import mongoose from "mongoose";

const ComboProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Array of references to existing Product documents (minimum 1, can be 11 or more)
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    // Server-calculated read-only totals of the individual products
    combined_mrp: {
      type: Number,
      required: true,
      default: 0,
    },
    combined_selling_price: {
      type: Number,
      required: true,
      default: 0,
    },
    // Admin-defined combo pricing
    combo_mrp: {
      type: Number,
      required: true,
      default: 0,
    },
    combo_price: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 10,
      min: 0,
    },
    stock_status: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
    // Offer validity dates
    offer_start: {
      type: Date,
      required: true,
      index: true,
    },
    offer_end: {
      type: Date,
      required: true,
      index: true,
    },
    // Images
    images: {
      type: [String],
      default: [],
    },
    // Tab 2 settings: Offer page banner and custom content
    banner_image: {
      type: String,
      default: "",
    },
    page_content: {
      type: String,
      default: "",
    },
    // SEO Fields
    meta_title: {
      type: String,
      default: "",
    },
    meta_description: {
      type: String,
      default: "",
    },
    search_keywords: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent overwrite errors during hot-reloading
export default mongoose.models.ComboProduct ||
  mongoose.model("ComboProduct", ComboProductSchema);
