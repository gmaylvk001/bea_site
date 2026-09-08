import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import ecom_category_info from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

async function getAllSubCategoryIds(categoryId) {
  if (!categoryId) return [];
  const subCategories = await ecom_category_info
    .find({ parentid: categoryId })
    .select('_id')
    .lean();
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
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || [];
    const subcategoryIds = searchParams.get('subcategoryIds')?.split(',').filter(Boolean) || [];
    const brandIds = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterIds = searchParams.get('filters')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'featured';

    // 1️⃣ Brand match
    const validBrandObjectIds = brandIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    const allBrandIds = [...brandIds, ...validBrandObjectIds];

    let brandClause = {};
    if (allBrandIds.length > 0) {
      brandClause.brand = { $in: allBrandIds };
    }

    // 2️⃣ Category & Subcategory resolution (expand all children in tree)
    let categoryMatchClause = null;
    if (subcategoryIds.length > 0) {
      let expandedIds = [];
      for (const catId of subcategoryIds) {
        const subIds = await getAllSubCategoryIds(catId);
        expandedIds = [...expandedIds, ...subIds];
      }
      const uniqueIds = [...new Set(expandedIds)];
      const objectAndStringIds = [
        ...uniqueIds.map(id => id.toString()),
        ...uniqueIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      ];
      categoryMatchClause = {
        $or: [
          { category: { $in: objectAndStringIds } },
          { sub_category: { $in: objectAndStringIds } },
        ]
      };
    } else if (categoryIds.length > 0) {
      let expandedIds = [];
      for (const catId of categoryIds) {
        const subIds = await getAllSubCategoryIds(catId);
        expandedIds = [...expandedIds, ...subIds];
      }
      const uniqueIds = [...new Set(expandedIds)];
      const objectAndStringIds = [
        ...uniqueIds.map(id => id.toString()),
        ...uniqueIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id))
      ];
      categoryMatchClause = {
        $or: [
          { category: { $in: objectAndStringIds } },
          { sub_category: { $in: objectAndStringIds } },
        ]
      };
    }

    // 3️⃣ Price range filter (considers special_price priority)
    const priceClause = {
      $or: [
        { 
          $and: [
            { special_price: { $nin: [null, 0] } },
            { special_price: { $gte: minPrice, $lte: maxPrice } }
          ]
        },
        { 
          $and: [
            { $or: [{ special_price: null }, { special_price: 0 }] },
            { price: { $gte: minPrice, $lte: maxPrice } }
          ]
        }
      ]
    };

    // 4️⃣ Base query
    const baseFilterQuery = {
      status: "Active",
      ...brandClause,
      $and: [
        ...(categoryMatchClause ? [categoryMatchClause] : []),
        priceClause
      ]
    };

    let query = { ...baseFilterQuery };
    let productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');

    // 5️⃣ Apply product filters (OR within group, AND across groups)
    if (filterIds.length > 0) {
      const preFilterProductIds = await Product.distinct('_id', query);
      const preFilterIdStrings = preFilterProductIds.map(id => id.toString());

      const validFilterIds = filterIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      const selectedFilterDocs = await Filter.find({ _id: { $in: validFilterIds } })
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
      productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');
    }

    // 6️⃣ Sort and Pagination
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

      const brandDocs = await Brand.find({
        _id: { $in: products.map(p => p.brand).filter(Boolean) }
      }).lean();
      const brandMap = {};
      brandDocs.forEach(b => { brandMap[b._id.toString()] = b; });
      products = products.map(p => ({
        ...p,
        brand: p.brand ? (brandMap[p.brand.toString()] || p.brand) : null
      }));
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

    // 7️⃣ Dynamic filters (Faceted aggregation)
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
        hasPrev: page > 1
      },
      filters: filtersWithGroup
    });
  } catch (error) {
    console.error('Error in /api/product/filter/brand/main:', error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}