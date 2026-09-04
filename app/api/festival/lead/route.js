import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FestivalLead from "@/models/festivalLead";

// POST: Save lead from right side form
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { fullName, email, phone, city } = body;

    if (!fullName || !email || !phone || !city) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const lead = await FestivalLead.create({
      fullName,
      email,
      phone,
      city,
      sourcePage: "/festival",
    });

    return NextResponse.json({
      success: true,
      message: "Lead submitted successfully!",
      lead,
    });
  } catch (err) {
    console.error("POST /api/festival/lead error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// GET: Retrieve all leads for admin
export async function GET() {
  try {
    await dbConnect();
    const leads = await FestivalLead.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, leads });
  } catch (err) {
    console.error("GET /api/festival/lead error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
