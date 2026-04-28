// app/api/search/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import ProductFilter from "@/models/ecom_productfilter_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

export const runtime = "nodejs";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getCategoryTree(parentId, productCategoryIds = null) {
  const categories = await Category.find({ parentid: parentId }).lean();
  let filteredCategories = [];
  for (const category of categories) {
    if (productCategoryIds) {
      if (productCategoryIds.includes(category._id.toString())) {
        category.subCategories = await getCategoryTree(
          category._id,
          productCategoryIds,
        );
        filteredCategories.push(category);
      } else {
        const children = await getCategoryTree(
          category._id,
          productCategoryIds,
        );
        if (children.length > 0) {
          category.subCategories = children;
          filteredCategories.push(category);
        }
      }
    } else {
      category.subCategories = await getCategoryTree(category._id);
      filteredCategories.push(category);
    }
  }
  return filteredCategories;
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

    let searchFilter = {
      status: "Active",
    };

    /* ---------------- TEXT SEARCH ---------------- */
    if (query) {
      const safe = escapeRegExp(query);
      const regex = new RegExp(safe, "i");
      searchFilter.$and = [
        ...(searchFilter.$and || []),
        {
          $or: [
            { name: regex },
            { item_code: regex },
            { search_keywords: regex },
          ],
        },
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
          filterDefs: [],
        });
      }

      searchFilter.sub_category_new = {
        $regex: categoryDoc.md5_cat_name,
        $options: "i",
      };
    }

    /* ---------------- BRAND FILTER ---------------- */
    if (brands.length > 0) {
      searchFilter.brand = { $in: brands };
    }

    /* --- CATEGORY IDS FILTER --- */

    const categoryIds = (searchParams.get("categoryIds") || "")
      .split(",")
      .filter((v) => mongoose.Types.ObjectId.isValid(v));
    const subcategoryIds = (searchParams.get("subcategoryIds") || "")
      .split(",")
      .filter((v) => mongoose.Types.ObjectId.isValid(v));

    if (categoryIds.length > 0 || subcategoryIds.length > 0) {
      const allIds = [...categoryIds, ...subcategoryIds];
       const categoryConditions = allIds.map(id => ({
    $or: [
      { category: id },
      { sub_category: id }
    ]
  }));
  
  searchFilter.$and = [
    ...(searchFilter.$and || []),
    { $and: categoryConditions }
  ];
}

    /* ---------------- PRICE FILTER ---------------- */
  
searchFilter.$and = [
  ...(searchFilter.$and || []), 
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

    /* ---------------- PRODUCT FILTER ---------------- */
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

        const filteredProductIds = baseProductIds.filter((id) => {
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

    /* ---------------- GLOBAL BRAND COUNT ---------------- */
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

    /* ---------------- GLOBAL PRODUCT FILTER COUNT ---------------- */
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

    /* ---------------- FILTER DEFINITIONS ---------------- */
    const allProductIds = await Product.distinct("_id", filterAggMatch);

    const productFilterDocs = await ProductFilter.find({
      product_id: { $in: allProductIds },
    }).lean();

    const filterDefIds = [
      ...new Set(
        productFilterDocs.map((pf) => pf.filter_id?.toString()).filter(Boolean),
      ),
    ];

    const filterDefs = await Filter.find({
      _id: { $in: filterDefIds },
    })
      .populate({
        path: "filter_group",
        select: "filtergroup_name",
        model: FilterGroup,
      })
      .lean();

    const formattedFilterDefs = filterDefs.map((f) => ({
      ...f,
      filter_group_name: f.filter_group?.filtergroup_name || "Other",
    }));

   /* ---------------- CATEGORY TREE ---------------- */

/* ---------------- CATEGORY TREE - SIMPLEST WORKING VERSION ---------------- */

const productSubCategoryIds = [
  ...new Set([
    ...products.map(p => p.sub_category?.toString()).filter(Boolean),
    ...products.map(p => p.category?.toString()).filter(Boolean),
  ])
];

let categoryTree = [];

if (productSubCategoryIds.length > 0) {
  // Get unique category IDs
  const uniqueCategoryIds = [...new Set(productSubCategoryIds)];
  
  // Fetch all these categories
  const categoriesWithProducts = await Category.find({
    _id: { $in: uniqueCategoryIds }
  }).lean();
  
  // Simple flat list (no hierarchy)
  categoryTree = categoriesWithProducts.map(c => ({
    ...c,
    subCategories: []
  }));
  
  console.log("Created flat category list:", categoryTree.length);
}

// If still no categories, try to fetch by category name
if (categoryTree.length === 0 && category) {
  const categoryByName = await Category.findOne({ 
    category_name: category,
    status: 'Active' 
  }).lean();
  
  if (categoryByName) {
    categoryTree = [{
      ...categoryByName,
      subCategories: []
    }];
  }
}

console.log("Final categories to display:", categoryTree.map(c => c.category_name));
    /* ---------------- RETURN ---------------- */
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
      filterDefs: formattedFilterDefs,
      categories: categoryTree,
    });
  } catch (error) {
    console.error("❌ Search API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
