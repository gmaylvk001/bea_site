// api/categoryproduct/get/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CategoryProduct from "@/models/categoryproduct";
import Category from "@/models/ecom_category_info"; // Import the Category model
import Product from "@/models/product";

export async function GET() {
  try {
    await connectDB();
    
    // First get all active category products
    const categoryProducts = await CategoryProduct.find({ status: "Active" })
      .sort({ position: 1 })
      .lean();

    // Get all subcategory IDs and product IDs
    const subcategoryIds = categoryProducts.map(cp => cp.subcategoryId);
    const allProductIds = categoryProducts.flatMap(cp => cp.products || []);
    
    // Fetch all subcategories in one query
    const subcategories = await Category.find({
      _id: { $in: subcategoryIds }
    })
    .select('category_name category_slug parentid')
    .lean();

    // Create a map for quick subcategory lookup
    const subcategoryMap = {};
    subcategories.forEach(cat => {
      subcategoryMap[cat._id.toString()] = cat;
    });

    // Fetch all products that meet the criteria in one query
    const validProducts = await Product.find({
      _id: { $in: allProductIds },
      quantity: { $gt: 2 },
      special_price: { $gt: 2 }
    })
    .select('name slug images price special_price quantity stock_status brand')
    .lean();
    // Create a map for quick product lookup
    const productMap = {};
    validProducts.forEach(product => {
      productMap[product._id.toString()] = product;
    });

    // Combine the data
    const categoryProductsWithData = await Promise.all(
      categoryProducts.map(async (cp) => {
        const subcategory = subcategoryMap[cp.subcategoryId.toString()];
        const filteredProducts = await Product.find({
          _id: { $in: cp.products },
          quantity: { $gt: 0 },
          special_price: { $gt: 2 },
          $or: [
            { model_number: { $exists: false } },
            { model_number: { $exists: true, $ne: "" } }
          ]
        }).lean();
        return {
          ...cp,
          subcategoryId: subcategory,
          products: filteredProducts,
        };
      })
    );  


    // Filter out category products with no valid products
    const filteredCategoryProducts = categoryProductsWithData.filter(
      cp => cp.products && cp.products.length > 0
    );

    return NextResponse.json({ 
      ok: true, 
      data: filteredCategoryProducts ,
      validProducts:validProducts
    }, { status: 200 });
    
  } catch (err) {
    console.error("Error fetching category products:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}