import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    // 1. Extract token from Authorization header or cookies
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    let token = null;

    if (authHeader) {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();
    }

    if (!token && req.cookies) {
      token = req.cookies.get("token")?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    // 2. Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded?.userId || decoded?.id || decoded?._id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token payload" },
        { status: 401 }
      );
    }

    await dbConnect();

    // 3. Verify user exists and is an active administrator
    const requester = await User.findById(userId).select("user_type status");
    if (!requester || requester.user_type !== "admin" || requester.status === "Inactive") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 4. Fetch users excluding passwords
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error in /api/users/get:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
