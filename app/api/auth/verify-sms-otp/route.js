import connectDB from "@/lib/db";
import MobileOtp from "@/models/MobileOtp";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { mobile, otp } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: "Mobile and OTP are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const record = await MobileOtp.findOne({ mobile, otp });

    if (!record) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    if (record.expiresAt < new Date()) {
      await MobileOtp.deleteOne({ mobile });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Delete OTP after successful verification
    await MobileOtp.deleteOne({ mobile });

    // Create a guest JWT token (no account needed)
    const token = jwt.sign(
      {
        isGuest: true,
        mobile,
        name: "Guest",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json(
      {
        message: "OTP verified successfully.",
        token,
        user: { name: "Guest", mobile, isGuest: true },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("verify-sms-otp error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
