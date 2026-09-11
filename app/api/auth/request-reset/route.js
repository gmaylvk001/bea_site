import connectDB from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = body?.email || "";
    const cleanEmail = rawEmail.trim().toLowerCase();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email.", error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    await connectDB();

    // Case-insensitive lookup for user
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email is not registered.", error: "Email is not registered." },
        { status: 400 }
      );
    }

    const userName = user.name || "Customer";
    const targetEmail = user.email || cleanEmail;

    // Generate 6-digit OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous OTP for this email
    await Otp.deleteMany({
      email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    });

    // Save OTP (10 min expiry)
    await Otp.create({
      email: targetEmail,
      otp: otpValue,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send Email via Eygr
    const adminForm = new FormData();
    adminForm.append("campaign_id", "cf9169a3-6c2c-4aa4-b53c-4d0e0dc8e96c");
    adminForm.append("email", targetEmail);
    adminForm.append("params", JSON.stringify([userName, otpValue]));

    const adminresponse = await fetch("https://bea.eygr.in/api/email/send-msg", {
      method: "POST",
      headers: {
        Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
      },
      body: adminForm,
    });

    let adminData = null;
    try {
      adminData = await adminresponse.json();
    } catch (e) {
      console.error("Eygr JSON parse error:", e);
    }

    if (!adminresponse.ok || (adminData && adminData.success === false)) {
      console.error("Eygr delivery error:", adminData || adminresponse.statusText);
      return NextResponse.json(
        {
          success: false,
          message: adminData?.message || adminData?.error || "Failed to deliver OTP email. Please try again later.",
          error: adminData?.message || adminData?.error || "Failed to deliver OTP email.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, message: "OTP sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("request-reset Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
