import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import connectDB from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Product_filter from "@/models/ecom_productfilter_info";
import fs from "fs";
import md5 from "md5";
export async function POST(req) {
  try {
    const formData = await req.formData();
    const productData = JSON.parse(formData.get("product"));
    // Normalize brand_code: keep trimmed when provided, drop when empty
    if (Object.prototype.hasOwnProperty.call(productData, "brand_code")) {
      const trimmed = (productData.brand_code ?? "").toString().trim();
      if (trimmed) {
        productData.brand_code = trimmed;
      } else {
        delete productData.brand_code;
      }
    }

    // ✅ Normalize the new fields
    if (Object.prototype.hasOwnProperty.call(productData, "model_number")) {
      const trimmed = (productData.model_number ?? "").toString().trim();
      productData.model_number = trimmed;
    } else {
      productData.model_number = "";
    }

    if (Object.prototype.hasOwnProperty.call(productData, "movement")) {
      const trimmed = (productData.movement ?? "").toString().trim();
      productData.movement = trimmed;
    } else {
      productData.movement = "";
    }

    if (Object.prototype.hasOwnProperty.call(productData, "size")) {
      const trimmed = (productData.size ?? "").toString().trim();
      productData.size = trimmed;
    } else {
      productData.size = "";
    }


    const imageFiles = formData.getAll("images");
    // const category   = formData.get("category");
    let variants = JSON.parse(formData.get("variant"));
    const Filters    = productData.filters;
    const item_code  = productData.item_code;
    const slug       = productData.slug;
    const overviewimageFiles = formData.getAll("overviewImages");
    let md5_cat_name = md5(slug);
    let existingProduct = await Product.findOne({ item_code });
      if (existingProduct) {
        return NextResponse.json({ error: "Product already exists" }, { status: 400 });
      }

      // ✅ Duplicate check for model_number (optional - remove if not needed)
    if (productData.model_number) {
      let existingModel = await Product.findOne({ model_number: productData.model_number });
      if (existingModel) {
        return NextResponse.json({ error: "Product with this model number already exists" }, { status: 400 });
      }
    }

      console.log(productData);
console.log("..............................................................");
 const category = productData.sub_category;
      let existingProductname = await Product.findOne({ slug });
      if (existingProductname) {
        return NextResponse.json({ error: "Product name already exists" }, { status: 400 });
      }

    const savedImages = [];
    const OverviewSavedImages = [];
    if (!imageFiles.length) {
        return NextResponse.json({ error: "No images received" }, { status: 400 });
    }
    const savedVariantImages = [];
    if(productData.hasVariants){
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const variantImages = [];
        
        // Get all images for this variant
        let imgIndex = 0;
        while (true) {
          const imageKey = `variant_${i}_image_${imgIndex}`;
          const imageFile = formData.get(imageKey);
          console.log(imageFile);
          if (!imageFile) break;
          
          // Process and save the image
          const filename = `${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
          const filePath = path.join(uploadDir, filename);
          
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          await writeFile(filePath, buffer);
          
          variantImages.push(`${filename}`);
          imgIndex++;
        }
        
        variant.images = variantImages;
      }
    }
    const uploadDir = path.join(process.cwd(), "public/uploads/products");
    if (!fs.existsSync(uploadDir)) {
        await fs.promises.mkdir(uploadDir, { recursive: true });
    }
    for (const file of imageFiles) {
      if (!file || typeof file.name !== "string") {
          console.error("Invalid file received:", file);
          continue;
      }
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      savedImages.push(`${filename}`);
    }

    for (const file of overviewimageFiles) {
      if (!file || typeof file.name !== "string") {
          console.error("Invalid file received:", file);
          continue;
      }
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      OverviewSavedImages.push(`${filename}`);
    }

    await connectDB();
    if(productData.quantity <= 0){
        productData.stock_status = "Out of Stock";
    }

    if(productData.slug != ""){
      productData.slug =slug;
    }
    if(md5_cat_name != ""){
      productData.md5_name =md5_cat_name;
    }
    let main_Category = "";
    if(category != ""){
      const main_cat = await Category.findOne({ _id: category });
      if(main_cat){
        main_Category = main_cat.parentid;
      }
    }
    
    if(!productData.hasVariants){
          variants = [];
        }

    productData.category = main_Category;
    productData.sub_category = category;

    const highlights = JSON.parse(formData.get("highlights") || "[]");
    productData.product_highlights = highlights;
    console.log(productData);
    const newProduct = new Product({
      ...productData,
      images: savedImages,
      variants: variants,
      overview_image: OverviewSavedImages,
    });
    await newProduct.save();

    if(newProduct.id){
      const product_id = newProduct._id;
      for (const filter of Filters) {
      const newProductFilter = new Product_filter({
        filter_id: filter,
        product_id: product_id,
      });
      await newProductFilter.save();
      }
    }

    return NextResponse.json(
      { message: "Product created successfully", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
