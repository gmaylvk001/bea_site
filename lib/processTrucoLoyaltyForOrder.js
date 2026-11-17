import EcomOrderInfo from "@/models/ecom_order_info";

export async function processTrucoLoyaltyForOrder(order) {
  if (!order?.loyalty_redemption_token) return null;

  if (
    order.payment_status !== "paid" ||
    order.payment_confirmation_source !== "razorpay" ||
    !order.payment_verified_at ||
    !["online", "emi"].includes(order.payment_method?.trim().toLowerCase())
  ) {
    return {
      success: false,
      status: "failed",
      message: "Loyalty points can only be processed for paid online or EMI orders.",
    };
  }

  if (order.loyalty_redemption_status === "succeeded") {
    return { success: true, alreadyProcessed: true };
  }
  if (order.loyalty_redemption_status) {
    return {
      success: false,
      status: order.loyalty_redemption_status,
      message: order.loyalty_redemption_status === "pending"
        ? "Loyalty redemption is already processing or has an uncertain result. Do not retry."
        : "This loyalty token has already been processed, cancelled, or failed. Revalidate points before trying again.",
    };
  }

  const token = order.loyalty_redemption_token;
  const orderNumber = order.order_number;
  const baseUrl = process.env.TRUCO_BASE_URL;
  const apiKey = process.env.TRUCO_API_KEY;
  if (!baseUrl || !apiKey) {
    return { success: false, status: "failed", message: "Truco config missing in environment." };
  }

  const expiryTime = order.loyalty_redemption_expires_at
    ? new Date(order.loyalty_redemption_expires_at).getTime()
    : NaN;
  if (!Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
    const expiryMessage = Number.isFinite(expiryTime)
      ? "The loyalty validation token has expired. Re-apply points before placing another order."
      : "The loyalty validation token expiry is missing. Re-apply points before placing another order.";
    await EcomOrderInfo.findOneAndUpdate(
      {
        _id: order._id,
        payment_status: "paid",
        loyalty_redemption_token: token,
        $or: [
          { loyalty_redemption_status: { $exists: false } },
          { loyalty_redemption_status: null },
        ],
      },
      {
        $set: {
          loyalty_redemption_status: "failed",
          loyalty_redemption_error: expiryMessage,
        },
      }
    );
    return { success: false, status: "failed", tokenExpired: true, message: expiryMessage };
  }

  const billTotal = Number(order.loyalty_bill_total);
  if (!Number.isFinite(billTotal) || billTotal <= 0) {
    const billTotalError = "The validated loyalty bill total is missing or invalid.";
    await EcomOrderInfo.findOneAndUpdate(
      {
        _id: order._id,
        payment_status: "paid",
        loyalty_redemption_token: token,
        $or: [
          { loyalty_redemption_status: { $exists: false } },
          { loyalty_redemption_status: null },
        ],
      },
      {
        $set: {
          loyalty_redemption_status: "failed",
          loyalty_redemption_error: billTotalError,
        },
      }
    );
    return {
      success: false,
      status: "failed",
      message: billTotalError,
    };
  }

  const claim = await EcomOrderInfo.findOneAndUpdate(
    {
      _id: order._id,
      payment_status: "paid",
      payment_confirmation_source: "razorpay",
      payment_verified_at: { $ne: null },
      loyalty_redemption_token: token,
      $or: [
        { loyalty_redemption_status: { $exists: false } },
        { loyalty_redemption_status: null },
      ],
    },
    { $set: { loyalty_redemption_status: "pending", loyalty_redemption_error: null } },
    { new: true }
  );
  if (!claim) {
    return {
      success: false,
      status: "pending",
      message: "Loyalty redemption is already being processed. Do not retry.",
    };
  }

  let response;
  let data;
  let uncertain = false;
  let alreadyProcessed = false;
  let errorMessage = "";
  const processPayload = {
    token,
    posTransactionReference: orderNumber,
    processedBy: "checkout-service",
    storeLocation: "ecom-web",
    billTotal,
  };
  try {
    response = await fetch(`${baseUrl}/pos/redemption/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(processPayload),
    });
    try {
      data = await response.json();
    } catch (parseError) {
      uncertain = response.ok || response.status >= 500;
      errorMessage = `Truco returned an unreadable redemption response (HTTP ${response.status}): ${parseError.message}`;
    }
    if (data) {
      alreadyProcessed = data.success === false &&
        /already processed/i.test(data.errorMessage || data.message || "");
      data = alreadyProcessed ? { ...data, success: true, alreadyProcessed: true } : data;
      errorMessage = data.errorMessage || data.message || `Truco redemption failed (HTTP ${response.status})`;
      uncertain = data.success !== true && response.status >= 500;
    }
  } catch (processError) {
    uncertain = true;
    errorMessage = processError.message;
    console.error("Truco loyalty redemption result is uncertain:", processError.name || "Error");
  }

  const succeeded = data?.success === true && (response?.ok === true || alreadyProcessed);
  const expired = /expir|token.*invalid/i.test(`${data?.errorCode || ""} ${errorMessage}`);
  const status = succeeded ? "succeeded" : uncertain ? "pending" : "failed";
  const processedAt = succeeded
    ? (data?.processedAt && Number.isFinite(new Date(data.processedAt).getTime())
      ? new Date(data.processedAt)
      : alreadyProcessed ? null : new Date())
    : null;
  const redemptionUpdate = {
    loyalty_redemption_status: status,
    loyalty_redemption_error: succeeded ? null : errorMessage,
  };
  if (processedAt) redemptionUpdate.loyalty_redemption_processed_at = processedAt;
  await EcomOrderInfo.findByIdAndUpdate(order._id, { $set: redemptionUpdate });

  return {
    ...(data || {}),
    success: succeeded,
    status,
    ...(succeeded && alreadyProcessed ? { alreadyProcessed: true } : {}),
    ...(expired ? {
      tokenExpired: true,
      message: "The loyalty validation token expired. Re-apply points before placing another order.",
    } : {}),
    ...(!succeeded && !expired ? {
      message: uncertain
        ? "The redemption result is uncertain. Do not retry; contact support to verify the order."
        : errorMessage || "Loyalty redemption failed. Re-apply points before placing another order.",
    } : {}),
  };
}
