"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  TIMING_MS,
  bootstrapVisitorState,
  classifyIntentScore,
  getScoreBreakdown,
  getVisitorIntentSnapshot,
  recordPageVisit,
  recordProductView,
  setBrowseContext as setBrowseContextState,
  tickEngagement,
  writeVisitorState,
  markLeadPopupShown,
  markLeadPopupClosed,
  markMobileCaptured as markMobileCapturedState,
  markSupportPopupShown,
  markHelpSelection as markHelpSelectionState,
  setTalkToId as setTalkToIdState,
  resolveTalkToId,
  syncTalkToAttributes,
  cacheTalkToId,
} from "@/lib/smartLead";
import { useSmartLeadConfig } from "@/context/SmartLeadConfigContext";

const VisitorIntentContext = createContext(null);

function persist(state) {
  writeVisitorState(state);
  return state;
}

export function VisitorIntentProvider({ children }) {
  const pathname = usePathname();
  const { getConfig } = useSmartLeadConfig();
  const [state, setState] = useState(null);
  const stateRef = useRef(null);
  const trackedProductRef = useRef(null);
  const readyRef = useRef(false);
  const getConfigRef = useRef(getConfig);
  getConfigRef.current = getConfig;

  const commit = useCallback((updater) => {
    setState((prev) => {
      const base = prev || stateRef.current;
      if (!base) return prev;
      const next = typeof updater === "function" ? updater(base) : updater;
      if (!next || next === base) return prev;
      stateRef.current = next;
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/admin")) return;

    const boot = bootstrapVisitorState({
      pathname: window.location.pathname,
      referrer: document.referrer || "",
    });
    // Associate TalkTo/Tawk id if already available (never invent)
    const talkToId = resolveTalkToId(boot.talkToId);
    const withTalk = talkToId ? setTalkToIdState(boot, talkToId) : boot;
    if (talkToId) {
      cacheTalkToId(talkToId);
      syncTalkToAttributes({
        visitorId: withTalk.visitorId,
        sessionId: withTalk.sessionId,
      });
    }
    stateRef.current = withTalk;
    readyRef.current = true;
    setState(withTalk);
    persist(withTalk);
  }, []);

  // Re-discover TalkTo id after widgets load (Tawk/Typebot are async)
  useEffect(() => {
    if (!readyRef.current) return;
    if (pathname?.startsWith("/admin")) return undefined;

    const tryAssociate = () => {
      const found = resolveTalkToId("");
      if (!found) return;
      commit((prev) => {
        if (!prev || prev.talkToId === found) return prev;
        syncTalkToAttributes({
          visitorId: prev.visitorId,
          sessionId: prev.sessionId,
        });
        return setTalkToIdState(prev, found);
      });
    };

    tryAssociate();
    const onTawk = () => tryAssociate();
    window.addEventListener("bea:tawk-ready", onTawk);
    const t1 = window.setTimeout(tryAssociate, 2000);
    const t2 = window.setTimeout(tryAssociate, 6000);
    return () => {
      window.removeEventListener("bea:tawk-ready", onTawk);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, commit]);

  useEffect(() => {
    if (!readyRef.current || !stateRef.current) return;
    if (pathname?.startsWith("/admin")) return;

    commit((prev) =>
      recordPageVisit(prev, {
        pathname: pathname || window.location.pathname,
        referrer: document.referrer || "",
        config: getConfigRef.current?.(),
      })
    );

    if (!pathname?.startsWith("/product/")) {
      trackedProductRef.current = null;
    }
  }, [pathname, commit]);

  useEffect(() => {
    if (!readyRef.current) return;
    if (pathname?.startsWith("/admin")) return;

    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      commit((prev) =>
        tickEngagement(prev, TIMING_MS.HEARTBEAT_MS, {
          config: getConfigRef.current?.(),
        })
      );
    }, TIMING_MS.HEARTBEAT_MS);

    return () => window.clearInterval(id);
  }, [pathname, commit]);

  const trackProductView = useCallback(
    (product, extras = {}) => {
      if (!product?._id && !product?.id) return;
      if (pathname?.startsWith("/admin")) return;

      const productId = String(product._id || product.id);
      if (trackedProductRef.current === productId) {
        commit((prev) => {
          if (!prev?.currentProduct) return prev;
          if (String(prev.currentProduct.productId) !== productId) return prev;
          const rating = Number(extras.rating);
          const reviewCount = Number(extras.reviewCount);
          const next = {
            ...prev.currentProduct,
            brandName: extras.brandName || prev.currentProduct.brandName,
            categoryName: extras.categoryName || prev.currentProduct.categoryName,
            rating: Number.isFinite(rating) && rating > 0 ? rating : prev.currentProduct.rating,
            reviewCount:
              Number.isFinite(reviewCount) && reviewCount > 0
                ? reviewCount
                : prev.currentProduct.reviewCount,
          };
          if (
            next.brandName === prev.currentProduct.brandName &&
            next.categoryName === prev.currentProduct.categoryName &&
            next.rating === prev.currentProduct.rating &&
            next.reviewCount === prev.currentProduct.reviewCount
          ) {
            return prev;
          }
          return { ...prev, currentProduct: next };
        });
        return;
      }
      trackedProductRef.current = productId;

      commit((prev) => {
        if (!prev) return prev;
        return recordProductView(prev, product, extras, {
          config: getConfigRef.current?.(),
        });
      });
    },
    [commit, pathname]
  );

  const setBrowseContext = useCallback(
    (browseContext) => {
      commit((prev) => setBrowseContextState(prev, browseContext));
    },
    [commit]
  );

  const markPopupShown = useCallback(
    ({ popupType } = {}) => {
      commit((prev) =>
        markLeadPopupShown(prev, { popupType, sessionId: prev?.sessionId })
      );
    },
    [commit]
  );

  const markPopupClosed = useCallback(
    ({ popupType, action } = {}) => {
      commit((prev) => markLeadPopupClosed(prev, { popupType, action }));
    },
    [commit]
  );

  const markMobileCaptured = useCallback(
    ({ mobile, name, leadId, popupType } = {}) => {
      commit((prev) =>
        markMobileCapturedState(prev, { mobile, name, leadId, popupType })
      );
    },
    [commit]
  );

  const markSupportShown = useCallback(
    ({ popupType } = {}) => {
      commit((prev) => markSupportPopupShown(prev, { popupType }));
    },
    [commit]
  );

  const markHelpSelection = useCallback(
    ({ helpOptions, leadId } = {}) => {
      commit((prev) => markHelpSelectionState(prev, { helpOptions, leadId }));
    },
    [commit]
  );

  const associateTalkToId = useCallback((talkToId) => {
    const id = String(talkToId || "").trim();
    if (!id) return;
    cacheTalkToId(id);
    commit((prev) => setTalkToIdState(prev, id));
  }, [commit]);

  const snapshot = useMemo(
    () => (state ? getVisitorIntentSnapshot(state) : null),
    [state]
  );

  const breakdown = useMemo(
    () =>
      state
        ? getScoreBreakdown(state)
        : { score: 0, classification: classifyIntentScore(0), events: [] },
    [state]
  );

  const value = useMemo(
    () => ({
      ready: Boolean(state),
      state,
      snapshot,
      intentScore: breakdown.score,
      classification: breakdown.classification,
      scoreEvents: breakdown.events,
      trackProductView,
      setBrowseContext,
      markPopupShown,
      markPopupClosed,
      markMobileCaptured,
      markSupportShown,
      markHelpSelection,
      associateTalkToId,
      getSnapshot: () => getVisitorIntentSnapshot(stateRef.current),
      getScore: () => Number(stateRef.current?.score) || 0,
      getClassification: () =>
        stateRef.current?.classification ||
        classifyIntentScore(stateRef.current?.score),
    }),
    [
      state,
      snapshot,
      breakdown,
      trackProductView,
      setBrowseContext,
      markPopupShown,
      markPopupClosed,
      markMobileCaptured,
      markSupportShown,
      markHelpSelection,
      associateTalkToId,
    ]
  );

  return (
    <VisitorIntentContext.Provider value={value}>
      {children}
    </VisitorIntentContext.Provider>
  );
}

export function useVisitorIntent() {
  const ctx = useContext(VisitorIntentContext);
  if (!ctx) {
    return {
      ready: false,
      state: null,
      snapshot: null,
      intentScore: 0,
      classification: classifyIntentScore(0),
      scoreEvents: [],
      trackProductView: () => {},
      setBrowseContext: () => {},
      markPopupShown: () => {},
      markPopupClosed: () => {},
      markMobileCaptured: () => {},
      markSupportShown: () => {},
      markHelpSelection: () => {},
      associateTalkToId: () => {},
      getSnapshot: () => null,
      getScore: () => 0,
      getClassification: () => classifyIntentScore(0),
    };
  }
  return ctx;
}
