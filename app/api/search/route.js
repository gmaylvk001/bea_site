import { NextResponse } from 'next/server';
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

// Ensure logs appear in Node runtime (useful locally and on Node server)
export const runtime = 'nodejs';

// Add a small helper to safely escape user-provided regex input
function escapeRegExp(str = '') {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
   const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 12;
  const skip = (page - 1) * limit;
 
  try {
    console.log('[API /api/search] Handler invoked at', new Date().toISOString());
    console.log('Search query:', query, 'Category:', category);

    await dbConnect();
    
    const searchFilter = { status: "Active" };
    // Text search (escaped for safety)
    if (query) {
      const safeQuery = escapeRegExp(query);
      const regex = new RegExp(safeQuery, 'i');
      searchFilter.$or = [
        { name: regex },
        { item_code: regex },
        { search_keywords: regex }
      ];
    }

    // Find category by category_name, then filter products by md5_cat_name
    if (category && category !== 'All Categories') {
      console.log('Searching in category:', category);
      let search_category = '';
        if(category === "Televisions" ){
          search_category ="Television";
        }else if(category === "Computers & Laptops" ){
          search_category ="Laptops";
        }else if(category === "Mobiles & Accessories" ){
          search_category ="Mobile Phones";
        }else if(category === "Gadgets" ){
          search_category ="Gadget";
        }else if(category === "Accessories" ){
          search_category ="Accessory";
        }else if(category === "Sound Systems" ){
          search_category = "Sound System";
        }
        let categoryDoc = await Category.findOne({
          category_name: search_category || category,
          status: "Active"
        })
        .select('_id')
        .lean();

      if (!categoryDoc) {
        console.log('[API /api/search] No category match, returning 0 products');
        return NextResponse.json([], {
          headers: { 'x-api-route': 'search', 'cache-control': 'no-store' },
        });
      }

    console.log('category_id:', categoryDoc._id);

    if (category === "Large Appliance" || category === "Small Appliances") {
            const largeApplianceDocs = await Category.find({
          parentid: categoryDoc._id,
          status: "Active",
        })
          .select('_id')
          .lean();

        if (largeApplianceDocs.length > 0) {
          console.log(
            'large_appliance_ids:',
            largeApplianceDocs.map(doc => doc._id)
          );
          // If multiple subcategories exist, include all in the filter
          searchFilter.category = { $in: largeApplianceDocs.map(doc => doc._id) };
        } else {
          // Fallback to the main category if no subcategories found
          searchFilter.category = categoryDoc._id;
        }

    } else {
      searchFilter.category = categoryDoc._id;
    }
  }

//console.log(searchFilter);
const allbrand = await Product.find(searchFilter).select('brand');
const total = await Product.countDocuments(searchFilter);
    const products = await Product.find(searchFilter)
      .sort({ createdAt: -1 })
      .lean().skip(skip)
      .limit(limit);

    console.log('[API /api/search] Returning products count:', products.length);
    /*
    return NextResponse.json(products, {
      headers: {
        'x-api-route': 'search',
        'cache-control': 'no-store'
      }
    });
*/
    return NextResponse.json({
      products,
      allbrand,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch(error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500, headers: { 'x-api-route': 'search', 'cache-control': 'no-store' } }
    );
  }
}