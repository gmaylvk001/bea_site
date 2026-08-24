import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { attachVariantGroupToProduct } from "@/lib/variantGroup";

export async function getProductBySlug(slug, { includeVariantGroup = true } = {}) {
  if (!slug) return null;
  await dbConnect();

  const product = await Product.findOne({
    slug,
    status: "Active",
  }).lean();

  if (!product) return null;
  if (includeVariantGroup) {
    await attachVariantGroupToProduct(product);
  } else {
    product.variantGroup = null;
  }
  return product;
}
