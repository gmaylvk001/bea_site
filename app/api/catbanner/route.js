import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryBanner from "@/models/catbanner";
import Category from "@/models/ecom_category_info";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// ✅ Save File Function with Dimension Validation
async function saveFile(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (err) {
      throw new Error("Invalid image file. Please upload a valid image.");
    }

    if (metadata.width !== 1920 || metadata.height !== 550) {
      throw new Error(
        `Image must be exactly 1920x550 pixels. Your image is ${metadata.width}x${metadata.height} pixels.`
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "catbanner");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = Date.now() + "-" + file.name.replace(/\s/g, "_");
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer).toFile(filepath);

    return "/uploads/catbanner/" + filename;
  } catch (err) {
    console.error("Save file error:", err);
    throw err;
  }
}

// ✅ GET all category banners with category details
export async function GET() {
  try {
    await dbConnect();
    const banners = await CategoryBanner.find({})
      .populate("category", "category_name category_slug")
      .sort({ order: 1 });
    
    return NextResponse.json({ success: true, banners });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ POST add new category banner
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const file = formData.get("banner_image");
    const category_id = formData.get("category_id");
    const status = formData.get("status") || "Active";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!category_id) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if banner already exists for this category
    const existingBanner = await Category.findOne({ category: category_id });
    if (existingBanner) {
      return NextResponse.json(
        { success: false, message: "Banner already exists for this category" },
        { status: 400 }
      );
    }

    let filePath;
    try {
      filePath = await saveFile(file);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }

    // Find max order
    const lastBanner = await CategoryBanner.findOne().sort({ order: -1 });
    const newOrder = lastBanner ? lastBanner.order + 1 : 0;

    const newBanner = new CategoryBanner({
      banner_image: filePath,
      category: category_id,
      status,
      order: newOrder,
    });

    await newBanner.save();
    
    // Get the populated banner
    // const populatedBanner = await CategoryBanner.findById(newBanner._id)
    //   .populate("category", "category_name category_slug");

    return NextResponse.json({ success: true, banner: newBanner });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ PUT update category banner
export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const existingBanner = await CategoryBanner.findById(id);
    if (!existingBanner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    let updateData = { updatedAt: new Date() };

    const category_id = formData.get("category_id");
    if (category_id !== null) {
      // Check if category exists
      const category = await Category.findById(category_id);
      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }
      
      // Check if another banner already uses this category
      const existingCategoryBanner = await CategoryBanner.findOne({
        category: category_id,
        _id: { $ne: id }
      });
      
      if (existingCategoryBanner) {
        return NextResponse.json(
          { success: false, message: "Another banner already uses this category" },
          { status: 400 }
        );
      }
      
      updateData.category = category_id;
    }

    const status = formData.get("status");
    if (status !== null) updateData.status = status;

    const file = formData.get("banner_image");
    if (file && file.size > 0) {
      try {
        const filePath = await saveFile(file);
        updateData.banner_image = filePath;

        if (existingBanner.banner_image) {
          const oldFilePath = path.join(
            process.cwd(),
            "public",
            existingBanner.banner_image
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } catch (err) {
        return NextResponse.json(
          { success: false, message: err.message },
          { status: 400 }
        );
      }
    }

    const updatedBanner = await CategoryBanner.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category", "category_name category_slug");

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ PATCH reorder banners
export async function PATCH(req) {
  try {
    await dbConnect();
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, message: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await CategoryBanner.findByIdAndUpdate(orderedIds[i], { order: i });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE banner
export async function DELETE(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const banner = await CategoryBanner.findById(id);
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    if (banner.banner_image) {
      const filePath = path.join(process.cwd(), "public", banner.banner_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await CategoryBanner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}