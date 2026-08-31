import { createDefaultPopupState } from "./frequency.js";

function nowIso() {
  return new Date().toISOString();
}

function pushHistory(popupState, entry) {
  return [
    ...((popupState && popupState.interactionHistory) || []),
    { ...entry, at: nowIso() },
  ].slice(-50);
}

/** Mark a lead popup as shown for this session (frequency Rule 1). */
export function markLeadPopupShown(state, { popupType, sessionId } = {}) {
  if (!state) return state;
  const prev = { ...createDefaultPopupState(), ...(state.popupState || {}) };
  const count = Number(prev.leadPopupShownCount || 0) + 1;
  const popupState = {
    ...prev,
    sessionIdForPopup: sessionId || state.sessionId || prev.sessionIdForPopup,
    leadPopupShown: true,
    leadPopupShownCount: count,
    lastShownAt: nowIso(),
    lastPopupType: popupType || prev.lastPopupType,
    interactionHistory: pushHistory(prev, {
      action: "shown",
      popupType,
      sessionId: sessionId || state.sessionId,
    }),
  };
  return { ...state, popupState, updatedAt: nowIso() };
}

/** Customer closed popup → suppress further normal lead popups this session. */
export function markLeadPopupClosed(state, { popupType, action = "close" } = {}) {
  if (!state) return state;
  const prev = { ...createDefaultPopupState(), ...(state.popupState || {}) };
  const popupState = {
    ...prev,
    closedThisSession: true,
    suppressedForSession: true,
    lastClosedAt: nowIso(),
    dismissedTypes: [...new Set([...(prev.dismissedTypes || []), popupType].filter(Boolean))],
    interactionHistory: pushHistory(prev, { action: "closed", popupType, closeAction: action }),
  };
  return { ...state, popupState, updatedAt: nowIso() };
}

/** After mobile capture — persist on visitor, never ask mobile again. */
export function markMobileCaptured(
  state,
  { mobile = "", name = "", leadId = null, popupType = null } = {}
) {
  if (!state) return state;
  const prev = { ...createDefaultPopupState(), ...(state.popupState || {}) };
  const popupState = {
    ...prev,
    capturedMobile: mobile || prev.capturedMobile,
    capturedName: name || prev.capturedName,
    lastLeadId: leadId || prev.lastLeadId,
    leadPopupShown: true,
    leadPopupShownCount: Math.max(1, Number(prev.leadPopupShownCount) || 0),
    // Capture is the final conversion — block all further Smart Lead popups
    closedThisSession: false,
    suppressedForSession: true,
    interactionHistory: pushHistory(prev, {
      action: "mobile_captured",
      popupType,
      leadId,
    }),
  };
  return {
    ...state,
    mobileNumberCaptured: true,
    popupState,
    updatedAt: nowIso(),
  };
}

export function markSupportPopupShown(state, { popupType } = {}) {
  if (!state) return state;
  const prev = { ...createDefaultPopupState(), ...(state.popupState || {}) };
  const popupState = {
    ...prev,
    supportPopupShownThisSession: true,
    lastShownAt: nowIso(),
    lastPopupType: popupType || prev.lastPopupType,
    interactionHistory: pushHistory(prev, { action: "support_shown", popupType }),
  };
  return { ...state, popupState, updatedAt: nowIso() };
}

export function markHelpSelection(state, { helpOptions = [], leadId = null } = {}) {
  if (!state) return state;
  const prev = { ...createDefaultPopupState(), ...(state.popupState || {}) };
  const popupState = {
    ...prev,
    lastLeadId: leadId || prev.lastLeadId,
    interactionHistory: pushHistory(prev, {
      action: "help_selection",
      helpOptions,
      leadId,
    }),
  };
  return { ...state, popupState, updatedAt: nowIso() };
}
