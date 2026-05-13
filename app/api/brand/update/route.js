import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// app/api/brand/update/route.js

export async function PUT(req) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const id = formData.get("id");
    const brand_name = formData.get("brand_name");
    const status = formData.get("status");
    const image = formData.get("image");

    // Validate
    if (!id || !brand_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Find brand
    const existingBrand = await Brand.findById(id);

    if (!existingBrand) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand not found",
        },
        { status: 404 }
      );
    }

    // Default existing image
    let imagePath = existingBrand.image;

    // If new image uploaded
    if (image && image.name) {

      /* =========================
         DELETE OLD IMAGE
      ========================= */

      if (existingBrand.image) {
        try {

          // remove starting slash
          const cleanImagePath = existingBrand.image.replace(/^\/+/, "");

          const oldImagePath = path.join(
            process.cwd(),
            "public",
            cleanImagePath
          );

          // check file exists
          await fs.access(oldImagePath);

          // delete file
          await fs.unlink(oldImagePath);

          console.log("Old image deleted");

        } catch (err) {
          console.error("Delete failed:", err.message);
        }
      }

      /* =========================
         SAVE NEW IMAGE
      ========================= */

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(image.name);

      const fileName = `brand_${Date.now()}${ext}`;

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/brands"
      );

      // create folder if not exists
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);

      // save image
      await fs.writeFile(filePath, buffer);

      // save path in DB
      imagePath = `${fileName}`;
    }

    /* =========================
       UPDATE BRAND
    ========================= */

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      {
        brand_name,
        brand_slug: brand_name
          .toLowerCase()
          .replace(/\s+/g, "-"),

        status,

        image: imagePath,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Brand updated successfully",
        data: updatedBrand,
      },
      { status: 200 }
    );

  } catch (error) {

    console.error("Error updating brand:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}