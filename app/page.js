import IndexComponent from "../components/index";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import { getBaseUrl, buildHomePageSchema } from "@/lib/schema";
import { getHomepageTopBannerItems } from "@/lib/homepageTopBanner";

export const metadata = {
  title: "Bharath Electronics & Appliances – Shop Electronics & Home Appliances Online",
  description: "Shop mobiles, TVs, ACs, refrigerators, washing machines & more at Bharath Electronics & Appliances. Authorized brands, best prices, free delivery in Coimbatore.",
  alternates: {
    canonical: buildCanonicalUrl("/"),
  },
};

export default async function Home() {
  const baseUrl = getBaseUrl();
  const homeSchema = buildHomePageSchema(baseUrl);
  let initialBannerItems = null;

  try {
    initialBannerItems = await getHomepageTopBannerItems();
  } catch (error) {
    console.error("Error loading homepage Top Banner:", error);
  }

  return (
    <>
      {homeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
        />
      )}
      {initialBannerItems?.[0]?.bgImageUrl && (
        <link
          rel="preload"
          as="image"
          href={initialBannerItems[0].bgImageUrl}
          fetchPriority="high"
          media={initialBannerItems[0].mobileBgImageUrl ? "(min-width: 768px)" : undefined}
        />
      )}
      {initialBannerItems?.[0]?.mobileBgImageUrl && (
        <link
          rel="preload"
          as="image"
          href={initialBannerItems[0].mobileBgImageUrl}
          fetchPriority="high"
          media="(max-width: 767px)"
        />
      )}
      <div className="">
        <IndexComponent initialBannerItems={initialBannerItems} />
      </div>
    </>
  );
}
