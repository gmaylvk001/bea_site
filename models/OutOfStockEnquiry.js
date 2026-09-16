import mongoose from "mongoose";

const OutOfStockEnquirySchema = new mongoose.Schema(
  {
    // Customer Details
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    requirement: {
      type: String,
      trim: true,
      default: "",
    },

    // Product Details
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    productName: {
      type: String,
      default: "",
    },
    productSlug: {
      type: String,
      default: "",
    },
    itemCode: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    specialPrice: {
      type: Number,
      default: 0,
    },
    productImage: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },

    // Action triggering the enquiry ('add_to_cart' or 'buy_now')
    action: {
      type: String,
      default: "add_to_cart",
    },

    // Enquiry status & management
    status: {
      type: String,
      enum: ["New", "Contacted", "Closed"],
      default: "New",
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.OutOfStockEnquiry ||
  mongoose.model("OutOfStockEnquiry", OutOfStockEnquirySchema);
