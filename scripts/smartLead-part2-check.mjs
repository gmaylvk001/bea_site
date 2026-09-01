/**
 * Part 2 — popup decision scenario checks.
 * Run: node scripts/smartLead-part2-check.mjs
 */
import { createEmptyVisitorState } from "../lib/smartLead/storage.js";
import { recordProductView, recordPageVisit, tickEngagement, getVisitorIntentSnapshot } from "../lib/smartLead/tracker.js";
import { selectPopupType, detectPageType } from "../lib/smartLead/popupDecision.js";
import { POPUP_TYPES, POPUP_TRIGGER_MS } from "../lib/smartLead/popupTypes.js";
import { TIMING_MS } from "../lib/smartLead/constants.js";
import { buildPopupContent } from "../lib/smartLead/popupContent.js";
import { canShowLeadPopup } from "../lib/smartLead/frequency.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("OK:", msg);
}

function product(id, category, price = 10000) {
  return {
    _id: id,
    name: `Product ${id}`,
    item_code: `SKU-${id}`,
    model_number: `MDL-${id}`,
    brand: "b1",
    category,
    price,
    special_price: 0,
    slug: `slug-${id}`,
    images: ["img.jpg"],
  };
}

function clearVisit(s) {
  return {
    ...s,
    currentProductStartedAt: null,
    currentProductVisitToken: null,
  };
}

// Comparison: A→B→C same category
{
  let s = createEmptyVisitorState();
  s = recordProductView(s, product("A", "cat1"));
  s = clearVisit(s);
  s = recordProductView(s, product("B", "cat1"));
  s = clearVisit(s);
  s = recordProductView(s, product("C", "cat1"));
  const snap = getVisitorIntentSnapshot(s);
  const d = selectPopupType({
    snapshot: snap,
    pageType: "product",
    pageActiveMs: POPUP_TRIGGER_MS.COMPARISON_SHORT,
  });
  assert(d.type === POPUP_TYPES.COMPARISON, `Comparison popup (got ${d.type}, score ${d.score})`);
  const content = buildPopupContent(POPUP_TYPES.COMPARISON, { snapshot: snap });
  assert(content.products.length === 3, "Comparison shows last 3 products");
  assert(content.primaryCta === "HELP ME CHOOSE", "Comparison primary CTA");
}

// Model: single product dwell + score 30+
{
  let s = createEmptyVisitorState();
  s = recordProductView(s, product("A", "cat1"));
  s = tickEngagement(s, TIMING_MS.PRODUCT_PAGE_30S);
  const snap = getVisitorIntentSnapshot(s);
  assert(snap.intentScore === 25, "score 25 before model needs more — returning or wait");
  // Force interested band without rewriting engine: add returning
  s = { ...s, isReturning: true, score: 25 };
  // manually bump via second tick already at 25; award returning on page would need page visit
  // Simulate score 35 for model gate
  const snap2 = { ...snap, intentScore: 35, leadClassification: { id: "interested" }, isPremium: false };
  const d = selectPopupType({
    snapshot: snap2,
    pageType: "product",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.MODEL, `Model popup (got ${d.type})`);
  const content = buildPopupContent(POPUP_TYPES.MODEL, { snapshot: snap2 });
  assert(content.headline.includes("Interested"), "Model headline");
}

// Premium: isPremium from Part 1 + early dwell
{
  let s = createEmptyVisitorState();
  s = recordProductView(s, product("P", "cat1", 60000));
  s = tickEngagement(s, POPUP_TRIGGER_MS.PREMIUM_EARLY);
  const snap = getVisitorIntentSnapshot(s);
  assert(snap.isPremium === true, "Part 1 marks premium via existing helper");
  const d = selectPopupType({
    snapshot: { ...snap, intentScore: Math.max(snap.intentScore, 30) },
    pageType: "product",
    pageActiveMs: POPUP_TRIGGER_MS.PREMIUM_EARLY,
  });
  assert(d.type === POPUP_TYPES.PREMIUM, `Premium popup (got ${d.type})`);
}

// Category dwell
{
  const snap = {
    intentScore: 35,
    leadClassification: { id: "interested" },
    sameCategoryProductCount: 0,
    isPremium: false,
    totalActiveMs: 0,
    currentProductActiveMs: 0,
    browseContext: { categoryName: "Refrigerator", categoryImage: "/x.jpg" },
  };
  const d = selectPopupType({
    snapshot: snap,
    pageType: "category",
    pageActiveMs: POPUP_TRIGGER_MS.CATEGORY_PAGE,
  });
  assert(d.type === POPUP_TYPES.CATEGORY, `Category popup (got ${d.type})`);
  const content = buildPopupContent(POPUP_TYPES.CATEGORY, {
    snapshot: snap,
    browseContext: snap.browseContext,
  });
  assert(content.headline.includes("Refrigerator"), "Category dynamic name");
}

// Browsing low score → NONE
{
  const d = selectPopupType({
    snapshot: {
      intentScore: 10,
      leadClassification: { id: "browsing" },
      sameCategoryProductCount: 0,
      isPremium: false,
      totalActiveMs: 0,
      currentProduct: { productId: "A" },
    },
    pageType: "product",
    pageActiveMs: 60_000,
  });
  assert(d.type === POPUP_TYPES.NONE, `Browsing does not interrupt (got ${d.type})`);
}

// canShowPopup suppression hook (Part 3)
{
  const d = selectPopupType({
    snapshot: {
      intentScore: 80,
      leadClassification: { id: "hot_premium" },
      sameCategoryProductCount: 3,
      isPremium: true,
      currentProduct: { productId: "A" },
    },
    pageType: "product",
    pageActiveMs: 60_000,
    canShowPopup: () => false,
  });
  assert(d.type === POPUP_TYPES.NONE && d.reason === "suppressed", "Part 3 suppress hook works");
}

// Decision does not mutate score
{
  const snap = {
    intentScore: 40,
    leadClassification: { id: "interested" },
    sameCategoryProductCount: 1,
    isPremium: false,
    currentProduct: { productId: "A", name: "X" },
    currentProductActiveMs: 30_000,
    totalActiveMs: 30_000,
  };
  selectPopupType({ snapshot: snap, pageType: "product", pageActiveMs: 30_000 });
  assert(snap.intentScore === 40, "Popup decision does not change Part 1 score");
}

// Page classification: Search is a supported browse page; Brand stays category
{
  assert(detectPageType("/search") === "search", "Search path is search");
  assert(detectPageType("/search?query=tv") === "search", "Search with query is search");
  assert(detectPageType("/search/") === "search", "Search trailing slash is search");
  assert(detectPageType("/brand/samsung") === "category", "Brand listing is category-style");
  assert(
    detectPageType("/category/brand/tv/samsung") === "category",
    "Nested brand/category URL stays category"
  );
  assert(detectPageType("/product/foo") === "product", "Product path unchanged");
  assert(detectPageType("/category/refrigerator") === "category", "Category path unchanged");
  assert(detectPageType("/") === "other", "Homepage is other");
}

function lastViewedSnap(overrides = {}) {
  return {
    intentScore: 35,
    leadClassification: { id: "interested" },
    sameCategoryProductCount: 1,
    isPremium: false,
    currentProduct: null,
    lastViewedProduct: {
      productId: "A",
      name: "Product A",
      itemCode: "SKU-A",
      isPremium: false,
      categoryName: "TV",
    },
    mobileNumberCaptured: false,
    totalActiveMs: 0,
    ...overrides,
  };
}

// Scenario A — homepage last-viewed MODEL
{
  const snap = lastViewedSnap();
  const d = selectPopupType({
    snapshot: snap,
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.MODEL, `A: homepage last-viewed MODEL (got ${d.type})`);
  const content = buildPopupContent(POPUP_TYPES.MODEL, { snapshot: snap });
  assert(content.productName === "Product A", "A: MODEL refers to last viewed Product A");
}

// Scenario A premium — homepage last-viewed PREMIUM
{
  const snap = lastViewedSnap({
    lastViewedProduct: {
      productId: "P",
      name: "Premium A",
      itemCode: "SKU-P",
      isPremium: true,
    },
  });
  const d = selectPopupType({
    snapshot: snap,
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PREMIUM_EARLY,
  });
  assert(d.type === POPUP_TYPES.PREMIUM, `A: homepage last-viewed PREMIUM (got ${d.type})`);
  const content = buildPopupContent(POPUP_TYPES.PREMIUM, { snapshot: snap });
  assert(content.productName === "Premium A", "A: PREMIUM refers to last viewed Premium A");
}

// Scenario B — later product wins
{
  const snap = lastViewedSnap({
    lastViewedProduct: {
      productId: "B",
      name: "Product B",
      itemCode: "SKU-B",
      isPremium: false,
    },
    productViewSequence: [
      { productId: "A", name: "Product A" },
      { productId: "B", name: "Product B" },
    ],
  });
  const d = selectPopupType({
    snapshot: snap,
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  const content = buildPopupContent(d.type, { snapshot: snap });
  assert(d.type === POPUP_TYPES.MODEL, `B: last-viewed MODEL (got ${d.type})`);
  assert(content.productName === "Product B", "B: popup refers to Product B not A");
}

// Scenario C — Search is eligible; category timing is not applied
{
  const noProduct = lastViewedSnap({ lastViewedProduct: null, productViewSequence: [] });
  const tooEarly = selectPopupType({
    snapshot: noProduct,
    pageType: "search",
    pageActiveMs: POPUP_TRIGGER_MS.CATEGORY_PAGE,
  });
  assert(
    tooEarly.type === POPUP_TYPES.NONE,
    `C: Search without last-viewed is not Category (got ${tooEarly.type})`
  );

  const d = selectPopupType({
    snapshot: lastViewedSnap(),
    pageType: "search",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.MODEL, `C: Search last-viewed MODEL (got ${d.type})`);
}

// Scenario D — Brand uses Category trigger, not last-viewed Model at product timing
{
  const snap = lastViewedSnap({
    browseContext: { categoryName: "Samsung", categorySlug: "samsung", type: "brand" },
  });
  const beforeCategory = selectPopupType({
    snapshot: snap,
    pageType: "category",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(
    beforeCategory.type === POPUP_TYPES.NONE,
    `D: Brand does not fire last-viewed Model at product timing (got ${beforeCategory.type})`
  );
  const atCategory = selectPopupType({
    snapshot: snap,
    pageType: "category",
    pageActiveMs: POPUP_TRIGGER_MS.CATEGORY_PAGE,
  });
  assert(atCategory.type === POPUP_TYPES.CATEGORY, `D: Brand Category-style popup (got ${atCategory.type})`);
}

// Scenario E — mobile captured blocks last-viewed
{
  const d = selectPopupType({
    snapshot: lastViewedSnap({ mobileNumberCaptured: true }),
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.NONE, `E: no last-viewed popup after mobile capture (got ${d.type})`);
}

// Scenario G — no previously viewed product
{
  const d = selectPopupType({
    snapshot: lastViewedSnap({
      lastViewedProduct: null,
      productViewSequence: [],
      productsViewed: [],
    }),
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.NONE, `G: no last-viewed popup without a product (got ${d.type})`);
}

// Existing product-page Model is unchanged when lastViewedProduct is also present
{
  const snap = {
    intentScore: 35,
    leadClassification: { id: "interested" },
    sameCategoryProductCount: 1,
    isPremium: false,
    currentProduct: { productId: "A", name: "On PDP", isPremium: false },
    lastViewedProduct: { productId: "A", name: "On PDP", isPremium: false },
    totalActiveMs: 0,
  };
  const d = selectPopupType({
    snapshot: snap,
    pageType: "product",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
  });
  assert(d.type === POPUP_TYPES.MODEL && d.reason === "product_dwell", `PDP Model reason unchanged (got ${d.reason})`);
}

// lastViewedProduct is stored on view and kept when leaving the PDP
{
  let s = createEmptyVisitorState();
  s = recordProductView(s, product("A", "cat1"));
  assert(s.lastViewedProduct?.productId === "A", "recordProductView stores last viewed");
  const scoreAfterView = s.score;
  s = recordPageVisit(s, { pathname: "/" });
  assert(s.currentProduct == null, "currentProduct cleared off PDP");
  assert(s.lastViewedProduct?.productId === "A", "lastViewedProduct kept off PDP");
  assert(!s.currentProductVisitToken, "30s scoring token cleared off PDP");
  assert(s.score === scoreAfterView, "leaving PDP does not change score");
  s = recordProductView(s, product("B", "cat1"));
  s = recordPageVisit(s, { pathname: "/search" });
  assert(s.lastViewedProduct?.productId === "B", "newer product replaces last viewed");
  const snap = getVisitorIntentSnapshot(s);
  assert(snap.lastViewedProduct?.productId === "B", "snapshot exposes last viewed B");
  assert(snap.currentProduct == null, "snapshot has no current product on Search");
}

// Scenario F — dismiss / frequency suppression unchanged
{
  const snap = lastViewedSnap({
    popupState: {
      leadPopupShownCount: 1,
      leadPopupShown: true,
      closedThisSession: true,
      suppressedForSession: true,
      sessionIdForPopup: "s1",
    },
    sessionId: "s1",
    intentScore: 35,
  });
  assert(
    canShowLeadPopup({ snapshot: snap }) === false,
    "F: dismissed popup stays suppressed for the session"
  );
  const d = selectPopupType({
    snapshot: snap,
    pageType: "other",
    pageActiveMs: POPUP_TRIGGER_MS.PRODUCT_PAGE,
    canShowPopup: (ctx) => canShowLeadPopup(ctx),
  });
  assert(d.type === POPUP_TYPES.NONE, `F: last-viewed respects frequency (got ${d.type})`);
}

console.log("\nAll Part 2 popup decision scenarios passed.");
