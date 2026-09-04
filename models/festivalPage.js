import mongoose from "mongoose";

const FestivalTopBannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  redirectUrl: { type: String, default: "" },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
});

const FestivalOfferCardSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  content: { type: String, required: true }, // bottom text for image
  redirectUrl: { type: String, default: "" },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
});

const FestivalPageSchema = new mongoose.Schema(
  {
    topBanners: [FestivalTopBannerSchema],
    topBanner: {
      heading1: { type: String, default: "CELEBRATE." },
      heading2: { type: String, default: "UPGRADE." },
      heading3: { type: String, default: "SAVE BIG." },
      subTitleTag: { type: String, default: "Upgrade Your Home This" },
      subTitleHighlight: { type: String, default: "Vinayagar Chaturthi" },
      subTitleSuffix: { type: String, default: "Special Deals Await!" },
      customBannerImage: { type: String, default: "" },
      status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    },
    headingBanner: {
      imageUrl: { type: String, default: "" },
      redirectUrl: { type: String, default: "" },
      status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    },
    festiveSectionHeader: {
      titlePrefix: { type: String, default: "Upgrade Your Home This" },
      titleHighlight: { type: String, default: "Festive Season" },
    },
    offerCards: [FestivalOfferCardSchema],
    leftSection: {
      heading: {
        type: String,
        default: "Celebrate Vinayagar Chaturthi with Joyful Shopping",
      },
      paragraphs: {
        type: [String],
        default: [
          "Enjoy your purchases this Vinayagar Chaturthi at Bharath Electronics & Appliances and make the season even more special with the right products for your home.",
          "Explore a wide range of televisions, refrigerators, washing machines, air conditioners, kitchen appliances and more from trusted brands, all at festive prices.",
          "Whether you are upgrading your home or gifting your family something useful this season, BEA brings you exciting offers, easy EMI options, dependable service and a smooth shopping experience.",
          "Celebrate Vinayagar Chaturthi with comfort, value and happiness, only at Bharath Electronics & Appliances.",
        ],
      },
      bulletPoints: {
        type: [String],
        default: [
          "Trusted Brands for Every Home",
          "Festive Offers & Great Value",
          "Easy EMI & Hassle-Free Shopping",
          "Reliable Service & Support",
        ],
      },
      deliveryBadgeText: {
        type: String,
        default: "DELIVERY ALL OVER TAMIL NADU",
      },
    },
    rightFormSection: {
      tagText: { type: String, default: "FESTIVE EXCLUSIVE" },
      miniBannerImage: { type: String, default: "" },
      titlePrefix: { type: String, default: "Unlock Your" },
      titleHighlight: { type: String, default: "Vinayagar Specials!" },
      subtitle: {
        type: String,
        default:
          "Share your details to receive festive offers, product updates, and exclusive BEA celebrations.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.FestivalPage ||
  mongoose.model("FestivalPage", FestivalPageSchema);

