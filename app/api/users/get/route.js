import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find().sort({ createdAt: -1 }); // Fetch latest users
    return NextResponse.json(users, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
