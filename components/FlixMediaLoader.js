"use client";

import { useEffect } from "react";

const FLIX_DISTRIBUTOR_ID = "17089";
const FLIX_LANGUAGE = "in";
const FLIX_LOADER_SRC = "//media.flixfacts.com/js/loader.js";

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

  const item = (p.item_code || p.sku || "").toString().trim();
  return item;
}

function extractFlixEan(p = {}) {
  const ean = p.ean || p.EAN || p.barcode || p.bar_code || p.gtin || p.GTIN || "";
  return ean ? String(ean).trim() : "";
}

function removeOldFlixScripts() {
  document.querySelectorAll(
    'script[src*="media.flixfacts.com/js/loader.js"], script[data-flix-distributor], script[data-flix="true"]'
  ).forEach((s) => s.remove());
}

function resetFlix() {
  try {
    if (typeof window.flixJsCallbacks === "object" && typeof window.flixJsCallbacks.reset === "function") {
      window.flixJsCallbacks.reset();
    }
  } catch {}
}

function containersReady() {
  const inpage = document.querySelectorAll("#flix-inpage");
  const minisite = document.querySelectorAll("#flix-minisite");
  if (inpage.length !== 1 || minisite.length !== 1) return false;
  return true;
}

/**
 * Standard JS INpage/MiniSite (React) — flexmedia.txt
 * Divs must already exist in <body> as unique #flix-inpage and #flix-minisite.
 */
export default function FlixMediaLoader({ product, brandName, enabled = true, layoutKey = "" }) {
  useEffect(() => {
    if (!enabled || !product || typeof window === "undefined") return;

    const product_brand = (brandName || "").trim();
    const product_mpn = extractFlixMpn(product);
    const product_ean = extractFlixEan(product);

    if (!product_brand || (!product_mpn && !product_ean)) {
      console.warn("[Flix] skip — need brand and MPN or EAN", { product_brand, product_mpn, product_ean });
      return;
    }

    let cancelled = false;
    let tries = 0;
    let timer;

    const run = () => {
      if (cancelled) return;
      tries += 1;

      if (!containersReady()) {
        if (tries < 40) {
          timer = setTimeout(run, 150);
        } else {
          console.warn("[Flix] skip — need exactly one #flix-inpage and one #flix-minisite in the body");
        }
        return;
      }

      resetFlix();
      removeOldFlixScripts();

      const inpage = document.getElementById("flix-inpage");
      const minisite = document.getElementById("flix-minisite");
      if (inpage) inpage.innerHTML = "";
      if (minisite) minisite.innerHTML = "";

      const headID = document.getElementsByTagName("head")[0];
      if (!headID) return;

      const flixScript = document.createElement("script");
      flixScript.type = "text/javascript";
      flixScript.async = true;
      flixScript.setAttribute("data-flix-distributor", FLIX_DISTRIBUTOR_ID);
      flixScript.setAttribute("data-flix-language", FLIX_LANGUAGE);
      flixScript.setAttribute("data-flix-brand", product_brand);
      flixScript.setAttribute("data-flix-ean", product_ean);
      flixScript.setAttribute("data-flix-mpn", product_mpn);
      flixScript.setAttribute("data-flix-inpage", "flix-inpage");
      flixScript.setAttribute("data-flix-button", "flix-minisite");
      flixScript.setAttribute("data-flix-button-image", "");
      flixScript.setAttribute("data-flix-fallback-language", "");
      flixScript.setAttribute("data-flix-price", "");

      headID.appendChild(flixScript);

      flixScript.onload = function () {
        if (cancelled) return;
        console.log("[Flix] loader.js loaded", {
          distributor: FLIX_DISTRIBUTOR_ID,
          language: FLIX_LANGUAGE,
          brand: product_brand,
          mpn: product_mpn,
          ean: product_ean,
        });
        if (typeof window.flixJsCallbacks === "object" && typeof window.flixJsCallbacks.setLoadCallback === "function") {
          window.flixJsCallbacks.setLoadCallback(function () {
            console.log("[Flix] INpage content available");
          }, "inpage");
          window.flixJsCallbacks.setLoadCallback(function () {
            console.log("[Flix] MiniSite content available");
          }, "minisite");
          window.flixJsCallbacks.setLoadCallback(function () {
            console.log("[Flix] no INpage/MiniSite match (noshow)");
          }, "noshow");
        }
      };

      flixScript.onerror = function (error) {
        console.error("[Flix] failed to load loader.js", error);
      };

      // Guide: set src last, after appendChild
      flixScript.src = FLIX_LOADER_SRC;
    };

    timer = setTimeout(run, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, layoutKey, product?._id, brandName, product?.model_number, product?.item_code, product?.slug]);

  return null;
}
