import mongoose from "mongoose";

const GuestUserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },

  mobile: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
  },

  email: {
    type: String,
    default: "", // ✅ allow empty
  },

  password: {
    type: String,
    default: "", // ✅ allow empty
  },

  user_type: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },

}, { timestamps: true });

export default mongoose.models.ecom_users_info ||
  mongoose.model("ecom_users_info", GuestUserSchema);