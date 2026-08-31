import mongoose from "mongoose";

const ProductSnapshotSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    itemCode: { type: String, default: "" },
    name: { type: String, default: "" },
    modelNumber: { type: String, default: "" },
    brandId: { type: String, default: "" },
    brandName: { type: String, default: "" },
    categoryId: { type: String, default: "" },
    categoryName: { type: String, default: "" },
    subcategoryId: { type: String, default: "" },
    slug: { type: String, default: "" },
    url: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    specialPrice: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    sequence: { type: Number, default: 0 },
    visitedAt: { type: String, default: "" },
    revisited: { type: Boolean, default: false },
    viewCount: { type: Number, default: 1 },
  },
  { _id: false }
);

const JourneyEventSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    type: { type: String, default: "" },
    label: { type: String, default: "" },
    at: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

/**
 * Smart Lead — enriched for sales team (Part 4).
 * Part 3 capture remains the single create event.
 */
const SmartLeadSchema = new mongoose.Schema(
  {
    // Basic
    mobile: { type: String, required: true, index: true },
    name: { type: String, default: "" },

    // Visitor
    visitorId: { type: String, default: "", index: true },
    sessionId: { type: String, default: "", index: true },
    visitorType: {
      type: String,
      enum: ["new", "returning", ""],
      default: "",
    },
    talkToId: { type: String, default: "" },

    // Current context
    sourceUrl: { type: String, default: "" },
    currentProduct: { type: ProductSnapshotSchema, default: () => ({}) },
    productId: { type: String, default: "" },
    itemCode: { type: String, default: "" },
    modelNumber: { type: String, default: "" },
    brandId: { type: String, default: "" },
    brandName: { type: String, default: "" },
    categoryId: { type: String, default: "" },
    categoryName: { type: String, default: "" },
    subcategoryId: { type: String, default: "" },
    subcategoryName: { type: String, default: "" },

    // Behaviour
    productsViewed: { type: [ProductSnapshotSchema], default: [] },
    productViewSequence: { type: [ProductSnapshotSchema], default: [] },
    productPageViewCount: { type: Number, default: 0 },
    brandsViewed: { type: [String], default: [] },
    totalActiveMs: { type: Number, default: 0 },
    currentProductActiveMs: { type: Number, default: 0 },
    timeOnSiteLabel: { type: String, default: "" },
    timeOnProductLabel: { type: String, default: "" },

    // Traffic
    referrer: { type: String, default: "" },
    trafficSource: { type: String, default: "" },
    campaign: { type: String, default: "" },
    utm: {
      source: { type: String, default: "" },
      medium: { type: String, default: "" },
      campaign: { type: String, default: "" },
      term: { type: String, default: "" },
      content: { type: String, default: "" },
    },

    // Technical
    device: { type: String, default: "" },
    browser: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ipArea: { type: String, default: "" },

    // Intent (from Part 1 — do not recalculate)
    intentScore: { type: Number, default: 0, index: true },
    classification: { type: String, default: "", index: true },
    classificationLabel: { type: String, default: "" },
    intentSummary: { type: String, default: "" },

    // Popup attribution
    popupType: {
      type: String,
      enum: ["CATEGORY", "MODEL", "COMPARISON", "PREMIUM", "UNKNOWN"],
      default: "UNKNOWN",
      index: true,
    },
    ctaClicked: { type: String, default: "" },
    whatsappClicked: { type: Boolean, default: false },
    helpOptions: { type: [String], default: [] },
    whatsappRequested: { type: Boolean, default: false },

    // Journey
    visitorJourney: { type: [JourneyEventSchema], default: [] },

    // OTP (Part 3) — never blocks lead
    otpVerified: { type: Boolean, default: false },
    otpOffered: { type: Boolean, default: false },

    // Sales workflow
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ecom_users_info",
      default: null,
      index: true,
    },
    contacted: { type: Boolean, default: false },
    contactedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["new", "open", "contacted", "follow_up", "converted", "closed", "lost"],
      default: "new",
      index: true,
    },
    followUpDate: { type: Date, default: null },
    conversion: { type: Boolean, default: false },
    convertedAt: { type: Date, default: null },
    invoiceRef: { type: String, default: "" },
    saleValue: { type: Number, default: null },
    salesNotes: { type: String, default: "" },

    // Extensible blob for later parts
    context: { type: Object, default: {} },
  },
  { timestamps: true }
);

SmartLeadSchema.index({ createdAt: -1 });
SmartLeadSchema.index({ mobile: 1, createdAt: -1 });

export default mongoose.models.SmartLead ||
  mongoose.model("SmartLead", SmartLeadSchema);
