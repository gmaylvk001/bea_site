import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  await dbConnect();

  try {
    const { userId, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const user = await User.findById(userObjectId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newStatus = status || (user.status === "Active" ? "Inactive" : "Active");
    user.status = newStatus;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User status changed to ${newStatus} successfully`,
      status: newStatus,
      user,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
