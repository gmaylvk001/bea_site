'use client';
// import { useState, useEffect } from "react";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import { SiTicktick } from "react-icons/si";
import { TbBrandAppgallery } from "react-icons/tb";
import { FiBox, FiHash } from "react-icons/fi";
import Image from "next/image";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import Link from "next/link";
import { Poppins } from "next/font/google";
const poppins = Poppins({ subsets: ["latin"], weight: ["400","500","600"] });
import { formatDistanceToNow, format } from "date-fns";
import { useHeaderdetails } from '@/context/HeaderContext';
import { ToastContainer, toast } from 'react-toastify';


function AvailableNearYou() {
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  

useEffect(() => {
  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const res = await fetch("/api/store/get");
      const data = await res.json();
      if (data.success) {
        setStores((data.stores || data.data || []).filter((s) => s.status === "Active").slice(0, 4));
      }
    } catch (err) {
      console.error("Failed to fetch stores", err);
    } finally {
      setLoadingStores(false);
    }
  };
  fetchStores();
}, []);
return (
  <div className="p-4 bg-white">
    <h3 className="text-base font-bold text-gray-900 mb-1">Available Near You</h3>
    <p className="text-xs text-gray-500 mb-3">Check product availability in BEA Stores</p>

    {loadingStores ? (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-5 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    ) : stores.length > 0 ? (
      <div className="space-y-1">
        {stores.slice(0, 4).map((store) => (
          <div key={store._id} className="flex items-center justify-between py-1.5">
            <span className="text-sm font-medium text-gray-800">
              {store.organisation_name || store.name || store.store_name}
            </span>
            <span className="text-sm text-green-600 font-semibold">Available</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No stores found.</p>
    )}

    <Link
      href="/location"
      className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
    >
      View all 47+ stores
    </Link>
  </div>
);
}

function StarRating({ value, onChange }) {
    return (
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <span
              className={`text-2xl ${
                star <= value ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
    );
  }

function DynamicTabs({ tabs, activeName, onTabChange, slotAfterHeader = null }) {
    const titleize = (s) => {
      if (s === "manufacturer") return "Manufacturer Details";
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    };

    return (
      <div>
<div role="tablist" aria-label="Product details" className={`flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-6 sm:gap-10 px-1 ${poppins.className}`}>
          {tabs.map((tab) => (
            <button
              key={tab.name}
              role="tab"
              aria-selected={activeName === tab.name}
              onClick={() => onTabChange && onTabChange(tab.name)}
           className={`py-3 sm:py-4 text-base sm:text-lg transition-all duration-200 border-b-[3px] -mb-[2px] whitespace-nowrap flex-shrink-0 ${
  activeName === tab.name
    ? "border-blue-600 text-blue-600 font-bold"
    : "border-transparent text-gray-600 font-medium hover:text-gray-900"
}`}
            >
              {titleize(tab.name)}
            </button>
          ))}
        </div>

        {slotAfterHeader}

        {/* Keep all tabs mounted; only the active one is visible. */}
        {tabs.map((tab) => {
          const usesExternalSlot = Boolean(slotAfterHeader) && tab.name === "manufacturer";
          const isActive = activeName === tab.name;
          return (
          <div
            key={tab.name}
            role="tabpanel"
            aria-hidden={!isActive}
            style={{ display: isActive && !usesExternalSlot ? "block" : "none" }}
            className={
  tab.name === "overview"
    ? "w-full px-4 py-6 text-left bg-gray-50"
    : "w-full px-4 py-6 text-left"
}
          >
            {tab.content}
          </div>
        );})}
      </div>
    );
  }
 function ReviewsTab({ reviewForm, setReviewForm, handleReviewSubmit, submitting, tabData, formatReviewDate, poppins }) {
  return (
    <div>
      <form onSubmit={handleReviewSubmit} className="bg-white p-4 rounded-md shadow mt-3">
        <h3 className="font-semibold text-left mb-2">Write a Review</h3>
        <label htmlFor="review-title" className="sr-only">Review Title</label>
        <input
          id="review-title"
          type="text"
          placeholder="Review Title"
          value={reviewForm.title}
          onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
          required
          className="w-full border rounded p-2 mb-2"
        />
        <StarRating value={reviewForm.rating} onChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))} />
        <label htmlFor="review-comment" className="sr-only">Review comment</label>
        <textarea
          id="review-comment"
          placeholder="Write your comments..."
          value={reviewForm.comment}
          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
          className="w-full border rounded p-2 mb-2"
          rows="3"
        />
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <h2 className={`text-sm font-bold text-left mt-3 ${poppins.className}`}>Customer Reviews</h2>
      <div className="flex items-center mt-2">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-2xl ${i < Math.floor(tabData.reviews.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
        ))}
        <span className="text-gray-700 ml-2 text-sm">
          {tabData.reviews.rating.toFixed(1)} ({tabData.reviews.count} Reviews)
        </span>
      </div>

      {tabData.reviews.items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tabData.reviews.items.map((review, index) => (
            <div key={index} className={`border-b border-gray-300 pb-3 ${index === 0 ? "border-t" : ""}`}>
              <div className="flex text-lg items-baseline mt-1">
                {[...Array(5)].map((_, i) => (
                  <span className="text-yellow-400" key={i}>{i < review.rating ? '★' : '☆'}</span>
                ))}
                <p className="text-gray-700 font-medium text-sm ml-1">{review.title}</p>
              </div>
              <p className="text-gray-700 text-left mt-2 text-sm">{review.comment}</p>
              <p className="text-gray-400 text-left text-xs mt-1">
                Reviewed By {review.userName} on {formatReviewDate(review.date)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mt-4 text-sm">No reviews yet. Be the first to review this product!</p>
      )}
    </div>
  );
}

function parseProductHighlights(highlights) {
  if (!Array.isArray(highlights)) return [];
  return highlights
    .flatMap((item) => String(item).split(/[\n,]+/).map((x) => x.trim()))
    .filter((item) => item.length > 0);
}

function parseKeyFeatures(keySpecs) {
  if (!Array.isArray(keySpecs)) return [];
  return keySpecs
    .flatMap((item) => String(item).split(/,(?![^(]*\))/))
    .map((f) => String(f).replace(/[{}\[\]"]/g, "").trim())
    .filter((f) => f.length > 0);
}

function getProductBrandId(product) {
  if (!product?.brand) return "";
  if (typeof product.brand === "object") {
    return String(product.brand._id || product.brand.id || "");
  }
  return String(product.brand);
}

function extractFlixMpn(p = {}) {
  const explicit = (p.model_number || p.mpn || p.MPN || p.modelNumber || "").toString().trim();
  if (explicit && explicit.toLowerCase() !== "null" && explicit.toLowerCase() !== "undefined") {
    return explicit;
  }

  const name = (p.name || "").toString();
  const paren = name.match(/\(([A-Z0-9][A-Z0-9-]{4,})/i);
  if (paren?.[1]) return paren[1].toUpperCase();

  const slug = (p.slug || "").toString();
  const slugTail = slug.match(/([0-9]{2}[a-z]{2}[0-9]{4}[a-z]{0,4})$/i);
  if (slugTail?.[1]) return slugTail[1].toUpperCase();

  return "";
}

const FlixMountPoints = memo(function FlixMountPoints({ inpageRef, minisiteRef }) {
  return (
    <>
      <div
        ref={inpageRef}
        id="flix-inpage"
        className="flix-inpage-container w-full min-h-[200px]"
        style={{ width: "100%" }}
      />
      <div
        ref={minisiteRef}
        id="flix-minisite"
        className="flix-minisite-container w-full mt-4 min-h-[60px]"
        style={{ width: "100%" }}
      />
    </>
  );
});

function flixHasVisibleContent(el) {
  if (!el) return false;
  // Flix first injects <script> tags — those are not visible content
  if (el.querySelector(
    "iframe, img, video, table, canvas, .flix-module, #flix-wrapper, [data-flix-embed-meta], [id*='flix-inpage'], [id*='flix-std'], [class*='Flix'], [class*='flix']"
  )) {
    return true;
  }
  const nonScriptKids = Array.from(el.children).filter((n) => n.tagName !== "SCRIPT");
  if (nonScriptKids.length === 0) return false;
  const text = (el.innerText || "").trim();
  return text.length > 20 || nonScriptKids.some((n) => (n.innerHTML || "").length > 40);
}

export default function ProductDetailsSection({
  product,
  reviews = [],
  avgRating = 0,
  reviewCount = 0,
  manufacturerName = "",
  manufacturerAddress = "",
  flixInstanceActive = true,
}) {
  const [brand, setBrand] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  // NEW: ensure default tab is set only once per product id
  const defaultTabSetRef = useRef(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(false);
  const { updateHeaderdetails, setIsLoggedIn, setUserData,setIsAdmin } = useHeaderdetails();
  const flixScriptRef = useRef(null);
  const flixInitializedRef = useRef(false);
  const [brandName, setBrandName] = useState("");
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const flixLoadAttemptedRef = useRef(false);
  // NEW: track if flix content has loaded before (persisted per product)
  const [flixLoaded, setFlixLoaded] = useState(false);
  // NEW: observer ref to watch for injected Flix nodes
  const flixObserverRef = useRef(null);
  const flixInpageRef = useRef(null);
  const flixMinisiteRef = useRef(null);
  const sectionRootRef = useRef(null);

  const productHighlights = useMemo(
    () => parseProductHighlights(product?.product_highlights),
    [product?.product_highlights],
  );
  const keyFeatures = useMemo(
    () => parseKeyFeatures(product?.key_specifications),
    [product?.key_specifications],
  );
 
  const tabData = {
    overview: product.overview || "No overview available.",
    description: product.description || "No description available.",
    videos: product.videos || [],
    overview: product.overview || "No overview available.",
    // reviews: {
    //   rating: product.rating || 0,
    //   count: product.reviews || 0,
    //   items: product.reviewItems || []
    // }
    reviews: {
      rating: avgRating,
      count: reviewCount,
      items: reviews.map(r => ({
        title: r.reviews_title,
        rating: r.reviews_rating,
        comment: r.reviews_comments,
        userName: r.user_id?.name || "Anonymous",
        date: r.created_date
      }))
    }
  };
  // Replace "tabs" with UI-aligned tabs only (videos is not rendered in tabsForUI)
  // const tabs = ["overview", "description", "videos", "reviews"];
  const uiTabs = ["overview", "specifications", "manufacturer", "reviews", "faq"];

  // Check if a tab has content
  const hasTabContent = (tabId) => {
    const PLACEHOLDER = "There is no product overview available for this item.";
    switch (tabId) {
      case "overview":
        return Boolean(
          ((product.overview && product.overview.trim() !== "" && product.overview.trim() !== PLACEHOLDER)) ||
          (product.overview_image &&
            (Array.isArray(product.overview_image)
              ? product.overview_image.length > 0
              : String(product.overview_image).split(",").filter(Boolean).length > 0)) ||
          (product.flix_data && (product.flix_data.inpage || product.flix_data.widget))
        );
      case "description":
        return product.description && product.description.trim() !== "";
      case "reviews":
        return true;
      // "videos" is intentionally ignored because it is not rendered in tabsForUI
      default:
        return false;
    }
  };

  // Only consider the tabs actually rendered by the UI
  const getFirstTabWithContent = () => {
    for (const tab of uiTabs) {
      if (hasTabContent(tab)) return tab;
    }
    return "overview";
  };

  // REPLACE the multi-effect activeTab setters with a single, one-time initializer per product
  useEffect(() => {
    // reset the one-time flag when product changes
    defaultTabSetRef.current = false;
  }, [product?._id]);

  useEffect(() => {
    if (!product || defaultTabSetRef.current) return;
    const firstAvailable = getFirstTabWithContent();
    setActiveTab(firstAvailable);
    defaultTabSetRef.current = true;
  }, [product, reviews?.length]);

  // DELETE this effect to prevent tab flicker and "overview" disappearing:
  // useEffect(() => {
  //   if (!product) return;
  //   const hasTextOrImages = /* ...existing code... */;
  //   if (flixLoaded || hasTextOrImages) { setActiveTab("overview"); } else if (...) { ... } else { ... }
  // }, [product?._id, flixLoaded]);

  // Keep any deep-link (#reviews) override
  const reviewsRef = useRef(null);
  useEffect(() => {
    if (window.location.hash === "#reviews") {
      setActiveTab("reviews");
      setTimeout(() => {
        const headerEl = document.querySelector("header"); // get header
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
  
        if (reviewsRef.current) {
          const y = reviewsRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 10; 
          // `-10` gives little gap below header
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 300);
    }
  }, []);
  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        console.error(result.error);
      } else {
        const data = result.data;

        // Format for react-select
        const brandOptions = data.map((b) => ({
          value: String(b._id),
          label: b.brand_name,
          manufacturer_name: b.manufacturer_name || "",
          manufacturer_address: b.manufacturer_address || "",
        }));

        setBrand(brandOptions);
        const brandId = getProductBrandId(product);
        if (brandId) {
          const matched = brandOptions.find((b) => String(b.value) === brandId);
          if (matched?.label) {
            setBrandName((prev) => (prev ? prev : matched.label));
          }
        }
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setBrandsLoaded(true);
    }
  };
  // Removed premature initialActiveName calculation; it will be defined after tabsForUI.
  // const initialActiveName =
  //   tabsForUI.find((tab) => tab.content && tab.content !== "")?.name || null;
  useEffect(() => {
    fetchBrand();
  }, [product?._id]);
  // Derive brandName from the product object or fallback fields; update when product/brand list changes
  useEffect(() => {
    if (!product) return;
    let derived = "";
    const brandId = getProductBrandId(product);

    if (product.brand && typeof product.brand === "object" && product.brand.brand_name) {
      derived = product.brand.brand_name;
    } else if (brandId) {
      const matched = Array.isArray(brand) ? brand.find((b) => String(b.value) === brandId) : null;
      if (matched?.label) derived = matched.label;
    } else if (product.brand_name) {
      derived = product.brand_name;
    } else if (product.manufacturer) {
      derived = product.manufacturer;
    }

    if (derived && derived !== brandName) {
      setBrandName(derived);
    }
  }, [product, brand]);

  const FLIX_DISTRIBUTOR_ID = "17089";
  const FLIX_LANGUAGE = "in";
  const FLIX_LOADER_SRC = "https://media.flixfacts.com/js/loader.js";

  const markFlixSuccess = () => {
    flixInitializedRef.current = true;
    setFlixLoaded(true);
    try {
      if (product?._id) sessionStorage.setItem(`flixLoaded:${product._id}`, "1");
    } catch {}
    console.log("[Flix] visible content detected");
  };

  const isThisInstanceVisible = () => {
    const el = sectionRootRef.current;
    if (!el || typeof window === "undefined") return false;
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      node = node.parentElement;
    }
    return true;
  };

  const areFlixTargetsVisible = () => {
    const inpage = flixInpageRef.current;
    if (!inpage || !isThisInstanceVisible()) return false;
    let node = inpage;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
      node = node.parentElement;
    }
    const rect = inpage.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const claimFlixContainers = () => {
    const inpage = flixInpageRef.current;
    const minisite = flixMinisiteRef.current;
    if (!inpage || !minisite) return false;
    if (!areFlixTargetsVisible()) {
      if (inpage.id === "flix-inpage") inpage.removeAttribute("id");
      if (minisite.id === "flix-minisite") minisite.removeAttribute("id");
      return false;
    }
    // Ensure IDs live on THIS instance only
    document.querySelectorAll("#flix-inpage").forEach((n) => {
      if (n !== inpage) n.removeAttribute("id");
    });
    document.querySelectorAll("#flix-minisite").forEach((n) => {
      if (n !== minisite) n.removeAttribute("id");
    });
    inpage.id = "flix-inpage";
    minisite.id = "flix-minisite";
    return true;
  };

  const clearFlixContainers = () => {
    const inpage = flixInpageRef.current;
    const minisite = flixMinisiteRef.current;
    if (inpage) inpage.innerHTML = "";
    if (minisite) minisite.innerHTML = "";
  };

  const removeFlixLoaderScript = () => {
    try {
      if (window.flixJsCallbacks && typeof window.flixJsCallbacks.reset === "function") {
        window.flixJsCallbacks.reset();
      }
    } catch {}
    document.querySelectorAll('script[data-flix="true"]').forEach((s) => s.remove());
    flixScriptRef.current = null;
    flixInitializedRef.current = false;
  };

  const startFlixObserver = () => {
    try {
      if (flixObserverRef.current) {
        try { flixObserverRef.current.disconnect(); } catch {}
        flixObserverRef.current = null;
      }
      const inpage = flixInpageRef.current;
      const minisite = flixMinisiteRef.current;
      if (!inpage && !minisite) return;

      if (flixHasVisibleContent(inpage) || flixHasVisibleContent(minisite)) {
        markFlixSuccess();
        return;
      }

      const obs = new MutationObserver(() => {
        if (flixHasVisibleContent(flixInpageRef.current) || flixHasVisibleContent(flixMinisiteRef.current)) {
          markFlixSuccess();
          try { obs.disconnect(); } catch {}
          flixObserverRef.current = null;
        }
      });
      if (inpage) obs.observe(inpage, { childList: true, subtree: true });
      if (minisite) obs.observe(minisite, { childList: true, subtree: true });
      flixObserverRef.current = obs;
    } catch {}
  };

  const reloadFlixModules = () => {
    try {
      if (window.flixJsCallbacks && typeof window.flixJsCallbacks.loadService === "function") {
        console.log("[Flix] calling flixJsCallbacks.loadService(inpage/minisite)");
        window.flixJsCallbacks.loadService("inpage");
        window.flixJsCallbacks.loadService("minisite");
        return true;
      }
      const cbNames = ["_loadInpageCallback", "_loadMinisiteCallback", "_loadCallback"];
      let invoked = false;
      for (const name of cbNames) {
        if (typeof window.flixJsCallbacks?.[name] === "function") {
          window.flixJsCallbacks[name]();
          invoked = true;
        }
      }
      return invoked;
    } catch (e) {
      console.warn("[Flix] loadService failed", e);
    }
    return false;
  };

  const getFlixIdentifiers = () => {
    const { mpn, ean, upc, sku, brandCode } = resolveFlixIds(product || {});
    const extractedMpn = extractFlixMpn(product || {});
    const primaryMpn =
      extractedMpn ||
      (brandCode || "").toString().trim() ||
      (product?.item_code || "").toString().trim() ||
      mpn ||
      "";
    return { primaryMpn, ean, upc, sku, brandCode };
  };

  const loadFlixScript = () => {
    const headID = document.getElementsByTagName("head")[0];
    if (!headID || !product || !flixInstanceActive) return;

    const { primaryMpn, ean, upc, sku } = getFlixIdentifiers();
    console.log("[Flix] identifiers:", {
      brand: brandName,
      mpn: primaryMpn,
      ean,
      upc,
      sku,
      item_code: product?.item_code,
      model_number: product?.model_number,
    });

    // Always inject a fresh loader so Flix targets the currently visible mount points
    removeFlixLoaderScript();
    clearFlixContainers();

    const flixScript = document.createElement("script");
    flixScript.type = "text/javascript";
    flixScript.async = true;
    flixScript.src = FLIX_LOADER_SRC;
    flixScript.setAttribute("data-flix", "true");
    flixScript.setAttribute("data-flix-distributor", FLIX_DISTRIBUTOR_ID);
    flixScript.setAttribute("data-flix-language", FLIX_LANGUAGE);
    flixScript.setAttribute("data-flix-fallback-language", "en");
    // Always set ean (even empty) — Flix loader expects the attribute
    flixScript.setAttribute("data-flix-ean", ean ? String(ean) : "");
    if (brandName) flixScript.setAttribute("data-flix-brand", brandName);
    if (primaryMpn) flixScript.setAttribute("data-flix-mpn", String(primaryMpn));
    if (upc) flixScript.setAttribute("data-flix-upc", String(upc));
    if (sku) flixScript.setAttribute("data-flix-sku", String(sku));
    flixScript.setAttribute("data-flix-inpage", "flix-inpage");
    flixScript.setAttribute("data-flix-button", "flix-minisite");

    flixScript.onload = () => {
      console.log("[Flix] loader.js loaded", { brand: brandName, mpn: primaryMpn });
      startFlixObserver();
      setTimeout(() => reloadFlixModules(), 300);
      setTimeout(() => reloadFlixModules(), 1500);
      setTimeout(() => {
        if (flixHasVisibleContent(flixInpageRef.current) || flixHasVisibleContent(flixMinisiteRef.current)) {
          markFlixSuccess();
        } else {
          console.log("[Flix] no visible HTML yet (script tags alone do not count)");
        }
      }, 12000);
    };

    flixScript.onerror = (error) => {
      console.error("[Flix] failed to load loader.js", error);
    };

    headID.appendChild(flixScript);
    flixScriptRef.current = flixScript;
  };

  const initializeFlixMedia = () => {
    if (!flixInstanceActive || activeTab !== "manufacturer") return;
    if (!claimFlixContainers()) {
      console.log("[Flix] containers not visible on this instance — skip");
      return;
    }
    console.log("[Flix] initialize", { brand: brandName, tab: activeTab });
    startFlixObserver();
    loadFlixScript();
  };

  // Only load Flix after Manufacturer Details tab is open and mount points are visible
  useEffect(() => {
    if (!flixInstanceActive || activeTab !== "manufacturer" || !brandsLoaded || !brandName || !product?._id) {
      return;
    }
    setFlixLoaded(false);
    const timer = setTimeout(() => initializeFlixMedia(), 450);
    return () => clearTimeout(timer);
  }, [activeTab, flixInstanceActive, brandsLoaded, brandName, product?._id]);

  useEffect(() => {
    if (!product) return;
    setActiveTab("overview");
    flixInitializedRef.current = false;
    flixLoadAttemptedRef.current = false;
    setFlixLoaded(false);
  }, [product?._id]);

  useEffect(() => {
    return () => {
      if (flixObserverRef.current) {
        try { flixObserverRef.current.disconnect(); } catch {}
        flixObserverRef.current = null;
      }
      // Do NOT wipe Flix container HTML on unmount of inactive duplicate —
      // only clear IDs so the remaining instance can claim them.
      const inpage = flixInpageRef.current;
      const minisite = flixMinisiteRef.current;
      if (inpage && inpage.id === "flix-inpage") inpage.removeAttribute("id");
      if (minisite && minisite.id === "flix-minisite") minisite.removeAttribute("id");
    };
  }, []);
  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const response = await fetch(
        `/api/product/related?categoryId=${product.category._id}&excludeId=${product._id}&limit=4`
      );
      const data = await response.json();
      if (data.success) {
        setRelatedProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoadingRelated(false);
    }
  };
  // put this near the top of your component (before return)
  const parseJSONSafe = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value; // already an object
    if (typeof value !== "string") return null;

    const tryParse = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return undefined;
      }
    };

    let s = value.trim();

    // 1) direct parse
    let parsed = tryParse(s);
    if (parsed !== undefined) {
      // if parsed is a string again (double-encoded), recurse
      return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 2) strip wrapping quotes if present and try again
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
      parsed = tryParse(s);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 3) unescape common escaped quotes/slashes and try one last time
    try {
      const unescaped = s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      parsed = tryParse(unescaped);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    } catch {}

    return null; // couldn't parse
  };
  const decodeAndClean = (str) => {
    if (!str) return "";

    // Create a temporary element to decode HTML entities
    const temp = document.createElement("textarea");
    temp.innerHTML = str;
    let decoded = temp.value;

    // Remove both actual LRM char and literal "&lrm;"
    decoded = decoded.replace(/\u200E/g, "").replace(/&lrm;/gi, "");

    return decoded.trim();
  };
  const fetchRecentlyViewed = async () => {
    try {
      setLoadingRecentlyViewed(true);
      const response = await fetch(`/api/product/recently-viewed?limit=4`);
      const data = await response.json();
      if (data.success) {
        setRecentlyViewed(data.products);
      }
    } catch (error) {
      // console.error("Error fetching recently viewed products:", error);
       toast.error("Error fetching recently viewed products:", error);
    } finally {
      setLoadingRecentlyViewed(false);
    }
  };
  const renderProductCard = (product) => {
    const discountPercentage = product.special_price 
      ? Math.round(((product.price - product.special_price) / product.price) * 100)
      : 0;

    return (
      <div key={product._id} className="border rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow relative">
        {discountPercentage > 0 && (
          <span className={`px-1 sm:px-2 py-1 text-xs font-bold tracking-wider text-white rounded absolute top-1 sm:top-2 left-1 sm:left-2 ${
            discountPercentage > 30 ? "bg-blue-500" : "bg-orange-500"
          }`}>
            -{discountPercentage}% OFF
          </span>
        )}
        
        <Link href={`/product/${product.slug || product._id}`}>
          <div className="relative h-32 sm:h-40 w-full">
            <Image 
              src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"} 
              alt={product.name} 
              fill
              className="object-contain rounded-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.jpg";
              }}
            />
          </div>
        </Link>

        <Link href={`/product/${product.slug || product._id}`}>
          <h3 className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 hover:text-blue-600 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-gray-600 text-xs">By {product.brand?.brand_name || "Our Store"}</p>
        <div className="flex items-center mt-1">
          <p className="text-sm sm:text-lg font-bold">${product.special_price || product.price}</p>
          {product.special_price && (
            <p className="text-gray-500 text-xs sm:text-sm line-through ml-1 sm:ml-2">${product.price}</p>
          )}
        </div>
        <div className="flex items-center text-xs sm:text-sm mt-1">
          <FaStar className="text-yellow-400 text-xs sm:text-sm" /> 
          <span className="px-1">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-500">({product.reviews || 0})</span>
        </div>
        <button 
          className="w-full mt-1 sm:mt-2 py-1 sm:py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition duration-300"
          style={{ backgroundColor: '#e0e7ff', color: '#1d4ed8' }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#e0e7ff';
            e.target.style.color = '#1d4ed8';
          }}
        >
          Add To Cart <FaShoppingCart className="text-xs sm:text-sm" />
        </button>
      </div>
    );
  };
  const renderLoadingSkeleton = (count = 4) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="border rounded-lg p-2 sm:p-3 shadow-md animate-pulse">
            <div className="bg-gray-200 h-32 sm:h-40 rounded-md"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2"></div>
            <div className="h-2 sm:h-3 bg-gray-200 rounded mt-1 w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2 w-1/2"></div>
            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg mt-1 sm:mt-2"></div>
          </div>
        ))}
      </div>
    );
  };
  function formatReviewDate(date) {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - reviewDate) / (1000 * 60 * 60 * 24));

    if (diffInDays < 7) {
      return formatDistanceToNow(reviewDate, { addSuffix: true });
    } else {
      return format(reviewDate, "MMM d, yyyy"); 
    }
  }
  const [reviewForm, setReviewForm] = useState({
    title: "",
    rating: 0,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const userId = "66f03a7b8f...";

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const reslt = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      const data1 = await reslt.json();
      if (!data1.loggedIn) {
        // Guard to avoid ReferenceError if openAuthModal is not defined
        if (typeof openAuthModal === 'function') {
          openAuthModal({
            error: 'Please login to continue.',
            onSuccess: () => handleReviewSubmit(),
          });
        }
        toast.error("Please login to continue!..");
        return;
      }

      if(data1.loggedIn) {
        const userId    = data1.user.userId;
        const productId = product._id;
        const res = await fetch(`/api/reviews/${product._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            productId,
            reviews_title: reviewForm.title,
            reviews_rating: reviewForm.rating,
            reviews_comments: reviewForm.comment,
          }),
        });
        const data = await res.json();
        if (data.success) {
           toast.success("Review added successfully!");
          // window.location.reload();
        } else {
           toast.error("Error: " + data.error);
        }
      }else {
         toast.error("Please login to review the product!..");
        // alert("Please login to review the product!..")
      }
    } catch (error) {
      // console.error("Error submitting review:", error);
       toast.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };
  // Small, controlled tab component: keep Overview mounted to preserve injected DOM

const overviewContent = (
  <div className="w-full text-left" id="overview-tab">
    {product.overviewdescription && (
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-2">{product.name} Overview</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{product.overviewdescription}</p>
      </div>
    )}

    {keyFeatures.length > 0 && (
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Key Features</h3>
        <ul className="space-y-2">
          {keyFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {feature.charAt(0).toUpperCase() + feature.slice(1)}
              </li>
            ))}
        </ul>
      </div>
    )}
    {!product.overviewdescription &&
     keyFeatures.length === 0 &&
     productHighlights.length === 0 && (
      <p className="text-gray-500 text-sm py-4">There is no product overview available for this item.</p>
    )}
  </div>
);
const descriptionContent = (() => {
  // Enhanced sanitize function to detect "<p>null</p>" and other null patterns
  const isNullContent = (value) => {
    if (!value) return true;
    const strValue = String(value).trim().toLowerCase();
    
    // Check for various null patterns including HTML null
    const nullPatterns = [
      "", "null", "undefined", "n/a", "none", "-", 
      "null null", "undefined undefined", "nan",
      "<p>null</p>", "<p>undefined</p>", "<p>n/a</p>",
      "&lt;p&gt;null&lt;/p&gt;", "&lt;p&gt;undefined&lt;/p&gt;"
    ];
    
    return nullPatterns.includes(strValue) || 
           strValue.replace(/<[^>]*>/g, '').trim() === 'null' ||
           strValue === '<p></p>' ||
           strValue === '<p> </p>';
  };

  // Check if we have any real content
  const hasRealContent = () => {
    // Check description
    if (product?.description && !isNullContent(product.description)) {
      return true;
    }
    
    // Check specifications
    const specs = [
      product?.ingredients,
      product?.weight,
      product?.dimensions,
      product?.item_code
    ];
    
    return specs.some(spec => spec && !isNullContent(spec));
  };

  // If no real content, return null to hide the entire tab
  if (!hasRealContent()) {
    return null;
  }

  const descObj = parseJSONSafe(product?.description);
  const hasValidDescription = descObj && typeof descObj === "object" && Object.keys(descObj).length > 0;
  
  // Only show plain description if it's not null content
  const hasPlainDescription = product?.description && 
                            !isNullContent(product.description) && 
                            !descObj;

  // Build specifications - filter out null values
  const specifications = [
    {
      icon: <TbBrandAppgallery size={14} className="text-white" />,
      label: "Brand",
      value: Array.isArray(brand) ? brand.find((b) => b.value === product.brand)?.label : "",
    },
    {
      icon: <FiHash size={16} className="text-white" />,
      label: "Item Code", 
      value: product?.item_code,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Ingredients",
      value: product?.ingredients,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Weight",
      value: product?.weight,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Dimensions",
      value: product?.dimensions, 
    }
  ].filter(item => {
    const value = item.value;
    return value && !isNullContent(value);
  });

  const hasSpecifications = specifications.length > 0;

  const decodeAndClean = (html) => {
  if (!html) return "";

  let cleaned = html;

  // remove starting/ending quotes
  cleaned = cleaned.replace(/^"+|"+$/g, "");

  // remove <p>" and "</p>
  cleaned = cleaned.replace(/^<p>"/, "").replace(/"<\/p>$/, "");

  // decode escaped slashes
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\\//g, "/");

  // remove unicode invisible chars
  cleaned = cleaned.replace(/\\u200e/g, "");

  // decode html entities
  const txt = document.createElement("textarea");
  txt.innerHTML = cleaned;
  cleaned = txt.value;

  return cleaned;
};



  return (
    <div>
      {/* Product Description - only show if we have valid content */}
      {/* {(hasValidDescription || hasPlainDescription) && (
        <>
          <h2 className={`text-sm font-bold text-left ${poppins.className}`}>
            Product Description
          </h2>

          {hasValidDescription ? (
            <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
              {Object.entries(descObj)
                .filter(([key, val]) => {
                  return key && val && !isNullContent(key) && !isNullContent(val);
                })
                .map(([key, val]) => {
                  const cleanKey = decodeAndClean(key);
                  const cleanVal = decodeAndClean(val);
                  return (
                    <div
                      key={cleanKey}
                      className="grid grid-cols-[150px,1fr] gap-x-2 items-start"
                    >
                      <div className={`text-xs sm:text-sm font-bold ${poppins.className}`}>
                        {cleanKey}:
                      </div>
                      <div className={`text-xs sm:text-sm ${poppins.className}`}>
                        {cleanVal}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              className="mt-3 text-xs sm:text-sm text-gray-700 prose prose-gray max-w-none text-left [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_tr:nth-child(even)]:bg-gray-50 [&_th]:bg-gray-100 [&_th]:font-semibold"
              dangerouslySetInnerHTML={{
                __html: decodeAndClean(String(product?.description || "")),
              }}
            />
          )}
        </>
      )} */}

      {(hasValidDescription || hasPlainDescription) && (
        <>
          <h2 className={`text-sm font-bold text-left ${poppins.className}`}>Product Description</h2>
          {hasValidDescription ? (
            <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
              {Object.entries(descObj)
                .filter(([key, val]) => {
                  return (
                    key &&
                    val &&
                    !isNullContent(key) &&
                    !isNullContent(val)
                  );
                })
                .map(([key, val]) => {
                  const cleanKey = decodeAndClean(key);
                  const cleanVal = decodeAndClean(val);

                  return (
                    <div key={cleanKey} className="grid grid-cols-[150px,1fr] gap-x-2 items-start">
                      <div className={`text-xs sm:text-sm font-bold ${poppins.className}`}>{cleanKey}:</div>
                      <div className={`text-xs sm:text-sm ${poppins.className}`}>{cleanVal}</div>
                    </div>
                  );
                })}
            </div>
          ) : (
            (() => {
              const cleanedDescription = decodeAndClean(
                String(product?.description || "")
              );

              // table html iruka check
              const hasTableHtml = cleanedDescription.includes("<table") || cleanedDescription.includes("&lt;table");

              return (
                <div
                  className={
                    hasTableHtml
                      ? `
                        mt-3
                        text-xs sm:text-sm
                        text-gray-700
                        prose
                        prose-gray
                        max-w-none
                        text-left
                        overflow-x-auto

                        [&_table]:w-full
                        [&_table]:border
                        [&_table]:border-collapse

                        [&_th]:border
                        [&_td]:border

                        [&_th]:p-2
                        [&_td]:p-2

                        [&_th]:bg-gray-100
                        [&_th]:font-semibold

                        [&_tr:nth-child(even)]:bg-gray-50
                      `
                      : `
                        mt-3
                        text-xs sm:text-sm
                        text-gray-700
                        prose
                        prose-gray
                        max-w-none
                        text-left
                      `
                  }
                  dangerouslySetInnerHTML={{
                    __html: cleanedDescription,
                  }}
                />
              );
            })()
          )}
        </>
      )}

      {/* Product Specifications - only show if we have valid specifications */}
      {hasSpecifications && (
        <>
          <h2 className={`text-sm font-bold mt-3 text-left ${poppins.className}`}>
            Product Specifications
          </h2>

          <ul className="mt-1 sm:mt-2 text-gray-700 text-xs sm:text-sm space-y-1">
            {specifications.map((item, idx) => (
              <li key={idx} className="flex items-center">
                <div className="w-5 h-5 flex items-center justify-center bg-gray-600 rounded-md mr-2">
                  {item.icon}
                </div>
                <div className="flex gap-x-1">
                  <strong className={`text-xs sm:text-sm ${poppins.className}`}>
                    {item.label}:
                  </strong>
                  <span className={`${poppins.className}`}>{item.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
})();
  //const resolveFlixIds = (p = {}) => { ... }
{/*   {activeTab === "videos" && (
          <div>
            <h2 className={`text-sm font-bold transition-all duration-200 text-left mt-3 ${poppins.className}`}>Product Videos</h2>
            {tabData.videos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-2 sm:mt-4">
                {tabData.videos.map((video, index) => (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <iframe
                      className="w-full h-48 sm:h-64 rounded-lg"
                      src={video.url}
                      title={video.title || `Product Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    {video.title && (
                      <p className="mt-1 sm:mt-2 font-medium text-gray-800 text-sm sm:text-base">{video.title}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">No videos available for this product.</p>
            )}
          </div>
        )} */}

  const faqContent = (
  <div className="text-left max-w-3xl mx-auto">
    <h3 className="text-base font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
    {Array.isArray(product.faqs) && product.faqs.length > 0 ? (
      <div className="space-y-3">
        {product.faqs.map((faq, index) => (
          <details key={index} className="border border-gray-200 rounded-lg p-3 cursor-pointer">
            <summary className="font-medium text-sm text-gray-800 flex justify-between items-center">
              {faq.question}
              <span className="text-blue-600 text-lg">+</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No FAQs available for this product.</p>
    )}
  </div>
); 
const productBrandId = getProductBrandId(product);
const matchedBrandLocal = Array.isArray(brand)
  ? brand.find((b) => String(b.value) === productBrandId)
  : null;
const displayManufacturerName = manufacturerName || matchedBrandLocal?.manufacturer_name || "";
const displayManufacturerAddress = manufacturerAddress || matchedBrandLocal?.manufacturer_address || "";

const manufacturerContent = (
  <div className="text-left w-full min-h-[1px]" aria-hidden="true" />
);
  // Build tabsForUI (name + content)
const tabsForUI = useMemo(() => [
  { name: "overview", content: overviewContent },
  { name: "specifications", content: descriptionContent },
  { name: "manufacturer", content: manufacturerContent },
  { name: "reviews", content: (
    <ReviewsTab
      reviewForm={reviewForm}
      setReviewForm={setReviewForm}
      handleReviewSubmit={handleReviewSubmit}
      submitting={submitting}
      tabData={tabData}
      formatReviewDate={formatReviewDate}
      poppins={poppins}
    />
  )},
  { name: "faq", content: faqContent },
], [reviewForm, submitting, tabData, overviewContent, descriptionContent, faqContent, manufacturerName, manufacturerAddress, manufacturerContent]);
  // Compute initialActiveName AFTER tabsForUI is initialized
  const initialActiveName = (() => {
    const PLACEHOLDER = "There is no product overview available for this item.";
    const hasValidContent = (c) => {
      if (c === null || c === undefined || c === false) return false;
      if (typeof c === "string") {
        const trimmed = c.trim();
        if (!trimmed) return false;
        // Skip if placeholder message present
        if (trimmed.includes(PLACEHOLDER)) return false;
        return true;
      }
      if (Array.isArray(c)) return c.length > 0;
      return true; // JSX or other truthy content
    };
    const overview = tabsForUI.find(t => t.name.toLowerCase() === "overview");
    if (overview && hasValidContent(overview.content)) return overview.name;
    const firstWithContent = tabsForUI.find(t => hasValidContent(t.content));
    return firstWithContent ? firstWithContent.name : (tabsForUI[0]?.name || "");
  })();

  
return (
 <div ref={sectionRootRef} className="mt-1 sm:mt-2 w-full">
    <ToastContainer position="top-right" autoClose={5000} />
    
    {/* Section 1 — Key Features + Available Near You */}
    <div className="bg-white py-6 px-4 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left — Key Features + Highlights */}
        <div className="text-left">
          {product.overviewdescription && (
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-2">{product.name} Overview</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{product.overviewdescription}</p>
            </div>
          )}
          {productHighlights.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Product Highlights</h3>
              <ul className="space-y-2">
                {productHighlights.map((item, index) => {
                    const cleaned = item.replace(/[\[\]{}"]/g, '').trim();
                    const [key, ...rest] = cleaned.split(':');
                    const value = rest.join(':').trim();
                    return (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        <span><strong>{key?.trim()}</strong>{value ? `: ${value}` : ''}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : keyFeatures.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {keyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {feature.charAt(0).toUpperCase() + feature.slice(1)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!product.overviewdescription &&
           productHighlights.length === 0 &&
           keyFeatures.length === 0 && (
            <p className="text-gray-500 text-sm">No overview available.</p>
          )}
        </div>

        {/* Right — Available Near You */}
        <div>
          <AvailableNearYou />
        </div>

      </div>
    </div>

    {/* Section 2 — Tabs */}
    <div className="bg-gray-100 py-4 px-2 sm:px-4 max-w-7xl mx-auto">
     <DynamicTabs
  tabs={tabsForUI}
  activeName={activeTab}
  onTabChange={setActiveTab}
  poppins={poppins}
  slotAfterHeader={
    flixInstanceActive && activeTab === "manufacturer" ? (
      <div className="w-full px-4 pt-6 pb-2 text-left bg-gray-100">
        <FlixMountPoints inpageRef={flixInpageRef} minisiteRef={flixMinisiteRef} />
        {!flixLoaded && (
          <p className="text-sm text-gray-500 mt-2">Loading FlixMedia content...</p>
        )}
      </div>
    ) : null
  }
/>
    </div>

  </div>
);
}

const resolveFlixIds = (p = {}) => {
  const ean = p.ean || p.EAN || p.barcode || p.bar_code || p.gtin || p.GTIN || null;
  const mpn = p.model_number || p.mpn || p.MPN || p.modelNumber || p.model || p.brand_code || p.sku || p.item_code || p.itemCode || null;
  const upc = p.upc || p.UPC || null;
  const sku = p.sku || p.SKU || p.item_code || null;
  const brandCode = p.brand_code || p.brandCode || null;
  return { ean, mpn, upc, sku, brandCode };
};