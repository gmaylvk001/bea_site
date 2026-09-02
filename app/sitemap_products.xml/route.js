import dbConnect from "@/lib/db";
import Product from "@/models/product";
import {
  getBaseUrl,
  urlEntry,
  wrapUrlset,
  xmlResponse,
  parseFromTo,
} from "@/lib/sitemap";

export async function GET(request) {
  try {
    const baseUrl = getBaseUrl();
    await dbConnect();

    const filter = {
      status: "Active",
      slug: { $exists: true, $ne: "" },
      price: { $gt: 0 },
    };

    const total = await Product.countDocuments(filter);
    const { skip, limit } = parseFromTo(request.nextUrl.searchParams, total);

    const products = await Product.find(filter, {
      slug: 1,
      updatedAt: 1,
    })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const entries = products
      .map((p) =>
        urlEntry(`${baseUrl}/product/${p.slug}`, {
          changefreq: "daily",
          priority: "0.8",
          lastmod: p.updatedAt || new Date(),
        })
      )
      .join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap products error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
