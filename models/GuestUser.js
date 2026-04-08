import mongoose from "mongoose";

const GuestUserSchema = new mongoose.Schema({


  name: {
    type: String,
    default: "", // ✅ instead of required
  },
   mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"], // ✅ Regex validation
    },
  email: {
    type: String,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // ✅ Regex validation
    default: "", // ✅ optional
  },
  password: {
    type: String,
    default: "", // ✅ optional
  },
  
 
  user_type: { 
    type: String, 
    enum: ["admin", "user"], // ✅ Define allowed values
    default: "user" // ✅ Set default value
  },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

export default mongoose.models.ecom_users_info || mongoose.model("ecom_users_info", GuestUserSchema);