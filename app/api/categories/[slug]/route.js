import dbConnect from "@/lib/db";
import ecom_category_info from "@/models/ecom_category_info";
import Product from "@/models/product";
import Brand from "@/models/ecom_brand_info"; 
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import CategoryFilter from "@/models/ecom_categoryfilters_infos";
import mongoose from "mongoose";

// In-memory cache per category slug
const slugCache = new Map();
const SLUG_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

function buildTreeInMemory(allCategories, parentId) {
  const parentIdStrs = new Set([String(parentId)]);
  if (parentId && typeof parentId === "object") {
    parentIdStrs.add(parentId.toString());
  }

  const directChildren = allCategories.filter((c) => {
    const pStr = c.parentid?.toString() || "";
    return parentIdStrs.has(pStr);
  });

  return directChildren.map((c) => ({
    ...c,
    subCategories: buildTreeInMemory(allCategories, c._id),
  }));
}

function getAllCategoryIds(categories) {
  return categories.reduce((acc, category) => {
    acc.push(category._id);
    if (category.subCategories?.length > 0) {
      acc.push(...getAllCategoryIds(category.subCategories));
    }
    return acc;
  }, []);
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url || "http://localhost/api/categories");
    const forceRefresh = searchParams.get("refresh") === "true";

    // Serve cached category data if valid
    const cachedEntry = slugCache.get(slug);
    if (!forceRefresh && cachedEntry && (Date.now() - cachedEntry.timestamp < SLUG_CACHE_TTL_MS)) {
      return Response.json(cachedEntry.data);
    }

    await dbConnect();

    // Fetch main category
    const main_category = await ecom_category_info.findOne({ category_slug: slug }).lean();
    if (!main_category) {
      return Response.json({ error: "Main Category not found" }, { status: 404 });
    }

    // Fetch all active categories in 1 bulk query and build tree in-memory (< 1ms)
    const allCategories = await ecom_category_info
      .find({ status: { $ne: "Inactive" } })
      .lean();

    const categoryTree = buildTreeInMemory(allCategories, main_category._id);
    const allCategoryIds = [main_category._id, ...getAllCategoryIds(categoryTree)];

    // Construct product query using indexed category IDs + md5_cat_name matching
    const orConditions = [
      { category: { $in: allCategoryIds } },
      { sub_category: { $in: allCategoryIds } },
    ];

    if (main_category.md5_cat_name) {
      orConditions.push({
        sub_category_new: {
          $regex: main_category.md5_cat_name,
          $options: "i",
        },
      });
    }

    const products = await Product.find({
      status: "Active",
      $or: orConditions,
      quantity: { $exists: true, $ne: null, $gt: 0 },
    }).lean();

    if (!products || products.length === 0) {
      const emptyResult = { category: categoryTree, products: [], brands: [], filters: [] };
      slugCache.set(slug, { data: emptyResult, timestamp: Date.now() });
      return Response.json(emptyResult);
    }

    // Fetch brand info & count
    const brandIds = [
      ...new Set(
        products
          .map((p) => p.brand)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      ),
    ];

    let brandsWithCount = [];
    if (brandIds.length > 0) {
      const brands = await Brand.find({ _id: { $in: brandIds } }).lean();
      const brandCountMap = products.reduce((acc, product) => {
        const brandId = product.brand?.toString();
        if (brandId) acc[brandId] = (acc[brandId] || 0) + 1;
        return acc;
      }, {});
      brandsWithCount = brands.map((b) => ({
        ...b,
        count: brandCountMap[b._id.toString()] || 0,
      }));
    }

    // Fetch category-level filters
    const categoryFilters = await CategoryFilter.find({
      category_id: main_category._id,
    }).lean();

    const filterIds = [
      ...new Set(categoryFilters.map((cf) => cf.filter_id)),
    ];

    const filters = await Filter.find({ _id: { $in: filterIds } })
      .populate({
        path: "filter_group",
        select: "filtergroup_name -_id",
        model: FilterGroup,
      })
      .lean();

    const formattedFilters = filters.map((filter) => ({
      ...filter,
      filter_group_name: filter.filter_group?.filtergroup_name || "No Group",
      filter_group: filter.filter_group?._id,
    }));

    const finalResponse = {
      main_category,
      category: categoryTree,
      allCategoryIds,
      products,
      brands: brandsWithCount,
      filters: formattedFilters,
    };

    // Cache the response
    slugCache.set(slug, { data: finalResponse, timestamp: Date.now() });

    return Response.json(finalResponse);

  } catch (error) {
    console.error("Category slug GET error:", error);
    return Response.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

