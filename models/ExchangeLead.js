import mongoose from "mongoose";

const ExchangeLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobile_number: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      required: [true, "City / Pincode location is required"],
      trim: true,
    },
    old_brand_model: {
      type: String,
      trim: true,
      default: "",
    },
    appliance_age: {
      type: String,
      trim: true,
      default: "",
    },
    working_condition: {
      type: String,
      enum: ["working", "working_minor_issues", "not_working", "unspecified"],
      default: "working",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    // New Target Product details (auto-captured from product page)
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    product_name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    product_slug: {
      type: String,
      trim: true,
      default: "",
    },
    product_sku: {
      type: String,
      trim: true,
      default: "",
    },
    product_price: {
      type: Number,
      default: 0,
    },
    product_image: {
      type: String,
      default: "",
    },
    product_url: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "converted", "rejected"],
      default: "new",
    },
    source: {
      type: String,
      default: "Product Page Exchange Section",
    },
    admin_notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ecom_exchange_leads) {
  delete mongoose.models.ecom_exchange_leads;
}

export default mongoose.models.ecom_exchange_leads ||
  mongoose.model("ecom_exchange_leads", ExchangeLeadSchema);
