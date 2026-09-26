import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FreeDeliveryLocation from "@/models/FreeDeliveryLocation";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const countOnly = searchParams.get("countOnly") === "true";
    if (countOnly) {
      const total = await FreeDeliveryLocation.countDocuments({ isActive: true });
      return NextResponse.json({ success: true, count: total });
    }

    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (search) {
      query.$or = [
        { pincode: { $regex: search, $options: "i" } },
        { area: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const [locations, total] = await Promise.all([
      FreeDeliveryLocation.find(query).sort({ district: 1, area: 1, pincode: 1 }).skip(skip).limit(limit).lean(),
      FreeDeliveryLocation.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Free delivery location GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch free delivery locations." },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const res = await FreeDeliveryLocation.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Cleared ${res.deletedCount} free delivery locations.`,
        deletedCount: res.deletedCount,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing location ID." }, { status: 400 });
    }

    await FreeDeliveryLocation.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Location deleted successfully." });
  } catch (error) {
    console.error("Free delivery location DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete." },
      { status: 500 }
    );
  }
}
