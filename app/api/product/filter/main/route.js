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
    const filterIds = searchParams.get('filters')?.split(',') || [];
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

    // Apply additional filters if any
    if (filterIds.length > 0) {
      //console.log('🔧 Applying additional filters:', filterIds);
      
      const productIds = await productsQuery.distinct('_id');
     // console.log('📦 Products before filter application:', productIds.length);
      
      if (productIds.length > 0) {
        const productFilters = await ProductFilter.find({
          product_id: { $in: productIds },
          filter_id: { $in: filterIds }
        });
        
        console.log('🎛️ Product filters found:', productFilters.length);
        
        const filtersByProduct = productFilters.reduce((acc, pf) => {
          const productId = pf.product_id.toString();
          if (!acc[productId]) acc[productId] = new Set();
          acc[productId].add(pf.filter_id.toString());
          return acc;
        }, {});
        
        // Get only product IDs that match ANY of the filters (using some instead of every)
        const filteredProductIds = productIds.filter(id => {
          const productId = id.toString();
          const productFilterIds = filtersByProduct[productId] || new Set();
          return filterIds.some(fid => productFilterIds.has(fid));
        });
        
        console.log('✅ Products after filter application:', filteredProductIds.length);
        
        // Update the query to only include filtered products
        query._id = { $in: filteredProductIds };
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
        hasMore: page < totalPages
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