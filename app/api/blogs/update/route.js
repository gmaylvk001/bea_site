import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import fs from "fs";
import path from "path";
import { writeFile, unlink } from "fs/promises";

export async function PUT(req) {
  try {
    // Connect to database
    await dbConnect();

    // Check content type
    const contentType = req.headers.get("content-type");

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (for file uploads)
      const formData = await req.formData();

      const id = formData.get("id");
      const name = formData.get("name");
      const description = formData.get("description");
      const category = formData.get("category");
      const status = formData.get("status");
      const image = formData.get("image");
      const existingImage = formData.get("existingImage");

      // Find the existing blog
      const existingBlog = await Blog.findById(id);
      if (!existingBlog) {
        return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
      }

      let imageUrl = existingImage;

      // Handle image upload if new image is provided
      if (image && image.name) {
        // Delete old image if it exists
        if (existingImage) {
          try {
            const oldImagePath = path.join(process.cwd(), "public", existingImage);
            await unlink(oldImagePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }

        // Save new image
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(image.name);
        const fileName = `blog_${Date.now()}${ext}`;
        const filePath = path.join(process.cwd(), "public/uploads/blogs", fileName);

        await writeFile(filePath, buffer);
        imageUrl = `/uploads/blogs/${fileName}`;
      }

      // Update the blog
      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        {
          blog_name: name,
          blog_slug: name.toLowerCase().replace(/\s+/g, "-"),
          description,
          category,
          status,
          image: imageUrl,
        },
        { new: true }
      );

      if (!updatedBlog) {
        return NextResponse.json({ success: false, error: "Failed to update blog" }, { status: 400 });
      }

      return NextResponse.json(
        { 
          success: true, 
          message: "Blog updated successfully",
          data: updatedBlog 
        }, 
        { status: 200 }
      );
    }

    return NextResponse.json({ success: false, error: "Invalid Content-Type" }, { status: 400 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}