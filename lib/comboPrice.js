import connectDB from "@/lib/db";
import Product from "@/models/product";
import { getSellingPrice } from "@/lib/productPrice";

/**
 * Calculates combined individual MRP and selling price directly from trusted DB records.
 * Ensures:
 * - Duplicate product IDs are rejected or deduplicated
 * - Prices are derived strictly on the server
 */
export async function calculateComboTotals(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {
      combined_mrp: 0,
      combined_selling_price: 0,
      products: [],
      error: "At least one product is required for a combo.",
    };
  }

  // Deduplicate IDs while preserving order
  const uniqueIds = Array.from(new Set(productIds.map(String)));
  if (uniqueIds.length !== productIds.length) {
    return {
      combined_mrp: 0,
      combined_selling_price: 0,
      products: [],
      error: "Duplicate products are not allowed in a combo.",
    };
  }

  await connectDB();
  const dbProducts = await Product.find({
    _id: { $in: uniqueIds },
  })
    .select("_id name price special_price quantity stock_status images item_code")
    .lean();

  if (dbProducts.length !== uniqueIds.length) {
    return {
      combined_mrp: 0,
      combined_selling_price: 0,
      products: [],
      error: "One or more selected products could not be found in the database.",
    };
  }

  let totalMRP = 0;
  let totalSellingPrice = 0;

  for (const prod of dbProducts) {
    const mrp = Number(prod.price) > 0 ? Number(prod.price) : Number(prod.special_price) || 0;
    const selling = getSellingPrice(prod) ?? mrp;

    totalMRP += mrp;
    totalSellingPrice += selling;
  }

  return {
    combined_mrp: Math.round(totalMRP),
    combined_selling_price: Math.round(totalSellingPrice),
    products: dbProducts,
    error: null,
  };
}
