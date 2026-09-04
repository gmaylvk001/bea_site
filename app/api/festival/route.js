import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FestivalPage from "@/models/festivalPage";
import fs from "fs";
import path from "path";
import sharp from "sharp";

async function saveUploadedFile(file, folder = "festival") {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate image
  try {
    await sharp(buffer).metadata();
  } catch (err) {
    throw new Error("Invalid image file uploaded.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const filepath = path.join(uploadDir, filename);
  await sharp(buffer).toFile(filepath);

  return `/uploads/${folder}/${filename}`;
}

const DEFAULT_OFFER_CARDS = [
  {
    imageUrl: "/uploads/festival/fridge_offer.jpg",
    content: "Upgrade your refrigerator this Vinayagar Chaturthi",
    redirectUrl: "/category/refrigerators",
    order: 0,
    status: "Active",
  },
  {
    imageUrl: "/uploads/festival/tv_deal.jpg",
    content: "Enjoy smarter entertainment with festive TV deals",
    redirectUrl: "/category/television",
    order: 1,
    status: "Active",
  },
  {
    imageUrl: "/uploads/festival/sony_tv.jpg",
    content: "Celebrate the season with exciting television offers",
    redirectUrl: "/category/television",
    order: 2,
    status: "Active",
  },
  {
    imageUrl: "/uploads/festival/premium_tv.jpg",
    content: "Bring home premium TV upgrades this Vinayagar Chaturthi",
    redirectUrl: "/category/television",
    order: 3,
    status: "Active",
  },
];

// GET: Retrieve festival page details
export async function GET() {
  try {
    await dbConnect();
    let pageData = await FestivalPage.findOne({});

    if (!pageData) {
      pageData = await FestivalPage.create({
        offerCards: DEFAULT_OFFER_CARDS,
      });
    }

    return NextResponse.json({ success: true, data: pageData });
  } catch (err) {
    console.error("GET /api/festival error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: Save or update festival page settings and cards
export async function POST(req) {
  try {
    await dbConnect();
    const contentType = req.headers.get("content-type") || "";

    let pageData = await FestivalPage.findOne({});
    if (!pageData) {
      pageData = new FestivalPage({ offerCards: [], topBanners: [] });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action");

      // -----------------------------------------------------------------------
      // Action: Add Top Banner (Unlimited)
      // -----------------------------------------------------------------------
      if (action === "add_top_banner") {
        const bannerFile = formData.get("bannerImageFile");
        const imageUrlInput = formData.get("imageUrl") || "";
        const redirectUrl = formData.get("redirectUrl") || "";
        const status = formData.get("status") || "Active";

        let finalImageUrl = imageUrlInput;
        if (bannerFile && bannerFile.size > 0) {
          finalImageUrl = await saveUploadedFile(bannerFile, "festival/top_banners");
        }

        if (!finalImageUrl) {
          return NextResponse.json(
            { success: false, message: "Banner image is required." },
            { status: 400 }
          );
        }

        pageData.topBanners.push({
          imageUrl: finalImageUrl,
          redirectUrl,
          order: pageData.topBanners.length,
          status,
        });
      }
      // -----------------------------------------------------------------------
      // Action: Update Top Banner
      // -----------------------------------------------------------------------
      else if (action === "update_top_banner") {
        const bannerId = formData.get("bannerId");
        const bannerIndex = formData.get("bannerIndex");

        let bannerToUpdate = null;
        if (bannerId) {
          bannerToUpdate = pageData.topBanners.id(bannerId);
        } else if (bannerIndex !== null && pageData.topBanners[bannerIndex]) {
          bannerToUpdate = pageData.topBanners[bannerIndex];
        }

        if (bannerToUpdate) {
          const bannerFile = formData.get("bannerImageFile");
          const imageUrlInput = formData.get("imageUrl");
          const redirectUrl = formData.get("redirectUrl");
          const status = formData.get("status");

          if (bannerFile && bannerFile.size > 0) {
            bannerToUpdate.imageUrl = await saveUploadedFile(bannerFile, "festival/top_banners");
          } else if (imageUrlInput) {
            bannerToUpdate.imageUrl = imageUrlInput;
          }

          if (redirectUrl !== null) bannerToUpdate.redirectUrl = redirectUrl;
          if (status !== null) bannerToUpdate.status = status;
        }
      }
      // -----------------------------------------------------------------------
      // Action: Delete Top Banner
      // -----------------------------------------------------------------------
      else if (action === "delete_top_banner") {
        const bannerId = formData.get("bannerId");
        const bannerIndex = formData.get("bannerIndex");

        if (bannerId) {
          pageData.topBanners = pageData.topBanners.filter(
            (b) => b._id.toString() !== bannerId
          );
        } else if (bannerIndex !== null) {
          const idx = parseInt(bannerIndex, 10);
          if (!isNaN(idx) && idx >= 0 && idx < pageData.topBanners.length) {
            pageData.topBanners.splice(idx, 1);
          }
        }
      }
      // -----------------------------------------------------------------------
      // Action: Update Single Heading Banner (Strictly Single)
      // -----------------------------------------------------------------------
      else if (action === "update_heading_banner") {
        const bannerFile = formData.get("headingBannerFile");
        const imageUrlInput = formData.get("imageUrl") || "";
        const redirectUrl = formData.get("redirectUrl") || "";
        const status = formData.get("status") || "Active";

        let finalImageUrl = pageData.headingBanner?.imageUrl || "";
        if (bannerFile && bannerFile.size > 0) {
          finalImageUrl = await saveUploadedFile(bannerFile, "festival/heading_banner");
        } else if (imageUrlInput) {
          finalImageUrl = imageUrlInput;
        }

        pageData.headingBanner = {
          imageUrl: finalImageUrl,
          redirectUrl,
          status,
        };
      }
      // -----------------------------------------------------------------------
      // Action: Legacy Update Banner (Text / Subtitles)
      // -----------------------------------------------------------------------
      else if (action === "update_banner") {
        const customBannerFile = formData.get("customBannerFile");
        if (customBannerFile && customBannerFile.size > 0) {
          const uploadedPath = await saveUploadedFile(
            customBannerFile,
            "festival/banner"
          );
          pageData.topBanner.customBannerImage = uploadedPath;
        }

        const heading1 = formData.get("heading1");
        const heading2 = formData.get("heading2");
        const heading3 = formData.get("heading3");
        const subTitleTag = formData.get("subTitleTag");
        const subTitleHighlight = formData.get("subTitleHighlight");
        const subTitleSuffix = formData.get("subTitleSuffix");
        const status = formData.get("status");

        if (heading1 !== null) pageData.topBanner.heading1 = heading1;
        if (heading2 !== null) pageData.topBanner.heading2 = heading2;
        if (heading3 !== null) pageData.topBanner.heading3 = heading3;
        if (subTitleTag !== null) pageData.topBanner.subTitleTag = subTitleTag;
        if (subTitleHighlight !== null)
          pageData.topBanner.subTitleHighlight = subTitleHighlight;
        if (subTitleSuffix !== null)
          pageData.topBanner.subTitleSuffix = subTitleSuffix;
        if (status !== null) pageData.topBanner.status = status;
      }
      // -----------------------------------------------------------------------
      // Action: Add Offer Card (4-grid)
      // -----------------------------------------------------------------------
      else if (action === "add_offer_card") {
        const cardFile = formData.get("cardImageFile");
        const imageUrlInput = formData.get("imageUrl");
        const content = formData.get("content") || "";
        const redirectUrl = formData.get("redirectUrl") || "";
        const status = formData.get("status") || "Active";

        let finalImageUrl = imageUrlInput || "";

        if (cardFile && cardFile.size > 0) {
          finalImageUrl = await saveUploadedFile(
            cardFile,
            "festival/cards"
          );
        }

        if (!finalImageUrl) {
          return NextResponse.json(
            { success: false, message: "Card image is required." },
            { status: 400 }
          );
        }

        pageData.offerCards.push({
          imageUrl: finalImageUrl,
          content,
          redirectUrl,
          order: pageData.offerCards.length,
          status,
        });
      }
      // -----------------------------------------------------------------------
      // Action: Update Offer Card
      // -----------------------------------------------------------------------
      else if (action === "update_offer_card") {
        const cardId = formData.get("cardId");
        const cardIndex = formData.get("cardIndex");

        let cardToUpdate = null;
        if (cardId) {
          cardToUpdate = pageData.offerCards.id(cardId);
        } else if (cardIndex !== null && pageData.offerCards[cardIndex]) {
          cardToUpdate = pageData.offerCards[cardIndex];
        }

        if (cardToUpdate) {
          const cardFile = formData.get("cardImageFile");
          const imageUrlInput = formData.get("imageUrl");
          const content = formData.get("content");
          const redirectUrl = formData.get("redirectUrl");
          const status = formData.get("status");

          if (cardFile && cardFile.size > 0) {
            cardToUpdate.imageUrl = await saveUploadedFile(
              cardFile,
              "festival/cards"
            );
          } else if (imageUrlInput) {
            cardToUpdate.imageUrl = imageUrlInput;
          }

          if (content !== null) cardToUpdate.content = content;
          if (redirectUrl !== null) cardToUpdate.redirectUrl = redirectUrl;
          if (status !== null) cardToUpdate.status = status;
        }
      }
      // -----------------------------------------------------------------------
      // Action: Update Right Form Section & Mini Banner
      // -----------------------------------------------------------------------
      else if (action === "update_right_form") {
        const miniBannerFile = formData.get("miniBannerFile");
        const removeMiniBanner = formData.get("removeMiniBanner") === "true";
        const tagText = formData.get("tagText");
        const titlePrefix = formData.get("titlePrefix");
        const titleHighlight = formData.get("titleHighlight");
        const subtitle = formData.get("subtitle");

        if (removeMiniBanner) {
          pageData.rightFormSection.miniBannerImage = "";
        } else if (miniBannerFile && miniBannerFile.size > 0) {
          pageData.rightFormSection.miniBannerImage = await saveUploadedFile(
            miniBannerFile,
            "festival/mini_banner"
          );
        }

        if (tagText !== null) pageData.rightFormSection.tagText = tagText;
        if (titlePrefix !== null) pageData.rightFormSection.titlePrefix = titlePrefix;
        if (titleHighlight !== null) pageData.rightFormSection.titleHighlight = titleHighlight;
        if (subtitle !== null) pageData.rightFormSection.subtitle = subtitle;
      }

      await pageData.save();
      return NextResponse.json({ success: true, data: pageData });
    } else {
      // JSON payload update
      const body = await req.json();

      if (Array.isArray(body.topBanners)) {
        pageData.topBanners = body.topBanners;
      }
      if (body.headingBanner) {
        pageData.headingBanner = { ...pageData.headingBanner, ...body.headingBanner };
      }
      if (body.topBanner) {
        pageData.topBanner = { ...pageData.topBanner, ...body.topBanner };
      }
      if (body.festiveSectionHeader) {
        pageData.festiveSectionHeader = {
          ...pageData.festiveSectionHeader,
          ...body.festiveSectionHeader,
        };
      }
      if (Array.isArray(body.offerCards)) {
        pageData.offerCards = body.offerCards;
      }
      if (body.leftSection) {
        pageData.leftSection = { ...pageData.leftSection, ...body.leftSection };
      }
      if (body.rightFormSection) {
        pageData.rightFormSection = {
          ...pageData.rightFormSection,
          ...body.rightFormSection,
        };
      }

      await pageData.save();
      return NextResponse.json({ success: true, data: pageData });
    }
  } catch (err) {
    console.error("POST /api/festival error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove offer card or top banner by type, ID or Index
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "card"; // 'card' | 'top_banner'
    const id = searchParams.get("id") || searchParams.get("cardId");
    const index = searchParams.get("index") || searchParams.get("cardIndex");

    const pageData = await FestivalPage.findOne({});
    if (!pageData) {
      return NextResponse.json(
        { success: false, message: "Page configuration not found." },
        { status: 404 }
      );
    }

    if (type === "top_banner") {
      if (id) {
        pageData.topBanners = pageData.topBanners.filter(
          (b) => b._id.toString() !== id
        );
      } else if (index !== null) {
        const idx = parseInt(index, 10);
        if (!isNaN(idx) && idx >= 0 && idx < pageData.topBanners.length) {
          pageData.topBanners.splice(idx, 1);
        }
      }
    } else {
      if (id) {
        pageData.offerCards = pageData.offerCards.filter(
          (c) => c._id.toString() !== id
        );
      } else if (index !== null) {
        const idx = parseInt(index, 10);
        if (!isNaN(idx) && idx >= 0 && idx < pageData.offerCards.length) {
          pageData.offerCards.splice(idx, 1);
        }
      }
    }

    await pageData.save();
    return NextResponse.json({ success: true, data: pageData });
  } catch (err) {
    console.error("DELETE /api/festival error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

