import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import CategoryBrandBanner from "@/models/category_brand_banner";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/category-brand-banners");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("categorySlug");
    const brandSlug = searchParams.get("brandSlug");
    const admin = searchParams.get("admin") === "1";

    const query = {};
    if (!admin) query.banner_status = "Active";
    if (categorySlug) query.category_slug = categorySlug;
    if (brandSlug) query.brand_slug = brandSlug;

    const banners = await CategoryBrandBanner.find(query)
      .populate("category_id", "category_name category_slug")
      .populate("brand_id", "brand_name brand_slug")
      .sort({ display_order: 1, createdAt: -1 });

    return NextResponse.json({ success: true, banners });
  } catch (err) {
    console.error("Category brand banner GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();

    const bannerId = formData.get("bannerId");
    const categoryId = formData.get("categoryId");
    const brandId = formData.get("brandId");
    const banner_name = String(formData.get("banner_name") || "").trim();
    const redirect_url = String(formData.get("redirect_url") || "").trim();
    const banner_status = formData.get("banner_status") || "Active";
    const display_order = formData.get("display_order") || 0;
    const bannerFile = formData.get("bannerImage");

    if (!banner_name) {
      return NextResponse.json({ success: false, error: "Banner name is required" });
    }

    let bannerImagePath = null;
    if (bannerFile && typeof bannerFile === "object" && bannerFile.size > 0) {
      if (bannerFile.size > 4 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: "File size too large. Maximum size is 4MB.",
        });
      }
      ensureDir(UPLOAD_DIR);
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const filename = `cat-brand-banner-${Date.now()}-${String(bannerFile.name || "image").replace(/\s+/g, "-")}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
      bannerImagePath = `/uploads/category-brand-banners/${filename}`;
    }

    if (bannerId) {
      const banner = await CategoryBrandBanner.findById(bannerId);
      if (!banner) {
        return NextResponse.json({ success: false, error: "Banner not found" });
      }

      banner.banner_name = banner_name;
      banner.redirect_url = redirect_url;
      banner.banner_status = banner_status;
      banner.display_order = parseInt(display_order, 10) || 0;

      if (bannerImagePath) {
        if (banner.banner_image) {
          const oldPath = path.join(process.cwd(), "public", banner.banner_image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        banner.banner_image = bannerImagePath;
      }

      await banner.save();
      return NextResponse.json({
        success: true,
        banner,
        message: "Banner updated successfully",
      });
    }

    if (!categoryId || !brandId) {
      return NextResponse.json({
        success: false,
        error: "Parent category and brand are required",
      });
    }
    if (!bannerImagePath) {
      return NextResponse.json({
        success: false,
        error: "Banner image is required for a new banner",
      });
    }

    const category = await Category.findById(categoryId);
    const brand = await Brand.findById(brandId);
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" });
    }
    if (!brand) {
      return NextResponse.json({ success: false, error: "Brand not found" });
    }

    const banner = await CategoryBrandBanner.create({
      category_id: category._id,
      category_name: category.category_name,
      category_slug: category.category_slug,
      brand_id: brand._id,
      brand_name: brand.brand_name,
      brand_slug: brand.brand_slug,
      banner_name,
      banner_image: bannerImagePath,
      redirect_url,
      banner_status,
      display_order: parseInt(display_order, 10) || 0,
    });

    return NextResponse.json({
      success: true,
      banner,
      message: "Banner created successfully",
    });
  } catch (err) {
    console.error("Category brand banner POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { bannerId, display_order } = body;
    if (!bannerId) {
      return NextResponse.json({ success: false, error: "Banner ID is required" });
    }

    const banner = await CategoryBrandBanner.findByIdAndUpdate(
      bannerId,
      { display_order: parseInt(display_order, 10) || 0 },
      { new: true }
    );
    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner not found" });
    }

    return NextResponse.json({
      success: true,
      message: "Display order updated successfully",
      banner,
    });
  } catch (err) {
    console.error("Category brand banner PATCH error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { bannerId } = body;
    if (!bannerId) {
      return NextResponse.json({ success: false, error: "Banner ID is required" });
    }

    const banner = await CategoryBrandBanner.findById(bannerId);
    if (!banner) {
      return NextResponse.json({ success: false, error: "Banner not found" });
    }

    if (banner.banner_image) {
      const imagePath = path.join(process.cwd(), "public", banner.banner_image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await CategoryBrandBanner.findByIdAndDelete(bannerId);
    return NextResponse.json({ success: true, message: "Banner deleted successfully" });
  } catch (err) {
    console.error("Category brand banner DELETE error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
