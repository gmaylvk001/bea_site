/* import mongoose from "mongoose";

const MobileOtpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.mobile_otp || mongoose.model("mobile_otp", MobileOtpSchema); */



// /models/MobileOtp.js

import mongoose from "mongoose";

const MobileOtpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },

  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "10m" }, // ✅ auto delete after 10 mins
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// prevent model overwrite issue
export default mongoose.models.mobile_otp ||
  mongoose.model("mobile_otp", MobileOtpSchema);