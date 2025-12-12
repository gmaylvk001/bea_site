import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import CategoryBanner from "@/models/category_banner_2";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    console.log("GET /api/category-banner_2: mongoose models:", mongoose.modelNames());

    let docCount = null;
    let collections = [];
    try {
      docCount = await CategoryBanner.countDocuments();
      console.log("GET /api/category-banner_2: CategoryBanner count:", docCount);
    } catch (countErr) {
      console.error("GET /api/category-banner_2: countDocuments error:", countErr.message);
    }

    try {
      if (mongoose.connection && mongoose.connection.db) {
        const cols = await mongoose.connection.db.listCollections().toArray();
        collections = cols.map((c) => c.name);
        console.log("GET /api/category-banner_2: collections:", collections);
      }
    } catch (colErr) {
      console.error("GET /api/category-banner_2: listCollections error:", colErr.message);
    }

    const data = await CategoryBanner.find()
      .populate({
        path: "category_id",
        model: "ecom_category_infos"
      })
      .populate({
        path: "banners.topBanner.featured_products",
        model: "Product",
        select: "name product_name _id" // Select only necessary fields
      });

    // If empty, return diagnostics so client shows reason
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json(
        {
          data: [],
          diagnostics: {
            modelNames: mongoose.modelNames(),
            docCount,
            collections,
            connectionState: mongoose.connection ? mongoose.connection.readyState : null,
          },
        },
        { status: 200 }
      );
    }

    // Return success response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching category banners:", error);

    const diagnostics = {
      modelNames: mongoose.modelNames(),
      connectionState: mongoose.connection ? mongoose.connection.readyState : null,
      details: error.message,
    };

    // Return specific error based on the type
    if (error.name === "CastError") {
      return NextResponse.json({ error: "Invalid ID format in database", diagnostics }, { status: 400 });
    }

    if (error.name === "MongoServerError") {
      return NextResponse.json({ error: "Database connection error", diagnostics }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to fetch category banners", diagnostics }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();

  const form = await req.formData();
  const category_id = form.get("category_id");
  const category_status = form.get("category_status");
  let banners = JSON.parse(form.get("banners"));
banners = JSON.parse(JSON.stringify(banners)); // deep clone so editable


  // ------------------------------
  // Create Upload Folders
  // ------------------------------
  const uploadDirTop = path.join(process.cwd(), "public/category/third/top_banners");
  const uploadDirSub = path.join(process.cwd(), "public/category/third/sub_banners");

  if (!fs.existsSync(uploadDirTop)) fs.mkdirSync(uploadDirTop, { recursive: true });
  if (!fs.existsSync(uploadDirSub)) fs.mkdirSync(uploadDirSub, { recursive: true });

  // ------------------------------
  // Save Banner Files (Fixed Loop)
  // ------------------------------
 for (let idx = 0; idx < banners.length; idx++) {

  const topFile = form.get(`topBanner_${idx}`);

  if (topFile && typeof topFile === "object") {
    const fileName = Date.now() + "_" + topFile.name;
    const filePath = path.join(uploadDirTop, fileName);

    const buffer = Buffer.from(await topFile.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    banners[idx].topBanner.image = `/category/third/top_banners/${fileName}`;
  }

  for (let sIdx = 0; sIdx < banners[idx].subBanners.length; sIdx++) {

    const subFile = form.get(`subBanner_${idx}_${sIdx}`);

    if (subFile && typeof subFile === "object") {
      const fileName = Date.now() + "_" + subFile.name;
      const filePath = path.join(uploadDirSub, fileName);

      const buffer = Buffer.from(await subFile.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      banners[idx].subBanners[sIdx].image =
        `/category/third/sub_banners/${fileName}`;
    }
  }
}


  // ------------------------------
  // Save to MongoDB
  // ------------------------------
 const doc = await CategoryBanner.create({
  category_id,
  category_status,
  banners, // now fully updated
});

 // Populate featured_products before returning
  const populatedDoc = await CategoryBanner.findById(doc._id)
    .populate("category_id")
    .populate("banners.topBanner.featured_products");


   return NextResponse.json({ success: true, data: populatedDoc });
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const body = await req.json();

    const updatedBanner = await CategoryBanner.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("category_id");

    if (!updatedBanner) {
      return NextResponse.json({ message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Banner updated successfully", data: updatedBanner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const deletedBanner = await CategoryBanner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json({ message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

