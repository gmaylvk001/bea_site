import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OutOfStockEnquiry from "@/models/OutOfStockEnquiry";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await req.json();

    const updateFields = {};
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.adminNotes !== undefined) updateFields.adminNotes = body.adminNotes;

    const updated = await OutOfStockEnquiry.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/product/out-of-stock-enquiry/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update enquiry" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const deleted = await OutOfStockEnquiry.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/product/out-of-stock-enquiry/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete enquiry" },
      { status: 500 }
    );
  }
}
