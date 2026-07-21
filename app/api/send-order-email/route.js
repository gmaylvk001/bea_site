import { NextResponse } from "next/server";

const EMAIL_AUTH =
  process.env.EYGR_EMAIL_AUTH ||
  "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L";

const CUSTOMER_CAMPAIGN_ID =
  process.env.EYGR_ORDER_CUSTOMER_CAMPAIGN_ID ||
  "0800f221-7805-4b76-988c-bbecd66e7500";

const ADMIN_CAMPAIGN_ID =
  process.env.EYGR_ORDER_ADMIN_CAMPAIGN_ID ||
  "dd7b5f8d-5bf1-45a5-9116-fcb40f69ede6";

const IMAGE_BASE =
  process.env.ORDER_EMAIL_SITE_URL || "https://bharathelectronics.in";

const formatINR = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function buildItemsHtml(items = []) {
  if (!items.length) {
    return `<div style="color:#64748b;font-size:13px;">No items found.</div>`;
  }

  // Use only simple div tags: Eygr strips complex tags (table/img) from params.
  return items
    .map((item) => {
      const price = Number(item.price || item.product_price || 0);
      const qty = Number(item.quantity || 1);
      const subtotal = price * qty;
      const warranty =
        item.warrantyData?.year && item.warrantyData?.price
          ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">+ ${item.warrantyData.year} Year Extended Warranty (${formatINR(item.warrantyData.price)})</div>`
          : "";

      return `<div style="padding:12px 0;border-bottom:1px solid #eef2f7;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;line-height:1.4;">${item.name || item.product_name || ""}</div>
        <div style="font-size:12px;color:#64748b;margin-top:6px;">${formatINR(price)} x ${qty} = <strong style="color:#0f172a;">${formatINR(subtotal)}</strong></div>
        ${warranty}
      </div>`;
    })
    .join("");
}

async function sendEygrEmail(campaignId, email, params) {
  const formData = new FormData();
  formData.append("campaign_id", campaignId);
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

  return { ok: response.ok, status: response.status, data, email };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderDetails, customerEmail, adminEmails = [] } = body;

    if (!orderDetails || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "orderDetails and customerEmail are required" },
        { status: 400 },
      );
    }

    const name = orderDetails.order_username || "Customer";
    const orderNumber = orderDetails.order_number || "N/A";
    const orderDate =
      orderDetails.order_date ||
      new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    const amount = formatINR(orderDetails.order_amount);
    const paymentMethod = orderDetails.payment_method || "N/A";
    const deliveryAddress = orderDetails.order_deliveryaddress || "";
    const phone = orderDetails.order_phonenumber || "";
    const itemsHtml = buildItemsHtml(orderDetails.order_item || []);

    // Customer campaign expects exactly 10 params.
    const customerParams = [
      name, // {{1}}
      orderNumber, // {{2}}
      orderDate, // {{3}}
      amount, // {{4}}
      paymentMethod, // {{5}}
      deliveryAddress, // {{6}}
      phone, // {{7}}
      itemsHtml, // {{{8}}}
      customerEmail, // {{9}}
      "", // {{10}} (padding)
    ];

    // Admin campaign expects exactly 5 params. Order meta (number, date,
    // amount, payment) is packed into the details block sent as {{5}}.
    // Simple div tags only (Eygr strips table/img from params).
    const adminDetailsHtml = `<div style="margin-bottom:12px;">
        <div style="font-size:12px;color:#64748b;padding:2px 0;">Order Number: <strong style="color:#0f172a;">#${orderNumber}</strong></div>
        <div style="font-size:12px;color:#64748b;padding:2px 0;">Order Date: <strong style="color:#0f172a;">${orderDate}</strong></div>
        <div style="font-size:12px;color:#64748b;padding:2px 0;">Total Amount: <strong style="color:#0f172a;">${amount}</strong></div>
        <div style="font-size:12px;color:#64748b;padding:2px 0;">Payment Method: <strong style="color:#0f172a;">${paymentMethod}</strong></div>
      </div>
      ${itemsHtml}`;

    const adminParams = [
      name, // {{1}} customer name
      customerEmail, // {{2}} customer email
      phone, // {{3}} phone
      deliveryAddress, // {{4}} delivery address
      adminDetailsHtml, // {{{5}}} order meta + items
    ];

    const recipients = [...new Set((adminEmails || []).filter(Boolean))];

    const customerResult = await sendEygrEmail(
      CUSTOMER_CAMPAIGN_ID,
      customerEmail,
      customerParams,
    );

    const adminResults = [];
    for (const email of recipients) {
      adminResults.push(
        await sendEygrEmail(ADMIN_CAMPAIGN_ID, email, adminParams),
      );
    }

    const success =
      customerResult.ok || adminResults.some((result) => result.ok);

    console.log("Order email result:", {
      orderNumber,
      customerResult,
      adminResults,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Eygr delivery failed", customerResult, adminResults },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true, orderNumber, customerResult, adminResults },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending order emails:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send order email" },
      { status: 500 },
    );
  }
}
