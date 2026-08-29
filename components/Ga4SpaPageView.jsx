"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ga4SpaPageView } from "@/utils/nextjs-event-tracking";

function getPageUrl(pathname, search) {
  if (typeof window === "undefined") return "";
  const query = search ? `?${search}` : "";
  return `${window.location.origin}${pathname}${query}`;
}

export default function Ga4SpaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";
  const previousUrlRef = useRef(null);

  useEffect(() => {
    const pageLocation = getPageUrl(pathname, search);

    if (previousUrlRef.current === null) {
      previousUrlRef.current = pageLocation;
      return;
    }

    if (previousUrlRef.current === pageLocation) return;

    const pageReferrer = previousUrlRef.current;
    previousUrlRef.current = pageLocation;
    ga4SpaPageView({ pageLocation, pageReferrer });
  }, [pathname, search]);

  return null;
}
