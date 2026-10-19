import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/product";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const ids = searchParams.get("ids") || "";

    // If specific comma-separated IDs are requested (e.g., to fetch selected products)
    if (ids) {
      const idArray = ids.split(",").filter((id) => /^[0-9a-fA-F]{24}$/.test(id.trim()));
      const products = await Product.find({ _id: { $in: idArray } })
        .select("_id name item_code price special_price quantity stock_status images slug")
        .lean();
      return NextResponse.json({ success: true, products });
    }

    const filter = { status: "Active" };
    if (query.trim()) {
      filter.$or = [
        { name: { $regex: query.trim(), $options: "i" } },
        { item_code: { $regex: query.trim(), $options: "i" } },
        { model_number: { $regex: query.trim(), $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .select("_id name item_code price special_price quantity stock_status images slug")
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Search products error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
