import { CLASSIFICATION, TIMING_MS } from "./constants.js";
import { getDefaultSmartLeadConfig } from "./configDefaults.js";
import {
  isCategoryPopupEnabled,
  isProductPopupEnabled,
} from "./configResolve.js";
import { POPUP_MIN_SCORE, POPUP_TRIGGER_MS, POPUP_TYPES } from "./popupTypes.js";

/**
 * Unique products viewed in the category the visitor is currently in.
 * Uses the current product / browse context — not the max across all categories.
 */
export function resolveSameCategoryCount(snapshot = {}) {
  const categoryId =
    snapshot?.currentProduct?.categoryId ||
    snapshot?.browseContext?.categoryId ||
    "";
  if (categoryId && snapshot?.categoryViews?.[categoryId]) {
    return Number(snapshot.categoryViews[categoryId].count) || 0;
  }
  return Number(snapshot?.sameCategoryProductCount) || 0;
}

function none(snapshot, reason) {
  return {
    type: POPUP_TYPES.NONE,
    reason,
    score: Number(snapshot?.intentScore) || 0,
    classificationId: snapshot?.leadClassification?.id || CLASSIFICATION.BROWSING.id,
  };
}

/**
 * Select exactly one popup type.
 * Priority: COMPARISON → PREMIUM → MODEL → CATEGORY → NONE
 *
 * Dwell is always the current page only (`pageActiveMs`). Leftover time from a
 * previous product/category must not fire Model/Premium instantly.
 *
 * Multi-product same-category browsing (2+ unique SKUs) is Category or
 * Comparison — not Model. Model is only for a genuine single-product focus.
 */
export function selectPopupType(ctx = {}) {
  const {
    snapshot,
    pageType = "other",
    pageActiveMs = 0,
    canShowPopup,
    config: rawConfig,
  } = ctx;

  const config = rawConfig || getDefaultSmartLeadConfig();

  if (config.global?.popupEnabled === false) {
    return none(snapshot, "popup_system_off");
  }

  if (typeof canShowPopup === "function" && canShowPopup(ctx) === false) {
    return none(snapshot, "suppressed");
  }

  if (!snapshot) {
    return { type: POPUP_TYPES.NONE, reason: "no_snapshot", score: 0 };
  }

  if (snapshot.mobileNumberCaptured) {
    return none(snapshot, "mobile_captured");
  }

  const triggers = config.triggers || {};
  const categoryMs = Number(triggers.categoryMs) || POPUP_TRIGGER_MS.CATEGORY_PAGE;
  const productMs = Number(triggers.productMs) || POPUP_TRIGGER_MS.PRODUCT_PAGE;
  const premiumMs = Number(triggers.premiumMs) || POPUP_TRIGGER_MS.PREMIUM_EARLY;
  const comparisonMs =
    Number(triggers.comparisonMs) || POPUP_TRIGGER_MS.COMPARISON_SHORT;
  const comparisonCount = Number(triggers.comparisonProductCount) || 3;
  const minScore =
    Number(triggers.minScoreToShow) >= 0
      ? Number(triggers.minScoreToShow)
      : POPUP_MIN_SCORE;
  const hotMin = Number(config.thresholds?.hotMin) || CLASSIFICATION.HOT.min;
  const comparisonMin =
    Number(config.thresholds?.comparisonMin) || CLASSIFICATION.COMPARISON.min;

  const score = Number(snapshot.intentScore) || 0;
  const classificationId =
    snapshot.leadClassification?.id || CLASSIFICATION.BROWSING.id;
  const sameCategoryCount = resolveSameCategoryCount(snapshot);
  const isPremium = Boolean(snapshot.isPremium);
  const onProduct = pageType === "product";
  const onCategory = pageType === "category";
  const hasCurrentProduct = Boolean(snapshot.currentProduct?.productId);
  const totalMs = Number(snapshot.totalActiveMs) || 0;

  // Current page only — never inherit previous product/category dwell.
  const pageDwellMs = Math.max(0, Number(pageActiveMs) || 0);

  const browsingSameCategory = sameCategoryCount >= 2;
  const comparisonReady = sameCategoryCount >= comparisonCount;

  // Category / product enable gates
  if (onCategory) {
    const catOk = isCategoryPopupEnabled(config, {
      categoryId: snapshot.browseContext?.categoryId,
      categorySlug: snapshot.browseContext?.categorySlug,
      categoryName: snapshot.browseContext?.categoryName,
    });
    if (!catOk) {
      return {
        type: POPUP_TYPES.NONE,
        reason: "category_disabled",
        score,
        classificationId,
      };
    }
  }

  if (onProduct && hasCurrentProduct) {
    const prodOk = isProductPopupEnabled(config, {
      productId: snapshot.currentProduct?.productId || snapshot.productId,
      itemCode: snapshot.currentProduct?.itemCode || snapshot.itemCode,
    });
    const catOk = isCategoryPopupEnabled(config, {
      categoryId:
        snapshot.currentProduct?.categoryId ||
        snapshot.browseContext?.categoryId,
      categorySlug: snapshot.browseContext?.categorySlug,
      categoryName:
        snapshot.currentProduct?.categoryName ||
        snapshot.browseContext?.categoryName,
    });
    if (!prodOk || !catOk) {
      return {
        type: POPUP_TYPES.NONE,
        reason: !prodOk ? "product_disabled" : "category_disabled",
        score,
        classificationId,
      };
    }
  }

  // --- Comparison (3+ unique products in this category) ---
  if (comparisonReady && score >= minScore && pageDwellMs >= comparisonMs) {
    return {
      type: POPUP_TYPES.COMPARISON,
      reason: "same_category_threshold",
      score,
      classificationId,
    };
  }

  if (
    classificationId === CLASSIFICATION.COMPARISON.id &&
    sameCategoryCount >= Math.max(2, comparisonCount - 1) &&
    score >= comparisonMin &&
    pageDwellMs >= comparisonMs
  ) {
    return {
      type: POPUP_TYPES.COMPARISON,
      reason: "classification_comparison_warm",
      score,
      classificationId,
    };
  }

  // --- Premium / Hot (this product page dwell only) ---
  if (onProduct && hasCurrentProduct) {
    const premiumReady =
      isPremium && score >= minScore && pageDwellMs >= premiumMs;
    const hotLead = score >= hotMin && pageDwellMs >= premiumMs;

    if (premiumReady || hotLead) {
      return {
        type: POPUP_TYPES.PREMIUM,
        reason: hotLead ? "hot_premium_lead" : "premium_sku_engagement",
        score,
        classificationId,
      };
    }
  }

  if (score < minScore) {
    return {
      type: POPUP_TYPES.NONE,
      reason: "browsing_low_score",
      score,
      classificationId,
    };
  }

  // --- Model: one specific product, this visit's dwell ---
  const focusedOnOneProduct = onProduct && hasCurrentProduct && !browsingSameCategory;
  if (
    focusedOnOneProduct &&
    !isPremium &&
    score < hotMin &&
    pageDwellMs >= productMs
  ) {
    return {
      type: POPUP_TYPES.MODEL,
      reason: "product_dwell",
      score,
      classificationId,
    };
  }

  // --- Category: category page, OR hopping 2+ products in the same category ---
  // On a product page the wait is productMs (same clock as Model) so Model cannot
  // steal the slot at 28s; the type is Category because they are not focused on one SKU.
  const categoryOnListing = onCategory && pageDwellMs >= categoryMs;
  const categoryOnProductBrowse =
    onProduct &&
    browsingSameCategory &&
    !comparisonReady &&
    pageDwellMs >= productMs;

  if ((categoryOnListing || categoryOnProductBrowse) && score >= minScore) {
    return {
      type: POPUP_TYPES.CATEGORY,
      reason: categoryOnProductBrowse ? "same_category_browse" : "category_dwell",
      score,
      classificationId,
    };
  }

  // --- 2+ minutes fallback: still respect page dwell + browse priority ---
  if (totalMs >= TIMING_MS.TOTAL_WEBSITE_2MIN && score >= minScore) {
    if (comparisonReady && pageDwellMs >= comparisonMs) {
      return {
        type: POPUP_TYPES.COMPARISON,
        reason: "total_time_comparison_fallback",
        score,
        classificationId,
      };
    }
    if (onProduct && hasCurrentProduct && (isPremium || score >= hotMin) && pageDwellMs >= premiumMs) {
      return {
        type: POPUP_TYPES.PREMIUM,
        reason: "total_time_premium_fallback",
        score,
        classificationId,
      };
    }
    if (
      browsingSameCategory &&
      ((onCategory && pageDwellMs >= categoryMs) ||
        (onProduct && pageDwellMs >= productMs))
    ) {
      return {
        type: POPUP_TYPES.CATEGORY,
        reason: "total_time_category_fallback",
        score,
        classificationId,
      };
    }
    if (focusedOnOneProduct && pageDwellMs >= productMs) {
      return {
        type: POPUP_TYPES.MODEL,
        reason: "total_time_model_fallback",
        score,
        classificationId,
      };
    }
    if (onCategory && pageDwellMs >= categoryMs) {
      return {
        type: POPUP_TYPES.CATEGORY,
        reason: "total_time_category_fallback",
        score,
        classificationId,
      };
    }
  }

  if (
    classificationId === CLASSIFICATION.INTERESTED.id &&
    focusedOnOneProduct &&
    pageDwellMs >= productMs
  ) {
    return {
      type: isPremium ? POPUP_TYPES.PREMIUM : POPUP_TYPES.MODEL,
      reason: "classification_interested",
      score,
      classificationId,
    };
  }

  if (
    classificationId === CLASSIFICATION.INTERESTED.id &&
    onCategory &&
    pageDwellMs >= categoryMs
  ) {
    return {
      type: POPUP_TYPES.CATEGORY,
      reason: "classification_interested_category",
      score,
      classificationId,
    };
  }

  if (
    classificationId === CLASSIFICATION.INTERESTED.id &&
    categoryOnProductBrowse
  ) {
    return {
      type: POPUP_TYPES.CATEGORY,
      reason: "classification_interested_category",
      score,
      classificationId,
    };
  }

  return {
    type: POPUP_TYPES.NONE,
    reason: "conditions_not_met",
    score,
    classificationId,
  };
}

export function detectPageType(pathname = "") {
  if (!pathname) return "other";
  if (pathname.startsWith("/product/")) return "product";
  if (pathname.startsWith("/category/")) return "category";
  if (pathname.startsWith("/brand/")) return "category";
  return "other";
}
