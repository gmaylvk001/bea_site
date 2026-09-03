// app/api/blogs/delete/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import path from "path";
import { unlink } from "fs/promises";

async function deleteLocalFile(relativePath) {
  if (!relativePath || typeof relativePath !== "string" || !relativePath.startsWith("/uploads/")) return;
  try {
    const absPath = path.join(process.cwd(), "public", relativePath);
    await unlink(absPath);
  } catch (err) {
    // File may already be deleted
  }
}

export async function DELETE(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    let blogId = searchParams.get('id');

    if (!blogId) {
      try {
        const body = await req.json();
        blogId = body.id || body.blogId;
      } catch (e) {
        // Ignore parse error
      }
    }

    if (!blogId) {
      return NextResponse.json({ success: false, error: "Blog ID is required" }, { status: 400 });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    // Clean up uploaded image/video if stored locally
    if (blog.image) await deleteLocalFile(blog.image);
    if (blog.video) await deleteLocalFile(blog.video);

    // Completely delete from database
    await Blog.findByIdAndDelete(blogId);

    return NextResponse.json(
      { success: true, message: "Blog deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Fallbacks for PUT / POST HTTP methods
export async function PUT(req) {
  return DELETE(req);
}

export async function POST(req) {
  return DELETE(req);
}