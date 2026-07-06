import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Store from "@/models/store";
import { attachFeaturedProductsToStores } from "@/lib/storesWithFeaturedProducts";

export async function GET(request, context) {
  const { storeId } = await context.params;

  if (!storeId) {
    return NextResponse.json(
      { success: false, error: "Store id or slug is required." },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    const query = mongoose.Types.ObjectId.isValid(storeId)
      ? { $or: [{ _id: storeId }, { slug: storeId }] }
      : { slug: storeId };

    const store = await Store.findOne(query).lean();

    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    const [data] = await attachFeaturedProductsToStores([store]);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch store" },
      { status: 500 }
    );
  }
}
