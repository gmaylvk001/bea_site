import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Order from "@/models/ecom_order_info";
import User from "@/models/User";

const EMAIL_AUTH =
  process.env.EYGR_EMAIL_AUTH ||
  "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L";

const CUSTOMER_CAMPAIGN_ID =
  process.env.EYGR_ORDER_CUSTOMER_CAMPAIGN_ID ||
  "0800f221-7805-4b76-988c-bbecd66e7500";

const ADMIN_CAMPAIGN_ID =
  process.env.EYGR_ORDER_ADMIN_CAMPAIGN_ID ||
  "dd7b5f8d-5bf1-45a5-9116-fcb40f69ede6";

const IMAGE_BASE = "https://www.bharathelectronics.in";
const DEFAULT_STATUS_ADMIN_EMAILS = [
  "arunkarthik@bharathelectronics.in",
  "ecom@bharathelectronics.in",
  "itadmin@bharathelectronics.in",
  "telemarketing@bharathelectronics.in",
  "sekarcorp@bharathelectronics.in",
  "customercare@bharathelectronics.in",
];
const STATUS_CANCEL_CAMPAIGN_ID =
  process.env.EYGR_CANCEL_CAMPAIGN_ID ||
  "637cf8a5-db01-453d-9c47-cca3cac44d52";
const STATUS_DELIVERY_CAMPAIGN_ID =
  process.env.EYGR_DELIVERY_CAMPAIGN_ID ||
  "e019b2bd-09e9-4369-8b04-1d80a0403bb9";

const formatINR = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function resolveProductImageUrl(image) {
  let src = image;
  if (Array.isArray(src)) src = src[0];
  if (!src) return "";
  src = String(src).trim();
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads/")) return `${IMAGE_BASE}${src}`;
  if (src.startsWith("/")) return `${IMAGE_BASE}${src}`;
  if (src.includes("uploads/")) {
    return `${IMAGE_BASE}/${src.replace(/^\/+/, "")}`;
  }
  return `${IMAGE_BASE}/uploads/products/${src}`;
}

function buildProductNameText(items = []) {
  if (!items.length) return "No items found.";

  return items
    .map((item) => {
      const price = Number(item.price || item.product_price || 0);
      const qty = Number(item.quantity || 1);
      const subtotal = price * qty;
      const name = item.name || item.product_name || "Product";
      const warranty =
        item.warrantyData?.year && item.warrantyData?.price
          ? `<br/>+ ${item.warrantyData.year} Year Extended Warranty (${formatINR(item.warrantyData.price)})`
          : "";
      return `${name}<br/>${formatINR(price)} x ${qty} = ${formatINR(subtotal)}${warranty}`;
    })
    .join("<br/><br/>");
}

function buildProductImageUrl(items = []) {
  const first = items?.[0];
  if (!first) return "";
  return resolveProductImageUrl(
    first.image || first.images?.[0] || first.product_image,
  );
}

/** Combined block for Eygr 5-param limit: amount, payment, address, phone, items. */
function buildSummaryBlock({
  amount,
  paymentMethod,
  deliveryAddress,
  phone,
  items,
}) {
  const itemsText = buildProductNameText(items);
  return (
    `Total Amount: ${amount}<br/>` +
    `Payment Method: ${paymentMethod}<br/><br/>` +
    `Delivery Address:<br/>${deliveryAddress || "-"}<br/>${phone || ""}<br/><br/>` +
    `Order Items:<br/>${itemsText}`
  );
}

function buildAdminItemsText(items = []) {
  if (!items.length) return "No items found.";

  // Plain text + <br/> only — nested tables/divs collapse inside Eygr params.
  return items
    .map((item) => {
      const price = Number(item.price || item.product_price || 0);
      const qty = Number(item.quantity || 1);
      const subtotal = price * qty;
      const name = item.name || item.product_name || "Product";
      const warranty =
        item.warrantyData?.year && item.warrantyData?.price
          ? `<br/>+ ${item.warrantyData.year} Year Extended Warranty (${formatINR(item.warrantyData.price)})`
          : "";
      return `${name}<br/>${formatINR(price)} x ${qty} = ${formatINR(subtotal)}${warranty}`;
    })
    .join("<br/><br/>");
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
    if (body.action === "status_update") {
      return await sendOrderStatusEmail(req, body);
    }

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
    const items = orderDetails.order_item || [];
    const productNameText = buildProductNameText(items);
    const summaryOnly =
      `Total Amount: ${amount}<br/>` +
      `Payment Method: ${paymentMethod}<br/><br/>` +
      `Delivery Address:<br/>${deliveryAddress || "-"}<br/>${phone || ""}`;
    const viewOrderUrl = `${IMAGE_BASE}/orders`;
    const adminItemsHtml = buildAdminItemsText(items);

    // Customer campaign expects exactly 6 params.
    // {{6}} = View Order URL — use as <a href="{{6}}"> in Eygr body.
    const customerParams = [
      name, // {{1}} customer name
      orderNumber, // {{2}} order number
      orderDate, // {{3}} order date
      summaryOnly, // {{4}} amount + payment + address + phone
      productNameText, // {{5}} product name + price + warranty
      viewOrderUrl, // {{6}} View Order button URL
    ];

    // Admin campaign expects exactly 8 params.
    const adminOrderId = String(
      orderDetails.order_id || orderDetails._id || "",
    ).trim();
    const adminPanelUrl = adminOrderId
      ? `${IMAGE_BASE}/admin/Allorder/${encodeURIComponent(adminOrderId)}`
      : `${IMAGE_BASE}/admin/Allorder`;

    const adminDetailsHtml =
      `Order Number: #${orderNumber}<br/>` +
      `Order Date: ${orderDate}<br/>` +
      `Total Amount: ${amount}<br/>` +
      `Payment Method: ${paymentMethod}`;

    const adminParams = [
      name, // {{1}} customer name
      customerEmail, // {{2}} customer email
      phone, // {{3}} phone
      deliveryAddress, // {{4}} delivery address
      adminDetailsHtml, // {{5}} order meta
      adminItemsHtml, // {{6}} items list
      adminPanelUrl, // {{7}} full admin order URL
      adminOrderId, // {{8}} order id
    ];

    console.log("Admin order link:", { adminOrderId, adminPanelUrl });

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
      adminResults: adminResults.map((r) => ({
        ok: r.ok,
        status: r.status,
        message: r.data?.message || r.data,
        email: r.email,
      })),
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

async function sendOrderStatusEmail(req, { status, orderId, deliveryDate }) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Admin authentication token required" },
      { status: 401 },
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid or expired admin authentication token" },
      { status: 401 },
    );
  }

  const userId = decoded?.userId || decoded?.id || decoded?._id;
  if (!userId || !["cancelled", "shipped"].includes(status) ||
      !mongoose.Types.ObjectId.isValid(orderId)) {
    return NextResponse.json(
      { success: false, error: "Valid admin authentication, status, and order ID are required" },
      { status: 400 },
    );
  }

  await dbConnect();
  const admin = await User.findById(userId).select("user_type status").lean();
  if (!admin || admin.user_type !== "admin" || admin.status === "Inactive") {
    return NextResponse.json(
      { success: false, error: "Active admin access required" },
      { status: 403 },
    );
  }

  const order = await Order.findById(orderId)
    .select("email_address order_username order_number delivery_type order_status")
    .lean();
  if (!order || order.delivery_type !== "home" || order.order_status !== status) {
    return NextResponse.json(
      { success: false, error: "Home delivery order status was not found" },
      { status: 404 },
    );
  }

  const customerEmail = String(order.email_address || "").trim();
  if (!customerEmail && status === "shipped") {
    return NextResponse.json(
      { success: false, error: "Customer email is missing for this order" },
      { status: 400 },
    );
  }

  let params;
  if (status === "cancelled") {
    params = [order.order_username || "Customer", order.order_number];
  } else {
    const date = new Date(deliveryDate);
    if (!deliveryDate || Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "A valid delivery date is required" },
        { status: 400 },
      );
    }
    params = [
      order.order_username || "Customer",
      order.order_number,
      date.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ];
  }

  const recipients = [
    ...new Set([
      customerEmail || "kbsiva1234@gmail.com",
      ...DEFAULT_STATUS_ADMIN_EMAILS,
    ]),
  ];
  const expectedCustomerRecipient =
    customerEmail || (status === "cancelled" ? "kbsiva1234@gmail.com" : "");
  const campaignId =
    status === "cancelled"
      ? STATUS_CANCEL_CAMPAIGN_ID
      : STATUS_DELIVERY_CAMPAIGN_ID;
  const results = [];
  for (const email of recipients) {
    results.push(await sendEygrEmail(campaignId, email, params));
  }

  const customerResult = results.find(
    (result) => result.email === expectedCustomerRecipient,
  );
  if (!customerResult?.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to send status email to the customer", results },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, results });
}
