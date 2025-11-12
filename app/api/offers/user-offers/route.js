import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Offer from "@/models/ecom_offer_info";
import Product from "@/models/product";
import User from "@/models/User";
import { getServerSession } from "next-auth"; // If using NextAuth
import { authOptions } from "@/lib/auth"; // Your NextAuth config

export async function GET() {
  try {
    await connectDB();

    // ✅ Get logged-in user from session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    // ✅ Find active offers where selected_users contains this user
    const offer = await Offer.findOne({
      fest_offer_status: "active",
      selected_users: user._id, // Match logged-in user
    });

    if (!offer || !offer.offer_product?.length) {
      return NextResponse.json({ success: false, message: "No offer for you" });
    }

    // ✅ Fetch matching products
    const products = await Product.find({ _id: { $in: offer.offer_product } });

    return NextResponse.json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching offer products:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch offer products" }, { status: 500 });
  }
}
