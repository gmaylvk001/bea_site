import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";
import { redeemTrucoPromotionForOrder } from "@/lib/redeemTrucoPromotionForOrder";

export async function POST(req) {

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const TRUCO_BASE_URL = process.env.TRUCO_BASE_URL;
  const TRUCO_API_KEY = process.env.TRUCO_API_KEY;

  try {
    const body = await req.json();

    if (!TRUCO_BASE_URL || !TRUCO_API_KEY) {
      return NextResponse.json(
        { success: false, message: "Truco config missing in environment" },
        { status: 500 }
      );
    }

    // ACTION 1: VALIDATE

    if (action === "validate") {
      const {
        code,         
        phoneNumber,  
        cartTotal,     
        cartItems,     
        paymentMethod, 
        storeId,      
        channel,      
        city,
        hasOtherOffersApplied,
      } = body;

      
      if (!code || !phoneNumber) {
        return NextResponse.json(
          { success: false, message: "code and phoneNumber are required" },
          { status: 400 }
        );
      }

      const validationPayload = {
        code,
        phoneNumber,
        transactionAmount: cartTotal || 0,
        storeId: storeId || "Online Store",
        channel: channel || "ONLINE",
        ...(paymentMethod ? { paymentMethod } : {}),
        city: city || "",
        cartItems: cartItems || [],
        hasOtherOffersApplied: hasOtherOffersApplied === true,
      };
      const res = await fetch(`${TRUCO_BASE_URL}/Promotion/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": TRUCO_API_KEY,     
        },
        body: JSON.stringify(validationPayload),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

 
    
    if (action === "redeem") {
      const { code, invoiceNumber } = body;
      if (!code || !invoiceNumber) {
        return NextResponse.json(
          { success: false, message: "code and invoiceNumber are required" },
          { status: 400 }
        );
      }

      await dbConnect();
      const order = await EcomOrderInfo.findOne({
        order_number: invoiceNumber,
        promotion_code_applied: code,
        promotion_is_truco: true,
      });
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order with this Truco promotion was not found" },
          { status: 404 }
        );
      }
      if (
        order.payment_status !== "paid" ||
        order.payment_confirmation_source !== (
          ["cash on delivery", "cod"].includes(order.payment_method?.trim().toLowerCase())
            ? "cod_admin"
            : "razorpay"
        ) ||
        !["online", "emi"].includes(order.payment_method?.trim().toLowerCase())
      ) {
        return NextResponse.json(
          { success: false, message: "Truco promotion redemption is available only after successful online or EMI payment" },
          { status: 409 }
        );
      }
      const result = await redeemTrucoPromotionForOrder(order);
      return NextResponse.json(result, { status: result.success ? 200 : result.status === "pending" ? 502 : 400 });
    }

   
    
   
  
    if (action === "status") {
      const { code } = body;

      if (!code) {
        return NextResponse.json(
          { success: false, message: "code required" },
          { status: 400 }
        );
      }

  
     
      const res = await fetch(`${TRUCO_BASE_URL}/Promotion/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": TRUCO_API_KEY,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    
   
    return NextResponse.json(
      { success: false, message: "Invalid action. Use: validate | redeem | status" },
      { status: 400 }
    );

  } catch (error) {

    console.error("Truco promo code error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}