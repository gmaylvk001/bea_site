import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";
import { getActiveBrandsForSearch } from "@/lib/brandSearch";
import {
  buildSearchOrConditions,
  getBrandSearchConstraints,
  scoreProductMatch,
  escapeRegExp,
} from "@/lib/searchMatch";

function buildBrandMatchConditions(brandConstraints) {
  if (!brandConstraints) return [];
  const escapedName = escapeRegExp(brandConstraints.brandName || "");
  const escapedSlug = escapeRegExp(brandConstraints.brandSlug || "");
  const conditions = [];

  if (brandConstraints.brandId) {
    conditions.push({ brand: brandConstraints.brandId });
  }
  if (brandConstraints.brandName) {
    conditions.push({ brand: brandConstraints.brandName });
    if (escapedName) {
      conditions.push({ brand: new RegExp(`^${escapedName}$`, "i") });
      conditions.push({ name: new RegExp(`\\b${escapedName}\\b`, "i") });
    }
  }
  if (brandConstraints.brandSlug && escapedSlug) {
    conditions.push({ brand: brandConstraints.brandSlug });
    conditions.push({ brand: new RegExp(`^${escapedSlug}$`, "i") });
  }

  return conditions;
}

function buildProductFindQuery(query, brands) {
  const base = { status: "Active" };
  const brandConstraints = getBrandSearchConstraints(query, brands);

  if (brandConstraints?.mode === "brand_product") {
    const brandConditions = buildBrandMatchConditions(brandConstraints);
    const productConditions = buildSearchOrConditions(brandConstraints.productQuery, []);

    return {
      ...base,
      $and: [
        { $or: brandConditions },
        { $or: productConditions },
      ],
    };
  }

  if (brandConstraints?.mode === "exact") {
    const brandConditions = buildBrandMatchConditions(brandConstraints);
    return {
      ...base,
      $or: brandConditions,
    };
  }

  return {
    ...base,
    $or: buildSearchOrConditions(query, brands),
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length < 1) return NextResponse.json([]);

  try {
    await dbConnect();
    const brands = await getActiveBrandsForSearch();
    const findQuery = buildProductFindQuery(q, brands);
    const brandConstraints = getBrandSearchConstraints(q, brands);
    const limit = brandConstraints ? 200 : q.length <= 2 ? 120 : 80;

    const products = await Product.find(findQuery)
      .select(
        "_id name item_code model_number images price special_price slug search_keywords sub_category_new_name category_new brand brand_code"
      )
      .limit(limit)
      .lean();

    const ranked = products
      .map((product) => ({
        ...product,
        _score: scoreProductMatch(product, q, { brands }),
      }))
      .filter((product) => product._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12)
      .map(({ _score, ...product }) => product);

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
