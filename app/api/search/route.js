// app/api/search/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import ProductFilter from "@/models/ecom_productfilter_info";
import mongoose from "mongoose";

export const runtime = "nodejs";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const query = (searchParams.get("query") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 12);

  const brands = (searchParams.get("brands") || "")
    .split(",")
    .filter((v) => mongoose.Types.ObjectId.isValid(v));

  const filters = (searchParams.get("filters") || "")
    .split(",")
    .filter((v) => mongoose.Types.ObjectId.isValid(v));

  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 1000000);

  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    /* ---------------- BASE QUERY ---------------- */
    /*
    let searchFilter = {
      status: "Active",
      quantity: { $gt: 0 },
    };
  */
     let searchFilter = {
      status: "Active"
    };
    /* ---------------- TEXT SEARCH ---------------- */
    if (query) {
      const safe = escapeRegExp(query);
      const regex = new RegExp(safe, "i");
      searchFilter.$or = [
        { name: regex },
        { item_code: regex },
        { search_keywords: regex },
      ];
    }

    /* ---------------- CATEGORY MAPPING ---------------- */
    if (category && category !== "All Categories") {
      const categoryDoc = await Category.findOne({
        category_name: category,
        status: "Active",
      }).select("_id md5_cat_name");

      if (!categoryDoc) {
        return NextResponse.json({
          products: [],
          pagination: { total: 0, currentPage: page, totalPages: 0 },
          brandSummary: [],
          filterSummary: [],
        });
      }

      // ✅ same logic as working category filter
      searchFilter.sub_category_new = {
        $regex: categoryDoc.md5_cat_name,
        $options: "i",
      };
    }

    /* ---------------- BRAND FILTER ---------------- */
    if (brands.length > 0) {
      searchFilter.brand = { $in: brands };
    }

    /* ---------------- PRICE FILTER (MATCHES CATEGORY ROUTE) ---------------- */
    searchFilter.$and = [
      {
        $or: [
          {
            $and: [
              { special_price: { $ne: null, $ne: 0 } },
              { special_price: { $gte: minPrice, $lte: maxPrice } },
            ],
          },
          {
            $and: [
              { $or: [{ special_price: null }, { special_price: 0 }] },
              { price: { $gte: minPrice, $lte: maxPrice } },
            ],
          },
        ],
      },
    ];

    /* ---------------- BASE PRODUCT QUERY ---------------- */
    let productsQuery = Product.find(searchFilter);

    /* ---------------- PRODUCT FILTER (USING ecom_productfilter_info) ---------------- */
    let filteredProductIds = null;

    if (filters.length > 0) {
      const baseProductIds = await productsQuery.distinct("_id");

      if (baseProductIds.length > 0) {
        const productFilters = await ProductFilter.find({
          product_id: { $in: baseProductIds },
          filter_id: { $in: filters },
        });

        const filtersByProduct = productFilters.reduce((acc, pf) => {
          const productId = pf.product_id.toString();
          if (!acc[productId]) acc[productId] = new Set();
          acc[productId].add(pf.filter_id.toString());
          return acc;
        }, {});

        filteredProductIds = baseProductIds.filter((id) => {
          const productId = id.toString();
          const productFilterIds = filtersByProduct[productId] || new Set();
          return filters.some((fid) => productFilterIds.has(fid));
        });

        searchFilter._id = { $in: filteredProductIds };
        productsQuery = Product.find(searchFilter);
      }
    }

    /* ---------------- PAGINATION ---------------- */
    const total = await Product.countDocuments(searchFilter);

    const products = await productsQuery
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    /* ---------------- ✅ GLOBAL BRAND COUNT (NOT PAGE-BASED) ---------------- */
    const brandAggMatch = { ...searchFilter };
    delete brandAggMatch.brand;
    delete brandAggMatch._id;

    const brandAgg = await Product.aggregate([
      { $match: brandAggMatch },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    
    const brandSummary = brandAgg
      .filter((b) => mongoose.Types.ObjectId.isValid(b._id))
      .map((b) => ({ brandId: b._id, count: b.count }));
      

    //  const brandSummary = await Product.find(searchFilter).select('brand');

    /* ---------------- ✅ GLOBAL PRODUCT FILTER COUNT ---------------- */
    const filterAggMatch = { ...searchFilter };
    delete filterAggMatch._id;

    const filterAgg = await ProductFilter.aggregate([
      {
        $match: {
          product_id: { $in: await Product.distinct("_id", filterAggMatch) },
        },
      },
      { $group: { _id: "$filter_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const filterSummary = filterAgg.map((f) => ({
      filterId: f._id,
      count: f.count,
    }));

    return NextResponse.json({
      products,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      brandSummary,
      filterSummary,
    });
  } catch (error) {
    console.error("❌ Search API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
