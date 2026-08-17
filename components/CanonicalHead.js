"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { buildCanonicalUrl } from "@/components/CanonicalLink";

export default function CanonicalHead() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  let path = pathname;
  if (pathname === "/search") {
    const query = (searchParams.get("query") || "").trim();
    path = query ? `/search?query=${encodeURIComponent(query)}` : "/search";
  }

  return <link rel="canonical" href={buildCanonicalUrl(path)} />;
}
