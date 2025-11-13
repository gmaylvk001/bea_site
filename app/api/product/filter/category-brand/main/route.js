import dbConnect from "@/lib/db";
import Product from "@/models/product";
import ProductFilter from "@/models/ecom_productfilter_info";
import ecom_category_info from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const maincategoryId = searchParams.get('maincategoryId')?.split(',') || [];
    const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
    let categorySlug = searchParams.get('categorySlug') || null;
    const brandSlug = searchParams.get('brandSlug') || null;
    const subcategoryIds = searchParams.get('subcategoryIds')?.split(',') || [];
    const brandIds = searchParams.get('brands')?.split(',') || [];
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0;
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || 1000000;
    const filterIds = searchParams.get('filters')?.split(',') || [];
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;


    // Base query (will be replaced once brand/category are resolved)
    let query = { status: "Active" };

    // Handle category and subcategory filters
    if (categoryIds.length > 0 || subcategoryIds.length > 0) {
      query.$or = [];
      
      if (categoryIds.length > 0) {
        query.$or.push({ category: { $in: categoryIds } });
      }else{
        query.$or.push({ category: { $in: maincategoryId } });
      }
      
      if (subcategoryIds.length > 0) {
        query.$or.push({ sub_category: { $in: subcategoryIds } });
      }
    }

      if (maincategoryId.length > 0) {
        query.$or = [];
        query.$or.push({ category: { $in: maincategoryId } });
      }

    // Add brand filters if any
    if (brandIds.length > 0) {
      query.brand = { $in: brandIds };
    }

    console.log(query);
    if( categorySlug === "televisions" ){
      categorySlug = "television";
    }else if( categorySlug === "computers-laptops" ){
      categorySlug = "computers-laptops";
    }else if( categorySlug === "mobiles-accessories" ){
      categorySlug = "mobiles-accessories";
    }else if( categorySlug === "gadgets" ){
      categorySlug = "gadgets";
    }else if( categorySlug === "accessories" ){
      categorySlug = "accessories";
    }else if( categorySlug === "sound-systems" ){
      categorySlug = "accessories";
    }

    // REPLACED: resolve category as array for large-appliance/small-appliances and build categoryIdsArray
    let find_category;
    let categoryIdsArray = [];
    if (categorySlug === "large-appliance" || categorySlug === "small-appliances") {
      const parentCat = await ecom_category_info.findOne({ category_slug: categorySlug, status: "Active" });
      if (!parentCat) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }
      const childCats = await ecom_category_info.find({ parentid: parentCat?._id, status: "Active" });
      categoryIdsArray = [parentCat._id.toString(), ...childCats.map(c => c._id.toString())];
      find_category = parentCat;
    } else {
      find_category = await ecom_category_info.findOne({ category_slug: categorySlug ,status: "Active"});
      if (!find_category) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }
      categoryIdsArray = [find_category._id.toString()];
    }

    const find_brand = await Brand.findOne({ brand_slug: brandSlug ,status: "Active"});
    if (!find_brand) {
      return Response.json({ error: "Brand not found" }, { status: 404 });
    }

    // Price range clause (special_price takes precedence when present)
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

   // This part is already correct in your filter API
// In /api/product/filter/category-brand/main/
query = {
  status: "Active",
  brand: find_brand._id.toString(),
  $and: [
    {
      $or: [
        { category: { $in: categoryIdsArray } },
        { sub_category: { $in: categoryIdsArray } }
      ]
    },
    priceClause,
    {
      $and: [
        {
          $or: [
            { 
              $and: [
                { quantity: { $gt: 0 } },
                { stock_status: "In Stock" }
              ]
            },
            {
              $and: [
                { quantity: { $exists: false } },
                { stock_status: "In Stock" }
              ]
            }
          ]
        }
      ]
    }
  ]
};


    let productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');

    // Apply additional filters if any (must match all filterIds)
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

      const filteredProductIds = productIds.filter(id => {
        const productId = id.toString();
        const productFilterIds = filtersByProduct[productId] || new Set();
        return filterIds.every(fid => productFilterIds.has(fid));
      });

      query._id = { $in: filteredProductIds };
      productsQuery = Product.find(query).populate('brand', 'brand_name brand_slug');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    const products = await productsQuery
      .skip(skip)
      .limit(limit)
      .lean();


    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    
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
    console.error('Error in /api/product/filter/category-brand:', error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}