import IndexComponent from "../components/index";
import { getBaseUrl, buildHomePageSchema } from "@/lib/schema";

export const metadata = {
  title: "Bharath Electronics & Appliances – Shop Electronics & Home Appliances Online",
  description: "Shop mobiles, TVs, ACs, refrigerators, washing machines & more at Bharath Electronics & Appliances. Authorized brands, best prices, free delivery in Coimbatore.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const baseUrl = getBaseUrl();
  const homeSchema = buildHomePageSchema(baseUrl);

  return (
    <>
      {homeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
        />
      )}
      <div className="">
        <IndexComponent />
      </div>
    </>
  );
}
