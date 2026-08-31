import {
  CLASSIFICATION,
  SCORE_EVENT_KEYS,
  SCORE_POINTS,
} from "./constants.js";
import { DEFAULT_SCORE_POINTS, DEFAULT_THRESHOLDS } from "./configDefaults.js";

/**
 * Map score to lead classification (spec bands).
 * Optional thresholds from admin config — defaults preserve document bands.
 */
export function classifyIntentScore(score = 0, thresholds = null) {
  const n = Number(score) || 0;
  const t = thresholds || {
    hotMin: CLASSIFICATION.HOT.min,
    comparisonMin: CLASSIFICATION.COMPARISON.min,
    interestedMin: CLASSIFICATION.INTERESTED.min,
  };
  const hotMin = Number(t.hotMin) || CLASSIFICATION.HOT.min;
  const comparisonMin = Number(t.comparisonMin) || CLASSIFICATION.COMPARISON.min;
  const interestedMin = Number(t.interestedMin) || CLASSIFICATION.INTERESTED.min;

  if (n >= hotMin) {
    return { ...CLASSIFICATION.HOT, min: hotMin, score: n };
  }
  if (n >= comparisonMin) {
    return { ...CLASSIFICATION.COMPARISON, min: comparisonMin, score: n };
  }
  if (n >= interestedMin) {
    return { ...CLASSIFICATION.INTERESTED, min: interestedMin, score: n };
  }
  return { ...CLASSIFICATION.BROWSING, max: Math.max(0, interestedMin - 1), score: n };
}

export function buildAwardKey(eventType, scope = "") {
  return scope ? `${eventType}:${scope}` : eventType;
}

export function applyScoreEvent(state, { eventType, points, awardKey, label, meta = {}, thresholds = null }) {
  if (!state || !eventType || !awardKey) {
    return { state, awarded: false, points: 0, event: null };
  }

  const awardedEvents = { ...(state.awardedEvents || {}) };
  if (awardedEvents[awardKey]) {
    return { state, awarded: false, points: 0, event: null };
  }

  const value = Number(points) || 0;
  awardedEvents[awardKey] = true;

  const event = {
    key: awardKey,
    eventType,
    points: value,
    label: label || eventType,
    meta,
    at: new Date().toISOString(),
  };

  const scoreEvents = [...(state.scoreEvents || []), event];
  const score = (Number(state.score) || 0) + value;
  const classification = classifyIntentScore(
    score,
    thresholds || state._scoreThresholds || null
  );

  return {
    state: {
      ...state,
      awardedEvents,
      scoreEvents,
      score,
      classification,
      updatedAt: event.at,
    },
    awarded: true,
    points: value,
    event,
  };
}

function pointsFrom(state, key, fallback) {
  const cfg = state?._scorePoints;
  if (cfg && Number.isFinite(Number(cfg[key]))) return Number(cfg[key]);
  return fallback;
}

function thresholdsFrom(state) {
  return state?._scoreThresholds || null;
}

/** Attach runtime score config onto visitor state (from admin config). */
export function withScoreRuntimeConfig(state, config = null) {
  if (!state) return state;
  if (!config) return state;
  return {
    ...state,
    _scorePoints: config.scorePoints || DEFAULT_SCORE_POINTS,
    _scoreThresholds: config.thresholds || DEFAULT_THRESHOLDS,
  };
}

export function awardProductPageOpened(state, visitToken) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.PRODUCT_PAGE_OPENED,
    points: pointsFrom(state, "PRODUCT_PAGE_OPENED", SCORE_POINTS.PRODUCT_PAGE_OPENED),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.PRODUCT_PAGE_OPENED, visitToken),
    label: "Product Page Opened",
    thresholds: thresholdsFrom(state),
  });
}

export function awardProductPage30s(state, visitToken) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.PRODUCT_PAGE_30S,
    points: pointsFrom(state, "PRODUCT_PAGE_30S", SCORE_POINTS.PRODUCT_PAGE_30S),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.PRODUCT_PAGE_30S, visitToken),
    label: "30 seconds on Product Page",
    thresholds: thresholdsFrom(state),
  });
}

export function awardSecondSameCategory(state, categoryId) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.SECOND_PRODUCT_SAME_CATEGORY,
    points: pointsFrom(
      state,
      "SECOND_PRODUCT_SAME_CATEGORY",
      SCORE_POINTS.SECOND_PRODUCT_SAME_CATEGORY
    ),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.SECOND_PRODUCT_SAME_CATEGORY, categoryId),
    label: "Viewed Second Product in Same Category",
    meta: { categoryId },
    thresholds: thresholdsFrom(state),
  });
}

export function awardThirdSameCategory(state, categoryId) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.THIRD_PRODUCT_SAME_CATEGORY,
    points: pointsFrom(
      state,
      "THIRD_PRODUCT_SAME_CATEGORY",
      SCORE_POINTS.THIRD_PRODUCT_SAME_CATEGORY
    ),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.THIRD_PRODUCT_SAME_CATEGORY, categoryId),
    label: "Viewed Third Product in Same Category",
    meta: { categoryId },
    thresholds: thresholdsFrom(state),
  });
}

export function awardRevisitedProduct(state, productId) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.REVISITED_PRODUCT,
    points: pointsFrom(state, "REVISITED_PRODUCT", SCORE_POINTS.REVISITED_PRODUCT),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.REVISITED_PRODUCT, productId),
    label: "Returned to Previously Viewed Product",
    meta: { productId },
    thresholds: thresholdsFrom(state),
  });
}

export function awardPremiumSku(state, productId) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.PREMIUM_SKU,
    points: pointsFrom(state, "PREMIUM_SKU", SCORE_POINTS.PREMIUM_SKU),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.PREMIUM_SKU, productId),
    label: "Premium SKU",
    meta: { productId },
    thresholds: thresholdsFrom(state),
  });
}

export function awardTotalTime2Min(state) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.TOTAL_TIME_2MIN,
    points: pointsFrom(state, "TOTAL_TIME_2MIN", SCORE_POINTS.TOTAL_TIME_2MIN),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.TOTAL_TIME_2MIN),
    label: "2+ Minutes Total Website Time",
    thresholds: thresholdsFrom(state),
  });
}

export function awardReturningVisitor(state) {
  return applyScoreEvent(state, {
    eventType: SCORE_EVENT_KEYS.RETURNING_VISITOR,
    points: pointsFrom(state, "RETURNING_VISITOR", SCORE_POINTS.RETURNING_VISITOR),
    awardKey: buildAwardKey(SCORE_EVENT_KEYS.RETURNING_VISITOR),
    label: "Returning Website Visitor",
    thresholds: thresholdsFrom(state),
  });
}

export function getScoreBreakdown(state) {
  return {
    score: Number(state?.score) || 0,
    classification:
      state?.classification ||
      classifyIntentScore(state?.score, thresholdsFrom(state)),
    events: Array.isArray(state?.scoreEvents) ? state.scoreEvents : [],
    awardedEvents: state?.awardedEvents || {},
  };
}
