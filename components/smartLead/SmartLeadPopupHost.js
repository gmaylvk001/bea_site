"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useVisitorIntent } from "@/context/VisitorIntentContext";
import { useSmartLeadConfig } from "@/context/SmartLeadConfigContext";
import {
  POPUP_TYPES,
  buildPopupContent,
  canShowLeadPopup,
  detectPageType,
  getPopupDisplayMode,
  selectPopupType,
  buildSmartLeadWhatsAppUrl,
} from "@/lib/smartLead";
import CategoryIntentPopup from "@/components/smartLead/popups/CategoryIntentPopup";
import ModelIntentPopup from "@/components/smartLead/popups/ModelIntentPopup";
import ComparisonIntentPopup from "@/components/smartLead/popups/ComparisonIntentPopup";
import PremiumIntentPopup from "@/components/smartLead/popups/PremiumIntentPopup";

function resolveCategorySlug(pathname = "") {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "category" || !parts[1]) return null;
  return parts[parts.length - 1] || parts[1];
}

export default function SmartLeadPopupHost() {
  const pathname = usePathname();
  const { config, ready: configReady } = useSmartLeadConfig();
  const {
    ready,
    snapshot,
    setBrowseContext,
    markPopupShown,
    markPopupClosed,
    markMobileCaptured,
    markHelpSelection,
  } = useVisitorIntent();

  const [openType, setOpenType] = useState(POPUP_TYPES.NONE);
  const [content, setContent] = useState(null);
  const [pageActiveMs, setPageActiveMs] = useState(0);
  const [dwellPath, setDwellPath] = useState(pathname);
  const [activeLeadId, setActiveLeadId] = useState(null);
  const pageEnteredAtRef = useRef(Date.now());
  const shownGuardRef = useRef("");
  const browseSlugRef = useRef("");
  const closeCtxRef = useRef({});

  // Reset dwell during render on route change so the selection effect never
  // sees the previous page's timer (that caused instant Model popups).
  if (dwellPath !== pathname) {
    setDwellPath(pathname);
    setPageActiveMs(0);
    setOpenType(POPUP_TYPES.NONE);
    setContent(null);
    setActiveLeadId(null);
    pageEnteredAtRef.current = Date.now();
    shownGuardRef.current = "";
  }

  const pageType = useMemo(() => detectPageType(pathname || ""), [pathname]);
  const displayMode = useMemo(() => getPopupDisplayMode(snapshot), [snapshot]);

  // Keep close handler identity stable — snapshot heartbeats every ~1s would otherwise
  // recreate onClose and (previously) re-trigger PopupShell autofocus.
  closeCtxRef.current = {
    snapshot,
    openType,
    displayMode,
    activeLeadId,
    markPopupClosed,
  };

  useEffect(() => {
    if (!ready) return undefined;
    if (pathname?.startsWith("/admin")) return undefined;

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setPageActiveMs(Date.now() - pageEnteredAtRef.current);
    }, 1000);

    return () => window.clearInterval(id);
  }, [ready, pathname]);

  // Keep category browse context on product pages (needed for Category popup
  // while hopping SKUs). Clear it only when leaving category + product.
  useEffect(() => {
    if (!ready) return undefined;
    if (pageType === "product") return undefined;
    if (pageType !== "category") {
      browseSlugRef.current = "";
      setBrowseContext?.(null);
      return undefined;
    }

    const slug = resolveCategorySlug(pathname || "");
    if (!slug || browseSlugRef.current === slug) return undefined;
    browseSlugRef.current = slug;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data = await res.json();
        const cat = data?.main_category || data?.category || null;
        if (cancelled || !cat) return;
        setBrowseContext?.({
          type: "category",
          categoryId: String(cat._id || ""),
          categoryName: cat.category_name || slug,
          categorySlug: cat.category_slug || slug,
          categoryImage: cat.image || cat.category_image || "",
        });
      } catch {
        setBrowseContext?.({
          type: "category",
          categorySlug: slug,
          categoryName: slug.replace(/-/g, " "),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, pageType, pathname, setBrowseContext]);

  // Part 2 selection + Part 3 frequency gate + Part 5 config
  useEffect(() => {
    if (!ready || !snapshot) return;
    if (pathname?.startsWith("/admin")) return;
    if (openType !== POPUP_TYPES.NONE) return;
    if (snapshot.mobileNumberCaptured) return;
    if (config?.global?.popupEnabled === false) return;

    const pageDwellMs = Math.max(
      0,
      Math.min(pageActiveMs, Date.now() - pageEnteredAtRef.current)
    );

    const decision = selectPopupType({
      snapshot,
      pageType,
      pageActiveMs: pageDwellMs,
      config,
      canShowPopup: (ctx) => canShowLeadPopup({ ...ctx, config }),
    });

    if (!decision?.type || decision.type === POPUP_TYPES.NONE) return;

    const guardKey = `${snapshot.sessionId}:${decision.type}:${decision.reason}`;
    if (shownGuardRef.current === guardKey) return;
    shownGuardRef.current = guardKey;

    const nextContent = buildPopupContent(decision.type, {
      snapshot,
      browseContext: snapshot.browseContext,
      config,
    });
    if (!nextContent) return;

    setContent(nextContent);
    setOpenType(decision.type);
    markPopupShown?.({ popupType: decision.type });
  }, [
    ready,
    configReady,
    config,
    snapshot,
    pageType,
    pageActiveMs,
    pathname,
    openType,
    markPopupShown,
  ]);

  const handleClose = useCallback((meta = {}) => {
    const {
      snapshot: snap,
      openType: type,
      markPopupClosed: markClosed,
    } = closeCtxRef.current;

    // Closing after mobile capture should not re-open mobile form; suppress lead popups
    if (!snap?.mobileNumberCaptured) {
      markClosed?.({ popupType: type, action: meta.action || "close" });
    }
    setOpenType(POPUP_TYPES.NONE);
    setContent(null);
    setActiveLeadId(null);
  }, []);

  const buildLeadPayload = useCallback(
    ({ mobile, name }) => {
      const p = snapshot?.currentProduct || {};
      const browse = snapshot?.browseContext || {};
      const ctaClicked = content?.primaryCta || "";
      return {
        mobile,
        name,
        popupType: openType,
        ctaClicked,
        visitorId: snapshot?.visitorId,
        sessionId: snapshot?.sessionId,
        visitorType: snapshot?.visitorType,
        talkToId: snapshot?.talkToId || "",
        productId: p.productId || snapshot?.productId || "",
        itemCode: p.itemCode || "",
        modelNumber: p.modelNumber || "",
        brandId: p.brandId || "",
        brandName: p.brandName || "",
        categoryId: p.categoryId || browse.categoryId || "",
        categoryName: p.categoryName || browse.categoryName || "",
        subcategoryId: p.subcategoryId || "",
        productName: p.name || "",
        productSlug: p.slug || "",
        productImage: p.image || "",
        intentScore: snapshot?.intentScore || 0,
        classification: snapshot?.leadClassification?.id || "",
        classificationLabel: snapshot?.leadClassification?.label || "",
        sourceUrl: typeof window !== "undefined" ? window.location.href : snapshot?.currentUrl,
        referrer: snapshot?.referrer || "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        totalActiveMs: snapshot?.totalActiveMs || 0,
        currentProductActiveMs: snapshot?.currentProductActiveMs || 0,
        productPageViewCount: snapshot?.productPageViewCount || 0,
        // Full history — especially for COMPARISON leads
        productViewSequence: snapshot?.productViewSequence || [],
        productsViewed: snapshot?.productsViewed || [],
        pagesViewed: snapshot?.pagesViewed || [],
        browseContext: browse,
        currentProduct: p,
        snapshot: {
          visitorId: snapshot?.visitorId,
          sessionId: snapshot?.sessionId,
          visitorType: snapshot?.visitorType,
          isReturning: snapshot?.isReturning,
          currentUrl: snapshot?.currentUrl,
          referrer: snapshot?.referrer,
          intentScore: snapshot?.intentScore,
          leadClassification: snapshot?.leadClassification,
          productViewSequence: snapshot?.productViewSequence,
          productsViewed: snapshot?.productsViewed,
          pagesViewed: snapshot?.pagesViewed,
          browseContext: browse,
          currentProduct: p,
          totalActiveMs: snapshot?.totalActiveMs,
          currentProductActiveMs: snapshot?.currentProductActiveMs,
          productPageViewCount: snapshot?.productPageViewCount,
          isPremium: snapshot?.isPremium,
          talkToId: snapshot?.talkToId || "",
          firstSeenAt: snapshot?.firstSeenAt || null,
        },
        displayMode,
        whatsappClicked: false,
        popupTemplate: content?.template || "",
        configVersion: config?.version ?? null,
      };
    },
    [snapshot, openType, displayMode, content, config]
  );

  const handleSubmitLead = useCallback(
    async ({ mobile, name }) => {
      const payload = buildLeadPayload({ mobile, name });
      // Refresh TalkTo id at submit moment if widget loaded late
      try {
        const { resolveTalkToId, syncTalkToAttributes } = await import(
          "@/lib/smartLead/talkToBridge.js"
        );
        const talkToId = resolveTalkToId(payload.talkToId);
        if (talkToId) payload.talkToId = talkToId;
        syncTalkToAttributes({
          visitorId: payload.visitorId,
          sessionId: payload.sessionId,
          mobile,
          name,
          productName: payload.productName,
          intentScore: payload.intentScore,
        });
      } catch {
        // bridge optional
      }

      const res = await fetch("/api/smart-lead/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        return { ok: false, error: "Failed to save lead" };
      }
      if (!res.ok || !data.success || !data.leadId) {
        return { ok: false, error: data.error || "Failed to save lead" };
      }

      const leadId = data.leadId;
      setActiveLeadId(leadId);
      markMobileCaptured?.({
        mobile,
        name,
        leadId,
        popupType: openType,
      });

      try {
        const { syncTalkToAttributes } = await import(
          "@/lib/smartLead/talkToBridge.js"
        );
        syncTalkToAttributes({
          visitorId: payload.visitorId,
          sessionId: payload.sessionId,
          leadId,
          mobile,
          name,
          productName: payload.productName,
          intentScore: payload.intentScore,
        });
      } catch {
        // optional
      }

      return { ok: true, leadId };
    },
    [buildLeadPayload, markMobileCaptured, openType]
  );

  const finishHelp = useCallback(() => {
    setOpenType(POPUP_TYPES.NONE);
    setContent(null);
    setActiveLeadId(null);
  }, []);

  const handleHelpSubmit = useCallback(
    async ({ helpOptions = [], whatsappRequested = false, leadId } = {}) => {
      const id = leadId || activeLeadId;
      if (id) {
        await fetch("/api/smart-lead/help", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: id, helpOptions, whatsappRequested }),
        }).catch(() => {});
      }
      markHelpSelection?.({ helpOptions, leadId: id });
      finishHelp();
    },
    [activeLeadId, markHelpSelection, finishHelp]
  );

  const handleHelpSkip = useCallback(() => {
    markHelpSelection?.({ helpOptions: [], leadId: activeLeadId });
    finishHelp();
  }, [activeLeadId, markHelpSelection, finishHelp]);

  const resolveLeadId = useCallback(() => {
    return activeLeadId || snapshot?.popupState?.lastLeadId || null;
  }, [activeLeadId, snapshot?.popupState?.lastLeadId]);

  const handleWhatsAppClick = useCallback(() => {
    const id = resolveLeadId();
    const talkToId = snapshot?.talkToId || "";
    if (id) {
      fetch("/api/smart-lead/help", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: id,
          whatsappClicked: true,
          talkToId,
        }),
      }).catch(() => {});
    }
    import("@/lib/smartLead/talkToBridge.js")
      .then(({ syncTalkToAttributes }) => {
        syncTalkToAttributes({
          visitorId: snapshot?.visitorId,
          sessionId: snapshot?.sessionId,
          leadId: id || "",
          productName: snapshot?.currentProduct?.name,
          intentScore: snapshot?.intentScore,
        });
      })
      .catch(() => {});
  }, [resolveLeadId, snapshot]);

  const whatsappHref = useMemo(
    () =>
      buildSmartLeadWhatsAppUrl({
        baseText: content?.whatsappText || "",
        snapshot,
        leadId: activeLeadId || snapshot?.popupState?.lastLeadId || "",
        talkToId: snapshot?.talkToId || "",
        config,
      }),
    [content?.whatsappText, snapshot, activeLeadId, config]
  );

  if (!ready || pathname?.startsWith("/admin")) return null;

  const shared = {
    mode: displayMode,
    onClose: handleClose,
    onSubmitLead: handleSubmitLead,
    onHelpSubmit: handleHelpSubmit,
    onHelpSkip: handleHelpSkip,
    onSupportChat: () => {
      handleWhatsAppClick();
      handleClose({ action: "support_chat" });
    },
    onWhatsAppClick: handleWhatsAppClick,
    whatsappHref,
  };

  return (
    <>
      <CategoryIntentPopup
        open={openType === POPUP_TYPES.CATEGORY}
        content={openType === POPUP_TYPES.CATEGORY ? content : null}
        {...shared}
      />
      <ModelIntentPopup
        open={openType === POPUP_TYPES.MODEL}
        content={openType === POPUP_TYPES.MODEL ? content : null}
        {...shared}
      />
      <ComparisonIntentPopup
        open={openType === POPUP_TYPES.COMPARISON}
        content={openType === POPUP_TYPES.COMPARISON ? content : null}
        {...shared}
      />
      <PremiumIntentPopup
        open={openType === POPUP_TYPES.PREMIUM}
        content={openType === POPUP_TYPES.PREMIUM ? content : null}
        {...shared}
      />
    </>
  );
}
