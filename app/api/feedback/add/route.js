import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FeedbackModel from "@/models/feedback_info";
import Notification from "@/models/Notification";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      email_address,
      mobile_number,
      invoice_number,
      products,
      feedback,
      city,
      status,
    } = body;

    // Validation
    if (!name || !email_address || !mobile_number || !feedback || !city || !invoice_number || !products) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Prevent duplicate feedback
    const existingFeedback = await FeedbackModel.findOne({ email_address });
    if (existingFeedback) {
      return NextResponse.json(
        { success: false, message: "Already you have submitted the feedback" },
        { status: 400 }
      );
    }

    // Save feedback
    const newFeedback = await FeedbackModel.create({
      name,
      email_address,
      mobile_number,
      invoice_number,
      products,
      feedback,
      city,
      status,
    });

    // 🔔 CREATE NOTIFICATION (THIS IS THE KEY PART)
    await Notification.create({
      type: "feedback",
      feedbackId: newFeedback._id,
      message: `New feedback received from ${name}`,
      read: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your feedback submitted successfully!",
        data: newFeedback,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error adding feedback:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
