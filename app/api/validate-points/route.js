import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

// Validate points before checkout; processing runs after server-side payment verification.

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

      if (
        !mobileNumber ||
        !Number.isFinite(Number(pointsToRedeem)) ||
        Number(pointsToRedeem) <= 0 ||
        !Number.isFinite(Number(billTotal)) ||
        Number(billTotal) <= 0
      ) {
        return NextResponse.json(
          { isValid: false, errorMessage: "mobileNumber, positive pointsToRedeem, and positive billTotal are required" },
          { status: 400 }
        );
      }

      const validationPayload = {
          mobileNumber,
          pointsToRedeem: Number(pointsToRedeem),
          billTotal: Number(billTotal),
          notes: "Web checkout",
        };
      const validationResponse = await fetch(`${baseUrl}/pos/redemption/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(validationPayload),
      });
      const validationData = await validationResponse.json();
      if (validationResponse.ok && validationData.isValid === true) {
        const expiryTime = new Date(validationData.expiresAt).getTime();
        if (!validationData.token || !Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
          if (validationData.token) {
            const cancelPayload = {
              token: validationData.token,
              reason: "Invalid or expired validation response",
              cancelledBy: "checkout-service",
            };
            try {
              const cancelResponse = await fetch(`${baseUrl}/pos/redemption/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': apiKey,
                },
                body: JSON.stringify(cancelPayload),
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
      return NextResponse.json(
        { success: false, message: "Loyalty points are processed automatically after server-side payment verification." },
        { status: 409 }
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
        const cancelPayload = {
          token,
          reason: "Customer removed points or checkout was abandoned",
          cancelledBy: "checkout-service",
        };
        const cancelResponse = await fetch(`${baseUrl}/pos/redemption/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
          body: JSON.stringify(cancelPayload),
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
      { success: false, message: "Invalid action. Use: validate | cancel | refund" },
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