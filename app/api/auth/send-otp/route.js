import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/otpService.mjs"; // Use the new .mjs file

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, mobile } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { error: "Email or mobile is required" },
        { status: 400 }
      );
    }

    const result = await sendOtp({ email, mobile, type: "password_reset" });

    return NextResponse.json({
      message: `OTP sent successfully via ${result.method}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
