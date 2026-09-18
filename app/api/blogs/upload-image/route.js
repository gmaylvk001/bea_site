import { NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Check all possible field names used by Jodit and standard file uploaders
    let file =
      formData.get("file") ||
      formData.get("image") ||
      formData.get("files[0]") ||
      formData.get("files");

    if (!file) {
      for (const [, val] of formData.entries()) {
        if (val && typeof val === "object" && typeof val.arrayBuffer === "function" && val.name) {
          file = val;
          break;
        }
      }
    }

    if (!file || typeof file === "string" || !file.name) {
      return NextResponse.json({ success: false, error: "No image file received" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const fileName = `blog_content_${Date.now()}_${safeName || `image${ext}`}`;
    const dir = path.join(process.cwd(), "public/uploads/blogs");

    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

    const location = `/uploads/blogs/${fileName}`;

    // Return both standard JSON and Jodit uploader compatible response
    return NextResponse.json({
      success: true,
      location,
      url: location,
      data: {
        baseurl: "",
        messages: [],
        files: [location],
        isImages: [true],
        code: 220,
      },
    });
  } catch (error) {
    console.error("Blog image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload image. Ensure server filesystem allows write access.",
      },
      { status: 500 }
    );
  }
}
