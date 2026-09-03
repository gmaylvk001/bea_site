// app/api/blogs/add/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

async function saveFile(file, folder) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const dir = path.join(process.cwd(), `public/uploads/blogs`);

    // Make sure the directory exists
    await mkdir(dir, { recursive: true });

    const filePath = path.join(dir, fileName);
    await writeFile(filePath, buffer);
    return `/uploads/blogs/${fileName}`;
  } catch (err) {
    console.error(`Error saving file ${file?.name}:`, err);
    throw new Error(`File upload failed (${err.message}). Ensure server filesystem allows write access to public/uploads/blogs.`);
  }
}

async function generateUniqueSlug(name) {
  if (!name || typeof name !== "string") return `blog-${Date.now()}`;
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) slug = `blog-${Date.now()}`;

  const existing = await Blog.findOne({ blog_slug: slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }
  return slug;
}

export async function POST(req) {
  try {
    await dbConnect();

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { name, description, category, status, video, meta_title, meta_description, meta_keyword } = await req.json();

      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Blog title (name) is required" },
          { status: 400 }
        );
      }

      if (!category) {
        return NextResponse.json(
          { success: false, error: "Blog category is required" },
          { status: 400 }
        );
      }

      const slug = await generateUniqueSlug(name);

      const newBlog = new Blog({
        blog_name: name.trim(),
        blog_slug: slug,
        description: description || "",
        category,
        status: status || "Active",
        video: video || "",
        meta_title: meta_title || "",
        meta_description: meta_description || "",
        meta_keyword: meta_keyword || "",
      });

      await newBlog.save();
      return NextResponse.json(
        { success: true, message: "Blog added successfully", data: newBlog },
        { status: 201 }
      );
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const name        = formData.get("name");
      const description = formData.get("description") || "";
      const category    = formData.get("category");
      const status      = formData.get("status") || "Active";
      const image       = formData.get("image");   // file upload
      const video       = formData.get("video");   // can be a file OR a URL string
      const meta_title       = formData.get("meta_title") || "";
      const meta_description = formData.get("meta_description") || "";
      const meta_keyword     = formData.get("meta_keyword") || "";

      if (!name || !String(name).trim()) {
        return NextResponse.json(
          { success: false, error: "Blog title (name) is required" },
          { status: 400 }
        );
      }

      if (!category) {
        return NextResponse.json(
          { success: false, error: "Blog category is required" },
          { status: 400 }
        );
      }

      let imageUrl = "";
      let videoUrl = "";

      // Handle image upload
      if (image && typeof image === "object" && image.name) {
        imageUrl = await saveFile(image, "blog_img");
      }

      // Handle video — if it's a File object upload it, if it's a plain string treat it as a URL
      if (video) {
        if (typeof video === "object" && video.name) {
          videoUrl = await saveFile(video, "blog_vid");
        } else if (typeof video === "string" && video.trim() !== "") {
          videoUrl = video.trim(); // YouTube / Vimeo URL
        }
      }

      const slug = await generateUniqueSlug(String(name));

      const newBlog = new Blog({
        blog_name: String(name).trim(),
        blog_slug: slug,
        description: String(description),
        category,
        status: String(status),
        image: imageUrl,
        video: videoUrl,
        meta_title: String(meta_title),
        meta_description: String(meta_description),
        meta_keyword: String(meta_keyword),
      });

      await newBlog.save();
      return NextResponse.json(
        { success: true, message: "Blog added successfully", data: newBlog },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid Content-Type header" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Blog POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

