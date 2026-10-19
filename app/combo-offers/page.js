import ComboOffersClient from "./ComboOffersClient";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import connectDB from "@/lib/db";
import ComboProduct from "@/models/ComboProduct";
import { getBaseUrl } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const baseUrl = getBaseUrl();
  const title = "Special Combo Offers & Appliance Bundles | Bharath Electronics & Appliances";
  const description =
    "Explore mega combo offers with 11+ appliance packages at unbeatable discounted prices. Save big on bundled electronics with fast delivery in Tamil Nadu.";

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalUrl("/combo-offers"),
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/combo-offers`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function getCombos() {
  try {
    await connectDB();
    const now = new Date();

    const combos = await ComboProduct.find({ status: "Active" })
      .populate("products", "name price special_price images item_code quantity stock_status brand model_number slug")
      .lean();

    const mapped = combos.map((combo) => {
      const start = new Date(combo.offer_start);
      const end = new Date(combo.offer_end);

      let offerStatus = "active";
      if (now < start) {
        offerStatus = "upcoming";
      } else if (now > end) {
        offerStatus = "expired";
      }

      return {
        ...JSON.parse(JSON.stringify(combo)),
        offerStatus,
        serverTime: now.toISOString(),
      };
    });

    const priority = { active: 1, upcoming: 2, expired: 3 };
    mapped.sort((a, b) => {
      if (priority[a.offerStatus] !== priority[b.offerStatus]) {
        return priority[a.offerStatus] - priority[b.offerStatus];
      }
      if (a.offerStatus === "active") {
        return new Date(a.offer_end) - new Date(b.offer_end);
      }
      if (a.offerStatus === "upcoming") {
        return new Date(a.offer_start) - new Date(b.offer_start);
      }
      return new Date(b.offer_end) - new Date(a.offer_end);
    });

    return mapped;
  } catch (error) {
    console.error("Error fetching combos SSR:", error);
    return [];
  }
}

export default async function ComboOffersPage() {
  const combos = await getCombos();
  const baseUrl = getBaseUrl();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Combo Offers",
        item: `${baseUrl}/combo-offers`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ComboOffersClient initialCombos={combos} />
    </>
  );
}
