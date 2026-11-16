import EcomOrderInfo from "@/models/ecom_order_info";

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
  const data = await response.json();
  return response.ok && data.isRedeemed === true;
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
    hasOtherOffersApplied: false,
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
    { $set: { promotion_redemption_status: "pending", promotion_redemption_error: null } },
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

    let data;
    try {
      data = await response.json();
    } catch (error) {
      uncertain = response.status >= 500 || response.ok;
      errorMessage = `Truco returned an unreadable promotion response (HTTP ${response.status}): ${error.message}`;
    }

    if (data) {
      succeeded = response.ok && data.success === true;
      errorMessage = data.errorMessage || data.message || `Truco promotion redemption failed (HTTP ${response.status})`;
      uncertain = !succeeded && response.status >= 500;
    }
  } catch (error) {
    uncertain = requestStarted;
    errorMessage = error.message;
    console.error("Truco promotion redemption request failed:", error);
  }

  if (uncertain) {
    try {
      succeeded = await getPromotionStatus(order.promotion_code_applied);
    } catch (statusError) {
      console.error("Truco promotion status check failed:", statusError);
      errorMessage = `${errorMessage}; status check failed: ${statusError.message}`;
    }
  }

  const status = succeeded ? "succeeded" : uncertain ? "pending" : "failed";
  await EcomOrderInfo.findByIdAndUpdate(order._id, {
    $set: {
      promotion_redemption_status: status,
      promotion_redemption_error: succeeded ? null : errorMessage,
    },
  });

  return {
    success: succeeded,
    status,
    message: succeeded
      ? "Truco promotion was redeemed after payment was confirmed."
      : uncertain
        ? "The redemption result is uncertain. Its status was checked; do not retry automatically."
        : errorMessage || "Truco promotion redemption failed. Contact support.",
  };
}
