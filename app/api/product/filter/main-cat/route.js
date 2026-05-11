import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import Brand from "@/models/ecom_brand_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    console.log(searchParams);
    const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
    const objectIdCategoryIds = categoryIds
  .filter(id => mongoose.Types.ObjectId.isValid(id))
  .map(id => new mongoose.Types.ObjectId(id));    

    const brandIds = searchParams.get('brands')?.split(',') || [];
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterIds = searchParams.get('filters')?.split(',') || [];
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 5;

const totalBeforeFilter = await Product.countDocuments({
  sub_category: { $in: objectIdCategoryIds },
  status: "Active",
  quantity: { $gt: 0 }
});
console.log("➡️ sub_category match count:", totalBeforeFilter);

const totalByMd5 = await Product.countDocuments({
  status: "Active", 
  stock_status: "In Stock",
  sub_category_new: { $regex: categoryIds[0] }
});
console.log("➡️ First categoryId as md5 test:", totalByMd5);
     
    // Base query - always filter by category
let query = { 
  sub_category: { $in: objectIdCategoryIds },
  status: "Active",
  $and: [
    { quantity: { $exists: true } },
    { quantity: { $ne: null } },
    { quantity: { $gt: 0 } }
  ]
};
    // Add brand filters if any
    if (brandIds.length > 0) {
      query.brand = { $in: brandIds };
    }
    
    // Price range filter (considers both price and special_price)
    query.$or = [
      { 
        $and: [
          { special_price: { $ne: null } },
          { special_price: { $gte: minPrice, $lte: maxPrice } }
        ]
      },
      { 
        $and: [
          { special_price: null },
          { special_price: { $gte: minPrice, $lte: maxPrice } }
        ]
      }
    ];
    
    // First fetch products matching brand and price filters
    // let products = await Product.find(query)
    //   .populate('brand', 'brand_name brand_slug')
    //   .lean();
    
    // // Apply additional filters if any
    // if (filterIds.length > 0) {
    //   const productIds = products.map(p => p._id);
      
    //   // Get all product-filter relationships that match our criteria
    //   const productFilters = await ProductFilter.find({
    //     product_id: { $in: productIds },
    //     filter_id: { $in: filterIds }
    //   });
    //   console.log(productFilters);
    //   // Group filters by product
    //   const filtersByProduct = productFilters.reduce((acc, pf) => {
    //     const productId = pf.product_id.toString();

    //     if (!acc[productId]) acc[productId] = new Set();
    //     acc[productId].add(pf.filter_id.toString());
    //     return acc;
    //   }, {});
    //   console.log("filtersByProduct",filtersByProduct);
    //   console.log("products",products);
    //   // Filter products to only those that have ALL selected filters
    //   products = products.filter(product => {
    //     const productId = product._id.toString();
    //     const productFilterIds = filtersByProduct[productId] || new Set();
    //    // return filterIds.every(fid => productFilterIds.has(fid));
    //    return filterIds.some(fid => productFilterIds.has(fid));
    //   });
    // }
    
    // return Response.json(products);
    let productsQuery = Product.find(query)
    .populate('brand', 'brand_name brand_slug');
  
  // Apply additional filters if any
  if (filterIds.length > 0) {
    const productIds = await productsQuery.distinct('_id');
    
    const productFilters = await ProductFilter.find({
      product_id: { $in: productIds },
      filter_id: { $in: filterIds }
    });
    
    const filtersByProduct = productFilters.reduce((acc, pf) => {
      const productId = pf.product_id.toString();
      if (!acc[productId]) acc[productId] = new Set();
      acc[productId].add(pf.filter_id.toString());
      return acc;
    }, {});
    
    // Get only product IDs that match all filters
    const filteredProductIds = productIds.filter(id => {
      const productId = id.toString();
      const productFilterIds = filtersByProduct[productId] || new Set();
      return filterIds.some(fid => productFilterIds.has(fid));
    });
    
    // Update the query to only include filtered products
    query._id = { $in: filteredProductIds };
    productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');
  }

 
    // Apply sorting: Products with quantity > 0 first, then quantity <= 0
    productsQuery = productsQuery.sort({ 
      price: -1, 
      _id: -1 
    });
  
  // Apply paginationn
  const skip = (page - 1) * limit;
  const products = await productsQuery
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Get total count for pagination info (optional)
  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

   const brandBaseQuery = {
      sub_category: { $in: objectIdCategoryIds },
      status: "Active",
      quantity: { $gt: 0 },
    };

    const allProductsForBrand = await Product.find(brandBaseQuery, { brand: 1 }).lean();
    const brandCountMap = {};
    allProductsForBrand.forEach((p) => {
      if (p.brand) {
        const key = p.brand.toString();
        brandCountMap[key] = (brandCountMap[key] || 0) + 1;
      }
    });
    const brandIdList = Object.keys(brandCountMap).filter(id => id && id !== "undefined");
    const brandDocs = await Brand.find({ _id: { $in: brandIdList } }).lean();
    const brandsWithCount = brandDocs
      .map((b) => ({ ...b, count: brandCountMap[b._id.toString()] || 0 }))
      .sort((a, b) => a.brand_name.localeCompare(b.brand_name));

    // ✅ Dynamic Product Filters — selected category-க்கு மட்டும்
    const baseProductIds = await Product.distinct("_id", brandBaseQuery);
    const baseProductIdStrings = baseProductIds.map(id => id.toString());

    const filterAgg = await ProductFilter.aggregate([
      {
        $match: {
          $or: [
            { product_id: { $in: baseProductIdStrings } },
            { product_id: { $in: baseProductIds } },
          ],
        },
      },
      { $group: { _id: "$filter_id", count: { $sum: 1 } } },
    ]);

    const filterIdList = filterAgg.map(f => f._id);
    const filterDocs = await Filter.find({ _id: { $in: filterIdList } })
      .populate({ path: "filter_group", select: "filtergroup_name", model: FilterGroup })
      .lean();

    const filtersWithGroup = filterDocs.map(f => ({
      ...f,
      filter_group_name: f.filter_group?.filtergroup_name || "Other",
      count: (filterAgg.find(fa => fa._id?.toString() === f._id?.toString()) || {}).count || 0,
    }));
  
  return Response.json({
    products,
    pagination: {
      currentPage: page,
      totalPages,
      totalProducts,
      hasNext: page < totalPages,  
      hasPrev: page > 1,    
      hasMore: page < totalPages
    },
      brands: brandsWithCount,
      filters: filtersWithGroup,
  });
  } catch (error) {
    console.error('Error in /api/product/filter:', error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}