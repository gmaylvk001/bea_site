import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
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
      brand_slug: { $exists: true, $ne: "" },
    };

    const total = await Brand.countDocuments(filter);
    const { skip, limit } = parseFromTo(request.nextUrl.searchParams, total);

    const brands = await Brand.find(filter, {
      brand_slug: 1,
      updatedAt: 1,
    })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const entries = brands
      .map((b) =>
        urlEntry(`${baseUrl}/brand/${b.brand_slug}`, {
          changefreq: "weekly",
          priority: "0.7",
          lastmod: b.updatedAt || new Date(),
        })
      )
      .join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap brands error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
