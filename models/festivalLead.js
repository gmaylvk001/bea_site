import mongoose from "mongoose";

const FestivalLeadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    sourcePage: { type: String, default: "/festival" },
    status: { type: String, default: "New" },
  },
  { timestamps: true }
);

export default mongoose.models.FestivalLead ||
  mongoose.model("FestivalLead", FestivalLeadSchema);
