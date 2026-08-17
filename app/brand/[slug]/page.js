import BrandComponent from "@/components/brand/BrandComponent";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import {
  getBaseUrl,
  fetchJson,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

async function getBrandData(slug) {
  return fetchJson(`/api/brand/${slug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  try {
    const data = await getBrandData(slug);
    const brand = data?.brand;

    if (!brand) {
      return {
        title: "Brand Not Found",
        description: "This brand does not exist",
      };
    }

    const title = brand.brand_name;
    const description = `Shop ${brand.brand_name} products online at best prices`;
    const image = brand.image
      ? brand.image.startsWith("http")
        ? brand.image
        : `${baseUrl}/uploads/Brands/${brand.image}`
      : undefined;

    return {
      title,
      description,
      alternates: {
        canonical: buildCanonicalUrl(`/brand/${slug}`),
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/brand/${slug}`,
        images: image ? [image] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: "Brand",
      description: "Browse products by brand",
    };
  }
}

export default async function Page({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();
  const path = `/brand/${slug}`;

  let data = null;
  try {
    data = await getBrandData(slug);
  } catch (error) {
    console.error("Brand schema fetch error:", error);
  }

  const brand = data?.brand || null;

  const brandSchema = brand
    ? buildCollectionPageSchema({
        baseUrl,
        path,
        name: brand.brand_name,
        description: `Shop ${brand.brand_name} products online at best prices`,
        products: data.products || [],
      })
    : null;

  const breadcrumbSchema = brand
    ? buildBreadcrumbSchema(baseUrl, [
        { name: brand.brand_name, path },
      ])
    : null;

  return (
    <>
      {brandSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <BrandComponent />
    </>
  );
}
