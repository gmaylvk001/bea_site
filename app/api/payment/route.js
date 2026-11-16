import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Payment from "@/models/ecom_payment_info";
import EcomOrderInfo from "@/models/ecom_order_info";

export async function POST(req) {
  try {
    // Parse JSON body instead of formData
    const body = await req.json();
    
    const userId = body.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const modevalue = body.modevalue || undefined;
    const payment_Date = body.payment_Date || undefined;
    const payment_id = body.payment_id || undefined;
    let status = body.status || undefined;
    const payment_mode = body.payment_mode || undefined;

    await connectDB();

    if (String(status || "").toLowerCase() === "paid") {
      if (!body.order_number || !payment_id) {
        return NextResponse.json({ error: "Verified order number and payment ID are required" }, { status: 400 });
      }
      const verifiedOrder = await EcomOrderInfo.findOne({
        order_number: body.order_number,
        user_id: userId,
        payment_id,
        payment_status: "paid",
        payment_confirmation_source: "razorpay",
      });
      if (!verifiedOrder) {
        return NextResponse.json({ error: "Payment has not been verified for this order" }, { status: 409 });
      }
      status = verifiedOrder.payment_status;
    } else {
      status = "pending";
    }
    
    const paymentData = new Payment({
      userId: userId,
      modevalue: modevalue,
      payment_id: payment_id,
      payment_Date: payment_Date,
      payment_mode: payment_mode,
      status: status,
    });
    
    await paymentData.save();

    return NextResponse.json(
      { 
        message: "Payment saved successfully", 
        paymentData: paymentData 
      },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}