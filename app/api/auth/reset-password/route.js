import connectDB from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { email, otp, newPassword } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").toString().trim();

    if (!cleanEmail || !cleanOtp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required.", error: "All fields are required." },
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

    // Find user with case-insensitive email
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found.", error: "User not found." },
        { status: 400 }
      );
    }

    // Hash password and save
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Remove OTP
    await Otp.deleteMany({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Server error.", error: error.message || "Server error." },
      { status: 500 }
    );
  }
}
