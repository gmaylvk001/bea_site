import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Store from "@/models/store";
import { attachFeaturedProductsToStores } from "@/lib/storesWithFeaturedProducts";

export async function GET() {
  await connectDB();

  try {
    const stores = await Store.find({}).lean();
    const data = await attachFeaturedProductsToStores(stores);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
