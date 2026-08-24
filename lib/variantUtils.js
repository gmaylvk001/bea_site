export function normalizeVariantValues(values = {}, attributeNames = []) {
  const next = {};
  const source = values && typeof values === "object" ? values : {};
  for (const name of attributeNames) {
    next[name] = String(source[name] ?? "").trim();
  }
  return next;
}

export function variantValue(value) {
  return String(value ?? "").trim();
}

export function valuesKeyFromNames(values = {}, attributeNames = []) {
  return attributeNames
    .map((name) => variantValue(values[name]).toLowerCase())
    .join("||");
}

export function activeSelections(values = {}, attributeNames = []) {
  const next = {};
  for (const name of attributeNames) {
    const value = variantValue(values[name]);
    if (value) next[name] = value;
  }
  return next;
}

export function isVariantValueAvailable(products, attrName, value, selected, attributeNames) {
  const target = variantValue(value);
  if (!target) return false;
  // Keep each attribute switchable on PDP. If at least one real product has this
  // value, allow click and let findProductForSelection choose a valid product.
  return products.some(
    (product) => variantValue(product.values?.[attrName]) === target
  );
}

export function findProductForSelection(products, selection, attributeNames, changedAttr = null) {
  const normalized = activeSelections(selection, attributeNames);

  const exact = products.find((product) =>
    attributeNames.every(
      (name) => variantValue(product.values?.[name]) === (normalized[name] || "")
    )
  );
  if (exact) return exact;

  if (changedAttr && normalized[changedAttr]) {
    const candidates = products.filter(
      (product) => variantValue(product.values?.[changedAttr]) === normalized[changedAttr]
    );
    if (!candidates.length) return null;

    let best = candidates[0];
    let bestScore = -1;
    for (const product of candidates) {
      let score = 0;
      for (const name of attributeNames) {
        if (name === changedAttr) continue;
        if (normalized[name] && variantValue(product.values?.[name]) === normalized[name]) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = product;
      }
    }
    return best;
  }

  return (
    products.find((product) =>
      Object.entries(normalized).every(
        ([name, val]) => variantValue(product.values?.[name]) === val
      )
    ) || null
  );
}

export function uniqueVariantValues(products, attrName) {
  const values = [];
  for (const product of products) {
    const value = variantValue(product.values?.[attrName]);
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}
