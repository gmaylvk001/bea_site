// app/api/products/related/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // your DB connection
import Product from "@/models/product";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category"); // category ID
    const excludeId = searchParams.get("exclude"); // optional product to exclude
    const limit = parseInt(searchParams.get("limit")) || 5; // default 5

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is requiredd" }, { status: 400 });
    }

    const query = { category: categoryId };
    if (excludeId) query._id = { $ne: excludeId }; // exclude current product

    const relatedProducts = await Product.find(query)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest products first

    return NextResponse.json({
  success: true,
  products: relatedProducts, // ✅ match frontend expectation
});

  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
