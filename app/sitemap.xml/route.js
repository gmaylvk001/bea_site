import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";
import Blog from "@/models/ecom_blog_info";
import Store from "@/models/store";
import {
  getBaseUrl,
  sitemapEntry,
  wrapSitemapIndex,
  xmlResponse,
  SITEMAP_CHUNK_SIZE,
} from "@/lib/sitemap";

async function countActive(Model, filter) {
  return Model.countDocuments(filter);
}

function chunkRanges(total, chunkSize = SITEMAP_CHUNK_SIZE) {
  if (total <= 0) return [];
  const ranges = [];
  for (let from = 1; from <= total; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, total);
    ranges.push({ from, to });
  }
  return ranges;
}

export async function GET() {
  try {
    const baseUrl = getBaseUrl();
    await dbConnect();

    const now = new Date();

    const [categoryCount, brandCount, storeCount, blogCount, productCount] =
      await Promise.all([
        countActive(Category, {
          status: "Active",
          category_slug: { $exists: true, $ne: "" },
        }),
        countActive(Brand, {
          status: "Active",
          brand_slug: { $exists: true, $ne: "" },
        }),
        countActive(Store, {
          status: "Active",
          slug: { $exists: true, $ne: "" },
        }),
        countActive(Blog, {
          status: "Active",
          blog_slug: { $exists: true, $ne: "" },
        }),
        countActive(Product, {
          status: "Active",
          slug: { $exists: true, $ne: "" },
        }),
      ]);

    const entries = [sitemapEntry(`${baseUrl}/sitemap_pages.xml`, now)];

    for (const { from, to } of chunkRanges(categoryCount)) {
      entries.push(
        sitemapEntry(
          `${baseUrl}/sitemap_categories.xml?from=${from}&to=${to}`,
          now
        )
      );
    }

    for (const { from, to } of chunkRanges(brandCount)) {
      entries.push(
        sitemapEntry(
          `${baseUrl}/sitemap_brands.xml?from=${from}&to=${to}`,
          now
        )
      );
    }

    for (const { from, to } of chunkRanges(storeCount)) {
      entries.push(
        sitemapEntry(
          `${baseUrl}/sitemap_stores.xml?from=${from}&to=${to}`,
          now
        )
      );
    }

    for (const { from, to } of chunkRanges(blogCount)) {
      entries.push(
        sitemapEntry(`${baseUrl}/sitemap_blogs.xml?from=${from}&to=${to}`, now)
      );
    }

    for (const { from, to } of chunkRanges(productCount)) {
      entries.push(
        sitemapEntry(
          `${baseUrl}/sitemap_products.xml?from=${from}&to=${to}`,
          now
        )
      );
    }

    return xmlResponse(wrapSitemapIndex(entries.join("")));
  } catch (error) {
    console.error("Sitemap index error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
