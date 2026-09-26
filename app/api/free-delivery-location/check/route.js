import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FreeDeliveryLocation from "@/models/FreeDeliveryLocation";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const rawPin = searchParams.get("pincode") || "";
    const pincode = rawPin.replace(/\s+/g, "").trim();

    if (!pincode) {
      return NextResponse.json(
        { success: false, isFreeDelivery: false, error: "Pincode is required." },
        { status: 400 }
      );
    }

    const numericPin = Number(pincode);
    const pinQueries = [{ pincode: pincode }];
    if (!Number.isNaN(numericPin)) {
      pinQueries.push({ pincode: numericPin });
    }

    const matches = await FreeDeliveryLocation.find({
      $or: pinQueries,
      isActive: true,
    }).lean();

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        isFreeDelivery: false,
        message: "Free delivery is not available for this pincode.",
        pincode,
      });
    }

    return NextResponse.json({
      success: true,
      isFreeDelivery: true,
      message: "Free delivery available for this pincode!",
      pincode,
      locations: matches.map((m) => ({
        area: m.area,
        district: m.district,
      })),
    });
  } catch (error) {
    console.error("Free delivery check error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check free delivery." },
      { status: 500 }
    );
  }
}
