/** Part 3 — frequency / annoyance control (integrates with Part 2 canShowPopup). */

import { getDefaultSmartLeadConfig } from "./configDefaults.js";

export const HIGH_INTENT_EXCEPTION_SCORE = 85;

export const HELP_OPTIONS = Object.freeze([
  { id: "best_price", label: "Best Price" },
  { id: "bank_emi", label: "Bank Offer / EMI" },
  { id: "exchange", label: "Exchange" },
  { id: "help_choose", label: "Help Me Choose" },
  { id: "product_info", label: "Product Information" },
  { id: "availability", label: "Availability" },
  { id: "call_me", label: "Call Me" },
  { id: "whatsapp_me", label: "WhatsApp Me" },
]);

export function createDefaultPopupState() {
  return {
    lastShownAt: null,
    lastPopupType: null,
    lastClosedAt: null,
    dismissedTypes: [],
    interactionHistory: [],
    sessionIdForPopup: null,
    leadPopupShownCount: 0,
    leadPopupShown: false,
    closedThisSession: false,
    suppressedForSession: false,
    supportPopupShownThisSession: false,
    lastLeadId: null,
    capturedMobile: "",
    capturedName: "",
  };
}

export function resetPopupStateForNewSession(popupState = {}, sessionId = "") {
  const prev = { ...createDefaultPopupState(), ...(popupState || {}) };
  return {
    ...prev,
    sessionIdForPopup: sessionId,
    leadPopupShownCount: 0,
    leadPopupShown: false,
    closedThisSession: false,
    suppressedForSession: false,
    supportPopupShownThisSession: false,
    lastShownAt: null,
    lastClosedAt: null,
    lastPopupType: null,
  };
}

/**
 * Part 2 canShowPopup implementation.
 * Consumes Part 5 frequencyCap + suppression settings when provided via ctx.config.
 */
export function canShowLeadPopup(ctx = {}) {
  const snapshot = ctx.snapshot;
  if (!snapshot) return false;

  // Mobile capture is the final conversion for this visitor storage —
  // block Category / Model / Comparison / Premium / support popups.
  if (snapshot.mobileNumberCaptured) return false;

  const config = ctx.config || getDefaultSmartLeadConfig();
  const freq = config.frequency || {};
  const frequencyCap = Math.max(1, Number(freq.frequencyCap) || 1);
  const exceptionScore =
    Number(freq.highIntentExceptionScore) >= 0
      ? Number(freq.highIntentExceptionScore)
      : HIGH_INTENT_EXCEPTION_SCORE;
  const exceptionMax = Math.max(1, Number(freq.highIntentExceptionMax) || 2);
  const suppressionMode = freq.suppressionMode === "duration" ? "duration" : "session";
  const suppressionMs = Math.max(0, Number(freq.suppressionMs) || 0);

  const ps = snapshot.popupState || {};
  const score = Number(snapshot.intentScore) || 0;

  if (ps.sessionIdForPopup && snapshot.sessionId && ps.sessionIdForPopup !== snapshot.sessionId) {
    return true;
  }

  // Closed without converting
  if (ps.suppressedForSession || ps.closedThisSession) {
    if (suppressionMode === "duration" && ps.lastClosedAt && suppressionMs > 0) {
      const closedAt = Date.parse(ps.lastClosedAt) || 0;
      const elapsed = Date.now() - closedAt;
      if (elapsed < suppressionMs) return false;
      // Duration elapsed — still respect frequency cap (no auto re-show timer)
      const shown = Number(ps.leadPopupShownCount || 0);
      if (shown >= frequencyCap) {
        return (
          score >= exceptionScore &&
          shown < exceptionMax &&
          !ps.closedThisSession
        );
      }
      return true;
    }

    // Default document behaviour: session suppression
    return false;
  }

  const shownCount = Number(ps.leadPopupShownCount || 0);
  if (shownCount >= frequencyCap) {
    const allowHighIntentException =
      score >= exceptionScore &&
      shownCount < exceptionMax &&
      !ps.closedThisSession;
    return allowHighIntentException;
  }

  return true;
}

export function getPopupDisplayMode(_snapshot) {
  // After mobile capture, no Smart Lead popup should open. Always "capture"
  // so an already-open popup is not flipped to the WhatsApp/support UI.
  return "capture";
}

export function isValidIndianMobile(mobile = "") {
  const digits = String(mobile || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(ten);
}

export function normalizeIndianMobile(mobile = "") {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(-10);
}
