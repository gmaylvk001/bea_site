/**
 * Eygr wishlist reminder mail — 6 plain-text params (must match Eygr campaign).
 */

const WISHLIST_MAIL_CAMPAIGN_ID = "39539e6b-9e34-488a-bd94-04d15d7e453d";

const EMAIL_AUTH =
  process.env.EYGR_EMAIL_AUTH ||
  "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L";

const SITE_BASE =
  process.env.ORDER_EMAIL_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://bharathelectronics.in";

const DEFAULT_LOGO_URL = `${SITE_BASE}/admin/assets/images/bea.png`;

export function getProductImageUrl(product, siteUrl = SITE_BASE) {
  const img = product?.images?.[0];
  if (!img) return DEFAULT_LOGO_URL;
  if (String(img).startsWith("http")) return img;
  return `${siteUrl}/uploads/products/${img}`;
}

/**
 * {{1}} name  {{2}} product  {{3}} reserved (empty)  {{4}} image  {{5}} product URL  {{6}} unsubscribe URL
 */
export function buildWishlistMailEygrParams({
  userName,
  productName,
  productImageUrl,
  productUrl,
  unsubscribeUrl,
}) {
  return [
    userName || "Customer",
    productName || "Product",
    "",
    productImageUrl || DEFAULT_LOGO_URL,
    productUrl || SITE_BASE,
    unsubscribeUrl || `${SITE_BASE}/wishlist`,
  ];
}

export function isEygrSendSuccessful(httpOk, data) {
  if (!httpOk) return false;
  if (!data || typeof data !== "object") return true;
  if (data.success === false) return false;
  if (data.status === "error" || data.status === "failed") return false;
  if (data.error) return false;
  return true;
}

export async function sendEygrWishlistMail(email, params) {
  const formData = new FormData();
  formData.append("campaign_id", WISHLIST_MAIL_CAMPAIGN_ID);
  formData.append("email", email);
  formData.append("params", JSON.stringify(params));

  const response = await fetch("https://bea.eygr.in/api/email/send-msg", {
    method: "POST",
    headers: { Authorization: EMAIL_AUTH },
    body: formData,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { raw: await response.text().catch(() => "") };
  }

  const ok = isEygrSendSuccessful(response.ok, data);

  if (!ok) {
    console.error("Eygr wishlist mail failed:", {
      email,
      status: response.status,
      data,
      campaignId: WISHLIST_MAIL_CAMPAIGN_ID,
      paramCount: params?.length,
    });
  } else {
    console.log("Eygr wishlist mail ok:", { email, status: response.status, data });
  }

  return {
    ok,
    status: response.status,
    data,
    email,
    campaignId: WISHLIST_MAIL_CAMPAIGN_ID,
  };
}

export { WISHLIST_MAIL_CAMPAIGN_ID };
