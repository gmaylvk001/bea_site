/**
 * Smart Lead — documented default configuration (Parts 1–4 baseline).
 * Do not change these values unless the product document changes.
 */

export const SMART_LEAD_CONFIG_KEY = "default";

export const DEFAULT_SCORE_POINTS = Object.freeze({
  PRODUCT_PAGE_OPENED: 10,
  PRODUCT_PAGE_30S: 15,
  SECOND_PRODUCT_SAME_CATEGORY: 10,
  THIRD_PRODUCT_SAME_CATEGORY: 20,
  REVISITED_PRODUCT: 20,
  PREMIUM_SKU: 20,
  TOTAL_TIME_2MIN: 10,
  RETURNING_VISITOR: 20,
});

export const DEFAULT_THRESHOLDS = Object.freeze({
  browsingMax: 29,
  interestedMin: 30,
  interestedMax: 49,
  comparisonMin: 50,
  comparisonMax: 69,
  hotMin: 70,
});

export const DEFAULT_TRIGGERS = Object.freeze({
  categoryMs: 35_000,
  productMs: 28_000,
  premiumMs: 15_000,
  comparisonMs: 800,
  comparisonProductCount: 3,
  minScoreToShow: 30,
});

export const DEFAULT_FREQUENCY = Object.freeze({
  frequencyCap: 1,
  highIntentExceptionScore: 85,
  highIntentExceptionMax: 2,
  /** session = close suppresses for rest of session (document default) */
  suppressionMode: "session",
  /** used when suppressionMode === "duration" */
  suppressionMs: 24 * 60 * 60 * 1000,
});

export const DEFAULT_CONTENT_BY_TYPE = Object.freeze({
  CATEGORY: {
    headline: "",
    subheading: "",
    cta: "",
    benefits: [],
  },
  MODEL: {
    headline: "",
    subheading: "",
    cta: "",
    benefits: [],
  },
  COMPARISON: {
    headline: "",
    subheading: "",
    cta: "",
    benefits: [],
  },
  PREMIUM: {
    headline: "",
    subheading: "",
    cta: "",
    benefits: [],
  },
});

export const CONTENT_PLACEHOLDERS = Object.freeze([
  { token: "{{category}}", meaning: "Category name" },
  { token: "{{productName}}", meaning: "Product name" },
  { token: "{{brand}}", meaning: "Brand name" },
  { token: "{{model}}", meaning: "Model number" },
]);

export const DESIGN_TEMPLATES = Object.freeze({
  default: "Default",
  compact: "Compact",
  premium: "Premium treatment",
});

/** Full default config document shape */
export function getDefaultSmartLeadConfig() {
  return {
    key: SMART_LEAD_CONFIG_KEY,
    version: 1,
    global: {
      popupEnabled: true,
    },
    frequency: { ...DEFAULT_FREQUENCY },
    triggers: { ...DEFAULT_TRIGGERS },
    scorePoints: { ...DEFAULT_SCORE_POINTS },
    thresholds: { ...DEFAULT_THRESHOLDS },
    defaultCategoryEnabled: true,
    categories: [],
    // [{ categoryId, categorySlug, categoryName, enabled }]
    products: [],
    // [{ productId, itemCode, name, enabled, isPremium }]
    premium: {
      usePriceFallback: true,
      priceFallbackThreshold: 50_000,
    },
    whatsapp: {
      enabled: true,
      /** E.164 without + — used by Smart Lead + float when set */
      phone: "919842344323",
    },
    design: {
      CATEGORY: "default",
      MODEL: "default",
      COMPARISON: "default",
      PREMIUM: "premium",
    },
    content: {
      CATEGORY: { ...DEFAULT_CONTENT_BY_TYPE.CATEGORY },
      MODEL: { ...DEFAULT_CONTENT_BY_TYPE.MODEL },
      COMPARISON: { ...DEFAULT_CONTENT_BY_TYPE.COMPARISON },
      PREMIUM: { ...DEFAULT_CONTENT_BY_TYPE.PREMIUM },
    },
  };
}
