import mongoose from "mongoose";

const CategoryBrandBannerSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_category_infos",
      required: true,
    },
    category_name: { type: String, required: true },
    category_slug: { type: String, required: true },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_brand_infos",
      required: true,
    },
    brand_name: { type: String, required: true },
    brand_slug: { type: String, required: true },
    banner_name: { type: String, required: true },
    banner_image: { type: String, required: true },
    redirect_url: { type: String, default: "" },
    banner_status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    banner_size: { type: String, default: "1920x600" },
    display_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategoryBrandBannerSchema.index({
  category_slug: 1,
  brand_slug: 1,
  display_order: 1,
});
CategoryBrandBannerSchema.index({ banner_status: 1 });

const MODEL_NAME = "category_brand_banner";

export default mongoose.models[MODEL_NAME] ||
  mongoose.model(MODEL_NAME, CategoryBrandBannerSchema);
