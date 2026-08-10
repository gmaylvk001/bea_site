import IndexComponent from "../components/index";
import { getBaseUrl, buildHomePageSchema } from "@/lib/schema";

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
