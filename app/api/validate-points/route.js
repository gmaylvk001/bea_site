import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

// Validate Points — POST /api/validate-points?action=validate
// Redeem Points — POST /api/validate-points?action=redeem

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    const body = await req.json();
    const baseUrl = process.env.TRUCO_BASE_URL;
    const apiKey = process.env.TRUCO_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { success: false, message: "Truco config missing in environment" },
        { status: 500 }
      );
    }

    const forwardRequest = async (path, payload) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    };

    if (action === 'validate') {
      const { mobileNumber, pointsToRedeem, billTotal, paymentMethod } = body;
      if (!['online', 'emi'].includes(String(paymentMethod || '').toLowerCase())) {
        return NextResponse.json(
          { isValid: false, errorMessage: "Loyalty points are available for online and EMI orders only" },
          { status: 400 }
        );
      }

      if (!mobileNumber || !Number.isFinite(Number(pointsToRedeem)) || Number(pointsToRedeem) <= 0) {
        return NextResponse.json(
          { isValid: false, errorMessage: "mobileNumber and positive pointsToRedeem are required" },
          { status: 400 }
        );
      }

      const validationResponse = await fetch(`${baseUrl}/pos/redemption/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          mobileNumber,
          pointsToRedeem: Number(pointsToRedeem),
          ...(Number.isFinite(Number(billTotal)) && Number(billTotal) > 0
            ? { billTotal: Number(billTotal) }
            : {}),
          notes: "Web checkout",
        }),
      });
      const validationData = await validationResponse.json();
      if (validationResponse.ok && validationData.isValid === true) {
        const expiryTime = new Date(validationData.expiresAt).getTime();
        if (!validationData.token || !Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
          if (validationData.token) {
            try {
              const cancelResponse = await fetch(`${baseUrl}/pos/redemption/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': apiKey,
                },
                body: JSON.stringify({
                  token: validationData.token,
                  reason: "Invalid or expired validation response",
                  cancelledBy: "checkout-service",
                }),
              });
              if (!cancelResponse.ok) {
                console.error("Unable to cancel a Truco token with an invalid expiry response:", cancelResponse.status);
              }
            } catch (cancelError) {
              console.error("Unable to cancel a Truco token with an invalid expiry response:", cancelError);
            }
          }

          const expired = Number.isFinite(expiryTime) && expiryTime <= Date.now();
          return NextResponse.json(
            {
              ...validationData,
              isValid: false,
              tokenExpired: expired,
              errorMessage: expired
                ? "The loyalty validation token has expired. Please validate points again."
                : "Truco did not return a valid expiry time for the loyalty token.",
            },
            { status: expired ? 400 : 502 }
          );
        }
      }

      return NextResponse.json(validationData, { status: validationResponse.status });
    }

    if (action === 'redeem') {
      const { token, orderNumber, billTotal } = body;
      if (!token || !orderNumber) {
        return NextResponse.json(
          { success: false, errorMessage: "token and orderNumber are required" },
          { status: 400 }
        );
      }

      await dbConnect();
      const order = await EcomOrderInfo.findOne({ order_number: orderNumber });
      if (!order || order.loyalty_redemption_token !== token) {
        return NextResponse.json(
          { success: false, message: "Paid order and matching loyalty token were not found" },
          { status: 404 }
        );
      }
      if (
        order.payment_status !== "paid" ||
        order.payment_confirmation_source !== "razorpay" ||
        !order.payment_verified_at ||
        !["online", "emi"].includes(order.payment_method?.trim().toLowerCase())
      ) {
        return NextResponse.json(
          { success: false, message: "Loyalty points can only be processed for paid online or EMI orders" },
          { status: 409 }
        );
      }
      if (order.loyalty_redemption_status === "succeeded") {
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }
      if (order.loyalty_redemption_status) {
        return NextResponse.json(
          {
            success: false,
            status: order.loyalty_redemption_status,
            message: order.loyalty_redemption_status === "pending"
              ? "Loyalty redemption is already processing or has an uncertain result. Do not retry."
              : "This loyalty token has already been processed, cancelled, or failed. Revalidate points before trying again.",
          },
          { status: 409 }
        );
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
        return NextResponse.json(
          { success: false, status: "failed", tokenExpired: true, message: expiryMessage },
          { status: 400 }
        );
      }

      const claim = await EcomOrderInfo.findOneAndUpdate(
        {
          _id: order._id,
          payment_status: "paid",
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
        return NextResponse.json(
          { success: false, status: "pending", message: "Loyalty redemption is already being processed. Do not retry." },
          { status: 409 }
        );
      }

      let response;
      let data;
      let uncertain = false;
      let alreadyProcessed = false;
      let errorMessage = "";
      try {
        response = await fetch(`${baseUrl}/pos/redemption/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify({
            token,
            posTransactionReference: orderNumber,
            processedBy: "checkout-service",
            storeLocation: "ecom-web",
            ...(Number.isFinite(Number(billTotal)) && Number(billTotal) > 0
              ? { billTotal: Number(billTotal) }
              : {}),
          }),
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
        console.error("Truco loyalty redemption result is uncertain:", processError);
      }

      const succeeded = data?.success === true && (response?.ok === true || alreadyProcessed);
      const expired = /expir|token.*invalid/i.test(
        `${data?.errorCode || ""} ${errorMessage}`
      );
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
      await EcomOrderInfo.findByIdAndUpdate(order._id, {
        $set: redemptionUpdate,
      });

      return NextResponse.json(
        {
          ...(data || {}),
          success: succeeded,
          status,
          ...(succeeded && alreadyProcessed ? { alreadyProcessed: true } : {}),
          ...(expired ? { tokenExpired: true, message: "The loyalty validation token expired. Re-apply points before placing another order." } : {}),
          ...(!succeeded && !expired ? { message: uncertain
            ? "The redemption result is uncertain. Do not retry; contact support to verify the order."
            : errorMessage || "Loyalty redemption failed. Re-apply points before placing another order." } : {}),
        },
        { status: succeeded ? 200 : uncertain ? 502 : 400 }
      );
    }

    if (action === 'cancel') {
      const { token, orderNumber } = body;
      if (!token) {
        return NextResponse.json(
          { success: false, message: "token is required" },
          { status: 400 }
        );
      }

      let order = null;
      if (orderNumber) {
        await dbConnect();
        order = await EcomOrderInfo.findOne({ order_number: orderNumber, loyalty_redemption_token: token });
        if (order) {
          if (!["online", "emi"].includes(order.payment_method?.trim().toLowerCase())) {
            return NextResponse.json(
              { success: false, message: "Loyalty token cancellation is available for online and EMI orders only" },
              { status: 409 }
            );
          }
          if (order.payment_status === "paid" || ["pending", "succeeded"].includes(order.loyalty_redemption_status)) {
            return NextResponse.json(
              { success: false, message: "A paid or processing loyalty redemption cannot be cancelled" },
              { status: 409 }
            );
          }
          if (["cancelled", "cancel_pending"].includes(order.loyalty_redemption_status)) {
            return NextResponse.json({
              success: order.loyalty_redemption_status === "cancelled",
              status: order.loyalty_redemption_status,
              alreadyCancelled: order.loyalty_redemption_status === "cancelled",
              message: "This loyalty token has already been cancelled or its cancellation is uncertain.",
            }, { status: order.loyalty_redemption_status === "cancelled" ? 200 : 409 });
          }
          if (order.loyalty_redemption_status === "failed") {
            return NextResponse.json(
              { success: false, message: "A failed loyalty redemption cannot be cancelled automatically" },
              { status: 409 }
            );
          }

          const cancelClaim = await EcomOrderInfo.findOneAndUpdate(
            {
              _id: order._id,
              payment_status: { $ne: "paid" },
              loyalty_redemption_token: token,
              $or: [
                { loyalty_redemption_status: { $exists: false } },
                { loyalty_redemption_status: null },
              ],
            },
            { $set: { loyalty_redemption_status: "cancelled", loyalty_redemption_error: null } },
            { new: true }
          );
          if (!cancelClaim) {
            return NextResponse.json(
              { success: false, message: "The loyalty token is already processing or the order is paid" },
              { status: 409 }
            );
          }
        }
      }

      try {
        const cancelResponse = await fetch(`${baseUrl}/pos/redemption/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify({
            token,
            reason: "Customer removed points or checkout was abandoned",
            cancelledBy: "checkout-service",
          }),
        });
        const cancelData = await cancelResponse.json();
        const alreadyExpired = /token.*expir|expir.*token/i.test(
          `${cancelData.errorCode || ""} ${cancelData.errorMessage || cancelData.message || ""}`
        );
        const cancelled = (cancelResponse.ok && cancelData.success === true) || alreadyExpired;
        if (order) {
          await EcomOrderInfo.findByIdAndUpdate(order._id, {
            $set: {
              loyalty_redemption_status: cancelled ? "cancelled" : "cancel_pending",
              loyalty_redemption_error: cancelled ? null : cancelData.errorMessage || cancelData.message || "Truco token cancellation could not be confirmed",
            },
          });
        }
        return NextResponse.json(
          {
            ...cancelData,
            success: cancelled,
            ...(alreadyExpired ? { alreadyExpired: true, message: "The loyalty validation token has expired and no longer needs cancellation." } : {}),
            ...(cancelled ? {} : { status: "cancel_pending" }),
          },
          { status: cancelResponse.status }
        );
      } catch (cancelError) {
        if (order) {
          await EcomOrderInfo.findByIdAndUpdate(order._id, {
            $set: {
              loyalty_redemption_status: "cancel_pending",
              loyalty_redemption_error: cancelError.message,
            },
          });
        }
        throw cancelError;
      }
    }

    if (action === 'refund') {
      const { refundType, token, phoneNumber, pointsToRefund, transactionReference, refundReason, refundedBy } = body;
      if (!['Token', 'Direct'].includes(refundType) || !refundReason || !refundedBy) {
        return NextResponse.json(
          { success: false, message: "refundType, refundReason, and refundedBy are required" },
          { status: 400 }
        );
      }

      if (refundType === 'Token' && !token) {
        return NextResponse.json(
          { success: false, message: "token is required for a token refund" },
          { status: 400 }
        );
      }

      if (refundType === 'Direct' && (!phoneNumber || !Number.isFinite(Number(pointsToRefund)) || Number(pointsToRefund) <= 0 || !transactionReference)) {
        return NextResponse.json(
          { success: false, message: "phoneNumber, positive pointsToRefund, and transactionReference are required for a direct refund" },
          { status: 400 }
        );
      }

      return forwardRequest('/pos/redemption/refund', {
        refundType,
        ...(refundType === 'Token'
          ? { token }
          : { phoneNumber, pointsToRefund: Number(pointsToRefund), ...(transactionReference ? { transactionReference } : {}) }),
        refundReason,
        refundedBy,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action. Use: validate | redeem | cancel | refund" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Truco loyalty API error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}