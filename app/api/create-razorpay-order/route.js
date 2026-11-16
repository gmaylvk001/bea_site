import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
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
    const { orderNumber } = body;
    if (!orderNumber) {
      return NextResponse.json(
        { error: "orderNumber is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const order = await EcomOrderInfo.findOne({ order_number: orderNumber });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!["online", "emi"].includes(order.payment_method?.trim().toLowerCase())) {
      return NextResponse.json({ error: "Razorpay is only available for online or EMI orders" }, { status: 409 });
    }
    if (order.payment_status !== "payment_initialized" || order.payment_confirmation_source) {
      return NextResponse.json({ error: "Order is not awaiting Razorpay payment" }, { status: 409 });
    }
    if (order.razorpay_order_id) {
      return NextResponse.json({ error: "A Razorpay order is already associated with this checkout" }, { status: 409 });
    }

    const amount = Math.round(Number(order.order_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Saved order amount is invalid" }, { status: 400 });
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: String(order.order_number).slice(0, 40),
    };

    const razorpayOrder = await razorpay.orders.create(options);
    const linkedOrder = await EcomOrderInfo.findOneAndUpdate(
      {
        _id: order._id,
        payment_status: "payment_initialized",
        payment_confirmation_source: null,
        $or: [
          { razorpay_order_id: { $exists: false } },
          { razorpay_order_id: null },
        ],
      },
      { $set: { razorpay_order_id: razorpayOrder.id } },
      { new: true }
    );
    if (!linkedOrder) {
      return NextResponse.json({ error: "Unable to link the Razorpay order to checkout" }, { status: 409 });
    }
    
    return NextResponse.json(
      { order: razorpayOrder },
      { status: 200 }
    );

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}