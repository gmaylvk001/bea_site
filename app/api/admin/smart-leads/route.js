import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SmartLead from "@/models/smartLead";
import User from "@/models/User";
import { buildSalesCardSummary } from "@/lib/smartLead/leadContext.js";

/**
 * GET /api/admin/smart-leads
 * Sales team list — newest first.
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { mobile: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { categoryName: { $regex: q, $options: "i" } },
        { brandName: { $regex: q, $options: "i" } },
        { modelNumber: { $regex: q, $options: "i" } },
        { itemCode: { $regex: q, $options: "i" } },
      ];
    }

    const [total, rows] = await Promise.all([
      SmartLead.countDocuments(filter),
      SmartLead.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "assignedStaff",
          model: User,
          select: "name email mobile",
        })
        .lean(),
    ]);

    const data = rows.map((lead) => ({
      ...lead,
      _id: String(lead._id),
      assignedStaff: lead.assignedStaff
        ? {
            _id: String(lead.assignedStaff._id),
            name: lead.assignedStaff.name,
            email: lead.assignedStaff.email,
            mobile: lead.assignedStaff.mobile,
          }
        : null,
      salesCard: buildSalesCardSummary(lead),
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("GET /api/admin/smart-leads", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list leads" },
      { status: 500 }
    );
  }
}
