import { PREMIUM_PRICE_THRESHOLD } from "./constants";

/**
 * Determine whether a product is premium/high-value from existing PDP fields.
 * Prefer special_price when > 0, else price.
 */
export function getEffectiveProductPrice(product = {}) {
  const special = Number(product.special_price);
  const price = Number(product.price);
  if (Number.isFinite(special) && special > 0) return special;
  if (Number.isFinite(price) && price > 0) return price;
  return 0;
}

export function isPremiumProduct(product = {}, threshold = PREMIUM_PRICE_THRESHOLD) {
  return getEffectiveProductPrice(product) >= threshold;
}
