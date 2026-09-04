import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopBanner from "@/models/topbanner";
import FlashSale from "@/models/flashsale";
import HomeSection from "@/models/homeSection";
import Brand from "@/models/ecom_brand_info";
import VideoCard from "@/models/VideoCard";

// Server-side in-memory cache
let cachedHomeData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url || "http://localhost/api/home-data");
    const forceRefresh = searchParams.get("refresh") === "true";

    if (!forceRefresh && cachedHomeData && (Date.now() - cacheTimestamp < CACHE_TTL_MS)) {
      return NextResponse.json(cachedHomeData, { status: 200 });
    }

    await dbConnect();

    // Fetch all active homepage sections in 1 parallel bulk execution
    const activeQuery = { $or: [{ status: { $regex: /^active$/i } }, { status: { $exists: false } }, { status: null }] };

    const [banners, flashSales, homeSections, brands, videoCards] = await Promise.all([
      TopBanner.find(activeQuery).sort({ order: 1 }).lean().catch(() => []),
      FlashSale.find(activeQuery).sort({ order: 1 }).lean().catch(() => []),
      HomeSection.find(activeQuery).sort({ position: 1 }).lean().catch(() => []),
      Brand.find({}).lean().catch(() => []),
      VideoCard.find({}).lean().catch(() => []),
    ]);

    const result = {
      success: true,
      banners: banners || [],
      flashSales: flashSales || [],
      homeSections: homeSections || [],
      brands: brands || [],
      videoCards: videoCards || [],
    };

    cachedHomeData = result;
    cacheTimestamp = Date.now();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Home data GET error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch home data" },
      { status: 500 }
    );
  }
}
