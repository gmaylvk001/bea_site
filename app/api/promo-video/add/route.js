import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ContactModel from "@/models/ecom_promo_video_info";
import Notification from "@/models/Notification";

export async function POST(request) {
  try {
    await dbConnect(); // Ensure DB connection

    const body = await request.json();
    const { name, email_address, mobile_number, product, city, status } = body;

    // Validate fields
    if (!name || !email_address || !mobile_number || !product || !city) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for existing contact (optional — usually check email instead of name)
    const existingContact = await ContactModel.findOne({ email_address });
    if (existingContact) {
      return NextResponse.json(
        { success: false, message: "This already exists" },
        { status: 400 }
      );
    }

     // Create new contact
    const newContact = await ContactModel.create({
      name,
      email_address,
      mobile_number,
      product,
      city,
      status,
    });

   // 🔔 CREATE NOTIFICATION (THIS IS THE KEY PART)
    await Notification.create({
      type: "contact",
      contactId: newContact._id,
      message: `New Data received from ${name}`,
      read: false,
    });


    return NextResponse.json(
      { success: true, message: "Added successfully", data: newContact },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
