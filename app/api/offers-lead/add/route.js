import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferLead from "@/models/ecom_offer_lead_info";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name = "",
      email_address = "",
      mobile_number = "",
      message = "",
      city = "",
      category = "",
      _hp,
    } = body;

    if (_hp) {
      return NextResponse.json(
        { success: false, message: "Spam detected" },
        { status: 400 }
      );
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email_address).trim();
    const normalizedPhone = String(mobile_number).replace(/\D/g, "");
    const normalizedMessage = String(message).trim();
    const normalizedCity = String(city).trim();
    const normalizedCategory = String(category).trim();

    if (!normalizedName || !normalizedPhone || !normalizedMessage || !normalizedCity) {
      return NextResponse.json(
        { success: false, message: "Name, phone, message, and city are required" },
        { status: 400 }
      );
    }

    if (normalizedPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const offerLead = await OfferLead.create({
      name: normalizedName,
      email_address: normalizedEmail,
      mobile_number: normalizedPhone,
      message: normalizedMessage,
      city: normalizedCity,
      category: normalizedCategory,
      status: "active",
    });

    return NextResponse.json(
      { success: true, message: "Offer enquiry submitted successfully", data: offerLead },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding offer lead:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit offer enquiry" },
      { status: 500 }
    );
  }
}
