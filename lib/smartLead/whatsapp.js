/**
 * Shared WhatsApp helpers for Smart Lead + site float (Part 7).
 * Prefills context so sales can link chat ↔ website session.
 * Does not invent TalkTo/WhatsApp backend APIs — uses wa.me deep links only.
 */

/** Existing Smart Lead / live-demo number used across product flows */
export const DEFAULT_WHATSAPP_E164 = "919842344323";

/** Float widget historically used a different number — keep as fallback alias */
export const FLOAT_WHATSAPP_E164 = "919585685500";

export function normalizeWhatsAppPhone(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return DEFAULT_WHATSAPP_E164;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
}

export function getConfiguredWhatsAppPhone(config = null) {
  const fromConfig = config?.whatsapp?.phone;
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      : undefined;
  return normalizeWhatsAppPhone(fromConfig || fromEnv || DEFAULT_WHATSAPP_E164);
}

/**
 * Build a concise prefilled WhatsApp message with visitor/product/lead context.
 */
export function buildWhatsAppContextMessage({
  baseText = "",
  productName = "",
  modelNumber = "",
  brandName = "",
  categoryName = "",
  itemCode = "",
  visitorId = "",
  sessionId = "",
  leadId = "",
  talkToId = "",
  intentScore = null,
  mobile = "",
} = {}) {
  const lines = [];
  const intro =
    String(baseText || "").trim() ||
    "Hi, I need help from BEA.";
  lines.push(intro);

  const productBits = [brandName, productName || modelNumber].filter(Boolean).join(" ");
  if (productBits && !intro.toLowerCase().includes(String(productName || "").toLowerCase())) {
    lines.push(`Product: ${productBits}${modelNumber && productName ? ` (${modelNumber})` : ""}`);
  }
  if (itemCode) lines.push(`SKU: ${itemCode}`);
  if (categoryName) lines.push(`Category: ${categoryName}`);

  const meta = [];
  if (leadId) meta.push(`Lead:${leadId}`);
  if (visitorId) meta.push(`Visitor:${visitorId}`);
  if (sessionId) meta.push(`Session:${String(sessionId).slice(0, 12)}`);
  if (talkToId) meta.push(`TalkTo:${talkToId}`);
  if (intentScore != null && intentScore !== "") meta.push(`Score:${intentScore}`);
  if (mobile) meta.push(`Mobile:${mobile}`);
  if (meta.length) lines.push(`Ref: ${meta.join(" | ")}`);

  return lines.join("\n").slice(0, 900);
}

export function buildWhatsAppUrl({
  phone,
  text = "",
  config = null,
} = {}) {
  const num = normalizeWhatsAppPhone(phone || getConfiguredWhatsAppPhone(config));
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${num}${q}`;
}

/**
 * Convenience for Smart Lead popups — merges snapshot + lead ids into wa.me URL.
 */
export function buildSmartLeadWhatsAppUrl({
  baseText = "",
  snapshot = null,
  leadId = "",
  talkToId = "",
  mobile = "",
  phone,
  config = null,
} = {}) {
  const p = snapshot?.currentProduct || {};
  const text = buildWhatsAppContextMessage({
    baseText,
    productName: p.name || "",
    modelNumber: p.modelNumber || snapshot?.modelNumber || "",
    brandName: p.brandName || snapshot?.brandName || "",
    categoryName: p.categoryName || snapshot?.browseContext?.categoryName || "",
    itemCode: p.itemCode || snapshot?.itemCode || "",
    visitorId: snapshot?.visitorId || "",
    sessionId: snapshot?.sessionId || "",
    leadId,
    talkToId: talkToId || snapshot?.talkToId || "",
    intentScore: snapshot?.intentScore,
    mobile,
  });
  return buildWhatsAppUrl({ phone, text, config });
}
