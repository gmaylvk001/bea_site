import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { orderNumber } = body;
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: "orderNumber is required" },
        { status: 400 }
      );
    }

    if (!process.env.TRUCO_BASE_URL || !process.env.TRUCO_API_KEY) {
      return NextResponse.json(
        { success: false, message: "Truco config missing in environment" },
        { status: 500 }
      );
    }

    const order = await EcomOrderInfo.findOne({ order_number: orderNumber });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (
      order.payment_status !== "paid" ||
      order.payment_confirmation_source !== "razorpay" ||
      !order.payment_verified_at ||
      !["online", "emi"].includes(order.payment_method?.trim().toLowerCase())
    ) {
      return NextResponse.json(
        { success: false, message: "Loyalty points are awarded only for completed online or EMI orders" },
        { status: 409 }
      );
    }
    if (order.loyalty_award_status === "succeeded") {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        points_awarded: order.loyalty_points_awarded,
        current_balance: order.loyalty_current_balance,
      });
    }
    if (order.loyalty_award_status) {
      return NextResponse.json(
        {
          success: false,
          status: order.loyalty_award_status,
          message: order.loyalty_award_status === "pending"
            ? "The points award result is uncertain or already processing. Do not retry."
            : "This invoice's points award previously failed. Do not retry automatically.",
        },
        { status: 409 }
      );
    }

    const invoiceDate = order.payment_verified_at ? new Date(order.payment_verified_at) : null;
    const netAmount = Number(order.invoice_net_amount);
    const deliveryCharge = order.delivery_charge == null
      ? NaN
      : Number(order.delivery_charge);
    const orderItems = Array.isArray(order.order_item) ? order.order_item : [];
    const lineItems = orderItems.map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.actual_price);
        return {
          product_code: String(item.item_code || "").trim(),
          product_name: String(item.name || "").trim(),
          quantity,
          unit_price: unitPrice,
          line_total: unitPrice * quantity,
        };
      });
    const ancillaryCharges = orderItems.map((item) => [
      item.warranty == null ? 0 : Number(item.warranty),
      item.extendedWarranty == null ? 0 : Number(item.extendedWarranty),
    ]);
    const ancillaryChargesAreValid = ancillaryCharges.every(([warranty, extendedWarranty]) =>
      Number.isFinite(warranty) &&
      warranty >= 0 &&
      Number.isFinite(extendedWarranty) &&
      extendedWarranty >= 0
    );
    const calculatedGrossAmount = ancillaryChargesAreValid
      ? lineItems.reduce((total, item, index) =>
        total + item.line_total + ancillaryCharges[index][0] + ancillaryCharges[index][1], 0) + deliveryCharge
      : NaN;
    const grossAmount = Number(order.invoice_gross_amount);
    if (
      !order.order_phonenumber ||
      !invoiceDate ||
      !Number.isFinite(invoiceDate.getTime()) ||
      !Number.isFinite(netAmount) ||
      netAmount <= 0 ||
      !Number.isFinite(deliveryCharge) ||
      deliveryCharge < 0 ||
      !Number.isFinite(grossAmount) ||
      grossAmount <= 0 ||
      !Number.isFinite(calculatedGrossAmount) ||
      Math.abs(grossAmount - calculatedGrossAmount) > 0.01 ||
      !lineItems.length ||
      lineItems.some((item) =>
        !item.product_code ||
        !item.product_name ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unit_price) ||
        item.unit_price <= 0 ||
        !Number.isFinite(item.line_total) ||
        item.line_total <= 0
      )
    ) {
      return NextResponse.json(
        { success: false, message: "The saved order is missing required Truco invoice data" },
        { status: 400 }
      );
    }

    const transactionBody = {
      phone_number: order.order_phonenumber,
      invoice: {
        invoice_number: order.order_number,
        invoice_date: invoiceDate.toISOString(),
        gross_amount: grossAmount,
        net_amount: netAmount,
        currency: "INR",
        payment_method: order.payment_gateway_method,
        ...(order.payment_id ? { payment_reference: order.payment_id } : {}),
        sales_channel: "online",
        loyalty_points_redeemed_amount: Number(order.loyalty_discount) || 0,
        loyalty_points_redeemed_code: order.loyalty_redemption_token || "",
        promotion_code_applied: order.promotion_is_truco ? order.promotion_code_applied || "" : "",
        promotion_discount_applied: order.promotion_is_truco
          ? Number(order.promotion_discount_applied) || 0
          : 0,
        line_items: lineItems,
      },
      store_info: {
        store_code: "ECOM",
        store_name: "Online Store",
        location: "web",
        terminal_id: "ecom-web",
        cashier_code: "system"
      },
      metadata: {
        source_system: "bea-ecom",
        customer_email: order.email_address,
      }
    };

    const awardClaim = await EcomOrderInfo.findOneAndUpdate(
      {
        _id: order._id,
        payment_status: "paid",
        $or: [
          { loyalty_award_status: { $exists: false } },
          { loyalty_award_status: null },
        ],
      },
      { $set: { loyalty_award_status: "pending", loyalty_award_error: null } },
      { new: true }
    );
    if (!awardClaim) {
      return NextResponse.json(
        { success: false, status: "pending", message: "This invoice's points award is already processing. Do not retry." },
        { status: 409 }
      );
    }

    const trucoUrl = `${process.env.TRUCO_BASE_URL}/external/transaction`;

    let trucoRes;
    try {
      trucoRes = await fetch(trucoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.TRUCO_API_KEY
        },
          body: JSON.stringify(transactionBody)
        });
    } catch (error) {
      await EcomOrderInfo.findByIdAndUpdate(order._id, {
        $set: { loyalty_award_error: error.message },
      });
      console.error("Truco transaction result is uncertain:", error);
      return NextResponse.json(
        { success: false, status: "pending", message: "The points award result is uncertain. Do not retry; contact support to verify the invoice." },
        { status: 502 }
      );
    }

    const rawBody = await trucoRes.text();
    const contentType = trucoRes.headers.get("content-type") || "";

    if (!trucoRes.ok || !contentType.includes("application/json")) {
      const uncertain = trucoRes.status >= 500 || (trucoRes.ok && !contentType.includes("application/json"));
      await EcomOrderInfo.findByIdAndUpdate(order._id, {
        $set: {
          loyalty_award_status: uncertain ? "pending" : "failed",
          loyalty_award_error: `Truco API error (HTTP ${trucoRes.status})`,
        },
      });
      console.error(
        "Truco returned a non-JSON / error response.",
        "status:", trucoRes.status,
        "content-type:", contentType,
        "url:", trucoUrl,
        "body(first 300 chars):", rawBody.slice(0, 300)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Truco API error (HTTP ${trucoRes.status}). Endpoint did not return JSON.`,
          status: trucoRes.status,
          url: trucoUrl,
          bodyPreview: rawBody.slice(0, 300),
          statusCode: uncertain ? "pending" : "failed",
        },
        { status: uncertain ? 502 : 400 }
      );
    }

    let trucoData;
    try {
      trucoData = JSON.parse(rawBody);
    } catch (parseError) {
      await EcomOrderInfo.findByIdAndUpdate(order._id, {
        $set: {
          loyalty_award_status: "pending",
          loyalty_award_error: `Truco returned invalid JSON: ${parseError.message}`,
        },
      });
      return NextResponse.json(
        { success: false, status: "pending", message: "The points award response could not be verified. Do not retry; contact support to verify the invoice." },
        { status: 502 }
      );
    }
    if (trucoData.success) {
      const updateResult = await EcomOrderInfo.findOneAndUpdate(
        { _id: order._id, loyalty_award_status: "pending" },
        { $set: {
          loyalty_award_status: "succeeded",
          loyalty_award_error: null,
          loyalty_points_awarded: Number(trucoData.points_awarded) || 0,
          loyalty_current_balance: trucoData.current_balance != null &&
            Number.isFinite(Number(trucoData.current_balance))
            ? Number(trucoData.current_balance)
            : null,
          truco_transaction_id: trucoData.transaction_id || null,
          promotion_code_applied: order.promotion_is_truco
            ? order.promotion_code_applied || null
            : null,
          promotion_discount_applied: order.promotion_is_truco
            ? Number(order.promotion_discount_applied) || 0
            : 0,
        } },
        { new: true }
      );

      if (!updateResult) {
        return NextResponse.json(
          { success: false, status: "pending", message: "Truco accepted the invoice, but its local award state could not be confirmed. Do not retry." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        points_awarded: trucoData.points_awarded,
        current_balance: trucoData.current_balance ?? null,
        rewards: trucoData.rewards || [],
        message: trucoData.messages?.[0] || "Points awarded successfully"
      });
    } else {
      const uncertain = trucoRes.status >= 500;
      await EcomOrderInfo.findByIdAndUpdate(order._id, {
        $set: {
          loyalty_award_status: uncertain ? "pending" : "failed",
          loyalty_award_error: trucoData.error || "Truco API failed",
        },
      });
      return NextResponse.json({
        success: false,
        status: uncertain ? "pending" : "failed",
        message: trucoData.error || "Truco API failed",
        errorCode: trucoData.errorCode || null
      }, { status: uncertain ? 502 : trucoRes.status });
    }

  } catch (error) {
    console.error("Award points error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, message: "phone is required" }, { status: 400 });
  }

  if (!process.env.TRUCO_BASE_URL || !process.env.TRUCO_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Truco config missing in environment" },
      { status: 500 }
    );
  }

  try {
    const endpoint = "/external/customer/check";
    const query = new URLSearchParams({ phoneNumber: phone });
    const res = await fetch(
      `${process.env.TRUCO_BASE_URL}${endpoint}?${query}`,
      {
        headers: {
          'X-Api-Key': process.env.TRUCO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || "Truco customer lookup failed" },
        { status: res.status }
      );
    }

    if (typeof data.customerExists !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Truco did not return the customer account status" },
        { status: 502 }
      );
    }

    if (data.customerExists) {
      const currentPointsBalance = Number(data.currentPointsBalance);
      if (!Number.isFinite(currentPointsBalance) || currentPointsBalance < 0) {
        return NextResponse.json(
          { success: false, message: "Truco did not return a valid points balance" },
          { status: 502 }
        );
      }

      const currentBalanceValue = data.currentBalanceValue != null &&
        Number.isFinite(Number(data.currentBalanceValue)) &&
        Number(data.currentBalanceValue) >= 0
        ? Number(data.currentBalanceValue)
        : null;
      return NextResponse.json({
        success: true,
        customerExists: true,
        points: currentPointsBalance,
        value: currentBalanceValue,
        pointsPerCurrencyUnit: data.pointsPerCurrencyUnit != null &&
          Number.isFinite(Number(data.pointsPerCurrencyUnit)) &&
          Number(data.pointsPerCurrencyUnit) > 0
          ? Number(data.pointsPerCurrencyUnit)
          : null,
      });
    } else {
      return NextResponse.json({
        success: true,
        customerExists: false,
        points: 0,
        value: null,
        pointsPerCurrencyUnit: null,
      });
    }
  } catch (error) {
    console.error("Truco customer lookup failed:", error);
    return NextResponse.json(
      { success: false, message: "Truco customer lookup failed" },
      { status: 502 }
    );
  }
}