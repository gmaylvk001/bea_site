import { NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") || formData.get("image");

    if (!file || typeof file === "string" || !file.name) {
      return NextResponse.json({ error: "No image file received" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (file.type && !allowed.includes(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const fileName = `blog_content_${Date.now()}_${safeName || `image${ext}`}`;
    const dir = path.join(process.cwd(), "public/uploads/blogs");

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

    const location = `/uploads/blogs/${fileName}`;
    return NextResponse.json({ location, url: location });
  } catch (error) {
    console.error("Blog image upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image. Ensure server filesystem allows write access to public/uploads/blogs." }, { status: 500 });
  }
}
