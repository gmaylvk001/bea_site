import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    job_post: {
      type: String,
      required: true,
      trim: true,
    },
    resume_path: {
      type: String,
      required: true,
      trim: true,
    },
    resume_name: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["New", "Reviewed", "Shortlisted", "Rejected"],
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

export default mongoose.models.JobApplication ||
  mongoose.model("JobApplication", JobApplicationSchema);
