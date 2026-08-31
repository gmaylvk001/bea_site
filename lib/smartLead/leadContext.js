/**
 * Build enriched lead context + chronological visitor journey for Part 4.
 * Pure helpers — no scoring changes.
 */

import { CLASSIFICATION } from "./constants.js";

export function formatDuration(ms = 0) {
  const totalSec = Math.max(0, Math.floor(Number(ms) || 0) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function parseUtmFromUrl(url = "") {
  try {
    const u = new URL(url, "https://example.com");
    return {
      source: u.searchParams.get("utm_source") || "",
      medium: u.searchParams.get("utm_medium") || "",
      campaign: u.searchParams.get("utm_campaign") || "",
      term: u.searchParams.get("utm_term") || "",
      content: u.searchParams.get("utm_content") || "",
    };
  } catch {
    return { source: "", medium: "", campaign: "", term: "", content: "" };
  }
}

export function inferTrafficSource(referrer = "", utm = {}) {
  if (utm?.source) return String(utm.source);
  const ref = String(referrer || "").toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("google.")) return "Google";
  if (ref.includes("facebook.") || ref.includes("fb.")) return "Facebook";
  if (ref.includes("instagram.")) return "Instagram";
  if (ref.includes("youtube.")) return "YouTube";
  if (ref.includes("bing.")) return "Bing";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "referral";
  } catch {
    return "referral";
  }
}

export function parseDeviceBrowser(userAgent = "") {
  const ua = String(userAgent || "");
  let device = "Desktop";
  if (/iPad|Tablet/i.test(ua)) device = "Tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) device = "Mobile";

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/MSIE|Trident\//i.test(ua)) browser = "IE";

  return { device, browser };
}

export function classificationLabelFromId(id = "", score = 0) {
  const map = {
    [CLASSIFICATION.BROWSING.id]: CLASSIFICATION.BROWSING.label,
    [CLASSIFICATION.INTERESTED.id]: CLASSIFICATION.INTERESTED.label,
    [CLASSIFICATION.COMPARISON.id]: CLASSIFICATION.COMPARISON.label,
    [CLASSIFICATION.HOT.id]: CLASSIFICATION.HOT.label,
    browsing: "Browsing",
    interested: "Interested / Warm",
    comparison_warm: "Comparison / Warm Lead",
    hot_premium: "Hot / Premium Lead",
  };
  if (map[id]) return map[id];
  if (score >= 70) return CLASSIFICATION.HOT.label;
  if (score >= 50) return CLASSIFICATION.COMPARISON.label;
  if (score >= 30) return CLASSIFICATION.INTERESTED.label;
  return CLASSIFICATION.BROWSING.label;
}

export function buildIntentSummary({
  classificationId = "",
  categoryName = "",
  brandsViewed = [],
  popupType = "",
  isPremium = false,
} = {}) {
  const cat = categoryName || "appliances";
  const brands = (brandsViewed || []).filter(Boolean).slice(0, 3).join(" / ");
  if (popupType === "COMPARISON" || classificationId === CLASSIFICATION.COMPARISON.id) {
    return `Comparing${isPremium ? " Premium" : ""} ${cat}${brands ? ` (${brands})` : ""}`;
  }
  if (classificationId === CLASSIFICATION.HOT.id || isPremium) {
    return `Hot interest in ${cat}${brands ? ` — ${brands}` : ""}`;
  }
  if (classificationId === CLASSIFICATION.INTERESTED.id) {
    return `Interested in ${cat}`;
  }
  return `Browsing ${cat}`;
}

function productSnapshot(entry = {}, index = 0) {
  const slug = entry.slug || "";
  return {
    productId: String(entry.productId || "").trim(),
    itemCode: String(entry.itemCode || "").trim(),
    name: String(entry.name || "").trim(),
    modelNumber: String(entry.modelNumber || "").trim(),
    brandId: String(entry.brandId || "").trim(),
    brandName: String(entry.brandName || "").trim(),
    categoryId: String(entry.categoryId || "").trim(),
    categoryName: String(entry.categoryName || "").trim(),
    subcategoryId: String(entry.subcategoryId || "").trim(),
    slug,
    url: slug ? `/product/${slug}` : "",
    image: String(entry.image || "").trim(),
    price: Number(entry.price) || 0,
    specialPrice: Number(entry.specialPrice) || 0,
    isPremium: Boolean(entry.isPremium),
    sequence: Number(entry.sequence) || index + 1,
    visitedAt: String(entry.at || entry.lastViewedAt || entry.firstViewedAt || ""),
    revisited: Boolean(entry.revisited),
    viewCount: Number(entry.viewCount) || 1,
  };
}

/**
 * Build deduped chronological journey from Part 1 snapshot + capture meta.
 */
export function buildVisitorJourney({
  snapshot = {},
  popupType = "",
  ctaClicked = "",
  referrer = "",
  trafficSource = "",
  submittedAt = "",
} = {}) {
  const events = [];
  const push = (type, label, at, meta = {}) => {
    const key = `${type}|${label}|${at || ""}`;
    if (events.some((e) => `${e.type}|${e.label}|${e.at || ""}` === key)) return;
    events.push({
      order: events.length + 1,
      type,
      label,
      at: at || submittedAt || new Date().toISOString(),
      meta,
    });
  };

  const sourceLabel =
    trafficSource ||
    (referrer ? inferTrafficSource(referrer) : "") ||
    "Direct";
  if (sourceLabel && sourceLabel !== "direct") {
    push("source", sourceLabel === "Google" ? "Google Search" : sourceLabel, snapshot.firstSeenAt || "");
  } else {
    push("source", "Direct Visit", snapshot.firstSeenAt || "");
  }

  const pages = Array.isArray(snapshot.pagesViewed) ? snapshot.pagesViewed : [];
  for (const page of pages) {
    const path = page?.path || "";
    if (!path || path.startsWith("/product/")) continue;
    if (path.startsWith("/category/")) {
      const slug = path.split("/").filter(Boolean).pop() || "Category";
      const name =
        snapshot.browseContext?.categoryName ||
        slug.replace(/-/g, " ");
      push("category", name, page.at, { path });
    }
  }

  // Prefer browse context category if no category page event yet
  if (
    snapshot.browseContext?.categoryName &&
    !events.some((e) => e.type === "category")
  ) {
    push("category", snapshot.browseContext.categoryName, snapshot.browseContext.at || "");
  }

  const sequence = Array.isArray(snapshot.productViewSequence)
    ? snapshot.productViewSequence
    : [];
  for (const entry of sequence) {
    const label =
      entry.name ||
      entry.modelNumber ||
      entry.itemCode ||
      entry.productId ||
      "Product";
    push(
      entry.revisited ? "product_revisit" : "product_view",
      entry.revisited ? `${label} — Revisited` : label,
      entry.at,
      {
        productId: entry.productId,
        brandName: entry.brandName,
        modelNumber: entry.modelNumber,
      }
    );
  }

  if (popupType) {
    push("popup_shown", `${popupType} Popup Shown`, submittedAt, { popupType });
  }
  if (ctaClicked) {
    push("cta_clicked", `CTA: ${ctaClicked}`, submittedAt, { ctaClicked });
  }
  push("mobile_submitted", "Mobile Submitted", submittedAt);

  return events.map((e, i) => ({ ...e, order: i + 1 }));
}

/**
 * Assemble full enriched fields for SmartLead.create from client payload + request headers.
 */
export function buildEnrichedLeadFields(body = {}, reqMeta = {}) {
  const snapshot = body.snapshot && typeof body.snapshot === "object" ? body.snapshot : {};
  const sourceUrl = String(body.sourceUrl || snapshot.currentUrl || "").slice(0, 500);
  const referrer = String(body.referrer || snapshot.referrer || "").slice(0, 500);
  const utm = {
    ...parseUtmFromUrl(sourceUrl),
    ...(body.utm && typeof body.utm === "object" ? body.utm : {}),
  };
  const trafficSource =
    String(body.trafficSource || "").trim() ||
    inferTrafficSource(referrer, utm);
  const campaign = String(utm.campaign || body.campaign || "").trim();

  const ua = String(reqMeta.userAgent || body.userAgent || "").slice(0, 500);
  const { device, browser } = parseDeviceBrowser(ua);

  const sequenceRaw = Array.isArray(body.productViewSequence)
    ? body.productViewSequence
    : Array.isArray(snapshot.productViewSequence)
      ? snapshot.productViewSequence
      : [];
  // FULL sequence for comparison leads — do not truncate to last 3
  const productViewSequence = sequenceRaw.map((e, i) => productSnapshot(e, i));

  const viewedRaw = Array.isArray(body.productsViewed)
    ? body.productsViewed
    : Array.isArray(snapshot.productsViewed)
      ? snapshot.productsViewed
      : [];
  const productsViewed =
    viewedRaw.length > 0
      ? viewedRaw.map((e, i) => productSnapshot(e, i))
      : (() => {
          const seen = new Map();
          for (const e of productViewSequence) {
            if (!e.productId) continue;
            const prev = seen.get(e.productId);
            seen.set(e.productId, {
              ...e,
              viewCount: (prev?.viewCount || 0) + 1,
            });
          }
          return [...seen.values()];
        })();

  const brandsViewed = [
    ...new Set(
      productViewSequence
        .map((p) => p.brandName)
        .filter(Boolean)
    ),
  ];

  const currentFromBody = body.currentProduct && typeof body.currentProduct === "object"
    ? body.currentProduct
    : snapshot.currentProduct || {};
  const currentProduct = productSnapshot({
    ...currentFromBody,
    productId: body.productId || currentFromBody.productId,
    itemCode: body.itemCode || currentFromBody.itemCode,
    name: body.productName || currentFromBody.name,
    modelNumber: body.modelNumber || currentFromBody.modelNumber,
    brandId: body.brandId || currentFromBody.brandId,
    brandName: body.brandName || currentFromBody.brandName,
    categoryId: body.categoryId || currentFromBody.categoryId,
    categoryName: body.categoryName || currentFromBody.categoryName,
    subcategoryId: body.subcategoryId || currentFromBody.subcategoryId,
    slug: body.productSlug || currentFromBody.slug,
    image: body.productImage || currentFromBody.image,
  });

  const intentScore = Number(body.intentScore ?? snapshot.intentScore) || 0;
  const classification = String(
    body.classification || snapshot.leadClassification?.id || ""
  );
  const classificationLabel =
    body.classificationLabel ||
    snapshot.leadClassification?.label ||
    classificationLabelFromId(classification, intentScore);

  const totalActiveMs = Number(body.totalActiveMs ?? snapshot.totalActiveMs) || 0;
  const currentProductActiveMs =
    Number(body.currentProductActiveMs ?? snapshot.currentProductActiveMs) || 0;

  const popupType = ["CATEGORY", "MODEL", "COMPARISON", "PREMIUM"].includes(body.popupType)
    ? body.popupType
    : "UNKNOWN";
  const ctaClicked = String(body.ctaClicked || "").trim().slice(0, 120);
  const submittedAt = new Date().toISOString();

  const visitorJourney = buildVisitorJourney({
    snapshot: {
      ...snapshot,
      pagesViewed: body.pagesViewed || snapshot.pagesViewed,
      productViewSequence: sequenceRaw,
      browseContext: body.browseContext || snapshot.browseContext,
      firstSeenAt: snapshot.firstSeenAt,
    },
    popupType,
    ctaClicked,
    referrer,
    trafficSource,
    submittedAt,
  });

  const intentSummary =
    String(body.intentSummary || "").trim() ||
    buildIntentSummary({
      classificationId: classification,
      categoryName: currentProduct.categoryName || body.categoryName,
      brandsViewed,
      popupType,
      isPremium: currentProduct.isPremium || Boolean(snapshot.isPremium),
    });

  const visitorTypeRaw =
    body.visitorType ||
    snapshot.visitorType ||
    (snapshot.isReturning ? "returning" : "new");
  const visitorType = visitorTypeRaw === "returning" ? "returning" : "new";
  const mobile = String(body.mobile || "").replace(/\D/g, "").slice(-10);

  return {
    mobile,
    name: String(body.name || "").trim().slice(0, 80),
    visitorId: String(body.visitorId || snapshot.visitorId || "").slice(0, 80),
    sessionId: String(body.sessionId || snapshot.sessionId || "").slice(0, 80),
    visitorType,
    talkToId: String(body.talkToId || "").slice(0, 120),
    sourceUrl,
    currentProduct,
    productId: currentProduct.productId,
    itemCode: currentProduct.itemCode,
    modelNumber: currentProduct.modelNumber,
    brandId: currentProduct.brandId,
    brandName: currentProduct.brandName,
    categoryId: currentProduct.categoryId || String(body.categoryId || "").slice(0, 80),
    categoryName:
      currentProduct.categoryName || String(body.categoryName || "").slice(0, 120),
    subcategoryId:
      currentProduct.subcategoryId || String(body.subcategoryId || "").slice(0, 80),
    subcategoryName: String(body.subcategoryName || "").slice(0, 120),
    productsViewed,
    productViewSequence,
    productPageViewCount:
      Number(body.productPageViewCount ?? snapshot.productPageViewCount) ||
      productViewSequence.length,
    brandsViewed,
    totalActiveMs,
    currentProductActiveMs,
    timeOnSiteLabel: formatDuration(totalActiveMs),
    timeOnProductLabel: formatDuration(currentProductActiveMs),
    referrer,
    trafficSource,
    campaign,
    utm,
    device: String(body.device || device).slice(0, 40),
    browser: String(body.browser || browser).slice(0, 40),
    userAgent: ua,
    ipArea: String(body.ipArea || reqMeta.ipArea || "").slice(0, 120),
    intentScore,
    classification,
    classificationLabel,
    intentSummary,
    popupType,
    ctaClicked,
    whatsappClicked: Boolean(body.whatsappClicked),
    helpOptions: Array.isArray(body.helpOptions)
      ? body.helpOptions.map(String).filter(Boolean)
      : [],
    whatsappRequested: Boolean(body.whatsappRequested),
    visitorJourney,
    contacted: false,
    conversion: false,
    status: "new",
    followUpDate: null,
    assignedStaff: null,
    invoiceRef: "",
    saleValue: null,
    context: {
      displayMode: body.displayMode || body.context?.displayMode || "",
      capturedAt: submittedAt,
    },
  };
}

/** Compact sales-card summary for list views */
export function buildSalesCardSummary(lead = {}) {
  const score = Number(lead.intentScore) || 0;
  const hot = score >= 70 || lead.classification === "hot_premium";
  return {
    headline: hot ? "HOT WEBSITE LEAD" : "WEBSITE LEAD",
    mobile: lead.mobile,
    category: lead.categoryName || "—",
    currentModel:
      lead.currentProduct?.name ||
      lead.modelNumber ||
      lead.itemCode ||
      "—",
    productsViewedCount:
      lead.productPageViewCount ||
      lead.productViewSequence?.length ||
      lead.productsViewed?.length ||
      0,
    brandsViewed: (lead.brandsViewed || []).join(" / ") || "—",
    timeOnSite: lead.timeOnSiteLabel || formatDuration(lead.totalActiveMs),
    source: lead.trafficSource || lead.referrer || "Direct",
    intent: lead.intentSummary || lead.classificationLabel || "—",
    leadScore: score,
    classificationLabel: lead.classificationLabel || classificationLabelFromId(lead.classification, score),
    popupType: lead.popupType,
    visitorType: lead.visitorType,
  };
}
