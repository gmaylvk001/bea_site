// app/api/blogs/get/route.js
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import "@/models/ecom_category_info";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const slug       = searchParams.get("slug");    // ?slug=some-slug  → single blog
    const withVideo  = searchParams.get("video");   // ?video=true      → only blogs with video
    const isAdmin    = searchParams.get("admin") === "true"; // ?admin=true → fetch all including inactive

    // ── Single blog by slug ──────────────────────────────────────────────────
    if (slug) {
      const query = { blog_slug: slug };
      if (!isAdmin) {
        query.status = "Active";
      }

      const blog = await Blog.findOne(query)
        .populate("category")
        .lean();

      if (!blog) {
        return Response.json({ success: false, error: "Blog not found" }, { status: 404 });
      }
      return Response.json({ success: true, data: blog });
    }

    // ── All blogs (with optional video filter) ───────────────────────────────
    const query = {};
    if (!isAdmin) {
      query.status = "Active";
    }

    if (withVideo === "true") {
      query.video = { $exists: true, $ne: "" };
    }

    const blogs = await Blog.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ success: true, data: blogs || [] });

  } catch (error) {
    console.error("Error fetching blogs:", error);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

