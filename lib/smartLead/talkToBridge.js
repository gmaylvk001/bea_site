/**
 * TalkTo / chat-widget bridge for Smart Lead (Part 7).
 *
 * Inspection findings (do not invent APIs):
 * - No dedicated "TalkTo" SDK or TalkTo API exists in this repo.
 * - Closest live chat widgets: Tawk.to (HomeOnlyScripts) + Typebot bubble.
 * - WhatsApp: WhatsAppFloat + Smart Lead CTAs (wa.me links).
 *
 * Strategy:
 * - Keep Part 1 visitorId as the primary Smart Lead identity.
 * - Discover an external chat visitor id when the widget exposes one (Tawk cookie / API).
 * - Store it as talkToId alongside visitorId (association, not replacement).
 * - Optionally push Smart Lead attributes into Tawk via its documented setAttributes.
 */

const STORAGE_KEY_TALKTO = "bea_smart_lead_talkto_id_v1";

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function safeCall(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/**
 * Discover an external TalkTo/Tawk/Typebot visitor identifier if available.
 * Returns empty string when none is exposed — caller must not invent one.
 */
export function discoverTalkToId() {
  if (typeof window === "undefined") return "";

  // Explicit BEA hook (future TalkTo script can set this)
  const explicit =
    window.__BEA_TALKTO_ID ||
    window.TalkTo?.visitorId ||
    window.TalkTo?.getVisitorId?.();
  if (explicit) return String(explicit).slice(0, 120);

  // Tawk.to — documented visitor helpers when present
  const tawk = window.Tawk_API;
  if (tawk) {
    const fromApi =
      safeCall(() => tawk.getVisitorId?.()) ||
      safeCall(() => tawk.getVisitorInfo?.()?.id) ||
      safeCall(() => tawk.getVisitorInfo?.()?.hash) ||
      tawk.visitor?.id ||
      tawk.visitor?.hash;
    if (fromApi) return `tawk:${String(fromApi).slice(0, 100)}`;
  }

  // Tawk cookie (common when widget has loaded)
  const tawkuuid = readCookie("__tawkuuid") || readCookie("TawkConnectionTime");
  if (tawkuuid && tawkuuid !== "0") {
    return `tawk:${String(tawkuuid).slice(0, 100)}`;
  }

  // Typebot — only if the loaded instance exposes a session id
  const typebotId =
    window.__Typebot?.sessionId ||
    window.Typebot?.sessionId ||
    safeCall(() => window.__Typebot?.getSessionId?.());
  if (typebotId) return `typebot:${String(typebotId).slice(0, 100)}`;

  // Previously discovered id (sessionStorage)
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY_TALKTO);
    if (cached) return cached;
  } catch {
    // ignore
  }

  return "";
}

export function cacheTalkToId(id) {
  if (!id || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_TALKTO, String(id).slice(0, 120));
  } catch {
    // ignore
  }
  window.__BEA_TALKTO_ID = String(id).slice(0, 120);
}

/**
 * Push Smart Lead association into Tawk.to using its documented setAttributes API.
 * No-ops when Tawk is unavailable — does not invent endpoints.
 */
export function syncTalkToAttributes(attrs = {}) {
  if (typeof window === "undefined") return false;
  const tawk = window.Tawk_API;
  if (!tawk || typeof tawk.setAttributes !== "function") return false;

  const payload = {};
  if (attrs.visitorId) payload.smartLeadVisitorId = String(attrs.visitorId).slice(0, 80);
  if (attrs.sessionId) payload.smartLeadSessionId = String(attrs.sessionId).slice(0, 80);
  if (attrs.leadId) payload.smartLeadId = String(attrs.leadId).slice(0, 80);
  if (attrs.mobile) payload.phone = String(attrs.mobile).slice(0, 20);
  if (attrs.name) payload.name = String(attrs.name).slice(0, 80);
  if (attrs.intentScore != null) payload.intentScore = String(attrs.intentScore);
  if (attrs.productName) payload.product = String(attrs.productName).slice(0, 120);

  if (!Object.keys(payload).length) return false;

  try {
    tawk.setAttributes(payload, () => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve talkToId for capture: prefer existing state, else discover + cache.
 */
export function resolveTalkToId(existing = "") {
  if (existing) return String(existing).slice(0, 120);
  const found = discoverTalkToId();
  if (found) cacheTalkToId(found);
  return found;
}
