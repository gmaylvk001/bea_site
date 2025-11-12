import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeedbackModel from "@/models/feedback_info";

export async function POST(request) {
  try {
    await dbConnect(); // Ensure DB connection

    const body = await request.json();
    const { name, email_address, mobile_number, invoice_number, products, feedback, city, status } = body;

    // Validate fields
    if (!name || !email_address || !mobile_number || !feedback || !city || !invoice_number || !products) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check for existing contact (optional — usually check email instead of name)
    const existingFeedback = await FeedbackModel.findOne({ email_address });
    if (existingFeedback) {
      return NextResponse.json(
        { success: false, message: "Already You have submited the Feedback" },
        { status: 400 }
      );
    }

    // Create new contact
    const newFeedback = new FeedbackModel({
      name,
      email_address,
      mobile_number,
      invoice_number,
      products,
      feedback,
      city,
      status,
    });

    await newFeedback.save();

    return NextResponse.json(
      { success: true, message: "Your Feedback submited successfully!", data: newFeedback },
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
