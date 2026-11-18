import mongoose from "mongoose";

const SonyCenterLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed", "inactive"],
      default: "new",
    },
    source: {
      type: String,
      default: "Sony Center External Lead Form",
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ecom_sony_center_leads) {
  delete mongoose.models.ecom_sony_center_leads;
}

export default mongoose.models.ecom_sony_center_leads ||
  mongoose.model("ecom_sony_center_leads", SonyCenterLeadSchema);
