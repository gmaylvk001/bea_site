import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import connectDB from "@/lib/db";
import ComboProduct from "@/models/ComboProduct";
import { calculateComboTotals } from "@/lib/comboPrice";
import { slugFromProductName } from "@/lib/productSlug";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const combo = await ComboProduct.findById(id)
      .populate("products", "name price special_price images item_code quantity stock_status model_number")
      .lean();

    if (!combo) {
      return NextResponse.json({ success: false, error: "Combo not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, combo });
  } catch (error) {
    console.error("GET single combo error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const existing = await ComboProduct.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Combo not found." }, { status: 404 });
    }

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
      quantity,
      offer_start,
      offer_end,
      status,
      meta_title,
      meta_description,
      search_keywords,
      page_content,
      existingImages = [],
      existingBanner,
    } = comboData;

    if (name && !name.trim()) {
      return NextResponse.json({ success: false, error: "Combo name cannot be empty." }, { status: 400 });
    }

    // Dates validation
    let startDate = existing.offer_start;
    let endDate = existing.offer_end;
    if (offer_start) startDate = new Date(offer_start);
    if (offer_end) endDate = new Date(offer_end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid start or end date format." }, { status: 400 });
    }
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: "Offer end date must be after offer start date." },
        { status: 400 }
      );
    }

    // SERVER-SIDE CALCULATION of individual MRP and individual Selling Price (if products updated)
    if (Array.isArray(products) && products.length > 0) {
      const calculation = await calculateComboTotals(products);
      if (calculation.error) {
        return NextResponse.json({ success: false, error: calculation.error }, { status: 400 });
      }
      existing.products = calculation.products.map((p) => p._id);
      existing.combined_mrp = calculation.combined_mrp;
      existing.combined_selling_price = calculation.combined_selling_price;
      existing.combo_mrp = Number(combo_mrp) > 0 ? Number(combo_mrp) : calculation.combined_mrp;
    } else if (combo_mrp !== undefined) {
      existing.combo_mrp = Number(combo_mrp) > 0 ? Number(combo_mrp) : existing.combo_mrp;
    }

    const numericComboPrice =
      combo_price !== undefined ? Number(combo_price) : existing.combo_price;
    if (isNaN(numericComboPrice) || numericComboPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid combo selling price." },
        { status: 400 }
      );
    }

    // Slug check if name changed
    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      const baseSlug = slugFromProductName(name.trim()) || "combo-offer";
      slug = baseSlug;
      let counter = 1;
      while (await ComboProduct.findOne({ slug, _id: { $ne: id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Combine images
    const finalImages = [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedImages];
    const finalBanner =
      uploadedBanner ||
      (existingBanner !== undefined
        ? existingBanner
        : comboData.banner_image !== undefined
        ? comboData.banner_image
        : existing.banner_image);

    existing.name = name ? name.trim() : existing.name;
    existing.slug = slug;
    existing.description = description !== undefined ? description : existing.description;
    existing.combo_price = numericComboPrice;
    if (quantity !== undefined && quantity !== null && quantity !== "") {
      const parsedQty = Number(quantity);
      if (!isNaN(parsedQty) && parsedQty >= 0) {
        existing.quantity = parsedQty;
        existing.stock_status = parsedQty > 0 ? "In Stock" : "Out of Stock";
      }
    }
    if (status) existing.status = status;
    existing.offer_start = startDate;
    existing.offer_end = endDate;
    let cleanPageContent = existing.page_content;
    if (page_content !== undefined) {
      if (typeof page_content === "string") {
        cleanPageContent = page_content;
      } else if (page_content && typeof page_content === "object") {
        cleanPageContent = page_content.target?.value || page_content.value || "";
      } else {
        cleanPageContent = String(page_content || "");
      }
    }

    if (finalImages.length > 0) existing.images = finalImages;
    existing.banner_image = finalBanner;
    existing.page_content = cleanPageContent;
    if (meta_title !== undefined) existing.meta_title = meta_title;
    if (meta_description !== undefined) existing.meta_description = meta_description;
    if (search_keywords !== undefined) existing.search_keywords = search_keywords;

    await existing.save();

    return NextResponse.json({
      success: true,
      message: "Combo product updated successfully.",
      combo: existing,
    });
  } catch (error) {
    console.error("PUT combo error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await ComboProduct.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Combo not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Combo deleted successfully." });
  } catch (error) {
    console.error("DELETE combo error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
