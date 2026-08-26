/** Safe category URL helpers — avoid literal "undefined" / "null" in paths. */

export function safeSlugify(s, fallback = "") {
  const base = (s || "").toString().trim();
  if (!base) return fallback;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isInvalidCategorySlug(slug) {
  const s = String(slug ?? "").trim();
  return !s || s === "undefined" || s === "null";
}

export function getCategorySlug(cat) {
  if (!cat) return "category";
  const raw = cat.category_slug || cat.slug;
  if (!isInvalidCategorySlug(raw)) return String(raw).trim();
  return safeSlugify(cat.category_name, String(cat._id || "category"));
}

export function getBrandSlug(brand) {
  if (!brand) return "brand";
  const raw = brand.brand_slug || brand.slug;
  if (!isInvalidCategorySlug(raw)) return String(raw).trim();
  return safeSlugify(brand.brand_name, String(brand._id || "brand"));
}

/** Build /category/a/b/c from category objects and/or slug strings. Drops invalid segments. */
export function buildCategoryHref(...catsOrSlugs) {
  const parts = catsOrSlugs
    .map((item) => {
      if (item == null || item === false) return "";
      if (typeof item === "string") {
        return isInvalidCategorySlug(item) ? "" : item.trim();
      }
      return getCategorySlug(item);
    })
    .filter(Boolean);

  return parts.length ? `/category/${parts.join("/")}` : "/";
}

export function buildCategoryBrandHref(category, brand) {
  const catSlug = typeof category === "string" ? category : getCategorySlug(category);
  const brandSlug = typeof brand === "string" ? brand : getBrandSlug(brand);
  if (isInvalidCategorySlug(catSlug) || isInvalidCategorySlug(brandSlug)) {
    return isInvalidCategorySlug(catSlug) ? "/" : `/category/${catSlug}`;
  }
  return `/category/brand/${catSlug}/${brandSlug}`;
}

/** Drop invalid segments; returns cleaned path parts for redirect. */
export function sanitizeCategorySlugs(slugs = []) {
  return slugs.filter((s) => !isInvalidCategorySlug(s));
}
