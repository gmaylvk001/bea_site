import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import * as XLSX from "xlsx";

import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

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

    const normalize = (val) =>
      val?.toString().trim().replace(/\s+/g, " ");

for (const row of rows) {
  const itemCode = normalize(
    row["item_code"] || row["Item Code"] || row["item code"]
  );

  const subCategoryName = normalize(
    row["category"] || row["Category"]
  ); // Air Conditioner

  const childName = normalize(
    row["sub_category"] || row["Sub Category"]
  ); // Split AC

  if (!itemCode || !subCategoryName || !childName) {
    skipped++;
    continue;
  }

  /* ---------- FIND PRODUCT ---------- */
  const product = await Product.findOne({ item_code: itemCode });

  if (!product) {
    skipped++;
    continue;
  }

/* ---------- FIND CHILD CATEGORY ---------- */
const childCategory = await Category.findOne({
  category_name: { $regex: `^${childName}$`, $options: "i" },
});

if (!childCategory) {
  skipped++;
  continue;
}

/* ---------- GET SUB CATEGORY FROM CHILD ---------- */
const subCategory = await Category.findById(childCategory.parentid);

if (!subCategory) {
  skipped++;
  continue;
}

/* ---------- GET MAIN CATEGORY FROM SUB ---------- */
const mainCategory = await Category.findById(subCategory.parentid);

if (!mainCategory) {
  skipped++;
  continue;
}

/* ---------- MATCH INPUT CATEGORY ---------- */
const inputCategory = subCategoryName.toLowerCase();

const isSubMatch =
  subCategory.category_name.toLowerCase() === inputCategory;

const isMainMatch =
  mainCategory.category_name.toLowerCase() === inputCategory;

if (!isSubMatch && !isMainMatch) {
  skipped++;
  continue;
}

  /* ---------- BUILD MD5 CHAIN ---------- */
  const subCategoryNew = [
    mainCategory.md5_cat_name,
    subCategory.md5_cat_name,
    childCategory.md5_cat_name,
  ].join("##");

  /* ---------- BUILD NAME CHAIN ---------- */
  const subCategoryNameFull = [
    mainCategory.category_name,
    subCategory.category_name,
    childCategory.category_name,
  ].join("##");

  /* ---------- UPDATE ---------- */
  await Product.updateMany(
    { _id: product._id },
    {
      category_new: mainCategory.md5_cat_name,     // ✅ MAIN
      sub_category_new: subCategoryNew,            // ✅ MD5 chain
      sub_category_new_name: subCategoryNameFull,      // ✅ NAME chain
      sub_category: childCategory._id,             // ✅ CHILD ID
    }
  );

  updated++;
}
    return NextResponse.json({
      success: true,
      message: "Bulk upload completed",
      updated,
      skipped,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}