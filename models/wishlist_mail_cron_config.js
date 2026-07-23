import mongoose from "mongoose";

const WishlistMailCronConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    enabled: { type: Boolean, default: true },
    maxMailsPerUser: { type: Number, default: 5 },
    mailCooldownDays: { type: Number, default: 7 },
    cronTime: { type: String, default: "09:00" }, // HH:mm local server time
    cronDays: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6], // 0=Sun .. 6=Sat
    },
    lastRunAt: { type: Date, default: null },
    lastRunStats: {
      type: Object,
      default: {},
    },
    adminDigestEmail: { type: String, default: "" },
    emailContent: {
      type: Object,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// Keep existing Mongo collection if data was created under the old model name
export default mongoose.models.WishlistMailCronConfig ||
  mongoose.model(
    "WishlistMailCronConfig",
    WishlistMailCronConfigSchema,
    "pricedropcronconfigs"
  );
