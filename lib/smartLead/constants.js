/** Smart Lead Capture — Part 1 intent score constants (spec values, do not change). */

export const STORAGE_KEY = "bea_smart_lead_visitor_v1";

export const SCORE_POINTS = Object.freeze({
  PRODUCT_PAGE_OPENED: 10,
  PRODUCT_PAGE_30S: 15,
  SECOND_PRODUCT_SAME_CATEGORY: 10,
  THIRD_PRODUCT_SAME_CATEGORY: 20,
  REVISITED_PRODUCT: 20,
  PREMIUM_SKU: 20,
  TOTAL_TIME_2MIN: 10,
  RETURNING_VISITOR: 20,
});

export const SCORE_EVENT_KEYS = Object.freeze({
  PRODUCT_PAGE_OPENED: "product_page_opened",
  PRODUCT_PAGE_30S: "product_page_30s",
  SECOND_PRODUCT_SAME_CATEGORY: "second_product_same_category",
  THIRD_PRODUCT_SAME_CATEGORY: "third_product_same_category",
  REVISITED_PRODUCT: "revisited_product",
  PREMIUM_SKU: "premium_sku",
  TOTAL_TIME_2MIN: "total_time_2min",
  RETURNING_VISITOR: "returning_visitor",
});

/** Classification bands from the specification */
export const CLASSIFICATION = Object.freeze({
  BROWSING: { id: "browsing", label: "Browsing", min: 0, max: 29 },
  INTERESTED: { id: "interested", label: "Interested", min: 30, max: 49 },
  COMPARISON: {
    id: "comparison_warm",
    label: "Comparison / Warm Lead",
    min: 50,
    max: 69,
  },
  HOT: { id: "hot_premium", label: "Hot / Premium Lead", min: 70, max: Infinity },
});

export const TIMING_MS = Object.freeze({
  PRODUCT_PAGE_30S: 30_000,
  TOTAL_WEBSITE_2MIN: 120_000,
  HEARTBEAT_MS: 1_000,
  /** New session if idle longer than this since lastSeen */
  SESSION_IDLE_MS: 30 * 60 * 1000,
});

/**
 * Premium / high-value heuristic from existing product price fields.
 * No premium flag exists on Product today — derived from effective price.
 * Adjustable in one place for later admin config.
 */
export const PREMIUM_PRICE_THRESHOLD = 50_000;
