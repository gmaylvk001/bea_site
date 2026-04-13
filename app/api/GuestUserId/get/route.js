import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mobile } = body;

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile || !mobileRegex.test(mobile)) {
      return NextResponse.json({ error: "Invalid mobile" }, { status: 400 });
    }

    await connectDB();

    // ✅ ONLY FIND USER
    const user = await User.findOne({ mobile });

    // ❌ If not found
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ If found → return ID
    return NextResponse.json({
      success: true,
      userId: user._id,
      mobile: user.mobile,
    });

  } catch (error) {
    console.error("❌ ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}