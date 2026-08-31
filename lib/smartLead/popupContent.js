/**
 * Build dynamic copy/payload for the four master popups from Part 1 snapshot + browse context.
 * Optional admin content overrides (Part 5) with {{placeholders}}.
 */

import { applyContentPlaceholders } from "./configResolve.js";
import { getDefaultSmartLeadConfig } from "./configDefaults.js";

function titleCase(str = "") {
  return String(str)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function resolveImage(path) {
  if (!path) return "/no-image.jpg";
  if (path.startsWith("http") || path.startsWith("/") || path.startsWith("data:")) return path;
  return `/uploads/products/${path}`;
}

export function resolveExpertType({ categoryName = "", productName = "" } = {}) {
  const hay = `${categoryName} ${productName}`.toLowerCase();
  if (/tv|television|oled|qled|bravia/.test(hay)) return "TV Expert";
  if (/refrigerat|fridge/.test(hay)) return "Refrigerator Expert";
  if (/wash|laundry/.test(hay)) return "Washing Machine Expert";
  if (/\bac\b|air.?condition|inverter/.test(hay)) return "AC Expert";
  if (/dishwasher/.test(hay)) return "Dishwasher Expert";
  if (/mixer|grinder/.test(hay)) return "Kitchen Expert";
  if (/chimney|hob|oven|microwave/.test(hay)) return "Kitchen Expert";
  if (/purifier|ro\b/.test(hay)) return "Water Purifier Expert";
  if (/fan\b/.test(hay)) return "Fan Expert";
  if (/audio|soundbar|speaker/.test(hay)) return "Audio Expert";
  return "Appliance Expert";
}

function contentVars({ categoryName = "", product = {} } = {}) {
  return {
    category: categoryName || product.categoryName || "",
    productName: product.name || "",
    brand: product.brandName || "",
    model: product.modelNumber || "",
  };
}

function applyOverrides(base, type, config, vars) {
  const block = config?.content?.[type] || {};
  const headline = block.headline
    ? applyContentPlaceholders(block.headline, vars) || base.headline
    : base.headline;
  const subcopy = block.subheading
    ? applyContentPlaceholders(block.subheading, vars) || base.subcopy
    : base.subcopy;
  const primaryCta = block.cta
    ? applyContentPlaceholders(block.cta, vars) || base.primaryCta
    : base.primaryCta;
  const benefits =
    Array.isArray(block.benefits) && block.benefits.length > 0
      ? block.benefits
      : base.benefits;
  const template = config?.design?.[type] || base.template || "default";
  const whatsappEnabled = config?.whatsapp?.enabled !== false;

  return {
    ...base,
    headline,
    subcopy,
    primaryCta,
    benefits,
    template,
    whatsappEnabled,
  };
}

export function buildCategoryPopupContent({ browseContext, snapshot, config } = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const name =
    browseContext?.categoryName ||
    browseContext?.name ||
    snapshot?.currentProduct?.categoryName ||
    titleCase(browseContext?.categorySlug || "Appliances");
  const image =
    browseContext?.categoryImage ||
    browseContext?.image ||
    snapshot?.currentProduct?.image ||
    null;

  const base = {
    type: "CATEGORY",
    headline: `Looking for a ${name}?`,
    subcopy:
      "Get the best price, exciting bank offers, exchange & EMI options.",
    categoryName: name,
    image: image ? resolveImage(image) : null,
    benefits: [
      "Best Price",
      "Bank Offers",
      "Exchange Benefit",
      "EMI Options",
    ],
    primaryCta: "GET TODAY'S BEST DEAL",
    expertType: resolveExpertType({ categoryName: name }),
    whatsappText: `Hi, I'm looking for ${name} deals at BEA.`,
    template: "default",
  };

  return applyOverrides(base, "CATEGORY", cfg, contentVars({ categoryName: name }));
}

export function buildModelPopupContent({ snapshot, config } = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const p = snapshot?.currentProduct || {};
  const label =
    [p.brandName, p.name].filter(Boolean).join(" ") ||
    p.name ||
    "this product";

  const base = {
    type: "MODEL",
    headline: `Interested in this ${label}?`,
    productName: label,
    subcopy: "Unlock today's best price & exclusive offers for this model.",
    product: {
      ...p,
      image: resolveImage(p.image || p.images?.[0]),
    },
    benefits: [
      "Best Price Guaranteed",
      "Bank Offers & EMI",
      "Exchange Benefit",
      "Genuine Product",
      "Expert Support",
    ],
    primaryCta: "GET MY BEST PRICE",
    expertType: resolveExpertType({
      categoryName: p.categoryName || "",
      productName: p.name || "",
    }),
    whatsappText: `Hi, I'm interested in ${label}${p.modelNumber ? ` (${p.modelNumber})` : ""} at BEA.`,
    template: "default",
  };

  return applyOverrides(
    base,
    "MODEL",
    cfg,
    contentVars({ categoryName: p.categoryName, product: p })
  );
}

export function buildComparisonPopupContent({ snapshot, config } = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const sequence = Array.isArray(snapshot?.productViewSequence)
    ? snapshot.productViewSequence
    : [];
  const currentCat = snapshot?.currentProduct?.categoryId || "";
  const sameCat = currentCat
    ? sequence.filter((p) => p.categoryId === currentCat)
    : sequence;

  const seen = new Set();
  const unique = [];
  for (let i = sameCat.length - 1; i >= 0; i -= 1) {
    const id = sameCat[i].productId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(sameCat[i]);
  }

  const lastThree = unique.slice(0, 3).map((p) => ({
    ...p,
    image: resolveImage(p.image || p.images?.[0]),
  }));
  const moreCount = Math.max(0, unique.length - 3);

  const categoryName =
    snapshot?.browseContext?.categoryName ||
    unique[0]?.categoryName ||
    "appliances";

  const prettyCategory = titleCase(categoryName);
  const base = {
    type: "COMPARISON",
    headline: `Comparing ${prettyCategory}?`,
    categoryName: prettyCategory,
    subcopy:
      "Let our appliance expert help you choose the right one & get the best deal!",
    products: lastThree,
    moreCount,
    moreLabel: moreCount > 0 ? `+${moreCount} More` : null,
    primaryCta: "HELP ME CHOOSE",
    secondaryCta: "Chat with us on WhatsApp",
    benefits: [
      "Best Price Guaranteed",
      "Expert Recommendation",
      "Bank Offers & EMI",
      "Warranty Support",
    ],
    expertType: resolveExpertType({ categoryName }),
    whatsappText: `Hi, I'm comparing ${titleCase(categoryName)} and need help choosing the right one at BEA.`,
    template: "default",
  };

  return applyOverrides(
    base,
    "COMPARISON",
    cfg,
    contentVars({ categoryName, product: snapshot?.currentProduct || {} })
  );
}

export function buildPremiumPopupContent({ snapshot, config } = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const p = snapshot?.currentProduct || {};
  const label =
    [p.brandName, p.name].filter(Boolean).join(" ") ||
    p.name ||
    "this premium product";
  const expert = resolveExpertType({
    categoryName: p.categoryName || "",
    productName: p.name || "",
  });

  const base = {
    type: "PREMIUM",
    headline: `Experience Every Detail with ${label}`,
    productName: label,
    subcopy:
      "Get the best available price, exclusive bank offers, exchange bonus & expert installation.",
    product: {
      ...p,
      image: resolveImage(p.image || p.images?.[0]),
    },
    benefits: [
      "Best Price Guaranteed",
      "Bank Offers & EMI",
      "Exchange Bonus",
      "Expert Installation",
      "Priority Support",
    ],
    primaryCta: `TALK TO A ${expert.replace(/ Expert$/i, "").toUpperCase()} EXPERT`,
    expertType: expert,
    whatsappText: `Hi, I'm considering ${label}${p.modelNumber ? ` (${p.modelNumber})` : ""} and want expert assistance at BEA.`,
    template: "premium",
  };

  return applyOverrides(
    base,
    "PREMIUM",
    cfg,
    contentVars({ categoryName: p.categoryName, product: p })
  );
}

export function buildPopupContent(type, { snapshot, browseContext, config } = {}) {
  const cfg = config || getDefaultSmartLeadConfig();
  const enrichedSnapshot = {
    ...snapshot,
    browseContext: browseContext || snapshot?.browseContext,
  };
  switch (type) {
    case "CATEGORY":
      return buildCategoryPopupContent({
        browseContext,
        snapshot: enrichedSnapshot,
        config: cfg,
      });
    case "MODEL":
      return buildModelPopupContent({ snapshot: enrichedSnapshot, config: cfg });
    case "COMPARISON":
      return buildComparisonPopupContent({
        snapshot: enrichedSnapshot,
        config: cfg,
      });
    case "PREMIUM":
      return buildPremiumPopupContent({ snapshot: enrichedSnapshot, config: cfg });
    default:
      return null;
  }
}
