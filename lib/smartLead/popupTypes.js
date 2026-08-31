/** Smart Lead — popup type ids and trigger timings (Part 2). */

export const POPUP_TYPES = Object.freeze({
  NONE: "NONE",
  CATEGORY: "CATEGORY",
  MODEL: "MODEL",
  COMPARISON: "COMPARISON",
  PREMIUM: "PREMIUM",
});

/** Midpoints of the document ranges (no cron — evaluated against live dwell). */
export const POPUP_TRIGGER_MS = Object.freeze({
  CATEGORY_PAGE: 35_000, // ~30–40s on category
  PRODUCT_PAGE: 28_000, // ~25–30s on product
  PREMIUM_EARLY: 15_000, // earlier for premium/high-value
  COMPARISON_SHORT: 800, // shortly after 3+ same-category condition
});

/** Minimum intent score to interrupt (Browsing = 0–29 stays quiet). */
export const POPUP_MIN_SCORE = 30;
