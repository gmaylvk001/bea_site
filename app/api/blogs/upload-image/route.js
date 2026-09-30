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

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const dir = path.join(process.cwd(), "public/uploads/blogs");
    await mkdir(dir, { recursive: true });

    let fileName = `blog_content_${Date.now()}_${safeName || `image${ext}`}`;
    let location = `/uploads/blogs/${fileName}`;

    // Determine if this request is already executing directly on www.bharathelectronics.in
    const host = req.headers.get("host") || "";
    const isAlreadyProd = host.includes("bharathelectronics.in") && !host.includes("estore.");
    const isReplication = formData.get("isReplication") === "true";

    // If running in development/staging/estore, replicate to production server to guarantee HTTP 200 on www
    if (!isAlreadyProd && !isReplication) {
      try {
        const prodFormData = new FormData();
        prodFormData.append("file", new Blob([buffer]), file.name);
        prodFormData.append("isReplication", "true");

        const prodRes = await fetch("https://www.bharathelectronics.in/api/blogs/upload-image", {
          method: "POST",
          body: prodFormData,
        });

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData?.location) {
            location = prodData.location;
            fileName = path.basename(prodData.location);
          }
        }
      } catch (err) {
        console.warn("Could not replicate blog image to production server:", err.message);
      }
    }

    // Always ensure local copy exists with the matching filename
    await writeFile(path.join(dir, fileName), buffer);

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
