import { STORAGE_KEY, TIMING_MS } from "./constants";
import { classifyIntentScore } from "./scoreEngine";
import { createDefaultPopupState, resetPopupStateForNewSession } from "./frequency";

function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyVisitorState(overrides = {}) {
  const now = new Date().toISOString();
  return {
    visitorId: uuid(),
    sessionId: uuid(),
    firstSeenAt: now,
    lastSeenAt: now,
    sessionStartedAt: now,
    isReturning: false,
    referrer: "",
    source: "",
    currentUrl: "",
    currentProduct: null,
    currentProductVisitToken: null,
    currentProductStartedAt: null,
    currentProductActiveMs: 0,
    totalActiveMs: 0,
    productsViewed: [],
    productViewSequence: [],
    categoryViews: {},
    pagesViewed: [],
    pageViewCount: 0,
    productPageViewCount: 0,
    uniqueProductCount: 0,
    uniqueModelCount: 0,
    score: 0,
    classification: classifyIntentScore(0),
    scoreEvents: [],
    awardedEvents: {},
    popupState: {
      lastShownAt: null,
      lastPopupType: null,
      dismissedTypes: [],
      interactionHistory: [],
      sessionIdForPopup: null,
      leadPopupShownCount: 0,
      leadPopupShown: false,
      closedThisSession: false,
      suppressedForSession: false,
      supportPopupShownThisSession: false,
      lastLeadId: null,
      capturedMobile: "",
      capturedName: "",
    },
    mobileNumberCaptured: false,
    browseContext: null,
    talkToId: "",
    updatedAt: now,
    ...overrides,
  };
}

export function readVisitorState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...createEmptyVisitorState(),
      ...parsed,
      awardedEvents: parsed.awardedEvents || {},
      scoreEvents: Array.isArray(parsed.scoreEvents) ? parsed.scoreEvents : [],
      productsViewed: Array.isArray(parsed.productsViewed) ? parsed.productsViewed : [],
      productViewSequence: Array.isArray(parsed.productViewSequence)
        ? parsed.productViewSequence
        : [],
      categoryViews: parsed.categoryViews || {},
      pagesViewed: Array.isArray(parsed.pagesViewed) ? parsed.pagesViewed : [],
      popupState: {
        ...createEmptyVisitorState().popupState,
        ...(parsed.popupState || {}),
      },
      classification: parsed.classification || classifyIntentScore(parsed.score),
    };
  } catch {
    return null;
  }
}

export function writeVisitorState(state) {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — ignore
  }
}

/**
 * Bootstrap visitor + session. Returning = existing visitorId from a prior session.
 */
export function bootstrapVisitorState({ pathname = "", referrer = "" } = {}) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const existing = readVisitorState();

  if (!existing) {
    const fresh = createEmptyVisitorState({
      referrer: referrer || "",
      source: referrer || "direct",
      currentUrl: pathname || "",
      isReturning: false,
    });
    fresh.popupState = {
      ...createDefaultPopupState(),
      sessionIdForPopup: fresh.sessionId,
    };
    return fresh;
  }

  const lastSeen = Date.parse(existing.lastSeenAt || existing.updatedAt || 0) || 0;
  const sessionExpired = !lastSeen || now - lastSeen > TIMING_MS.SESSION_IDLE_MS;

  let next = {
    ...existing,
    lastSeenAt: nowIso,
    currentUrl: pathname || existing.currentUrl || "",
    referrer: existing.referrer || referrer || "",
    source: existing.source || referrer || "direct",
  };

  if (sessionExpired) {
    // Persisted visitor starting a new session ⇒ returning visitor
    const newSessionId = uuid();
    next = {
      ...next,
      isReturning: true,
      sessionId: newSessionId,
      sessionStartedAt: nowIso,
      currentProduct: null,
      currentProductVisitToken: null,
      currentProductStartedAt: null,
      currentProductActiveMs: 0,
      popupState: resetPopupStateForNewSession(next.popupState, newSessionId),
    };
  } else if (!next.popupState?.sessionIdForPopup) {
    next = {
      ...next,
      popupState: {
        ...createDefaultPopupState(),
        ...(next.popupState || {}),
        sessionIdForPopup: next.sessionId,
      },
    };
  }

  return next;
}

export function normalizeProductContext(product = {}, extras = {}) {
  const id = String(product._id || product.id || "").trim();
  const categoryId = String(
    product.category ||
      product.category_new ||
      extras.categoryId ||
      ""
  ).trim();
  const subcategoryId = String(
    product.sub_category ||
      product.sub_category_new ||
      product.sub_category_new_name ||
      extras.subcategoryId ||
      ""
  ).trim();
  const brandId = String(
    typeof product.brand === "object"
      ? product.brand?._id || product.brand?.id || ""
      : product.brand || extras.brandId || ""
  ).trim();

  return {
    productId: id,
    itemCode: String(product.item_code || product.sku || "").trim(),
    name: String(product.name || "").trim(),
    modelNumber: String(product.model_number || product.mpn || "").trim(),
    brandId,
    brandName: String(extras.brandName || product.brand_name || "").trim(),
    categoryId,
    subcategoryId,
    categoryName: String(
      extras.categoryName || product.category_name || product.categoryName || ""
    ).trim(),
    slug: String(product.slug || "").trim(),
    price: Number(product.price) || 0,
    specialPrice: Number(product.special_price) || 0,
    image: String(
      extras.image ||
        (Array.isArray(product.images) ? product.images[0] : "") ||
        product.image ||
        ""
    ).trim(),
    isPremium: Boolean(extras.isPremium),
    rating: Number(extras.rating || product.avgRating || product.average_rating) || 0,
    reviewCount:
      Number(extras.reviewCount || product.reviewCount || product.review_count) || 0,
  };
}
