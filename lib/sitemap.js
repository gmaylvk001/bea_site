import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export function getBaseUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!baseUrl) throw new Error("BASE_URL not defined");
  return baseUrl;
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function urlEntry(loc, { changefreq, priority, lastmod } = {}) {
  return `
      <url>
        <loc>${escapeXml(loc)}</loc>
        ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
        ${priority ? `<priority>${priority}</priority>` : ""}
        ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
      </url>`;
}

export function sitemapEntry(loc, lastmod) {
  return `
  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
  </sitemap>`;
}

export function xmlResponse(body) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function wrapUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export function wrapSitemapIndex(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<!-- This is the parent sitemap linking to additional sitemaps for products, collections and pages as shown below. -->
${entries}
</sitemapindex>`;
}

/** Build /category/... path from parentid chain (main / sub / child). */
export function buildCategoryPath(category, byId) {
  const slugs = [];
  let current = category;
  const seen = new Set();

  while (current?.category_slug) {
    const id = current._id.toString();
    if (seen.has(id)) break;
    seen.add(id);

    slugs.unshift(current.category_slug);

    const parentId = current.parentid;
    if (!parentId || parentId === "none") break;

    current = byId.get(String(parentId));
    if (!current) break;
  }

  if (!slugs.length) return null;
  return `/category/${slugs.join("/")}`;
}

export async function getActiveCategories() {
  await dbConnect();
  return Category.find(
    {
      status: "Active",
      category_slug: { $exists: true, $ne: "" },
    },
    { category_slug: 1, parentid: 1, updatedAt: 1 }
  )
    .sort({ _id: 1 })
    .lean();
}

/** Parse 1-based inclusive from/to query params into skip/limit. */
export function parseFromTo(searchParams, total) {
  if (!total) return { skip: 0, limit: 0, from: 0, to: 0 };

  let from = parseInt(searchParams.get("from") || "1", 10);
  let to = parseInt(searchParams.get("to") || String(total), 10);

  if (!Number.isFinite(from) || from < 1) from = 1;
  if (!Number.isFinite(to) || to < from) to = from;
  if (to > total) to = total;

  return {
    from,
    to,
    skip: from - 1,
    limit: to - from + 1,
  };
}

export const STATIC_PAGES = [
  { path: "", priority: "1.0" },
  { path: "/location", priority: "0.6" },
  { path: "/contact", priority: "0.6" },
  { path: "/privacypolicy", priority: "0.6" },
  { path: "/terms-and-condition", priority: "0.6" },
  { path: "/cancellation-refund-policy", priority: "0.6" },
  { path: "/shipping", priority: "0.6" },
  { path: "/aboutus", priority: "0.6" },
  { path: "/blog", priority: "0.6" },
  { path: "/feedback", priority: "0.6" },
  { path: "/careers", priority: "0.6" },
];

/** Max URLs recommended per sitemap file. */
export const SITEMAP_CHUNK_SIZE = 50000;
