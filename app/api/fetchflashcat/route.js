import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import CategoryBanner from "@/models/main_flash_banner";
import { NextResponse } from "next/server";

function slugFromRedirect(url = "") {
  const raw = String(url || "").trim();
  if (!raw || raw === "#") return "";
  try {
    const path = raw.startsWith("http")
      ? new URL(raw).pathname
      : raw.split("?")[0];
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug');
    
    console.log('🔍 Fetching banners for category slug:', categorySlug);
    
    let query = { banner_status: "Active" };
    
    // If categorySlug is provided, filter by exact category slug match
    if (categorySlug && categorySlug !== 'null' && categorySlug !== 'undefined') {
      query.category_slug = categorySlug;
    }

    console.log('📋 Query:', query);

    // Fetch category banners with category info, sorted by display order
    const banners = await CategoryBanner.find(query)
      .populate('category_id', 'category_name category_slug status')
      .sort({ display_order: 1, createdAt: -1 });

    const redirectSlugs = [
      ...new Set(banners.map((b) => slugFromRedirect(b.redirect_url)).filter(Boolean)),
    ];
    let inactiveSlugs = new Set();
    if (redirectSlugs.length > 0) {
      const inactiveCats = await Category.find({
        category_slug: { $in: redirectSlugs },
        status: "Inactive",
      })
        .select("category_slug")
        .lean();
      inactiveSlugs = new Set(inactiveCats.map((c) => c.category_slug));
    }

    const visibleBanners = banners.filter((banner) => {
      const parentStatus = banner.category_id?.status;
      if (parentStatus && String(parentStatus) === "Inactive") return false;
      const destSlug = slugFromRedirect(banner.redirect_url);
      if (destSlug && inactiveSlugs.has(destSlug)) return false;
      return true;
    });
    
    console.log('🎯 Found banners:', visibleBanners.length);
    
    return NextResponse.json({ 
      success: true, 
      banners: visibleBanners 
    });
  } catch (err) {
    console.error("Fetch category banners errors:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    });
  }
}