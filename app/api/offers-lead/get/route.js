import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferLead from "@/models/ecom_offer_lead_info";

export async function GET() {
  try {
    await dbConnect();
    const offerLeads = await OfferLead.find({}).sort({ createdAt: -1, _id: -1 }).lean();

    return NextResponse.json(
      { success: true, data: offerLeads },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error fetching offer leads:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching offer leads" },
      { status: 500 }
    );
  }
}
