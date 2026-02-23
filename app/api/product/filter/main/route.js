import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
   // console.log('🔍 API Request Params:', Object.fromEntries(searchParams.entries()));
    
    //const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
    const sub_category_new = searchParams.get('sub_category_new');
    const brandIds = searchParams.get('brands')?.split(',') || [];
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterGroupsParam = searchParams.get('filterGroups');
    let filterGroupsMap = {};
    if (filterGroupsParam) {
      try { filterGroupsMap = JSON.parse(filterGroupsParam); } catch (e) { filterGroupsMap = {}; }
    }
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const sort = searchParams.get('sort') || 'featured';

    //console.log('🎯 Category IDs:', categoryIds);
    //console.log('💰 Price Range:', minPrice, '-', maxPrice);

    // Build base query
    let query = { 
  status: "Active",
  quantity: { $gt: 0 } 
};

if (sub_category_new && typeof sub_category_new === "string") {
  query.sub_category_new = { 
    $regex: sub_category_new,
    $options: "i"
  };
}

    // Category filter - try different possible category fields
    /*
    if (categoryIds.length > 0) {
      query.$or = [
        { sub_category: { $in: categoryIds } },
        { category: { $in: categoryIds } },
        { main_category: { $in: categoryIds } }
      ];
    }
      */

    // Brand filter
    if (brandIds.length > 0) {
      query.brand = { $in: brandIds };
    }

    // Price range filter - FIXED VERSION
    query.$and = [
      {
        $or: [
          // Products with special_price in range
          { 
            $and: [
              { special_price: { $ne: null, $ne: 0 } },
              { special_price: { $gte: minPrice, $lte: maxPrice } }
            ]
          },
          // Products without special_price but regular price in range
          { 
            $and: [
              { $or: [{ special_price: null }, { special_price: 0 }] },
              { price: { $gte: minPrice, $lte: maxPrice } }
            ]
          }
        ]
      }
    ];

    //console.log('📝 Final Query:', JSON.stringify(query, null, 2));

    // First, let's check what products exist with just basic query
    /*
    const testProducts = await Product.find({ 
      status: "Active",
      quantity: { $gt: 0 }
    }).limit(5).lean();
    
    console.log('🧪 Sample products in DB:', testProducts.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      sub_category: p.sub_category,
      main_category: p.main_category,
      price: p.price,
      special_price: p.special_price
    })));
    */

    let productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');

    // Apply sorting based on parameter
    switch(sort) {
      case 'price-low-high':
        productsQuery = productsQuery.sort({ price: 1 });
        break;
      case 'price-high-low':
        productsQuery = productsQuery.sort({ price: -1 });
        break;
      case 'name-a-z':
        productsQuery = productsQuery.sort({ name: 1 });
        break;
      case 'name-z-a':
        productsQuery = productsQuery.sort({ name: -1 });
        break;
      case 'featured':
      default:
        productsQuery = productsQuery.sort({ createdAt: -1, _id: -1 });
        break;
    }

    // Apply product attribute filters (AND between groups, OR within group)
    if (Object.keys(filterGroupsMap).length > 0) {
      // Start with all products matching the base query (category + brand + price)
      let candidateIds = await productsQuery.distinct('_id');

      if (candidateIds.length > 0) {
        // Process each filter group — product must satisfy every group (AND)
        for (const groupFilterIds of Object.values(filterGroupsMap)) {
          // Within a group — product only needs to match one filter (OR)
          const matchingProductIds = await ProductFilter.find({
            product_id: { $in: candidateIds },
            filter_id: { $in: groupFilterIds }
          }).distinct('product_id');

          const matchingSet = new Set(matchingProductIds.map(id => id.toString()));
          // Intersect: keep only products that matched this group
          candidateIds = candidateIds.filter(id => matchingSet.has(id.toString()));

          if (candidateIds.length === 0) break; // no point checking further groups
        }

        query._id = { $in: candidateIds };
        productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');

        // Re-apply sorting
        switch(sort) {
          case 'price-low-high':
            productsQuery = productsQuery.sort({ price: 1 });
            break;
          case 'price-high-low':
            productsQuery = productsQuery.sort({ price: -1 });
            break;
          case 'name-a-z':
            productsQuery = productsQuery.sort({ name: 1 });
            break;
          case 'name-z-a':
            productsQuery = productsQuery.sort({ name: -1 });
            break;
          case 'featured':
          default:
            productsQuery = productsQuery.sort({ createdAt: -1, _id: -1 });
            break;
        }
      }
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const products = await productsQuery
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
/*
    console.log('📊 Final Results:', {
      productsFound: products.length,
      totalProducts,
      currentPage: page,
      totalPages
    });

    if (products.length > 0) {
      console.log('🎉 Sample product returned:', {
        name: products[0].name,
        price: products[0].price,
        special_price: products[0].special_price,
        category: products[0].category
      });
    }
*/
    return Response.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error in /api/product/filter:', error);
    return Response.json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
}