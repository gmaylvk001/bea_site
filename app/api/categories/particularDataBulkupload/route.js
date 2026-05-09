import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import * as XLSX from "xlsx";

import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import crypto from "crypto";
import mongoose from "mongoose";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let updated = 0;
    let skipped = 0;

    /* ---------- HELPERS ---------- */

    const normalize = (val) =>
      val?.toString().trim().replace(/\s+/g, " ");

    const escapeRegex = (str) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const isValidObjectId = (id) =>
      mongoose.Types.ObjectId.isValid(id);

    /* ---------- LOOP ---------- */

    for (const row of rows) {
      const itemCode = normalize(
        row["Item No."] ||
          row["Item No"] ||
          row["ITEM NO."] ||
          row["Item Code"] ||
          row["item_code"]
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

      /* =========================================================
         FIND CATEGORY
         ========================================================= */

      const childCategory = await Category.findOne({
        category_name: {
          $regex: escapeRegex(childName),
          $options: "i",
        },
      });

      if (!childCategory) {
        console.log(
          "⚠️ SKIPPED - itemCode:",
          itemCode,
          "| childName:",
          childName,
          "| REASON: Category not found in DB"
        );

        skipped++;
        continue;
      }

      /*
        CASE 1:
        Main Category -> Subcategory -> Child Category
      */

      let mainCategory = null;
      let subCategory = null;

      // child category has valid parent
      if (
        childCategory.parentid &&
        childCategory.parentid !== "none" &&
        isValidObjectId(childCategory.parentid)
      ) {
        subCategory = await Category.findById(childCategory.parentid);

        if (subCategory) {
          /*
            sub category has valid parent
            => full 3 level category
          */
          if (
            subCategory.parentid &&
            subCategory.parentid !== "none" &&
            isValidObjectId(subCategory.parentid)
          ) {
            mainCategory = await Category.findById(subCategory.parentid);
          }

          /*
            CASE 2:
            Main Category -> Subcategory only

            subCategory parent invalid/none
            => childCategory itself is subcategory
          */
          if (!mainCategory) {
            mainCategory = subCategory;
            subCategory = childCategory;
          }
        }
      }

      /*
        CASE 3:
        Only Main Category
      */
      if (!subCategory && !mainCategory) {
        mainCategory = childCategory;
      }

      if (!mainCategory) {
        console.log(
          "⚠️ SKIPPED - itemCode:",
          itemCode,
          "| REASON: Main category not found"
        );

        skipped++;
        continue;
      }

      /* =========================================================
         BUILD CATEGORY CHAINS
         ========================================================= */

      let subCategoryNew = mainCategory.md5_cat_name;
      let subCategoryNameFull = mainCategory.category_name;
      let subCategoryId = mainCategory._id;

      // if subcategory available
      if (subCategory) {
        subCategoryNew = [
          mainCategory.md5_cat_name,
          subCategory.md5_cat_name,
        ].join("##");

        subCategoryNameFull = [
          mainCategory.category_name,
          subCategory.category_name,
        ].join("##");

        subCategoryId = subCategory._id;
      }

      // if child category available (3 level)
      if (
        childCategory &&
        subCategory &&
        childCategory._id.toString() !== subCategory._id.toString()
      ) {
        subCategoryNew = [
          mainCategory.md5_cat_name,
          subCategory.md5_cat_name,
          childCategory.md5_cat_name,
        ].join("##");

        subCategoryNameFull = [
          mainCategory.category_name,
          subCategory.category_name,
          childCategory.category_name,
        ].join("##");

        subCategoryId = childCategory._id;
      }

      /* =========================================================
         KEY FEATURES
         ========================================================= */

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

      /* =========================================================
         UPDATE DATA
         ========================================================= */

      const updateData = {
        category_new: mainCategory.md5_cat_name,
        sub_category_new: subCategoryNew,
        sub_category_new_name: subCategoryNameFull,
        sub_category: subCategoryId,
      };

      if (brandId) {
        updateData.brand = brandId;
      }

      /*
        PRODUCT NAME + SLUG + MD5
      */

      if (productName) {
        const name = productName.trim();

        updateData.name = name;

        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        updateData.slug = slug;

        const md5Name = crypto
          .createHash("md5")
          .update(slug)
          .digest("hex");

        updateData.md5_name = md5Name;
      }

      if (size) updateData.size = size;
      if (star) updateData.star = star;
      if (description) updateData.description = description;

      if (keySpecsArray.length > 0) {
        updateData.key_specifications = keySpecsArray;
      }

      console.log("✅ FINAL UPDATE DATA:", updateData);

      /* =========================================================
         UPDATE PRODUCT
         ========================================================= */

      const result = await Product.updateOne(
        { item_code: itemCode },
        {
          $set: {
            ...updateData,
            item_code: itemCode,
          },
        },
        { upsert: true }
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
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}