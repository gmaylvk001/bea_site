/**
 * Resolve + validate Smart Lead admin configuration.
 * Invalid / missing values fall back to documented defaults.
 */

import {
  getDefaultSmartLeadConfig,
  DEFAULT_SCORE_POINTS,
  DEFAULT_THRESHOLDS,
  DEFAULT_TRIGGERS,
  DEFAULT_FREQUENCY,
} from "./configDefaults.js";
import { getEffectiveProductPrice } from "./premium.js";

function toNonNegInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function toPositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

function toBool(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function mergeScorePoints(raw = {}) {
  const out = { ...DEFAULT_SCORE_POINTS };
  for (const key of Object.keys(DEFAULT_SCORE_POINTS)) {
    if (raw[key] !== undefined) {
      const n = Number(raw[key]);
      if (Number.isFinite(n) && n >= 0) out[key] = Math.floor(n);
    }
  }
  return out;
}

function mergeThresholds(raw = {}) {
  const d = DEFAULT_THRESHOLDS;
  let interestedMin = toNonNegInt(raw.interestedMin, d.interestedMin);
  let comparisonMin = toNonNegInt(raw.comparisonMin, d.comparisonMin);
  let hotMin = toNonNegInt(raw.hotMin, d.hotMin);

  // Keep logical order: interested ≤ comparison ≤ hot
  if (comparisonMin < interestedMin) comparisonMin = interestedMin;
  if (hotMin < comparisonMin) hotMin = comparisonMin;

  return {
    browsingMax: Math.max(0, interestedMin - 1),
    interestedMin,
    interestedMax: Math.max(interestedMin, comparisonMin - 1),
    comparisonMin,
    comparisonMax: Math.max(comparisonMin, hotMin - 1),
    hotMin,
  };
}

function mergeTriggers(raw = {}) {
  const d = DEFAULT_TRIGGERS;
  return {
    categoryMs: toNonNegInt(raw.categoryMs, d.categoryMs),
    productMs: toNonNegInt(raw.productMs, d.productMs),
    premiumMs: toNonNegInt(raw.premiumMs, d.premiumMs),
    comparisonMs: toNonNegInt(raw.comparisonMs, d.comparisonMs),
    comparisonProductCount: toPositiveInt(
      raw.comparisonProductCount,
      d.comparisonProductCount
    ),
    minScoreToShow: toNonNegInt(raw.minScoreToShow, d.minScoreToShow),
  };
}

function mergeFrequency(raw = {}) {
  const d = DEFAULT_FREQUENCY;
  const mode =
    raw.suppressionMode === "duration" || raw.suppressionMode === "session"
      ? raw.suppressionMode
      : d.suppressionMode;
  return {
    frequencyCap: toPositiveInt(raw.frequencyCap, d.frequencyCap),
    highIntentExceptionScore: toNonNegInt(
      raw.highIntentExceptionScore,
      d.highIntentExceptionScore
    ),
    highIntentExceptionMax: toPositiveInt(
      raw.highIntentExceptionMax,
      d.highIntentExceptionMax
    ),
    suppressionMode: mode,
    suppressionMs: toNonNegInt(raw.suppressionMs, d.suppressionMs),
  };
}

function normalizeCategoryRow(row = {}) {
  const categoryId = String(row.categoryId || "").trim();
  const categorySlug = String(row.categorySlug || row.slug || "").trim();
  if (!categoryId && !categorySlug) return null;
  return {
    categoryId,
    categorySlug,
    categoryName: String(row.categoryName || row.name || "").trim(),
    enabled: toBool(row.enabled, true),
  };
}

function normalizeProductRow(row = {}) {
  const productId = String(row.productId || "").trim();
  const itemCode = String(row.itemCode || row.sku || "").trim();
  if (!productId && !itemCode) return null;
  return {
    productId,
    itemCode,
    name: String(row.name || "").trim(),
    enabled: toBool(row.enabled, true),
    isPremium: toBool(row.isPremium, false),
  };
}

function mergeContentBlock(raw = {}, fallback = {}) {
  return {
    headline: String(raw.headline ?? fallback.headline ?? "").slice(0, 200),
    subheading: String(raw.subheading ?? fallback.subheading ?? "").slice(0, 500),
    cta: String(raw.cta ?? fallback.cta ?? "").slice(0, 120),
    benefits: Array.isArray(raw.benefits)
      ? raw.benefits.map((b) => String(b).trim()).filter(Boolean).slice(0, 12)
      : Array.isArray(fallback.benefits)
        ? fallback.benefits
        : [],
  };
}

const ALLOWED_TEMPLATES = new Set(["default", "compact", "premium"]);

/**
 * Merge raw DB/API payload with safe defaults.
 */
export function resolveSmartLeadConfig(raw = null) {
  const base = getDefaultSmartLeadConfig();
  if (!raw || typeof raw !== "object") return base;

  const categories = Array.isArray(raw.categories)
    ? raw.categories.map(normalizeCategoryRow).filter(Boolean)
    : base.categories;
  const products = Array.isArray(raw.products)
    ? raw.products.map(normalizeProductRow).filter(Boolean)
    : base.products;

  const designRaw = raw.design && typeof raw.design === "object" ? raw.design : {};
  const design = { ...base.design };
  for (const key of Object.keys(design)) {
    const v = String(designRaw[key] || design[key]);
    design[key] = ALLOWED_TEMPLATES.has(v) ? v : design[key];
  }

  const contentRaw = raw.content && typeof raw.content === "object" ? raw.content : {};
  const content = {
    CATEGORY: mergeContentBlock(contentRaw.CATEGORY, base.content.CATEGORY),
    MODEL: mergeContentBlock(contentRaw.MODEL, base.content.MODEL),
    COMPARISON: mergeContentBlock(contentRaw.COMPARISON, base.content.COMPARISON),
    PREMIUM: mergeContentBlock(contentRaw.PREMIUM, base.content.PREMIUM),
  };

  const premiumRaw = raw.premium && typeof raw.premium === "object" ? raw.premium : {};

  return {
    key: base.key,
    version: toPositiveInt(raw.version, base.version),
    global: {
      popupEnabled: toBool(raw.global?.popupEnabled, base.global.popupEnabled),
    },
    frequency: mergeFrequency(raw.frequency),
    triggers: mergeTriggers(raw.triggers),
    scorePoints: mergeScorePoints(raw.scorePoints),
    thresholds: mergeThresholds(raw.thresholds),
    defaultCategoryEnabled: toBool(
      raw.defaultCategoryEnabled,
      base.defaultCategoryEnabled
    ),
    categories,
    products,
    premium: {
      usePriceFallback: toBool(
        premiumRaw.usePriceFallback,
        base.premium.usePriceFallback
      ),
      priceFallbackThreshold: toPositiveInt(
        premiumRaw.priceFallbackThreshold,
        base.premium.priceFallbackThreshold
      ),
    },
    whatsapp: {
      enabled: toBool(raw.whatsapp?.enabled, base.whatsapp.enabled),
      phone: String(raw.whatsapp?.phone || base.whatsapp.phone || "").replace(/\D/g, "").slice(0, 15),
    },
    design,
    content,
  };
}

/** Validate payload; returns { ok, errors, config } */
export function validateSmartLeadConfigInput(raw = {}) {
  const errors = [];
  if (raw.triggers) {
    for (const k of ["categoryMs", "productMs", "premiumMs", "comparisonMs"]) {
      if (raw.triggers[k] !== undefined && Number(raw.triggers[k]) < 0) {
        errors.push(`${k} cannot be negative`);
      }
    }
    if (
      raw.triggers.comparisonProductCount !== undefined &&
      Number(raw.triggers.comparisonProductCount) < 1
    ) {
      errors.push("comparisonProductCount must be ≥ 1");
    }
  }
  if (raw.frequency?.frequencyCap !== undefined && Number(raw.frequency.frequencyCap) < 1) {
    errors.push("frequencyCap must be ≥ 1");
  }
  if (raw.frequency?.suppressionMs !== undefined && Number(raw.frequency.suppressionMs) < 0) {
    errors.push("suppressionMs cannot be negative");
  }
  if (raw.scorePoints) {
    for (const [k, v] of Object.entries(raw.scorePoints)) {
      if (v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0)) {
        errors.push(`scorePoints.${k} must be a non-negative number`);
      }
    }
  }
  const config = resolveSmartLeadConfig(raw);
  return { ok: errors.length === 0, errors, config };
}

export function findCategoryConfig(config, { categoryId = "", categorySlug = "", categoryName = "" } = {}) {
  const list = config?.categories || [];
  const id = String(categoryId || "").trim();
  const slug = String(categorySlug || "").trim().toLowerCase();
  const name = String(categoryName || "").trim().toLowerCase();
  return (
    list.find((c) => id && c.categoryId && c.categoryId === id) ||
    list.find((c) => slug && c.categorySlug && c.categorySlug.toLowerCase() === slug) ||
    list.find((c) => name && c.categoryName && c.categoryName.toLowerCase() === name) ||
    null
  );
}

export function isCategoryPopupEnabled(config, categoryRef = {}) {
  const row = findCategoryConfig(config, categoryRef);
  if (row) return row.enabled !== false;
  return config?.defaultCategoryEnabled !== false;
}

export function findProductConfig(config, { productId = "", itemCode = "" } = {}) {
  const list = config?.products || [];
  const id = String(productId || "").trim();
  const sku = String(itemCode || "").trim().toLowerCase();
  return (
    list.find((p) => id && p.productId && p.productId === id) ||
    list.find((p) => sku && p.itemCode && p.itemCode.toLowerCase() === sku) ||
    null
  );
}

export function isProductPopupEnabled(config, productRef = {}) {
  const row = findProductConfig(config, productRef);
  if (row) return row.enabled !== false;
  return true;
}

/**
 * Premium: admin tag is authoritative when present.
 * Otherwise optional price fallback (configurable threshold — not hard-coded in callers).
 */
export function resolveProductIsPremium(product = {}, config = null, extras = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const productId = String(product._id || product.id || extras.productId || "").trim();
  const itemCode = String(
    product.item_code || product.sku || extras.itemCode || ""
  ).trim();
  const row = findProductConfig(cfg, { productId, itemCode });
  if (row && typeof row.isPremium === "boolean") {
    return row.isPremium;
  }
  if (cfg.premium?.usePriceFallback === false) return false;
  const threshold =
    Number(cfg.premium?.priceFallbackThreshold) ||
    getDefaultSmartLeadConfig().premium.priceFallbackThreshold;
  return getEffectiveProductPrice(product) >= threshold;
}

export function applyContentPlaceholders(template = "", vars = {}) {
  if (!template) return "";
  return String(template)
    .replace(/\{\{\s*category\s*\}\}/gi, vars.category || "")
    .replace(/\{\{\s*productName\s*\}\}/gi, vars.productName || "")
    .replace(/\{\{\s*brand\s*\}\}/gi, vars.brand || "")
    .replace(/\{\{\s*model\s*\}\}/gi, vars.model || "")
    .trim();
}

/** Public client payload (same resolved object; safe to expose). */
export function toPublicSmartLeadConfig(config) {
  return resolveSmartLeadConfig(config);
}
