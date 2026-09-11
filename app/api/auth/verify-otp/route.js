import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { email, otp } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").toString().trim();

    if (!cleanEmail || !cleanOtp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required.", error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const otpRecord = await Otp.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
      otp: cleanOtp,
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP.", error: "Invalid OTP." },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired.", error: "OTP expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, message: "Server error.", error: error.message || "Server error." },
      { status: 500 }
    );
  }
}
