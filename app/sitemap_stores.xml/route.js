import dbConnect from "@/lib/db";
import Store from "@/models/store";
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
    };

    const total = await Store.countDocuments(filter);
    const { skip, limit } = parseFromTo(request.nextUrl.searchParams, total);

    const stores = await Store.find(filter, {
      slug: 1,
      updatedAt: 1,
    })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const entries = stores
      .map((s) =>
        urlEntry(`${baseUrl}/store/${s.slug}`, {
          changefreq: "weekly",
          priority: "0.7",
          lastmod: s.updatedAt || new Date(),
        })
      )
      .join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap stores error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
