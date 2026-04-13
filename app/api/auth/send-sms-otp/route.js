import connectDB from "@/lib/db";
import MobileOtp from "@/models/MobileOtp";
import { sendSMS } from "@/lib/paysendsms";
import { NextResponse } from "next/server";

console.log("🔥 FILE LOADED");

export async function POST(req) {
  try {
    console.log("✅ API HIT");

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mobile } = body;
    console.log("📱 Mobile:", mobile);

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile || !mobileRegex.test(mobile)) {
      return NextResponse.json({ error: "Invalid mobile" }, { status: 400 });
    }

    console.log("🔌 Before DB");
    await connectDB();
    console.log("✅ After DB");

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("🔢 OTP:", otp);

    await MobileOtp.deleteMany({ mobile });
    await MobileOtp.create({
      mobile,
      otp,
      // expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    console.log("📨 Before SMS");
    const smsResult = await sendSMS({ otp, numbers: mobile });
    // return NextResponse.json({ success: true });
    console.log("📨 After SMS", smsResult);

    if (!smsResult.success) {
      return NextResponse.json({ error: smsResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}