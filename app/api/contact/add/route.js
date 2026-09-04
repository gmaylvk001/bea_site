import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ContactModel from "@/models/ecom_contact_info";
import Notification from "@/models/Notification";
import { appendToContactSheet } from "@/lib/googleSheets";

export async function POST(request) {
  try {
    await dbConnect(); // Ensure DB connection

    const body = await request.json();
    const { name, email_address, mobile_number, message, city, status, _hp } = body;

    // Honeypot check — bots fill this hidden field, humans don't
    if (_hp) {
      return NextResponse.json({ success: false, message: "Spam detected" }, { status: 400 });
    }

    // Validate fields
    if (!name || !email_address || !mobile_number || !message || !city) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate phone number (extract digits)
    const digitsPhone = mobile_number.replace(/\D/g, "");
    if (digitsPhone.length < 10) {
      return NextResponse.json({ success: false, message: "Please enter a valid 10-digit phone number" }, { status: 400 });
    }

    // Create new contact
    const finalStatus = (status || "active").toLowerCase();
    const newContact = await ContactModel.create({
      name: name.trim(),
      email_address: email_address.trim(),
      mobile_number: digitsPhone,
      message: message.trim(),
      city: city.trim(),
      status: finalStatus === "inactive" ? "inactive" : "active",
    });

    // 🔔 CREATE NOTIFICATION (safely wrapped so it doesn't fail contact creation)
    try {
      await Notification.create({
        type: "contact",
        contactId: newContact._id,
        message: `New contact received from ${name}`,
        read: false,
      });
    } catch (notifErr) {
      console.error("Notification creation failed:", notifErr.message);
    }

    // 📊 APPEND TO GOOGLE SHEET (non-blocking)
    appendToContactSheet(newContact).catch((err) =>
      console.error("Google Sheets append failed:", err.message)
    );

    return NextResponse.json(
      { success: true, message: "Contact added successfully", data: newContact },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit contact request" },
      { status: 500 }
    );
  }
}
