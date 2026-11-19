import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeLead from "@/models/ExchangeLead";
import Notification from "@/models/Notification";

// POST: Submit a new exchange lead from the product page
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      name,
      mobile_number,
      email,
      location,
      old_brand_model,
      appliance_age,
      working_condition,
      remarks,
      product_id,
      product_name,
      product_slug,
      product_sku,
      product_price,
      product_image,
      product_url,
    } = body;

    // Validation
    const cleanName = (name || "").trim();
    const cleanPhone = (mobile_number || "").toString().replace(/\D/g, "");
    const cleanLocation = (location || "").trim();
    const cleanProductName = (product_name || "").trim();

    if (!cleanName) {
      return NextResponse.json(
        { success: false, message: "Please provide your name" },
        { status: 400 }
      );
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (!cleanLocation) {
      return NextResponse.json(
        { success: false, message: "Please provide your city or pincode" },
        { status: 400 }
      );
    }

    if (!cleanProductName) {
      return NextResponse.json(
        { success: false, message: "Product details are missing" },
        { status: 400 }
      );
    }

    const newLead = await ExchangeLead.create({
      name: cleanName,
      mobile_number: cleanPhone,
      email: (email || "").trim(),
      location: cleanLocation,
      old_brand_model: (old_brand_model || "").trim(),
      appliance_age: (appliance_age || "").trim(),
      working_condition: working_condition || "working",
      remarks: (remarks || "").trim(),
      product_id: product_id || null,
      product_name: cleanProductName,
      product_slug: (product_slug || "").trim(),
      product_sku: (product_sku || "").trim(),
      product_price: Number(product_price) || 0,
      product_image: (product_image || "").trim(),
      product_url: (product_url || "").trim(),
      status: "new",
      source: "Product Page Exchange Section",
    });

    // Create Admin Notification (non-blocking)
    try {
      if (Notification) {
        await Notification.create({
          type: "exchange_lead",
          message: `New Exchange Inquiry: ${cleanName} (${cleanPhone}) for ${cleanProductName.slice(0, 35)}...`,
          read: false,
        });
      }
    } catch (notifErr) {
      console.warn("Notification creation skipped:", notifErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Exchange enquiry submitted successfully. Our executive will contact you shortly with the best quote.",
        data: {
          id: newLead._id,
          name: newLead.name,
          createdAt: newLead.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exchange lead:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error occurred while submitting exchange inquiry",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET: Admin retrieves exchange leads
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

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { mobile_number: searchRegex },
        { email: searchRegex },
        { location: searchRegex },
        { old_brand_model: searchRegex },
        { product_name: searchRegex },
        { product_sku: searchRegex },
      ];
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const leads = await ExchangeLead.find(query).sort({ createdAt: -1, _id: -1 }).lean();

    // Summary counts
    const totalCount = await ExchangeLead.countDocuments({});
    const newCount = await ExchangeLead.countDocuments({ status: "new" });
    const contactedCount = await ExchangeLead.countDocuments({ status: "contacted" });
    const quotedCount = await ExchangeLead.countDocuments({ status: "quoted" });
    const convertedCount = await ExchangeLead.countDocuments({ status: "converted" });

    return NextResponse.json(
      {
        success: true,
        data: leads,
        counts: {
          total: totalCount,
          new: newCount,
          contacted: contactedCount,
          quoted: quotedCount,
          converted: convertedCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching exchange leads:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching exchange leads", error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Admin updates status or notes
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Lead ID is required" },
        { status: 400 }
      );
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (typeof admin_notes === "string") updateFields.admin_notes = admin_notes;

    const updated = await ExchangeLead.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Exchange lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead updated successfully", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating exchange lead:", error);
    return NextResponse.json(
      { success: false, message: "Error updating lead", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Admin deletes an exchange lead
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

    const deleted = await ExchangeLead.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Exchange lead deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting exchange lead:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting lead", error: error.message },
      { status: 500 }
    );
  }
}
