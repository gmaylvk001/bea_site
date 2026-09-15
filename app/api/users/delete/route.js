import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function DELETE(req) {
  await dbConnect();

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const deletedUser = await User.findByIdAndDelete(userObjectId);
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted permanently" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}