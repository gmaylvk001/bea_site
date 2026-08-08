import {
  getBaseUrl,
  urlEntry,
  wrapUrlset,
  xmlResponse,
  STATIC_PAGES,
} from "@/lib/sitemap";

export async function GET() {
  try {
    const baseUrl = getBaseUrl();

    const entries = STATIC_PAGES.map(({ path, priority }) =>
      urlEntry(`${baseUrl}${path}`, {
        changefreq: "monthly",
        priority,
      })
    ).join("");

    return xmlResponse(wrapUrlset(entries));
  } catch (error) {
    console.error("Sitemap pages error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
