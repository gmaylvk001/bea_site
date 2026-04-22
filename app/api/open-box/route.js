import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const brands = searchParams.get("brands");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "10000000");
    const sortBy = searchParams.get("sortBy") || "";

    // Base query 
    const query = {
      movement: "EOL",
      status: "Active", 
       quantity: { $gt: 0 },
      special_price: { $gte: minPrice, $lte: maxPrice },
    };

    // Brand filter
    if (brands) {
      const brandIds = brands.split(",");
      query.brand = { $in: brandIds };
    }

    // Sort
    let sortQuery = {};
  switch (sortBy) {
  case "price-low-high":
    sortQuery = { special_price: 1, price: 1 };
    break;
  case "price-high-low":
     sortQuery = { special_price: -1, price: -1 }
    break;
  case "name-a-z":
    sortQuery = { name: 1 };
    break;
  case "name-z-a":
    sortQuery = { name: -1 };
    break;
  case "quantity-low-to-high":   
    sortQuery = { quantity: 1 };
    break;
  case "quantity-high-to-low":   
    sortQuery = { quantity: -1 };
    break;
  default:
    sortQuery = { createdAt: -1 };
}

    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

   const needsPriceSort = sortBy === "price-low-high" || sortBy === "price-high-low";

let products;

if (needsPriceSort) {
  products = await Product.aggregate([
    { $match: query },
    {
      $addFields: {
        effectivePrice: {
          $cond: {
            if: {
              $and: [
                { $gt: ["$special_price", 0] },
                { $lt: ["$special_price", "$price"] }
              ]
            },
            then: "$special_price",
            else: "$price"
          }
        }
      }
    },
    { $sort: sortQuery },
    { $skip: skip },
    { $limit: limit }
  ]);

} else {
  products = await Product.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .lean();
}

    // Brands list for filter sidebar
    const allEOLProducts = await Product.find(
       { movement: "EOL", status: "Active", quantity: { $gt: 0 } }, 
      { brand: 1 }
    ).lean();

    const brandCountMap = {};
    allEOLProducts.forEach((p) => {
      if (p.brand) {
        const key = p.brand.toString();
        brandCountMap[key] = (brandCountMap[key] || 0) + 1;
      }
    });

    const brandIds = Object.keys(brandCountMap);
    const brandDocs = await Brand.find({ _id: { $in: brandIds } }).lean();
    const brandsWithCount = brandDocs.map((b) => ({
      ...b,
      count: brandCountMap[b._id.toString()] || 0,
    }));

    // Price range
    const priceData = await Product.aggregate([
      { $match: { movement: "EOL" } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$special_price" },
          maxPrice: { $max: "$special_price" },
        },
      },
    ]);

    const priceRange = priceData[0] || { minPrice: 0, maxPrice: 100000 };

    return NextResponse.json({
      success: true,
      products,
      brands: brandsWithCount,
      priceRange,
      pagination: {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("❌ Open Box error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}