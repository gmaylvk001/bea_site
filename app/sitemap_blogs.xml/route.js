import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
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
      blog_slug: { $exists: true, $ne: "" },
    };

    const total = await Blog.countDocuments(filter);
    const { skip, limit } = parseFromTo(request.nextUrl.searchParams, total);

    const blogs = await Blog.find(filter, {
      blog_slug: 1,
      updatedAt: 1,
    })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const entries = blogs
      .map((b) =>
        urlEntry(`${baseUrl}/blog/${b.blog_slug}`, {
          changefreq: "weekly",
          priority: "0.6",
          lastmod: b.updatedAt || new Date(),
        })
      )
      .join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap blogs error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
