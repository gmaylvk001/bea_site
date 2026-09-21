import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import ecom_category_info from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

// Fast in-memory resolution of all descendant category IDs
async function getAllSubCategoryIds(categoryId) {
  try {
    const allCategories = await ecom_category_info
      .find({ status: { $ne: "Inactive" } })
      .select("_id parentid")
      .lean();

    const targetIdStr = categoryId.toString();
    const idSet = new Set([targetIdStr]);

    let added = true;
    while (added) {
      added = false;
      for (const c of allCategories) {
        const cId = c._id.toString();
        const pId = c.parentid?.toString();
        if (pId && idSet.has(pId) && !idSet.has(cId)) {
          idSet.add(cId);
          added = true;
        }
      }
    }
    return Array.from(idSet);
  } catch (err) {
    console.error("Error getting subcategory IDs:", err);
    return [categoryId.toString()];
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get("categorySlug");
    const brandSlug = searchParams.get("brandSlug");
    const minPrice = parseFloat(searchParams.get("minPrice")) || 0;
    const maxPrice = parseFloat(searchParams.get("maxPrice")) || 1000000;
    const filterIds = searchParams.get("filters")?.split(",").filter(Boolean) || [];
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const sort = searchParams.get("sort") || "featured";

    const categoryIdsParam = searchParams.get("categoryIds");
    const subcategoryIdsParam = searchParams.get("subcategoryIds");

    const selectedCategoryIds = categoryIdsParam
      ? categoryIdsParam.split(",").filter(Boolean)
      : [];

    const selectedSubcategoryIds = subcategoryIdsParam
      ? subcategoryIdsParam.split(",").filter(Boolean)
      : [];

    if (!categorySlug || !brandSlug) {
      return Response.json(
        { error: "Category or Brand missing" },
        { status: 400 },
      );
    }

    /* --------------------------------------------------
       1️⃣ Resolve CATEGORY hierarchy
    -------------------------------------------------- */
    const parentCategory = await ecom_category_info.findOne({
      $or: [
        { category_slug: categorySlug },
        { category_slug: decodeURIComponent(categorySlug) },
        { category_slug: categorySlug.toLowerCase() },
      ],
      status: "Active",
    });

    if (!parentCategory) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    /* --------------------------------------------------
       2️⃣ Resolve BRAND
    -------------------------------------------------- */
    const find_brand = await Brand.findOne({
      $or: [
        { brand_slug: brandSlug },
        { brand_slug: decodeURIComponent(brandSlug) },
        { brand_slug: brandSlug.toLowerCase() },
      ],
      status: "Active",
    });

    if (!find_brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    /* --------------------------------------------------
       3️⃣ Category Match Clause
    -------------------------------------------------- */
    const allCategoryIdsInTree = await getAllSubCategoryIds(parentCategory._id);
    let expandedCategoryIds = allCategoryIdsInTree;

    if (selectedSubcategoryIds.length > 0) {
      expandedCategoryIds = selectedSubcategoryIds;
    } else if (selectedCategoryIds.length > 0) {
      let selectedAll = [];
      for (const catId of selectedCategoryIds) {
        const subIds = await getAllSubCategoryIds(catId);
        selectedAll = [...selectedAll, ...subIds];
      }
      expandedCategoryIds = [...new Set(selectedAll)];
    }

    const categoryObjectIds = expandedCategoryIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const allCategoryVariants = [...new Set([...expandedCategoryIds, ...categoryObjectIds])];

    const categoryMatchClause = {
      $or: [
        { category: { $in: allCategoryVariants } },
        { sub_category: { $in: allCategoryVariants } },
      ],
    };

    if (parentCategory.md5_cat_name) {
      categoryMatchClause.$or.push({
        sub_category_new: {
          $regex: parentCategory.md5_cat_name,
          $options: "i",
        },
      });
    }

    /* --------------------------------------------------
       4️⃣ Price logic (special_price priority)
    -------------------------------------------------- */
    const priceClause = {
      $or: [
        {
          $and: [
            { special_price: { $nin: [null, 0] } },
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
    };

    const brandIdStr = find_brand._id.toString();
    const brandVariants = [find_brand._id, brandIdStr];

    let query = {
      status: "Active",
      brand: { $in: brandVariants },
      $and: [categoryMatchClause, priceClause],
    };

    let productsQuery = Product.find(query).populate(
      "brand",
      "brand_name brand_slug",
    );

    /* --------------------------------------------------
       5️⃣ Parse and apply filterGroups (AND between groups, OR within group)
    -------------------------------------------------- */
    const filterGroupsParam = searchParams.get("filterGroups");
    let filterGroupsMap = {};
    if (filterGroupsParam) {
      try {
        filterGroupsMap = JSON.parse(filterGroupsParam);
      } catch (e) {
        console.error("Failed to parse filterGroups:", e);
      }
    }

    // Fallback if filterGroups was not passed directly but filter IDs were
    if (Object.keys(filterGroupsMap).length === 0 && filterIds.length > 0) {
      const validFilterIds = filterIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validFilterIds.length > 0) {
        const selectedFilterDocs = await Filter.find({ _id: { $in: validFilterIds } })
          .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
          .lean();

        selectedFilterDocs.forEach(f => {
          const groupName = f.filter_group?.filtergroup_name || "other";
          if (!filterGroupsMap[groupName]) filterGroupsMap[groupName] = [];
          filterGroupsMap[groupName].push(f._id.toString());
        });
      }
    }

    if (Object.keys(filterGroupsMap).length > 0) {
      let candidateIds = await productsQuery.distinct("_id");

      if (candidateIds.length > 0) {
        for (const groupFilterIds of Object.values(filterGroupsMap)) {
          const groupFilterObjectIds = groupFilterIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
          const allGroupFilterVariants = [...new Set([...groupFilterIds, ...groupFilterObjectIds])];

          const matchingProductIds = await ProductFilter.find({
            product_id: { $in: candidateIds },
            filter_id: { $in: allGroupFilterVariants },
          }).distinct("product_id");

          const matchingSet = new Set(matchingProductIds.map((id) => id.toString()));
          candidateIds = candidateIds.filter((id) => matchingSet.has(id.toString()));

          if (candidateIds.length === 0) break;
        }

        query._id = { $in: candidateIds };
        productsQuery = Product.find(query).populate(
          "brand",
          "brand_name brand_slug",
        );
      } else {
        query._id = { $in: [] };
        productsQuery = Product.find(query).populate(
          "brand",
          "brand_name brand_slug",
        );
      }
    }

    /* --------------------------------------------------
       6️⃣ Sort & Pagination
    -------------------------------------------------- */
    const skip = (page - 1) * limit;
    let products;

    if (sort === "price-low-high" || sort === "price-high-low") {
      const sortDir = sort === "price-low-high" ? 1 : -1;
      products = await Product.aggregate([
        { $match: query },
        {
          $addFields: {
            effective_price: {
              $cond: {
                if: {
                  $and: [
                    { $gt: ["$special_price", 0] },
                    { $lt: ["$special_price", "$price"] },
                  ],
                },
                then: "$special_price",
                else: "$price",
              },
            },
          },
        },
        { $sort: { effective_price: sortDir, _id: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
    } else {
      const sortObj =
        sort === "name-a-z"
          ? { name: 1, _id: -1 }
          : sort === "name-z-a"
            ? { name: -1, _id: -1 }
            : sort === "quantity-low-to-high"
              ? { quantity: 1, _id: -1 }
              : sort === "quantity-high-to-low"
                ? { quantity: -1, _id: -1 }
                : { quantity: -1, _id: -1 };

      products = await productsQuery
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    /* --------------------------------------------------
       7️⃣ Dynamic Filters (Faceted counts matching subcategory pattern)
    -------------------------------------------------- */
    const finalFilteredProductIds = await Product.distinct("_id", query);
    const finalFilteredProductIdStrings = finalFilteredProductIds.map((id) => id.toString());

    const filterAggMap = {};

    if (Object.keys(filterGroupsMap).length > 0) {
      const baseFilterQuery = {
        status: "Active",
        brand: { $in: brandVariants },
        $and: [categoryMatchClause, priceClause],
      };

      const baseIds = await Product.distinct("_id", baseFilterQuery);
      const baseIdStrings = baseIds.map((id) => id.toString());

      for (const [groupName, groupFilterIds] of Object.entries(filterGroupsMap)) {
        let candidateIdStrs = [...baseIdStrings];

        for (const [otherGroupName, otherGroupFilterIds] of Object.entries(filterGroupsMap)) {
          if (otherGroupName === groupName) continue;

          const otherGroupObjIds = otherGroupFilterIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

          const otherGroupPF = await ProductFilter.find({
            product_id: { $in: candidateIdStrs },
            filter_id: { $in: [...otherGroupFilterIds, ...otherGroupObjIds] },
          }).distinct("product_id");

          const otherMatchIds = new Set(otherGroupPF.map((id) => id.toString()));
          candidateIdStrs = candidateIdStrs.filter((id) => otherMatchIds.has(id));
          if (candidateIdStrs.length === 0) break;
        }

        const candidateObjIds = candidateIdStrs
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const targetGroupObjIds = groupFilterIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        const agg = await ProductFilter.aggregate([
          {
            $match: {
              product_id: { $in: [...candidateIdStrs, ...candidateObjIds] },
              filter_id: { $in: [...groupFilterIds, ...targetGroupObjIds] },
            },
          },
          { $group: { _id: "$filter_id", count: { $sum: 1 } } },
        ]);

        agg.forEach((item) => {
          filterAggMap[item._id.toString()] = item.count;
        });
      }
    }

    const filterAgg = await ProductFilter.aggregate([
      {
        $match: {
          product_id: { $in: [...finalFilteredProductIdStrings, ...finalFilteredProductIds] },
        },
      },
      { $group: { _id: "$filter_id", count: { $sum: 1 } } },
    ]);

    filterAgg.forEach((item) => {
      if (!filterAggMap[item._id.toString()]) {
        filterAggMap[item._id.toString()] = item.count;
      }
    });

    const filterIdList = [
      ...new Set([
        ...Object.keys(filterAggMap),
        ...filterAgg.map((f) => f._id.toString()),
        ...filterIds,
        ...Object.values(filterGroupsMap).flat(),
      ]),
    ].filter((id) => mongoose.Types.ObjectId.isValid(id));

    const filterDocs = await Filter.find({ _id: { $in: filterIdList } })
      .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
      .lean();

    const filtersWithGroup = filterDocs
      .map((f) => ({
        ...f,
        filter_group_name: f.filter_group?.filtergroup_name || "Other",
        filter_group_id: f.filter_group?._id?.toString() || "other",
        count: filterAggMap[f._id.toString()] || 0,
      }))
      .filter((f) => f.count > 0 || filterIds.includes(f._id.toString()));

    return Response.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: filtersWithGroup,
    });
  } catch (error) {
    console.error("Error in category-brand filter:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
