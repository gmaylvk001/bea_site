import dbConnect from "@/lib/db";
import CategoryBanner from "@/models/main_cat_products";
import { NextResponse } from "next/server";

// GET: Fetch both top and sub banners in a single request
export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { categorySlug } = params;
    const { searchParams } = new URL(request.url);
    
    console.log('🔍 Fetching banners for categorys:', categorySlug);
    
    if (!categorySlug) {
      return NextResponse.json({ 
        success: false, 
        error: "Category slug is required" 
      }, { status: 400 });
    }
    
    // Get all active banners for this category
    const query = { 
      category_slug: categorySlug,
      banner_status: "Active" 
    };
    
    const banners = await CategoryBanner.find(query)
      .sort({ 
        banner_type: 1, // top first, then sub
        display_order: 1, 
        createdAt: -1 
      });
    
    // Separate top and sub banners
    const topBanners = banners.filter(banner => banner.banner_type === "top");
    const subBanners = banners.filter(banner => banner.banner_type === "sub");
    
    // For top banner, we usually take the first one (highest priority)
    const topBanner = topBanners.length > 0 ? topBanners[0] : null;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        top: topBanner,
        sub: subBanners
      },
      meta: {
        categorySlug,
        totalBanners: banners.length,
        topCount: topBanners.length,
        subCount: subBanners.length
      }
    });
    
  } catch (err) {
    console.error("❌ Fetch category banners error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}