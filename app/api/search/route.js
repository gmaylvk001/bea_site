// app/api/search/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

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
  const brands = (searchParams.get("brands") || "").split(",").filter(Boolean);
  const filters = (searchParams.get("filters") || "").split(",").filter(Boolean);
  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 9999999999);
  const skip = (page - 1) * limit;

  try {
    await dbConnect();

    // Build base search filter (includes everything except selected brand/filter exclusions we want for aggregated counts)
    const searchFilter = { status: "Active" };

    // Text search
    if (query) {
      const q = escapeRegExp(query);
      const regex = new RegExp(q, "i");
      searchFilter.$or = [{ name: regex }, { item_code: regex }, { search_keywords: regex }];
    }

    // Category mapping (same as before)
    if (category && category !== "All Categories") {
      let search_category = "";
      if (category === "Televisions") search_category = "Television";
      else if (category === "Computers & Laptops") search_category = "Laptops";
      else if (category === "Mobiles & Accessories") search_category = "Mobile Phones";
      else if (category === "Gadgets") search_category = "Gadget";
      else if (category === "Accessories") search_category = "Accessory";
      else if (category === "Sound Systems") search_category = "Sound System";

      const categoryDoc = await Category.findOne({
        category_name: search_category || category,
        status: "Active",
      })
        .select("_id")
        .lean();

      if (!categoryDoc) {
        return NextResponse.json(
          { products: [], pagination: { total: 0, currentPage: page, totalPages: 0, hasNext: false, hasPrev: false }, brandSummary: [], filterSummary: [] },
          { headers: { "x-api-route": "search" } }
        );
      }

      if (category === "Large Appliance" || category === "Small Appliances") {
        const children = await Category.find({ parentid: categoryDoc._id, status: "Active" }).select("_id").lean();
        searchFilter.category = children.length ? { $in: children.map((c) => c._id) } : categoryDoc._id;
      } else {
        searchFilter.category = categoryDoc._id;
      }
    }

    // Apply price restriction via $expr
    searchFilter.$expr = {
      $and: [
        {
          $gte: [
            {
              $cond: [
                { $and: [{ $gt: ["$special_price", 0] }, { $lt: ["$special_price", "$price"] }] },
                "$special_price",
                "$price",
              ],
            },
            minPrice,
          ],
        },
        {
          $lte: [
            {
              $cond: [
                { $and: [{ $gt: ["$special_price", 0] }, { $lt: ["$special_price", "$price"] }] },
                "$special_price",
                "$price",
              ],
            },
            maxPrice,
          ],
        },
      ],
    };

    // Apply filters that SHOULD restrict the returned product set (brand and filters selected by user)
    if (brands.length) {
      searchFilter.brand = { $in: brands };
    }
    if (filters.length) {
      searchFilter.filters = { $in: filters };
    }

    // Now compute counts and return paged products.
    const total = await Product.countDocuments(searchFilter);
    const products = await Product.find(searchFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    // ---- IMPORTANT: compute brandSummary based on the same search criteria BUT EXCLUDING the brand filter
    // That ensures brand counts reflect the matched set ignoring which brands are currently selected.
    const searchFilterForBrandAgg = { ...searchFilter };
    delete searchFilterForBrandAgg.brand; // remove brand constraint so we count across all brands for same other filters

    // Similarly, compute filterSummary excluding the active filters (so counts reflect full matched set ignoring selection)
    const searchFilterForFilterAgg = { ...searchFilter };
    delete searchFilterForFilterAgg.filters;

    // Aggregation for brand counts (full matched set except brand selection)
    const brandAgg = await Product.aggregate([
      { $match: searchFilterForBrandAgg },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    //const brandSummary = brandAgg.map((b) => ({ brandId: b._id, count: b.count }));

    const brandSummary = await Product.find(searchFilter).select('brand');

    // Aggregation for filter counts (full matched set except filter selection)
    const filterAgg = await Product.aggregate([
      { $match: searchFilterForFilterAgg },
      { $unwind: { path: "$filters", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$filters", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const filterSummary = filterAgg.map((f) => ({ filterId: f._id, count: f.count }));

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
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
