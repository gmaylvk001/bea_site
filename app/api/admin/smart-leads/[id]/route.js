import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import SmartLead from "@/models/smartLead";
import User from "@/models/User";
import { buildSalesCardSummary } from "@/lib/smartLead/leadContext.js";

/**
 * GET /api/admin/smart-leads/:id
 */
export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid lead id" }, { status: 400 });
    }

    const lead = await SmartLead.findById(id)
      .populate({
        path: "assignedStaff",
        model: User,
        select: "name email mobile",
      })
      .lean();

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error("GET /api/admin/smart-leads/:id", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/smart-leads/:id
 * Sales fields only — does not recreate leads.
 */
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid lead id" }, { status: 400 });
    }

    const body = await req.json();
    const allowedStatuses = [
      "new",
      "open",
      "contacted",
      "follow_up",
      "converted",
      "closed",
      "lost",
    ];

    const $set = {};
    if (body.status !== undefined && allowedStatuses.includes(body.status)) {
      $set.status = body.status;
    }
    if (body.contacted !== undefined) {
      $set.contacted = Boolean(body.contacted);
      if (body.contacted) $set.contactedAt = new Date();
    }
    if (body.conversion !== undefined) {
      $set.conversion = Boolean(body.conversion);
      if (body.conversion) {
        $set.convertedAt = new Date();
        $set.status = $set.status || "converted";
      }
    }
    if (body.followUpDate !== undefined) {
      $set.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    }
    if (body.assignedStaff !== undefined) {
      $set.assignedStaff =
        body.assignedStaff && mongoose.Types.ObjectId.isValid(body.assignedStaff)
          ? body.assignedStaff
          : null;
    }
    if (body.invoiceRef !== undefined) {
      $set.invoiceRef = String(body.invoiceRef || "").slice(0, 120);
    }
    if (body.saleValue !== undefined) {
      const n = Number(body.saleValue);
      $set.saleValue = Number.isFinite(n) ? n : null;
    }
    if (body.salesNotes !== undefined) {
      $set.salesNotes = String(body.salesNotes || "").slice(0, 2000);
    }
    if (body.whatsappClicked !== undefined) {
      $set.whatsappClicked = Boolean(body.whatsappClicked);
    }

    if (!Object.keys($set).length) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const lead = await SmartLead.findByIdAndUpdate(id, { $set }, { new: true })
      .populate({
        path: "assignedStaff",
        model: User,
        select: "name email mobile",
      })
      .lean();

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...lead,
        _id: String(lead._id),
        salesCard: buildSalesCardSummary(lead),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/smart-leads/:id", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}
