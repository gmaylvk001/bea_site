// app/api/wishlist/get/route.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import connectDB from "@/lib/db";
import Wishlist from "@/models/ecom_wishlist_info";
import Product from "@/models/product";

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ items: [] });

    const { userId } = verifyToken(token);
    await connectDB();

    const wishlist = await Wishlist.find({ userId }).populate("productId");

    const items = wishlist .filter((entry) => entry.productId)
  .map((entry) => {
      const product = entry.productId;
      return {
        id: entry._id,
        productId: product._id,
        name: product.name,
        image: product.images[0] || "/placeholder.jpg", // fallback if no image
        price: product.special_price > 0 ? product.special_price : product.price,
        rating: 4.5, // Default or calculate dynamically if needed
        reviews: 50, // Same here
        tags: [product.brand, product.category],
        stockStatus: product.stock_status,
        quantity: product.quantity || 0,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Wishlist fetch error", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
