import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { attachVariantGroupToProduct } from "@/lib/variantGroup";
import { withValidPrice } from "@/lib/productPrice";

export async function getProductBySlug(slug, { includeVariantGroup = false } = {}) {
  if (!slug) return null;
  await dbConnect();

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {}

  const candidates = Array.from(new Set([slug, decodedSlug])).filter(Boolean);
  const conditions = [{ slug: { $in: candidates } }];
  const validIds = candidates.filter((c) => /^[0-9a-fA-F]{24}$/.test(c));
  if (validIds.length > 0) {
    conditions.push({ _id: { $in: validIds } });
  }

  const query = conditions.length === 1 ? conditions[0] : { $or: conditions };

  const product = await Product.findOne(withValidPrice({
    ...query,
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
