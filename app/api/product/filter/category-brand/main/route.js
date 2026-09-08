import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import ecom_category_info from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

async function getAllSubCategoryIds(categoryId) {
  const subCategories = await ecom_category_info.find({ parentid: categoryId }).select('_id').lean();
  let allIds = [categoryId.toString()];
  for (const subCat of subCategories) {
    const childIds = await getAllSubCategoryIds(subCat._id);
    allIds = [...allIds, ...childIds];
  }
  return allIds;
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const categorySlug = searchParams.get("categorySlug");
    const brandSlug = searchParams.get("brandSlug");
    const minPrice = parseFloat(searchParams.get("minPrice")) || 0;
    const maxPrice = parseFloat(searchParams.get("maxPrice")) || 1000000;
    const filterIds = searchParams.get("filters")?.split(",") || [];
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sort = searchParams.get("sort") || "featured";

    const categoryIdsParam = searchParams.get("categoryIds");
    const subcategoryIdsParam = searchParams.get("subcategoryIds");

    const selectedCategoryIds = categoryIdsParam
      ? categoryIdsParam.split(",")
      : [];

    const selectedSubcategoryIds = subcategoryIdsParam
      ? subcategoryIdsParam.split(",")
      : [];

    if (!categorySlug || !brandSlug) {
      return Response.json(
        { error: "Category or Brand missing" },
        { status: 400 },
      );
    }

    /* --------------------------------------------------
       1️⃣ Resolve CATEGORY hierarchy (parent → child → sub-child)
    -------------------------------------------------- */
    const parentCategory = await ecom_category_info.findOne({
      category_slug: categorySlug,
      status: "Active",
    });

    if (!parentCategory) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    const childCategories = await ecom_category_info.find({
      parentid: parentCategory._id,
      status: "Active",
    });

    const childIds = childCategories.map((c) => c._id);

    const subChildCategories = await ecom_category_info.find({
      parentid: { $in: childIds },
      status: "Active",
    });

    const categoryIdsArray = [
      parentCategory._id.toString(),
      ...childCategories.map((c) => c._id.toString()),
      ...subChildCategories.map((c) => c._id.toString()),
    ];

    /* --------------------------------------------------
       2️⃣ Resolve BRAND
    -------------------------------------------------- */
    const find_brand = await Brand.findOne({
      brand_slug: brandSlug,
      status: "Active",
    });

    if (!find_brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    /* --------------------------------------------------
       3️⃣ Price logic (special_price priority)
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

    /* --------------------------------------------------
       4️⃣ FINAL PRODUCT QUERY
    -------------------------------------------------- */

// const effectiveCategoryIds =
//   selectedCategoryIds.length > 0
//     ? selectedCategoryIds
//     : categoryIdsArray;

// const effectiveSubcategoryIds =
//   selectedSubcategoryIds.length > 0
//     ? selectedSubcategoryIds
//     : null;
     
// console.log("=== DEBUG ===");
// console.log("categorySlug:", categorySlug);
// console.log("brandSlug:", brandSlug);
// console.log("selectedCategoryIds:", selectedCategoryIds);
// console.log("selectedSubcategoryIds:", selectedSubcategoryIds);
// console.log("categoryIdsArray:", categoryIdsArray);
// console.log("effectiveCategoryIds:", effectiveCategoryIds);
// console.log("effectiveSubcategoryIds:", effectiveSubcategoryIds);

// const categoryMatchClause = effectiveSubcategoryIds
//   ? {
//       $or: [
//         { category: { $in: effectiveSubcategoryIds } },
//         { sub_category: { $in: effectiveSubcategoryIds } },
//       ],
//     }
//   : {
//       $or: [
//         { category: { $in: effectiveCategoryIds } },
//         { sub_category: { $in: effectiveCategoryIds } },
//       ],
//     };

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

    const categoryMatchClause = {
      $or: [
        { category: { $in: expandedCategoryIds } },
        { sub_category: { $in: expandedCategoryIds } },
      ],
    };

    const brandIdStr = find_brand._id.toString();
    let query = {
      status: "Active",
      brand: { $in: [find_brand._id, brandIdStr] },
      $and: [
        categoryMatchClause, 
        priceClause,
      ],
    };

    let productsQuery = Product.find(query).populate(
      "brand",
      "brand_name brand_slug",
    );

    /* --------------------------------------------------
       5️⃣ Apply FILTERS (OR within group, AND across groups)
    -------------------------------------------------- */
    if (filterIds.length > 0) {
      const preFilterProductIds = await Product.distinct('_id', query);
      const preFilterIdStrings = preFilterProductIds.map(id => id.toString());

      const selectedFilterDocs = await Filter.find({ _id: { $in: filterIds } })
        .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
        .lean();

      const filtersByGroup = {};
      selectedFilterDocs.forEach(f => {
        const groupId = f.filter_group?._id?.toString() || "other";
        if (!filtersByGroup[groupId]) filtersByGroup[groupId] = [];
        filtersByGroup[groupId].push(f._id.toString());
      });

      let matchingProductIds = new Set(preFilterIdStrings);

      for (const groupFilterIds of Object.values(filtersByGroup)) {
        const groupFilterObjectIds = groupFilterIds
          .filter(id => mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));

        const groupProductFilters = await ProductFilter.find({
          product_id: { $in: [...preFilterIdStrings, ...preFilterProductIds] },
          filter_id: { $in: [...groupFilterIds, ...groupFilterObjectIds] }
        }).lean();

        const groupMatchingIds = new Set(
          groupProductFilters.map(pf => pf.product_id.toString())
        );

        matchingProductIds = new Set(
          [...matchingProductIds].filter(id => groupMatchingIds.has(id))
        );
      }

      const matchingList = Array.from(matchingProductIds);
      const matchingObjectAndStringIds = [
        ...matchingList,
        ...matchingList.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      ];
      query._id = { $in: matchingObjectAndStringIds };
      productsQuery = Product.find(query).populate(
        "brand",
        "brand_name brand_slug",
      );
    }

    /* --------------------------------------------------
       6️⃣ Sort (same default as /api/product/filter: quantity high → low)
          + Pagination
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
       7️⃣ DYNAMIC FILTERS (Faceted aggregation)
    -------------------------------------------------- */
    const finalFilteredProductIds = await Product.distinct('_id', query);
    const finalFilteredProductIdStrings = finalFilteredProductIds.map(id => id.toString());

    let selectedFiltersByGroup = {};
    if (filterIds.length > 0) {
      const validFilterIds = filterIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      const selectedFilterDocs = await Filter.find({ _id: { $in: validFilterIds } })
        .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
        .lean();
      selectedFilterDocs.forEach(f => {
        const groupId = f.filter_group?._id?.toString() || "other";
        if (!selectedFiltersByGroup[groupId]) selectedFiltersByGroup[groupId] = [];
        selectedFiltersByGroup[groupId].push(f._id.toString());
      });
    }

    const filterAggMap = {};

    // Base query without filterIds (only category, brand, price, status)
    const baseFilterQuery = {
      status: "Active",
      brand: { $in: [find_brand._id, brandIdStr] },
      $and: [
        categoryMatchClause, 
        priceClause,
      ],
    };

    if (filterIds.length > 0) {
      for (const [groupId, groupFilterIds] of Object.entries(selectedFiltersByGroup)) {
        let baseIds = await Product.distinct('_id', baseFilterQuery);
        let baseIdStrings = baseIds.map(id => id.toString());

        for (const [otherGroupId, otherGroupFilterIds] of Object.entries(selectedFiltersByGroup)) {
          if (otherGroupId === groupId) continue;

          const otherGroupObjIds = otherGroupFilterIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

          const otherGroupPF = await ProductFilter.find({
            product_id: { $in: [...baseIdStrings, ...baseIds] },
            filter_id: { $in: [...otherGroupFilterIds, ...otherGroupObjIds] }
          }).lean();

          const otherMatchIds = new Set(otherGroupPF.map(pf => pf.product_id.toString()));
          baseIds = baseIds.filter(id => otherMatchIds.has(id.toString()));
          baseIdStrings = baseIds.map(id => id.toString());
        }

        const agg = await ProductFilter.aggregate([
          {
            $match: {
              $or: [
                { product_id: { $in: baseIdStrings } },
                { product_id: { $in: baseIds } },
              ],
            }
          },
          { $group: { _id: "$filter_id", count: { $sum: 1 } } }
        ]);

        agg.forEach(item => {
          filterAggMap[item._id.toString()] = item.count;
        });
      }
    }

    // Standard agg for all filters based on final filtered products
    const filterAgg = await ProductFilter.aggregate([
      {
        $match: {
          $or: [
            { product_id: { $in: finalFilteredProductIdStrings } },
            { product_id: { $in: finalFilteredProductIds } },
          ],
        },
      },
      { $group: { _id: "$filter_id", count: { $sum: 1 } } },
    ]);

    filterAgg.forEach(item => {
      if (!filterAggMap[item._id.toString()]) {
        filterAggMap[item._id.toString()] = item.count;
      }
    });

    const filterIdList = [
      ...new Set([
        ...Object.keys(filterAggMap),
        ...filterAgg.map(f => f._id.toString()),
        ...filterIds
      ])
    ].filter(id => mongoose.Types.ObjectId.isValid(id));

    const filterDocs = await Filter.find({ _id: { $in: filterIdList } })
      .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
      .lean();

    const filtersWithGroup = filterDocs
      .map(f => ({
        ...f,
        filter_group_name: f.filter_group?.filtergroup_name || "Other",
        filter_group_id: f.filter_group?._id?.toString() || "other",
        count: filterAggMap[f._id.toString()] || 0,
      }))
      .filter(f => f.count > 0 || filterIds.includes(f._id.toString()));

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
