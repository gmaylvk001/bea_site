import mongoose from "mongoose";
import { SMART_LEAD_CONFIG_KEY } from "@/lib/smartLead/configDefaults.js";

const ContentBlockSchema = new mongoose.Schema(
  {
    headline: { type: String, default: "" },
    subheading: { type: String, default: "" },
    cta: { type: String, default: "" },
    benefits: { type: [String], default: [] },
  },
  { _id: false }
);

const CategoryRuleSchema = new mongoose.Schema(
  {
    categoryId: { type: String, default: "" },
    categorySlug: { type: String, default: "" },
    categoryName: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductRuleSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    itemCode: { type: String, default: "" },
    name: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Singleton Smart Lead admin configuration.
 */
const SmartLeadConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: SMART_LEAD_CONFIG_KEY, unique: true, index: true },
    version: { type: Number, default: 1 },
    global: {
      popupEnabled: { type: Boolean, default: true },
    },
    frequency: {
      frequencyCap: { type: Number, default: 1 },
      highIntentExceptionScore: { type: Number, default: 85 },
      highIntentExceptionMax: { type: Number, default: 2 },
      suppressionMode: {
        type: String,
        enum: ["session", "duration"],
        default: "session",
      },
      suppressionMs: { type: Number, default: 24 * 60 * 60 * 1000 },
    },
    triggers: {
      categoryMs: { type: Number, default: 35000 },
      productMs: { type: Number, default: 28000 },
      premiumMs: { type: Number, default: 15000 },
      comparisonMs: { type: Number, default: 800 },
      comparisonProductCount: { type: Number, default: 3 },
      minScoreToShow: { type: Number, default: 30 },
    },
    scorePoints: {
      PRODUCT_PAGE_OPENED: { type: Number, default: 10 },
      PRODUCT_PAGE_30S: { type: Number, default: 15 },
      SECOND_PRODUCT_SAME_CATEGORY: { type: Number, default: 10 },
      THIRD_PRODUCT_SAME_CATEGORY: { type: Number, default: 20 },
      REVISITED_PRODUCT: { type: Number, default: 20 },
      PREMIUM_SKU: { type: Number, default: 20 },
      TOTAL_TIME_2MIN: { type: Number, default: 10 },
      RETURNING_VISITOR: { type: Number, default: 20 },
    },
    thresholds: {
      browsingMax: { type: Number, default: 29 },
      interestedMin: { type: Number, default: 30 },
      interestedMax: { type: Number, default: 49 },
      comparisonMin: { type: Number, default: 50 },
      comparisonMax: { type: Number, default: 69 },
      hotMin: { type: Number, default: 70 },
    },
    defaultCategoryEnabled: { type: Boolean, default: true },
    categories: { type: [CategoryRuleSchema], default: [] },
    products: { type: [ProductRuleSchema], default: [] },
    premium: {
      usePriceFallback: { type: Boolean, default: true },
      priceFallbackThreshold: { type: Number, default: 50000 },
    },
    whatsapp: {
      enabled: { type: Boolean, default: true },
    },
    design: {
      CATEGORY: { type: String, default: "default" },
      MODEL: { type: String, default: "default" },
      COMPARISON: { type: String, default: "default" },
      PREMIUM: { type: String, default: "premium" },
    },
    content: {
      CATEGORY: { type: ContentBlockSchema, default: () => ({}) },
      MODEL: { type: ContentBlockSchema, default: () => ({}) },
      COMPARISON: { type: ContentBlockSchema, default: () => ({}) },
      PREMIUM: { type: ContentBlockSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SmartLeadConfig ||
  mongoose.model("SmartLeadConfig", SmartLeadConfigSchema);
