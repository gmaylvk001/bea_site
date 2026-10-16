import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import connectDB from "@/lib/db";
import ComboProduct from "@/models/ComboProduct";
import { calculateComboTotals } from "@/lib/comboPrice";
import { slugFromProductName } from "@/lib/productSlug";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const combos = await ComboProduct.find({})
      .populate("products", "name price special_price images item_code quantity stock_status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, combos });
  } catch (error) {
    console.error("GET combos error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const contentType = req.headers.get("content-type") || "";

    let comboData = {};
    const uploadedImages = [];
    let uploadedBanner = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawData = formData.get("data");
      if (rawData) {
        comboData = JSON.parse(rawData);
      }

      // Handle upload directories
      const uploadDir = path.join(process.cwd(), "public", "uploads", "combos");
      if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
      }

      // Combo product images
      const imageFiles = formData.getAll("images");
      for (const file of imageFiles) {
        if (file && typeof file.arrayBuffer === "function" && file.name) {
          const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
          const filePath = path.join(uploadDir, filename);
          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(filePath, buffer);
          uploadedImages.push(`/uploads/combos/${filename}`);
        }
      }

      // Banner image (Tab 2)
      const bannerFile = formData.get("banner_image");
      if (bannerFile && typeof bannerFile.arrayBuffer === "function" && bannerFile.name) {
        const bannerFilename = `banner-${Date.now()}-${bannerFile.name.replace(/\s+/g, "-")}`;
        const bannerPath = path.join(uploadDir, bannerFilename);
        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        await writeFile(bannerPath, buffer);
        uploadedBanner = `/uploads/combos/${bannerFilename}`;
      }
    } else {
      comboData = await req.json();
    }

    const {
      name,
      description,
      products = [],
      combo_mrp,
      combo_price,
      quantity = 10,
      offer_start,
      offer_end,
      status = "Active",
      meta_title = "",
      meta_description = "",
      search_keywords = "",
      page_content = "",
      existingImages = [],
      existingBanner = "",
    } = comboData;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Combo name is required." }, { status: 400 });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one product for the combo." },
        { status: 400 }
      );
    }

    if (!offer_start || !offer_end) {
      return NextResponse.json(
        { success: false, error: "Both offer start date and end date are required." },
        { status: 400 }
      );
    }

    const startDate = new Date(offer_start);
    const endDate = new Date(offer_end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid start or end date format." }, { status: 400 });
    }
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: "Offer end date must be after offer start date." },
        { status: 400 }
      );
    }

    // SERVER-SIDE CALCULATION of individual MRP and individual Selling Price
    const calculation = await calculateComboTotals(products);
    if (calculation.error) {
      return NextResponse.json({ success: false, error: calculation.error }, { status: 400 });
    }

    const numericComboMrp = Number(combo_mrp) > 0 ? Number(combo_mrp) : calculation.combined_mrp;
    const numericComboPrice = Number(combo_price);
    if (isNaN(numericComboPrice) || numericComboPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid combo selling price." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugFromProductName(name) || "combo-offer";
    let slug = baseSlug;
    let counter = 1;
    while (await ComboProduct.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const allImages = [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedImages];
    const finalBanner = uploadedBanner || existingBanner || "";

    let cleanPageContent = "";
    if (typeof page_content === "string") {
      cleanPageContent = page_content;
    } else if (page_content && typeof page_content === "object") {
      cleanPageContent = page_content.target?.value || page_content.value || "";
    } else {
      cleanPageContent = String(page_content || "");
    }

    const newCombo = new ComboProduct({
      name: name.trim(),
      slug,
      description: description || "",
      products: calculation.products.map((p) => p._id),
      combined_mrp: calculation.combined_mrp,
      combined_selling_price: calculation.combined_selling_price,
      combo_mrp: numericComboMrp,
      combo_price: numericComboPrice,
      quantity: Number(quantity) >= 0 ? Number(quantity) : 10,
      stock_status: Number(quantity) > 0 ? "In Stock" : "Out of Stock",
      status: status === "Inactive" ? "Inactive" : "Active",
      offer_start: startDate,
      offer_end: endDate,
      images: allImages,
      banner_image: finalBanner,
      page_content: cleanPageContent,
      meta_title: meta_title || name.trim(),
      meta_description: meta_description || "",
      search_keywords: search_keywords || "",
    });

    await newCombo.save();

    return NextResponse.json(
      {
        success: true,
        message: "Combo product created successfully.",
        combo: newCombo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST combo error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
