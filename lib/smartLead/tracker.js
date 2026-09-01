import { TIMING_MS } from "./constants.js";
import { getDefaultSmartLeadConfig } from "./configDefaults.js";
import { resolveProductIsPremium } from "./configResolve.js";
import {
  awardPremiumSku,
  awardProductPage30s,
  awardProductPageOpened,
  awardReturningVisitor,
  awardRevisitedProduct,
  awardSecondSameCategory,
  awardThirdSameCategory,
  awardTotalTime2Min,
  classifyIntentScore,
  withScoreRuntimeConfig,
} from "./scoreEngine.js";
import { normalizeProductContext, toLastViewedProduct } from "./storage.js";

function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueModels(sequence) {
  const set = new Set();
  for (const entry of sequence) {
    const model = String(entry.modelNumber || entry.itemCode || entry.productId || "").trim();
    if (model) set.add(model);
  }
  return set.size;
}

/**
 * Record a generic page visit (pathname). Idempotent for rapid re-renders of same path.
 */
export function recordPageVisit(state, { pathname, referrer, config } = {}) {
  if (!state || !pathname) return state;
  const nowIso = new Date().toISOString();
  const pages = Array.isArray(state.pagesViewed) ? [...state.pagesViewed] : [];
  const last = pages[pages.length - 1];
  if (last?.path === pathname) {
    return withScoreRuntimeConfig(
      {
        ...state,
        currentUrl: pathname,
        lastSeenAt: nowIso,
        referrer: state.referrer || referrer || "",
      },
      config
    );
  }

  pages.push({ path: pathname, at: nowIso });
  const onProductPath = pathname.startsWith("/product/");
  const currentSlug = String(state.currentProduct?.slug || "").trim();
  const sameProductPage =
    onProductPath &&
    currentSlug &&
    (pathname === `/product/${currentSlug}` ||
      pathname.startsWith(`/product/${currentSlug}/`));
  // Keep last-viewed product when leaving a PDP so off-product pages can
  // still show MODEL/PREMIUM. Do not restore currentProduct (that would
  // resume the 30s product scoring clock off the PDP).
  const lastViewedProduct =
    toLastViewedProduct(state.lastViewedProduct) ||
    toLastViewedProduct(state.currentProduct) ||
    toLastViewedProduct(
      Array.isArray(state.productViewSequence)
        ? state.productViewSequence[state.productViewSequence.length - 1]
        : null
    );
  let next = withScoreRuntimeConfig(
    {
      ...state,
      currentUrl: pathname,
      lastSeenAt: nowIso,
      referrer: state.referrer || referrer || "",
      source: state.source || referrer || "direct",
      pagesViewed: pages.slice(-100),
      pageViewCount: (Number(state.pageViewCount) || 0) + 1,
      currentProduct: sameProductPage ? state.currentProduct : null,
      currentProductVisitToken: sameProductPage
        ? state.currentProductVisitToken
        : null,
      currentProductStartedAt: sameProductPage
        ? state.currentProductStartedAt
        : null,
      currentProductActiveMs: sameProductPage
        ? state.currentProductActiveMs
        : 0,
      lastViewedProduct,
      updatedAt: nowIso,
    },
    config
  );

  if (next.isReturning) {
    const r = awardReturningVisitor(next);
    next = r.state;
  }

  return next;
}

/**
 * Record a product detail view + apply related intent score events.
 * One call per navigation to a product (caller must not re-fire on re-render).
 */
export function recordProductView(state, product, extras = {}, runtime = {}) {
  if (!state || !product) return state;

  const config = runtime.config || extras.config || null;
  let next = withScoreRuntimeConfig({ ...state }, config);
  const nowIso = new Date().toISOString();
  const isPremium = resolveProductIsPremium(product, config || getDefaultSmartLeadConfig(), {
    productId: product._id || product.id,
    itemCode: product.item_code || product.sku,
  });
  const ctx = normalizeProductContext(product, {
    ...extras,
    isPremium,
  });

  if (!ctx.productId) return next;

  // Ignore React Strict Mode / rapid duplicate mounts of the same product
  if (
    next.currentProduct?.productId === ctx.productId &&
    next.currentProductVisitToken
  ) {
    const started = Date.parse(next.currentProductStartedAt || 0) || 0;
    if (started && Date.now() - started < 3000) {
      return next;
    }
  }

  const visitToken = uuid();
  const sequence = Array.isArray(next.productViewSequence)
    ? [...next.productViewSequence]
    : [];
  const previouslyViewed = sequence.some((p) => p.productId === ctx.productId);

  const entry = {
    ...ctx,
    sequence: sequence.length + 1,
    visitToken,
    at: nowIso,
    revisited: previouslyViewed,
  };
  sequence.push(entry);

  const productsViewed = Array.isArray(next.productsViewed) ? [...next.productsViewed] : [];
  const existingIdx = productsViewed.findIndex((p) => p.productId === ctx.productId);
  if (existingIdx >= 0) {
    productsViewed[existingIdx] = {
      ...productsViewed[existingIdx],
      ...ctx,
      lastViewedAt: nowIso,
      viewCount: (Number(productsViewed[existingIdx].viewCount) || 1) + 1,
    };
  } else {
    productsViewed.push({ ...ctx, firstViewedAt: nowIso, lastViewedAt: nowIso, viewCount: 1 });
  }

  // Same-category unique product tracking
  const categoryViews = { ...(next.categoryViews || {}) };
  let sameCategoryUniqueCount = 0;
  if (ctx.categoryId) {
    const cat = categoryViews[ctx.categoryId] || {
      categoryId: ctx.categoryId,
      productIds: [],
      count: 0,
    };
    const ids = Array.isArray(cat.productIds) ? [...cat.productIds] : [];
    if (!ids.includes(ctx.productId)) {
      ids.push(ctx.productId);
    }
    sameCategoryUniqueCount = ids.length;
    categoryViews[ctx.categoryId] = {
      categoryId: ctx.categoryId,
      productIds: ids,
      count: ids.length,
      lastViewedAt: nowIso,
    };
  }

  next = {
    ...next,
    currentProduct: ctx,
    lastViewedProduct: toLastViewedProduct(ctx),
    currentProductVisitToken: visitToken,
    currentProductStartedAt: nowIso,
    currentProductActiveMs: 0,
    productViewSequence: sequence.slice(-100),
    productsViewed: productsViewed.slice(-100),
    categoryViews,
    productPageViewCount: (Number(next.productPageViewCount) || 0) + 1,
    uniqueProductCount: productsViewed.length,
    uniqueModelCount: uniqueModels(sequence),
    lastSeenAt: nowIso,
    updatedAt: nowIso,
    classification: classifyIntentScore(next.score, next._scoreThresholds || null),
  };

  // Returning visitor (once)
  if (next.isReturning) {
    const r = awardReturningVisitor(next);
    next = r.state;
  }

  // Product opened (+10) — once per visitToken (this navigation)
  {
    const r = awardProductPageOpened(next, visitToken);
    next = r.state;
  }

  // Revisited product (+20) — once per productId
  if (previouslyViewed) {
    const r = awardRevisitedProduct(next, ctx.productId);
    next = r.state;
  }

  // Same-category 2nd / 3rd unique products
  if (ctx.categoryId && sameCategoryUniqueCount === 2) {
    const r = awardSecondSameCategory(next, ctx.categoryId);
    next = r.state;
  }
  if (ctx.categoryId && sameCategoryUniqueCount === 3) {
    const r = awardThirdSameCategory(next, ctx.categoryId);
    next = r.state;
  }

  // Premium SKU (+20) — once per productId
  if (ctx.isPremium) {
    const r = awardPremiumSku(next, ctx.productId);
    next = r.state;
  }

  return next;
}

/**
 * Tick active engagement time while tab is visible.
 * Awards 30s product + 2min total when thresholds first crossed.
 */
export function tickEngagement(state, deltaMs = TIMING_MS.HEARTBEAT_MS, runtime = {}) {
  if (!state || deltaMs <= 0) return state;

  let next = withScoreRuntimeConfig(
    {
      ...state,
      totalActiveMs: (Number(state.totalActiveMs) || 0) + deltaMs,
      lastSeenAt: new Date().toISOString(),
    },
    runtime.config || null
  );

  if (next.currentProductVisitToken) {
    next.currentProductActiveMs = (Number(next.currentProductActiveMs) || 0) + deltaMs;
    if (next.currentProductActiveMs >= TIMING_MS.PRODUCT_PAGE_30S) {
      const r = awardProductPage30s(next, next.currentProductVisitToken);
      next = r.state;
    }
  }

  if (next.totalActiveMs >= TIMING_MS.TOTAL_WEBSITE_2MIN) {
    const r = awardTotalTime2Min(next);
    next = r.state;
  }

  next.classification = classifyIntentScore(next.score, next._scoreThresholds || null);
  next.updatedAt = next.lastSeenAt;
  return next;
}

export function setMobileNumberCaptured(state, captured = true) {
  if (!state) return state;
  return {
    ...state,
    mobileNumberCaptured: Boolean(captured),
    updatedAt: new Date().toISOString(),
  };
}

export function setPopupInteraction(state, interaction = {}) {
  if (!state) return state;
  const popupState = {
    ...(state.popupState || {}),
    ...interaction,
    interactionHistory: [
      ...((state.popupState && state.popupState.interactionHistory) || []),
      { ...interaction, at: new Date().toISOString() },
    ].slice(-50),
  };
  return {
    ...state,
    popupState,
    updatedAt: new Date().toISOString(),
  };
}

export function setBrowseContext(state, browseContext = null) {
  if (!state) return state;
  return {
    ...state,
    browseContext: browseContext
      ? {
          type: browseContext.type || "category",
          categoryId: String(browseContext.categoryId || "").trim(),
          categoryName: String(browseContext.categoryName || browseContext.name || "").trim(),
          categorySlug: String(browseContext.categorySlug || browseContext.slug || "").trim(),
          categoryImage: String(browseContext.categoryImage || browseContext.image || "").trim(),
          at: new Date().toISOString(),
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
}

/** Associate external TalkTo/Tawk id without replacing Part 1 visitorId. */
export function setTalkToId(state, talkToId = "") {
  if (!state) return state;
  const id = String(talkToId || "").trim().slice(0, 120);
  if (!id || state.talkToId === id) return state;
  return {
    ...state,
    talkToId: id,
    updatedAt: new Date().toISOString(),
  };
}

/** Snapshot for later popup decision system */
export function getVisitorIntentSnapshot(state) {
  if (!state) return null;
  const classification = state.classification || classifyIntentScore(state.score);
  const lastViewedProduct =
    toLastViewedProduct(state.lastViewedProduct) ||
    toLastViewedProduct(state.currentProduct) ||
    toLastViewedProduct(
      Array.isArray(state.productViewSequence)
        ? state.productViewSequence[state.productViewSequence.length - 1]
        : null
    );

  const currentCategoryId =
    state.currentProduct?.categoryId || state.browseContext?.categoryId || "";
  const sameCategoryCount = currentCategoryId
    ? Number(state.categoryViews?.[currentCategoryId]?.count) || 0
    : 0;

  // Only fall back to max-across-categories when we have no current category.
  let sameCategoryProductCount = sameCategoryCount;
  if (!currentCategoryId) {
    for (const cat of Object.values(state.categoryViews || {})) {
      const c = Number(cat?.count) || 0;
      if (c > sameCategoryProductCount) sameCategoryProductCount = c;
    }
  }

  return {
    visitorId: state.visitorId,
    sessionId: state.sessionId,
    isReturning: Boolean(state.isReturning),
    visitorType: state.isReturning ? "returning" : "new",
    currentUrl: state.currentUrl,
    referrer: state.referrer,
    source: state.source,
    browseContext: state.browseContext || null,
    currentProduct: state.currentProduct,
    lastViewedProduct,
    productId: state.currentProduct?.productId || null,
    itemCode: state.currentProduct?.itemCode || null,
    modelNumber: state.currentProduct?.modelNumber || null,
    brand: state.currentProduct?.brandId || null,
    brandName: state.currentProduct?.brandName || null,
    category: state.currentProduct?.categoryId || null,
    subcategory: state.currentProduct?.subcategoryId || null,
    isPremium: Boolean(state.currentProduct?.isPremium),
    productsViewed: state.productsViewed || [],
    productViewSequence: state.productViewSequence || [],
    productPageViewCount: state.productPageViewCount || 0,
    uniqueProductCount: state.uniqueProductCount || 0,
    uniqueModelCount: state.uniqueModelCount || 0,
    sameCategoryProductCount,
    categoryViews: state.categoryViews || {},
    totalActiveMs: state.totalActiveMs || 0,
    totalActiveSeconds: Math.floor((state.totalActiveMs || 0) / 1000),
    currentProductActiveMs: state.currentProductActiveMs || 0,
    currentProductActiveSeconds: Math.floor((state.currentProductActiveMs || 0) / 1000),
    intentScore: Number(state.score) || 0,
    leadClassification: classification,
    scoreEvents: state.scoreEvents || [],
    popupState: state.popupState || {},
    mobileNumberCaptured: Boolean(state.mobileNumberCaptured),
    pagesViewed: state.pagesViewed || [],
    firstSeenAt: state.firstSeenAt || null,
    talkToId: state.talkToId || "",
  };
}
