import mongoose from "mongoose";

const OfferLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email_address: { type: String, default: "" },
    mobile_number: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Please fill a valid 10-digit mobile number"],
    },
    message: { type: String, required: true },
    city: { type: String, required: true },
    category: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ecom_offer_lead_infos ||
  mongoose.model("ecom_offer_lead_infos", OfferLeadSchema);
