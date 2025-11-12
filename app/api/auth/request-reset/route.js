import connectDB from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Email is not registered." },
        { status: 404 }
      );
    }

    // Generate OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous OTP for this email
    await Otp.deleteMany({ email });

    // Save OTP
    const otpinsert = await Otp.create({
      email,
      otp: otpValue,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    });

    console.log(otpinsert);
    // Send Email
   const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // 🚩 add this line
  },
});
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP",
      text: `Your OTP is ${otpValue}. It expires in 10 minutes.`,
    });


    return NextResponse.json(
      { message: "OTP sent to your email." },
      { status: 200 }
    );

  } catch (error) {
    console.error("request-reset Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
