import mongoose from "mongoose";

const FreeDeliveryLocationSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique index on pincode + area so multiple areas can exist under the same pincode
FreeDeliveryLocationSchema.index({ pincode: 1, area: 1 }, { unique: true });
FreeDeliveryLocationSchema.index({ district: 1 });
FreeDeliveryLocationSchema.index({ isActive: 1 });

export default mongoose.models.FreeDeliveryLocation ||
  mongoose.model("FreeDeliveryLocation", FreeDeliveryLocationSchema);
