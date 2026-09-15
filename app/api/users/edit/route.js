import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  await dbConnect();

  try {
    const { userId, name, mobile, email, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const cleanMobile = mobile ? String(mobile).trim() : "";
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanName = name ? String(name).trim() : "";

    // ✅ Validate mobile (10 digits only)
    if (!/^\d{10}$/.test(cleanMobile)) {
      return NextResponse.json({ error: "Mobile number must be exactly 10 digits" }, { status: 400 });
    }

    // ✅ Validate email format
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    // Check if email or mobile already exists for another user
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { mobile: cleanMobile }
      ],
      _id: { $ne: userObjectId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or mobile already exists" },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userObjectId,
      { name: cleanName, mobile: cleanMobile, email: cleanEmail, status },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}