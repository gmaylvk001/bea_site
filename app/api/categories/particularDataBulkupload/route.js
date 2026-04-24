import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import * as XLSX from "xlsx";

import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import crypto from "crypto";
export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let updated = 0;
    let skipped = 0;

    /* ---------- HELPERS ---------- */
    const normalize = (val) => val?.toString().trim().replace(/\s+/g, " ");

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    /* ---------- LOOP ---------- */
    for (const row of rows) {
      const itemCode = normalize(
        row["Item No."] ||
          row["Item No"] ||
          row["ITEM NO."] ||
          row["Item Code"] ||
          row["item_code"],
      );

      const childName = normalize(row["Subcategory"]);
      const productName = normalize(row["Product Name"]);
      const size = normalize(row["Size"]);
      const brand = normalize(row["Brand"]);
      const star = normalize(row["Star"]);
      const description = normalize(row["Description"]);
      const keyFeatures = normalize(row["Key Features"]);

      if (!itemCode || !childName) {
        skipped++;
        continue;
      }

      console.log("➡ Processing:", itemCode, childName);

      /* ---------- FIND CATEGORY ---------- */
      const childCategory = await Category.findOne({
        category_name: {
          $regex: escapeRegex(childName),
          $options: "i",
        },
      });

      if (!childCategory) {
          console.log("⚠️ SKIPPED - itemCode:", itemCode, "| childName:", childName); 
        skipped++;
        continue;
      }

      const subCategory = await Category.findById(childCategory.parentid);
      if (!subCategory) {
        console.log("❌ Subcategory missing");
        skipped++;
        continue;
      }

      const mainCategory = await Category.findById(subCategory.parentid);
      if (!mainCategory) {
        console.log("❌ Main category missing");
        skipped++;
        continue;
      }

      /* ---------- BUILD CATEGORY CHAINS ---------- */
      const subCategoryNew = [
        mainCategory.md5_cat_name,
        subCategory.md5_cat_name,
        childCategory.md5_cat_name,
      ].join("##");

      const subCategoryNameFull = [
        mainCategory.category_name,
        subCategory.category_name,
        childCategory.category_name,
      ].join("##");

      /* ---------- KEY FEATURES ---------- */
      const keySpecsArray = keyFeatures
        ? keyFeatures.split(",").map((x) => x.trim())
        : [];

      let brandId = null;

      if (brand) {
        const brandDoc = await Brand.findOne({
          brand_name: {
            $regex: `^${escapeRegex(brand)}$`,
            $options: "i",
          },
        });

        if (!brandDoc) {
          console.log("❌ Brand not found:", brand);
        } else {
          brandId = brandDoc._id;
        }
      }

      /* ---------- UPDATE DATA ---------- */
      const updateData = {
        category_new: mainCategory.md5_cat_name,
        sub_category_new: subCategoryNew,
        sub_category_new_name: subCategoryNameFull,
        sub_category: childCategory._id,
      };

      if (brandId) {
        updateData.brand = brandId; // 👈 IMPORTANT
      }

      console.log(updateData);

      // if (productName) updateData.name = productName;
      if (productName) {
  // 1️⃣ PRODUCT NAME
  const name = productName.trim();
  updateData.name = name;

  // 2️⃣ SLUG (from product name)
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
    .replace(/\s+/g, "-")          // space → dash
    .replace(/-+/g, "-");          // remove extra dash

  updateData.slug = slug;

  // 3️⃣ MD5 NAME (from slug)
  const md5Name = crypto
    .createHash("md5")
    .update(slug)
    .digest("hex");

  updateData.md5_name = md5Name;
}
      // if (brand) updateData.brand = brand;
      if (size) updateData.size = size;
      if (star) updateData.star = star;
      if (description) updateData.description = description;
      if (keySpecsArray.length > 0) {
        updateData.key_specifications = keySpecsArray;
      }
      const result = await Product.updateOne(
        { item_code: itemCode },
        { $set: { ...updateData, item_code: itemCode } },
        { upsert: true },
      );
      if (result.upsertedCount > 0) {
        console.log("✅ Created new product:", itemCode);
        updated++;
      } else if (result.matchedCount > 0) {
        console.log("✅ Updated product:", itemCode);
        updated++;
      } else {
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
      { status: 500 },
    );
  }
}
