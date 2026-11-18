import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SonyCenterLead from "@/models/SonyCenterLead";

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
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { location: searchRegex },
        { message: searchRegex },
      ];
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const leads = await SonyCenterLead.find(query).sort({ createdAt: -1, _id: -1 }).lean();

    // Summary counts
    const totalLeads = await SonyCenterLead.countDocuments({});
    const newLeads = await SonyCenterLead.countDocuments({ status: "new" });
    const contactedLeads = await SonyCenterLead.countDocuments({ status: "contacted" });
    const convertedLeads = await SonyCenterLead.countDocuments({ status: "converted" });

    return NextResponse.json(
      {
        success: true,
        data: leads,
        counts: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          converted: convertedLeads,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Sony Center leads:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching Sony Center leads", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const updated = await SonyCenterLead.findByIdAndUpdate(
      id,
      { status },
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
    console.error("Error updating Sony Center lead:", error);
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

    const deleted = await SonyCenterLead.findByIdAndDelete(id);

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
    console.error("Error deleting Sony Center lead:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting lead", error: error.message },
      { status: 500 }
    );
  }
}
