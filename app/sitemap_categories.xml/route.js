import {
  getBaseUrl,
  urlEntry,
  wrapUrlset,
  xmlResponse,
  parseFromTo,
  getActiveCategories,
  buildCategoryPath,
} from "@/lib/sitemap";

export async function GET(request) {
  try {
    const baseUrl = getBaseUrl();
    const categories = await getActiveCategories();
    const { skip, limit } = parseFromTo(
      request.nextUrl.searchParams,
      categories.length
    );

    const byId = new Map(categories.map((c) => [c._id.toString(), c]));
    const slice = categories.slice(skip, skip + limit);

    const entries = slice
      .map((c) => {
        const path = buildCategoryPath(c, byId);
        if (!path) return "";
        const depth = path.split("/").length - 2; // 1=main, 2=sub, 3=child
        const priority = depth >= 3 ? "0.6" : depth === 2 ? "0.65" : "0.7";
        return urlEntry(`${baseUrl}${path}`, {
          changefreq: "monthly",
          priority,
          lastmod: c.updatedAt || new Date(),
        });
      })
      .join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap categories error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
