/** True when a product has a usable selling price (MRP or special). */
export function hasValidPrice(product) {
  if (!product) return false;
  const price = Number(product.price);
  const special = Number(product.special_price);
  return (Number.isFinite(price) && price > 0) || (Number.isFinite(special) && special > 0);
}

export function getSellingPrice(product) {
  const special = Number(product?.special_price);
  const price = Number(product?.price);
  const specialOk = Number.isFinite(special) && special > 0;
  const priceOk = Number.isFinite(price) && price > 0;

  if (specialOk && (!priceOk || special < price)) return special;
  if (priceOk) return price;
  if (specialOk) return special;
  return null;
}

export function filterPricedProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.filter(hasValidPrice);
}

/** Mongo clause: numeric price or special_price greater than 0. */
export const VALID_PRICE_CLAUSE = {
  $or: [
    { price: { $type: "number", $gt: 0 } },
    { special_price: { $type: "number", $gt: 0 } },
  ],
};

export function withValidPrice(query = {}) {
  return {
    ...query,
    $and: [...(query.$and || []), VALID_PRICE_CLAUSE],
  };
}
