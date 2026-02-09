import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) throw new Error("BASE_URL not defined");

    await dbConnect();

    /* ---------------- STATIC PAGES ---------------- */
    const staticPages = [
      "",
      "/location",
      "/contact",
      "/wishlist",
      "/cart",
      "/privacypolicy",
      "/terms-and-condition",
      "/cancellation-refund-policy",
      "/shipping",
      "/aboutus",
      "/blog",
      "/faq",
      "/feedback",
      "/careers"
    ];

    const staticUrls = staticPages.map(
      (path) => `
      <url>
        <loc>${baseUrl}${path}</loc>
        <changefreq>monthly</changefreq>
        <priority>${path === "" ? "1.0" : "0.6"}</priority>
      </url>`
    ).join("");

    /* ---------------- CATEGORIES (RARE) ---------------- */
    const categories = await Category.find(
      { category_slug: { $exists: true, $ne: "" } },
      { category_slug: 1, updatedAt: 1 }
    ).lean();

    const categoryUrls = categories.map(
      (c) => `
      <url>
        <loc>${baseUrl}/category/${c.category_slug}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
        <lastmod>${(c.updatedAt || new Date()).toISOString()}</lastmod>
      </url>`
    ).join("");

    /* ---------------- PRODUCTS (FREQUENT) ---------------- */
    const products = await Product.find(
      { slug: { $exists: true, $ne: "" },status: "Active" },
      { slug: 1, updatedAt: 1 }
    ).lean();

    const productUrls = products.map(
      (p) => `
      <url>
        <loc>${baseUrl}/product/${p.slug}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
        <lastmod>${(p.updatedAt || new Date()).toISOString()}</lastmod>
      </url>`
    ).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${categoryUrls}
  ${productUrls}
  </urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // products update frequently
      },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
