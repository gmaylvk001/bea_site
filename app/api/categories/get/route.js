import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// In-memory cache for ultra-fast response
let cachedCategoriesData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url || "http://localhost/api/categories/get");
    const forceRefresh = searchParams.get("refresh") === "true";

    // Serve cached response if valid and not force-refreshed
    if (!forceRefresh && cachedCategoriesData && (Date.now() - cacheTimestamp < CACHE_TTL_MS)) {
      return NextResponse.json(cachedCategoriesData, { status: 200 });
    }

    await dbConnect();

    // 1. Fetch all categories, products (category & brand fields only), and brands in 3 bulk queries total
    const [categories, allProducts, allBrands] = await Promise.all([
      Category.find().sort({ position: 1 }).lean(),
      Product.find({}, { category: 1, brand: 1 }).lean(),
      Brand.find().lean(),
    ]);

    // 2. Build brand lookup map: brandIdStr -> brand object
    const brandMap = new Map();
    allBrands.forEach((b) => {
      brandMap.set(b._id.toString(), b);
    });

    // 3. Build parent -> children map for in-memory category tree traversal
    const childrenMap = new Map();
    categories.forEach((cat) => {
      const pId = cat.parentid?.toString() || "none";
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId).push(cat._id.toString());
    });

    // Helper: recursively get descendant category IDs in memory (zero DB calls)
    const getDescendantCategoryIdsInMemory = (categoryIdStr, visited = new Set()) => {
      if (visited.has(categoryIdStr)) return [];
      visited.add(categoryIdStr);
      let ids = [categoryIdStr];
      const children = childrenMap.get(categoryIdStr) || [];
      for (const childId of children) {
        ids = ids.concat(getDescendantCategoryIdsInMemory(childId, visited));
      }
      return ids;
    };

    // 4. Map direct brands per category ID in memory
    const catDirectBrandsMap = new Map();
    allProducts.forEach((p) => {
      if (!p.category || !p.brand) return;
      const catIdStr = p.category.toString();
      const brandIdStr = p.brand.toString();
      if (!mongoose.Types.ObjectId.isValid(brandIdStr)) return;

      if (!catDirectBrandsMap.has(catIdStr)) catDirectBrandsMap.set(catIdStr, new Set());
      catDirectBrandsMap.get(catIdStr).add(brandIdStr);
    });

    // 5. Construct final response with inherited brands for each category
    const categoriesWithProducts = categories.map((cat) => {
      const catIdStr = cat._id.toString();
      const descendantCatIds = getDescendantCategoryIdsInMemory(catIdStr);

      const brandIdSet = new Set();
      descendantCatIds.forEach((dId) => {
        const bSet = catDirectBrandsMap.get(dId);
        if (bSet) {
          bSet.forEach((bId) => brandIdSet.add(bId));
        }
      });

      const brands = [];
      brandIdSet.forEach((bId) => {
        const brandObj = brandMap.get(bId);
        if (brandObj) brands.push(brandObj);
      });

      return {
        ...cat,
        parentid: cat.parentid?.toString() || "none",
        brands,
      };
    });

    // Update server cache
    cachedCategoriesData = categoriesWithProducts;
    cacheTimestamp = Date.now();

    return NextResponse.json(categoriesWithProducts, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching categories with products/brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 },
    );
  }
}

