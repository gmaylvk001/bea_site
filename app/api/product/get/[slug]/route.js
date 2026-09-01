import { NextResponse } from 'next/server';
import Product from '@/models/product';
import Filter from '@/models/ecom_filter_infos';
import dbConnect from '@/lib/db';
import { attachVariantGroupToProduct } from '@/lib/variantGroup';
import { withValidPrice } from '@/lib/productPrice';

export const dynamic = 'force-dynamic'; // Important for dynamic fetching

export async function GET(request, { params }) {
  try {
    // 1. Connect to database
    await dbConnect();
    
    // 2. Get slug from URL parameters
    const { slug } = await params;
    console.log('Fetching product for slug:', slug);

    const isObjectId = /^[a-f\d]{24}$/i.test(String(slug || ""));
    const productQuery = withValidPrice(
      isObjectId
        ? { $or: [{ slug }, { _id: slug }], status: "Active" }
        : { slug, status: "Active" }
    );

    const product = await Product.findOne(productQuery).lean();

    if (!product) {
      console.log('Product not found for slug:', slug);
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }
    let filters= [];

    // 4. Convert MongoDB ObjectId to string
    if (product._id) {
      product._id = product._id.toString();
      if (!isObjectId) {
        filters = await Filter.findOne({
          proudct_id: product._id
        });
        await attachVariantGroupToProduct(product);
      }
    }

    // 5. Return product data
    return NextResponse.json({
      success: true,
      data: product,
      filters: filters
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}