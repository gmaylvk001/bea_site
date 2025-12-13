import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_category_infos",
      required: true
    },
    category_status: {
      type: String,
      default: "active"
    },
    banners: [
      {
        topBanner: {
          name: String,
          image: String,
          url: String,
          status: { type: String, default: "active" },
           featured_products: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "products"
            }
          ]
        },
        subBanners: [
          {
            name: String,
            image: String,
            url: String,
            status: { type: String, default: "active" },
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.category_banner_2 || mongoose.model("category_banner_2", schema);

