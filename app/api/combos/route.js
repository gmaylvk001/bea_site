import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ComboProduct from "@/models/ComboProduct";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    const combos = await ComboProduct.find({ status: "Active" })
      .populate("products", "name price special_price images item_code quantity stock_status brand model_number")
      .lean();

    // Map each combo with its server-computed status
    const mappedCombos = combos.map((combo) => {
      const start = new Date(combo.offer_start);
      const end = new Date(combo.offer_end);

      let offerStatus = "active";
      if (now < start) {
        offerStatus = "upcoming";
      } else if (now > end) {
        offerStatus = "expired";
      }

      return {
        ...combo,
        offerStatus, // "active", "upcoming", "expired"
        serverTime: now.toISOString(),
      };
    });

    // Sort order: active first, then upcoming, then expired
    const priority = { active: 1, upcoming: 2, expired: 3 };
    mappedCombos.sort((a, b) => {
      if (priority[a.offerStatus] !== priority[b.offerStatus]) {
        return priority[a.offerStatus] - priority[b.offerStatus];
      }
      if (a.offerStatus === "active") {
        // active ending soonest first
        return new Date(a.offer_end) - new Date(b.offer_end);
      }
      if (a.offerStatus === "upcoming") {
        // upcoming starting soonest first
        return new Date(a.offer_start) - new Date(b.offer_start);
      }
      // expired most recently expired first
      return new Date(b.offer_end) - new Date(a.offer_end);
    });

    return NextResponse.json({
      success: true,
      serverTime: now.toISOString(),
      combos: mappedCombos,
    });
  } catch (error) {
    console.error("GET public combos error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
