import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import LiveDemoLead from "@/models/LiveDemoLead";

export async function GET(request) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "All";
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { category: searchRegex },
        { requirement: searchRegex },
        { connectMethod: searchRegex },
        { additionalInfo: searchRegex },
      ];
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const leads = await LiveDemoLead.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    // Summary counts
    const totalLeads = await LiveDemoLead.countDocuments({});
    const newLeads = await LiveDemoLead.countDocuments({ status: "new" });
    const contactedLeads = await LiveDemoLead.countDocuments({ status: "contacted" });
    const scheduledLeads = await LiveDemoLead.countDocuments({ status: "scheduled" });
    const completedLeads = await LiveDemoLead.countDocuments({ status: "completed" });
    const cancelledLeads = await LiveDemoLead.countDocuments({ status: "cancelled" });

    return NextResponse.json(
      {
        success: true,
        data: leads,
        counts: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          scheduled: scheduledLeads,
          completed: completedLeads,
          cancelled: cancelledLeads,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching live demo leads:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching live demo leads",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await LiveDemoLead.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead updated successfully", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating live demo lead:", error);
    return NextResponse.json(
      { success: false, message: "Error updating lead", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const deleted = await LiveDemoLead.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting live demo lead:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting lead", error: error.message },
      { status: 500 }
    );
  }
}
