import EcomOrderInfo from "@/models/ecom_order_info";

const sanitizeText = (value) => String(value)
  .slice(0, 500)
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
  .replace(/\+?\d[\d\s().-]{6,}\d/g, "[redacted-number]")
  .replace(/\b(api[-_ ]?key|authorization|token)\s*[:=]\s*\S+/gi, "$1=[redacted]");

function sanitizeTrucoResponse(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { received: true, responseType: data === null ? "null" : typeof data };
  }

  const sanitized = {};
  for (const key of ["success", "isRedeemed", "alreadyRedeemed"]) {
    if (typeof data[key] === "boolean") sanitized[key] = data[key];
  }
  for (const key of ["status", "errorCode", "message", "errorMessage"]) {
    if (typeof data[key] === "string") sanitized[key] = sanitizeText(data[key]);
  }
  return Object.keys(sanitized).length ? sanitized : { received: true };
}

async function readTrucoResponse(response) {
  try {
    return sanitizeTrucoResponse(await response.json());
  } catch {
    return { unreadable: true };
  }
}

async function getPromotionStatus(code) {
  const baseUrl = process.env.TRUCO_BASE_URL;
  const apiKey = process.env.TRUCO_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Truco config missing in environment");

  const response = await fetch(`${baseUrl}/Promotion/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({ code }),
  });
  const data = await readTrucoResponse(response);
  return {
    httpStatus: response.status,
    response: data,
    isRedeemed: response.ok && data.isRedeemed === true,
  };
}

export async function redeemTrucoPromotionForOrder(order) {
  if (!order?.promotion_is_truco || !order.promotion_code_applied) {
    return { success: false, status: "failed", message: "No Truco promotion is stored on this order." };
  }
  if (
    order.payment_status !== "paid" ||
    order.payment_confirmation_source !== "razorpay" ||
    !["online", "emi"].includes(order.payment_method?.trim().toLowerCase()) ||
    !order.payment_verified_at
  ) {
    return {
      success: false,
      status: "failed",
      message: "A verified payment is required before Truco promotion redemption.",
    };
  }

  if (order.promotion_redemption_status === "succeeded") {
    return { success: true, alreadyRedeemed: true };
  }

  if (order.promotion_redemption_status) {
    return {
      success: false,
      status: order.promotion_redemption_status,
      message: order.promotion_redemption_status === "pending"
        ? "Truco promotion redemption is already being processed. Check its status before taking further action."
        : "Truco promotion redemption previously failed or was cancelled. Do not retry it automatically.",
    };
  }

  const transactionAmount = Number(order.promotion_transaction_amount);
  if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
    return {
      success: false,
      status: "failed",
      message: "A valid promotion transaction amount is not available for this order",
    };
  }

  const paymentMethod = String(order.payment_gateway_method || "").trim().toUpperCase();
  if (!["COD", "CARD", "UPI", "NETBANKING", "WALLET", "EMI", "CASH"].includes(paymentMethod)) {
    return {
      success: false,
      status: "failed",
      message: "The confirmed payment method is not available for Truco promotion redemption.",
    };
  }

  const hasOtherOffersApplied =
    Number(order.loyalty_points_redeemed) > 0 ||
    Number(order.loyalty_discount) > 0 ||
    order.order_item?.some((item) =>
      Number(item.coupondiscount) > 0 || item.coupondetails?.length > 0
    ) === true;

  const requestPayload = {
    code: order.promotion_code_applied,
    phoneNumber: order.order_phonenumber,
    transactionAmount,
    invoiceNumber: order.order_number,
    storeId: "Online Store",
    channel: "ONLINE",
    paymentMethod,
    city: "",
    cartItems: order.promotion_cart_items || [],
    hasOtherOffersApplied,
  };

  const claim = await EcomOrderInfo.findOneAndUpdate(
    {
      _id: order._id,
      payment_status: "paid",
      $or: [
        { promotion_redemption_status: { $exists: false } },
        { promotion_redemption_status: null },
      ],
    },
    {
      $set: {
        promotion_redemption_status: "pending",
        promotion_redemption_error: null,
        promotion_redemption_attempted_at: new Date(),
        promotion_redemption_http_status: null,
        promotion_redemption_response: null,
        promotion_status_check_http_status: null,
        promotion_status_check_response: null,
      },
    },
    { new: true }
  );

  if (!claim) {
    return {
      success: false,
      status: "pending",
      message: "Truco promotion redemption is already being processed. Check its status before taking further action.",
    };
  }

  let succeeded = false;
  let uncertain = false;
  let requestStarted = false;
  let errorMessage = "";
  let redeemHttpStatus = null;
  let redeemResponse = null;
  let statusCheckHttpStatus = null;
  let statusCheckResponse = null;
  const baseUrl = process.env.TRUCO_BASE_URL;
  const apiKey = process.env.TRUCO_API_KEY;

  try {
    if (!baseUrl || !apiKey) throw new Error("Truco config missing in environment");

    requestStarted = true;
    const response = await fetch(`${baseUrl}/Promotion/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(requestPayload),
    });

    redeemHttpStatus = response.status;
    redeemResponse = await readTrucoResponse(response);
    if (redeemResponse.unreadable) {
      uncertain = response.status >= 500 || response.ok;
      errorMessage = `Truco returned an unreadable promotion response (HTTP ${response.status})`;
    } else {
      succeeded = response.ok && redeemResponse.success === true;
      errorMessage = redeemResponse.errorMessage || redeemResponse.message || `Truco promotion redemption failed (HTTP ${response.status})`;
      uncertain = !succeeded && response.status >= 500;
    }
  } catch (error) {
    uncertain = requestStarted;
    errorMessage = sanitizeText(error.message);
    redeemResponse = { error: errorMessage };
    console.error("Truco promotion redemption request failed:", error.name || "Error");
  }

  await EcomOrderInfo.findByIdAndUpdate(order._id, {
    $set: {
      promotion_redemption_http_status: redeemHttpStatus,
      promotion_redemption_response: redeemResponse ||
        (errorMessage ? { error: errorMessage } : null),
    },
  });

  if (uncertain) {
    try {
      const statusResult = await getPromotionStatus(order.promotion_code_applied);
      statusCheckHttpStatus = statusResult.httpStatus;
      statusCheckResponse = statusResult.response;
      succeeded = statusResult.isRedeemed;
    } catch (statusError) {
      statusCheckResponse = { error: sanitizeText(statusError.message) };
      console.error("Truco promotion status check failed:", statusError.name || "Error");
      errorMessage = `${errorMessage}; status check failed: ${sanitizeText(statusError.message)}`;
    }
  }

  const status = succeeded ? "succeeded" : uncertain ? "pending" : "failed";
  await EcomOrderInfo.findByIdAndUpdate(order._id, {
    $set: {
      promotion_redemption_status: status,
      promotion_redemption_error: succeeded ? null : errorMessage,
      promotion_redemption_http_status: redeemHttpStatus,
      promotion_redemption_response: redeemResponse,
      promotion_status_check_http_status: statusCheckHttpStatus,
      promotion_status_check_response: statusCheckResponse,
    },
  });

  return {
    success: succeeded,
    status,
    redeemHttpStatus,
    redeemResponse,
    statusCheckHttpStatus,
    statusCheckResponse,
    message: succeeded
      ? "Truco promotion was redeemed after payment was confirmed."
      : uncertain
        ? "The redemption result is uncertain. Its status was checked; do not retry automatically."
        : errorMessage || "Truco promotion redemption failed. Contact support.",
  };
}
