import {
  getBaseUrl,
  urlEntry,
  wrapUrlset,
  xmlResponse,
  parseFromTo,
  getBrandSitemapEntries,
} from "@/lib/sitemap";

export async function GET(request) {
  try {
    const baseUrl = getBaseUrl();
    const entries = await getBrandSitemapEntries(baseUrl);
    const { skip, limit } = parseFromTo(
      request.nextUrl.searchParams,
      entries.length
    );

    const xmlEntries = entries
      .slice(skip, skip + limit)
      .map((entry) =>
        urlEntry(entry.loc, {
          changefreq: entry.changefreq,
          priority: entry.priority,
          lastmod: entry.lastmod,
        })
      )
      .join("");

    return xmlResponse(wrapUrlset(xmlEntries));
  } catch (error) {
    console.error("Sitemap brands error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
