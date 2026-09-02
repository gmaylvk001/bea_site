// app/api/brand/by-category/route.js
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function collectCategoryTree(root, includeInactive) {
  const md5s = new Set();
  const ids = new Set();
  const queue = [root];

  while (queue.length > 0) {
    const cat = queue.shift();
    const id = String(cat._id);
    if (ids.has(id)) continue;
    ids.add(id);
    if (cat.md5_cat_name) md5s.add(cat.md5_cat_name);

    const childQuery = {
      $or: [
        { parentid: id },
        { parentid: cat._id },
        ...(cat.md5_cat_name ? [{ parentid_new: cat.md5_cat_name }] : []),
      ],
    };
    if (!includeInactive) childQuery.status = "Active";

    const children = await Category.find(childQuery)
      .select("_id md5_cat_name")
      .lean();
    children.forEach((child) => queue.push(child));
  }

  return {
    md5Array: Array.from(md5s).filter(Boolean),
    idArray: Array.from(ids),
  };
}

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const includeAll = searchParams.get("all") === "1";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "slug is required" },
        { status: 400 }
      );
    }

    const mainQuery = { category_slug: slug };
    if (!includeAll) mainQuery.status = "Active";

    const mainCategory = await Category.findOne(mainQuery).lean();
    if (!mainCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    const { md5Array, idArray } = await collectCategoryTree(
      mainCategory,
      includeAll
    );

    const regexPattern = md5Array.map(escapeRegex).join("|");
    const productQuery = {
      brand: { $exists: true, $nin: [null, ""] },
      $or: [
        ...(md5Array.length
          ? [
              { category_new: { $in: md5Array } },
              { sub_category_new: { $regex: regexPattern, $options: "i" } },
            ]
          : []),
        { category: { $in: idArray } },
        { sub_category: { $in: idArray } },
      ],
    };
    if (!includeAll) productQuery.status = "Active";

    const uniqueBrandIds = await Product.distinct("brand", productQuery);

    if (!uniqueBrandIds.length) {
      return NextResponse.json({ success: true, brands: [] });
    }

    const objectIdBrands = uniqueBrandIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const brandQuery = { _id: { $in: objectIdBrands } };
    if (!includeAll) brandQuery.status = "Active";

    const brands = await Brand.find(brandQuery)
      .select("brand_name brand_slug image status")
      .sort({ brand_name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      brands: brands.map((b) => ({
        _id: b._id.toString(),
        brand_name: b.brand_name,
        brand_slug: b.brand_slug,
        image: b.image,
      })),
    });
  } catch (error) {
    console.error("by-category error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
