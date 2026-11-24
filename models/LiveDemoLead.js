import mongoose from "mongoose";

const LiveDemoLeadSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      default: "I'm not sure yet",
      trim: true,
    },
    requirement: {
      type: String,
      default: "",
      trim: true,
    },
    preferredDate: {
      type: String,
      required: [true, "Preferred date is required"],
      trim: true,
    },
    preferredTime: {
      type: String,
      required: [true, "Preferred time is required"],
      trim: true,
    },
    connectMethod: {
      type: String,
      default: "WhatsApp Video",
      trim: true,
    },
    additionalInfo: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "completed", "cancelled"],
      default: "new",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      default: "Live Video Demo Modal",
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ecom_live_demo_leads) {
  delete mongoose.models.ecom_live_demo_leads;
}

const LiveDemoLead =
  mongoose.models.ecom_live_demo_leads ||
  mongoose.model("ecom_live_demo_leads", LiveDemoLeadSchema);

export default LiveDemoLead;
