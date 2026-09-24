export function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Common abbreviations → full product terms */
const QUERY_SYNONYMS = {
  ac: [
    "air conditioner",
    "air conditioners",
    "a/c",
    "split ac",
    "window ac",
    "inverter ac",
  ],
};

export function normalizeSearchText(value = "") {
  return (value || "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function expandSearchTerms(query) {
  const q = normalizeSearchText(query);
  if (!q) return [];
  const terms = [q];
  if (QUERY_SYNONYMS[q]) {
    terms.push(...QUERY_SYNONYMS[q]);
  }
  return [...new Set(terms)];
}

function buildTextOrConditions(query) {
  return expandSearchTerms(query).flatMap((term) => {
    const safe = escapeRegExp(term);
    const regex = new RegExp(safe, "i");
    const clean = term.replace(/[^a-z0-9]/gi, "");

    const conditions = [
      { name: regex },
      { item_code: regex },
      { search_keywords: regex },
    ];

    if (clean && clean.length >= 2) {
      if (clean !== term) {
        conditions.push({ item_code: new RegExp(escapeRegExp(clean), "i") });
      }
      if (clean.length >= 3) {
        const flexible = clean.split("").map(escapeRegExp).join("[\\s\\-_/]*");
        conditions.push({ item_code: new RegExp(flexible, "i") });
      }
    }

    return conditions;
  });
}

/**
 * Full brand name only — partial prefixes like "Sam" for Samsung are ignored.
 * Supports: "Samsung" (exact) or "Samsung TV" (brand + product).
 */
export function detectBrandQuery(query, brands = []) {
  const q = normalizeSearchText(query);
  if (!q || !Array.isArray(brands) || brands.length === 0) return null;

  const activeBrands = brands
    .filter((b) => b?.brand_name && (!b.status || b.status === "Active"))
    .map((b) => ({
      id: String(b._id),
      name: normalizeSearchText(b.brand_name),
      rawName: b.brand_name,
    }))
    .sort((a, b) => b.name.length - a.name.length);

  for (const brand of activeBrands) {
    if (q === brand.name) {
      return { brandId: brand.id, brandName: brand.rawName, mode: "exact" };
    }
    if (q.startsWith(`${brand.name} `)) {
      const productQuery = q.slice(brand.name.length).trim();
      if (productQuery) {
        return {
          brandId: brand.id,
          brandName: brand.rawName,
          mode: "brand_product",
          productQuery,
        };
      }
    }
  }

  return null;
}

/** Build MongoDB $or field conditions for product text search */
export function buildSearchOrConditions(query, brands = []) {
  const brandMatch = detectBrandQuery(query, brands);

  if (brandMatch?.mode === "exact") {
    return [{ brand: brandMatch.brandId }];
  }

  if (brandMatch?.mode === "brand_product") {
    return buildTextOrConditions(brandMatch.productQuery);
  }

  return buildTextOrConditions(query);
}

/** Extra AND filters when user typed full brand + product phrase */
export function getBrandSearchConstraints(query, brands = []) {
  const brandMatch = detectBrandQuery(query, brands);
  if (!brandMatch) return null;

  if (brandMatch.mode === "exact") {
    return { brandId: brandMatch.brandId, mode: "exact" };
  }

  if (brandMatch.mode === "brand_product") {
    return {
      brandId: brandMatch.brandId,
      mode: "brand_product",
      productQuery: brandMatch.productQuery,
    };
  }

  return null;
}

function hasStrictTokenMatch(text, q) {
  if (!text || !q) return false;
  const escaped = escapeRegExp(q);
  const tokenRe = new RegExp(
    `(^|[\\s\\-/,_(])${escaped}($|[\\s\\-/,_.)])`,
    "i"
  );
  if (tokenRe.test(text)) return true;
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function isPrefixInsideWord(text, q) {
  const lower = (text || "").toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return false;
  const after = lower[idx + q.length];
  if (!after) return false;
  return /[a-z0-9]/i.test(after);
}

function scoreSingleTerm(product, term, strictShort) {
  const name = (product.name || "").toLowerCase();
  const code = (product.item_code || "").toLowerCase();
  const keywords = (product.search_keywords || "").toLowerCase();
  const termLower = term.toLowerCase();

  let score = 0;

  const cleanCode = code.replace(/[^a-z0-9]/gi, "");
  const cleanTerm = termLower.replace(/[^a-z0-9]/gi, "");

  // Check item code substring matching (start, center, or end)
  const isItemCodeMatch =
    Boolean(code && termLower && (code.includes(termLower) || (cleanTerm.length >= 2 && cleanCode.includes(cleanTerm))));

  if (termLower.includes(" ")) {
    if (name.includes(termLower)) return 95;
    if (keywords.includes(termLower)) return 90;
    if (cleanTerm.length >= 3 && cleanCode.includes(cleanTerm)) return 88;

    // Check if any word of the search query matches the item code (start, center, end)
    const words = termLower.split(/\s+/).filter((w) => w.length >= 2);
    const codeMatch = words.some((w) => {
      const cw = w.replace(/[^a-z0-9]/gi, "");
      return (cw.length >= 2 && cleanCode.includes(cw)) || code.includes(w);
    });
    if (codeMatch) return 82;

    return 0;
  }

  // 1. Exact Name / Token Match
  if (name === termLower) score = 100;
  else if (hasStrictTokenMatch(product.name, termLower)) score = 88;

  // 2. Item Code Matching: Exact, Starting, Ending, or Center (Any Substring)
  else if (code === termLower || (cleanTerm.length >= 3 && cleanCode === cleanTerm)) {
    score = 92;
  } else if (code.startsWith(termLower) || (cleanTerm.length >= 2 && cleanCode.startsWith(cleanTerm))) {
    score = strictShort ? 30 : 86;
  } else if (code.endsWith(termLower) || (cleanTerm.length >= 2 && cleanCode.endsWith(cleanTerm))) {
    score = strictShort ? 25 : 84;
  } else if (isItemCodeMatch) {
    score = strictShort ? 20 : 82;
  }

  // 3. Keywords & Partial Name
  else if (keywords && hasStrictTokenMatch(product.search_keywords, termLower)) score = 72;
  else if (name.includes(termLower)) score = 28;

  if (score === 0) return 0;

  if (strictShort) {
    const strict =
      hasStrictTokenMatch(product.name, termLower) ||
      hasStrictTokenMatch(product.item_code, termLower) ||
      isItemCodeMatch ||
      hasStrictTokenMatch(product.search_keywords, termLower);

    if (!strict) {
      if (isPrefixInsideWord(product.name, termLower)) return 0;
      if (name.includes(termLower) && !hasStrictTokenMatch(product.name, termLower)) {
        return 0;
      }
    }
  }

  return score;
}

function getProductBrandId(product) {
  return String(product.brand || product.brand_id || "");
}

function applyBrandBoost(product, query, brands, skipBrandDetection) {
  if (skipBrandDetection || !brands?.length) return 0;

  const brandMatch = detectBrandQuery(query, brands);
  if (!brandMatch) return 0;

  const productBrandId = getProductBrandId(product);
  if (productBrandId !== brandMatch.brandId) return 0;

  if (brandMatch.mode === "exact") return 120;

  const productScore = scoreProductMatch(product, brandMatch.productQuery, {
    brands: [],
    skipBrandDetection: true,
  });

  return productScore > 0 ? 118 + productScore : 108;
}

/**
 * Score how well a product matches a search query.
 * Higher score = better match. Returns 0 when product should be excluded.
 */
export function scoreProductMatch(product, query, options = {}) {
  const { brands = [], skipBrandDetection = false } = options;
  const q = normalizeSearchText(query);
  if (!q) return 0;

  const brandMatch = !skipBrandDetection ? detectBrandQuery(query, brands) : null;
  const textQuery =
    brandMatch?.mode === "brand_product" ? brandMatch.productQuery : query;

  const terms = expandSearchTerms(textQuery);
  const isShort = normalizeSearchText(textQuery).length <= 2;
  let best = 0;

  for (const term of terms) {
    const termScore = scoreSingleTerm(product, term, isShort && term === normalizeSearchText(textQuery));
    if (term !== normalizeSearchText(textQuery) && termScore > 0) {
      best = Math.max(best, termScore + (isShort ? 25 : 8));
    } else {
      best = Math.max(best, termScore);
    }
  }

  if (normalizeSearchText(textQuery) === "ac") {
    const subName = (product.sub_category_new_name || "").toLowerCase();
    const catName = (product.category_new || "").toLowerCase();
    const keywords = (product.search_keywords || "").toLowerCase();
    if (
      subName.includes("air condition") ||
      catName.includes("air condition") ||
      keywords.includes("air condition")
    ) {
      best = Math.max(best, 110);
    }
  }

  const brandBoost = applyBrandBoost(product, query, brands, skipBrandDetection);
  best = Math.max(best, brandBoost);

  if (brandMatch?.mode === "exact" && brandBoost === 0) {
    return 0;
  }

  if (brandMatch?.mode === "brand_product" && brandBoost === 0) {
    return 0;
  }

  return best;
}

export function filterAndRankProducts(products, query, limit = 12, options = {}) {
  if (!Array.isArray(products) || !query?.trim()) return [];

  return products
    .map((product) => ({
      product,
      score: scoreProductMatch(product, query, options),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}
