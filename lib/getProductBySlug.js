import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { attachVariantGroupToProduct } from "@/lib/variantGroup";
import { withValidPrice } from "@/lib/productPrice";

export async function getProductBySlug(slug, { includeVariantGroup = false } = {}) {
  if (!slug) return null;
  await dbConnect();

  const product = await Product.findOne(withValidPrice({
    slug,
    status: "Active",
  })).lean();

  if (!product) return null;
  if (includeVariantGroup) {
    await attachVariantGroupToProduct(product);
  } else {
    product.variantGroup = null;
  }
  return product;
}
