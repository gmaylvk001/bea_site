import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OutOfStockEnquiry from "@/models/OutOfStockEnquiry";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      fullName,
      phone,
      email,
      city,
      requirement,
      productId,
      productName,
      productSlug,
      itemCode,
      price,
      specialPrice,
      productImage,
      brand,
      action,
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, message: "Name and Mobile number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.toString().trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const enquiry = await OutOfStockEnquiry.create({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : "",
      city: city ? city.trim() : "",
      requirement: requirement ? requirement.trim() : "",
      productId: productId || null,
      productName: productName || "",
      productSlug: productSlug || "",
      itemCode: itemCode || "",
      price: Number(price) || 0,
      specialPrice: Number(specialPrice) || 0,
      productImage: productImage || "",
      brand: brand || "",
      action: action || "add_to_cart",
      status: "New",
    });

    return NextResponse.json({
      success: true,
      message: "Enquiry submitted successfully!",
      enquiry,
    });
  } catch (error) {
    console.error("POST /api/product/out-of-stock-enquiry error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));
    const status = searchParams.get("status") || "";
    const q = (searchParams.get("q") || "").trim();

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { fullName: regex },
        { phone: regex },
        { email: regex },
        { city: regex },
        { productName: regex },
        { itemCode: regex },
        { brand: regex },
      ];
    }

    const skip = (page - 1) * limit;
    const [enquiries, total] = await Promise.all([
      OutOfStockEnquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OutOfStockEnquiry.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("GET /api/product/out-of-stock-enquiry error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}
