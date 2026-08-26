import { Suspense } from "react";
import SearchPage from "./SearchPage";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import { noIndexMetadata } from "@/components/NoIndexRobots";

function searchCanonicalPath(searchParams) {
  const query = String(searchParams?.query || "").trim();
  return query ? `/search?query=${encodeURIComponent(query)}` : "/search";
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const query = String(sp?.query || "").trim();
  const path = searchCanonicalPath(sp);

  return {
    title: query ? `Search results for '${query}'` : "Search",
    description: query
      ? `Search results for ${query} at Bharath Electronics & Appliances`
      : "Search electronics and home appliances at Bharath Electronics & Appliances",
    ...noIndexMetadata,
    alternates: {
      canonical: buildCanonicalUrl(path),
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
