import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await dbConnect();

  try {
    const { order_id, order_status, payment_status, payment_id, cancellation_reason } = await req.json();

    if (!order_id || !order_status) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const order = await EcomOrderInfo.findById(order_id);
    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const isCodPayment = ["cash on delivery", "cod"].includes(
      order.payment_method?.trim().toLowerCase()
    );
    const isStorePayment = order.payment_method?.trim().toLowerCase() === "pay_at_store";
    const isMarkingManualPaymentPaid =
      String(payment_status || "").trim().toLowerCase() === "paid" &&
      (isCodPayment || isStorePayment);
    if (
      String(payment_status || "").trim().toLowerCase() === "paid" &&
      !isMarkingManualPaymentPaid
    ) {
      return Response.json(
        { success: false, message: "Online and EMI payments must be confirmed by server-side Razorpay verification" },
        { status: 403 }
      );
    }

    if (isMarkingManualPaymentPaid) {
      const token = req.headers.get("authorization")?.split(" ")[1];
      if (!token) {
        return Response.json({ success: false, message: "Admin authorization is required to confirm COD payment" }, { status: 401 });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return Response.json({ success: false, message: "Invalid admin authorization" }, { status: 401 });
      }

      if (!decoded?.userId) {
        return Response.json({ success: false, message: "Invalid admin authorization" }, { status: 401 });
      }
      const admin = await User.findById(decoded.userId).select("user_type status");
      if (!admin || admin.user_type !== "admin" || admin.status !== "Active") {
        return Response.json({ success: false, message: "Active admin access is required to confirm COD payment" }, { status: 403 });
      }
    }

    const updateFields = { order_status };
    if (isMarkingManualPaymentPaid) {
      updateFields.payment_status = "paid";
      updateFields.payment_confirmation_source = isCodPayment ? "cod_admin" : "admin_manual";
      updateFields.payment_verified_at = new Date();
    }
    if (payment_id) updateFields.payment_id = payment_id;

    const updatedOrder = await EcomOrderInfo.findOneAndUpdate(
      { _id: order_id },
      { $set: updateFields },
      { new: true }
    );
    if (!updatedOrder) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    let loyaltyRefund = null;
    if (
      order_status === "cancelled" &&
      order.payment_status === "paid" &&
      order.payment_confirmation_source === "razorpay" &&
      ["online", "emi"].includes(order.payment_method?.trim().toLowerCase()) &&
      order.loyalty_redemption_token
    ) {
      const processedAt = order.loyalty_redemption_processed_at
        ? new Date(order.loyalty_redemption_processed_at).getTime()
        : NaN;
      const redemptionAge = Date.now() - processedAt;
      if (order.loyalty_refund_status === "succeeded") {
        loyaltyRefund = { success: true, alreadyRefunded: true };
      } else if (order.loyalty_refund_status) {
        loyaltyRefund = {
          success: false,
          message: order.loyalty_refund_status === "pending"
            ? "A loyalty points refund is already being processed."
            : "The loyalty points refund failed previously and requires support review.",
        };
      } else if (order.loyalty_redemption_status !== "succeeded") {
        loyaltyRefund = {
          success: false,
          message: "Loyalty points were not confirmed as redeemed; no refund was attempted.",
        };
      } else if (
        !Number.isFinite(processedAt) ||
        redemptionAge < 0 ||
        redemptionAge > 24 * 60 * 60 * 1000
      ) {
        const refundWindowError = !Number.isFinite(processedAt)
          ? "The original redemption time is unavailable; a refund cannot be safely attempted."
          : "The 24-hour Truco refund window has passed; contact Truco support.";
        await EcomOrderInfo.findOneAndUpdate(
          {
            _id: order._id,
            $or: [
              { loyalty_refund_status: { $exists: false } },
              { loyalty_refund_status: null },
            ],
          },
          {
            $set: {
              loyalty_refund_status: "failed",
              loyalty_refund_error: refundWindowError,
            },
          }
        );
        loyaltyRefund = { success: false, message: refundWindowError };
      } else {
        const refundClaim = await EcomOrderInfo.findOneAndUpdate(
          {
            _id: order._id,
            loyalty_redemption_status: "succeeded",
            loyalty_redemption_processed_at: order.loyalty_redemption_processed_at,
            $or: [
              { loyalty_refund_status: { $exists: false } },
              { loyalty_refund_status: null },
            ],
          },
          { $set: { loyalty_refund_status: "pending", loyalty_refund_error: null } },
          { new: true }
        );

        if (!refundClaim) {
          loyaltyRefund = {
            success: false,
            message: "A loyalty points refund is already being processed. Please check the order again.",
          };
        } else {
          try {
            if (!process.env.TRUCO_BASE_URL || !process.env.TRUCO_API_KEY) {
              throw new Error("Truco config missing in environment");
            }

            const refundRes = await fetch(`${process.env.TRUCO_BASE_URL}/pos/redemption/refund`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": process.env.TRUCO_API_KEY,
              },
              body: JSON.stringify({
                refundType: "Token",
                token: order.loyalty_redemption_token,
                refundReason: cancellation_reason || "Order cancelled",
                refundedBy: "admin-order-cancellation",
              }),
            });
            let refundData = null;
            try {
              refundData = await refundRes.json();
            } catch (parseError) {
              console.error("Unable to read the Truco points refund response:", parseError);
            }
            const refundSucceeded = refundRes.ok && refundData?.success === true;
            const refundUncertain = !refundSucceeded &&
              (refundRes.status >= 500 || (refundRes.ok && typeof refundData?.success !== "boolean"));

            await EcomOrderInfo.findByIdAndUpdate(order._id, {
              $set: {
                loyalty_refund_status: refundSucceeded ? "succeeded" : refundUncertain ? "pending" : "failed",
                loyalty_refund_error: refundSucceeded
                  ? null
                  : refundData?.errorMessage || refundData?.message || `Truco refund could not be confirmed (HTTP ${refundRes.status})`,
              },
            });

            loyaltyRefund = {
              success: refundSucceeded,
              message: refundSucceeded
                ? "Loyalty points were refunded."
                : refundUncertain
                  ? "The loyalty points refund result is uncertain. Do not retry; contact Truco support."
                  : "Loyalty points could not be refunded automatically. Please contact Truco support.",
            };
          } catch (refundError) {
            console.error("Truco loyalty refund failed:", refundError);
            await EcomOrderInfo.findByIdAndUpdate(order._id, {
              $set: {
                loyalty_refund_status: "pending",
                loyalty_refund_error: refundError.message,
              },
            });
            loyaltyRefund = {
              success: false,
              message: "The loyalty points refund result is uncertain. Do not retry; contact Truco support.",
            };
          }
        }
      }
    }

    return Response.json({
      success: true,
      message: `Order marked as ${order_status}`,
      order: updatedOrder,
      ...(loyaltyRefund ? { loyaltyRefund } : {}),
      ...(order_status === "cancelled" && order.promotion_is_truco === true
        ? { trucoPromotionReversalRequiresSupport: true }
        : {}),
    });

  } catch (error) {
    console.error("Order update failed:", error);
    return Response.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}
