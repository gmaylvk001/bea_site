import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderNumber,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderNumber) {
      return NextResponse.json(
        { error: "Missing payment verification parameters or order number" },
        { status: 400 }
      );
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Validate signature
    if (!/^[a-f0-9]{64}$/i.test(String(razorpay_signature))) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const expectedSignature = Buffer.from(generatedSignature, "hex");
    const receivedSignature = Buffer.from(String(razorpay_signature), "hex");
    if (
      expectedSignature.length !== receivedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return NextResponse.json(
        { error: 'Invalid signature' }, 
        { status: 400 }
      );
    }

    await dbConnect();
    const order = await EcomOrderInfo.findOne({
      order_number: orderNumber,
      razorpay_order_id: razorpay_order_id,
    });
    if (!order) {
      return NextResponse.json(
        { error: "Razorpay order is not associated with this checkout" },
        { status: 404 }
      );
    }

    if (order.payment_status === "paid") {
      if (order.payment_id === razorpay_payment_id && order.payment_confirmation_source === "razorpay") {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          method: order.payment_gateway_method,
          isEmiPayment: order.payment_method?.trim().toLowerCase() === "emi",
        });
      }
      return NextResponse.json({ error: "A different payment is already recorded for this order" }, { status: 409 });
    }
    if (
      order.payment_status !== "payment_initialized" ||
      order.payment_confirmation_source ||
      !["online", "emi"].includes(order.payment_method?.trim().toLowerCase())
    ) {
      return NextResponse.json({ error: "Order is not awaiting a verified online payment" }, { status: 409 });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const isEmiPayment =
      payment.method === 'emi' ||
      payment.method === 'cardless_emi' ||
      (payment.method === 'card' && payment.card?.emi === true);
    const expectedEmiPayment = order.payment_method?.trim().toLowerCase() === "emi";
    const expectedAmount = Math.round(Number(order.order_amount) * 100);
    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      Number(payment.amount) !== expectedAmount ||
      isEmiPayment !== expectedEmiPayment
    ) {
      return NextResponse.json(
        { error: "Payment is not captured for this order with the expected amount and payment method" },
        { status: 409 }
      );
    }

    const verifiedAt = new Date();
    const gatewayMethod = isEmiPayment
      ? "emi"
      : String(payment.method || "").trim().toLowerCase();
    const paidOrder = await EcomOrderInfo.findOneAndUpdate(
      {
        _id: order._id,
        payment_status: "payment_initialized",
        razorpay_order_id,
        $or: [
          { payment_confirmation_source: { $exists: false } },
          { payment_confirmation_source: null },
        ],
      },
      {
        $set: {
          payment_status: "paid",
          payment_id: razorpay_payment_id,
          payment_gateway_method: gatewayMethod,
          payment_confirmation_source: "razorpay",
          payment_verified_at: verifiedAt,
        },
      },
      { new: true }
    );
    if (!paidOrder) {
      return NextResponse.json({ error: "Order payment state changed during verification" }, { status: 409 });
    }

    return NextResponse.json(
      { 
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        method: gatewayMethod,
        isEmiPayment,
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Payment verification failed' 
      }, 
      { status: 500 }
    );
  }
}