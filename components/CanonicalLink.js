import { getBaseUrl } from "@/lib/schema";

export function buildCanonicalUrl(path = "/") {
  const base = getBaseUrl().replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;

  const [pathname, query = ""] = String(path).split("?");
  const cleanPath = (pathname.startsWith("/") ? pathname : `/${pathname}`).replace(
    /\/+$/,
    ""
  );
  return query ? `${base}${cleanPath}?${query}` : `${base}${cleanPath}`;
}

export default function CanonicalLink({ path = "/" }) {
  return <link rel="canonical" href={buildCanonicalUrl(path)} />;
}
