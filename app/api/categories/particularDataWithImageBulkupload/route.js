import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import * as XLSX from "xlsx";

import Product from "@/models/product";

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    /* ---------- READ EXCEL ---------- */
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let updated = 0;
    let skipped = 0;

    /* ---------- HELPER ---------- */
    const normalize = (val) =>
      val ? val.toString().trim().replace(/\s+/g, " ") : "";

    /* ---------- LOOP ---------- */
    for (const row of rows) {
      try {
        const itemCode = normalize(
          row["Item No."] ||
          row["Item No"] ||
          row["ITEM NO."]
        );

        const productName = normalize(row["Product Name"]);

        const image1 = normalize(row["image1"]);
        const image2 = normalize(row["image2"]);
        const image3 = normalize(row["image3"]);

        const overviewImages = normalize(row["overview images"]);
        const overviewDescription = normalize(row["overview description"]);

        if (!itemCode) {
          skipped++;
          continue;
        }

        console.log("➡ Processing:", itemCode);

        /* ---------- IMAGES ARRAY ---------- */
        const imagesArray = [];
        if (image1) imagesArray.push(image1);
        if (image2) imagesArray.push(image2);
        if (image3) imagesArray.push(image3);

        /* ---------- OVERVIEW IMAGES ARRAY ---------- */
        let overviewImagesArray = [];
        if (overviewImages) {
          overviewImagesArray = overviewImages
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
        }

        /* ---------- UPDATE DATA ---------- */
        const updateData = {};

        if (productName) updateData.name = productName;

        if (imagesArray.length > 0) {
          updateData.images = imagesArray; // ✅ image1,2,3 → array
        }

        if (overviewImagesArray.length > 0) {
          updateData.overview_images = overviewImagesArray; // ✅ array
        }

        if (overviewDescription) {
          updateData.overviewdescription = overviewDescription; // ✅ correct field name
        }

        /* ---------- UPDATE ---------- */
        const result = await Product.updateOne(
          { item_code: itemCode },
          { $set: updateData }
        );

        if (result.matchedCount > 0) {
          updated++;
        } else {
          console.log("❌ Product not found:", itemCode);
          skipped++;
        }
      } catch (err) {
        console.log("❌ Row error:", err.message);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      updated,
      skipped,
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}