import ProductClient from "./ProductClient";
import {
  getBaseUrl,
  fetchJson,
  productImageUrl,
  stripHtml,
  buildProductSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

async function getProductData(slug) {
  return fetchJson(`/api/product/${slug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  try {
    const product = await getProductData(slug);

    if (!product?.slug && !product?.name) {
      return {
        title: "Product not found",
        description: "This product is unavailable",
      };
    }

    const title = product.meta_title || product.name;
    const description =
      product.meta_description ||
      stripHtml(product.description).slice(0, 160) ||
      "Buy products online at best price";

    const image =
      product.images?.length > 0
        ? productImageUrl(baseUrl, product.images[0])
        : `${baseUrl}/no-image.jpg`;

    return {
      title,
      description,
      keywords: product.search_keywords || "",
      openGraph: {
        title,
        description,
        url: `${baseUrl}/product/${slug}`,
        images: [image],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return {
      title: "Product",
      description: "Buy products online",
    };
  }
}

export default async function ProductNew({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  let product = null;
  try {
    product = await getProductData(slug);
  } catch (error) {
    console.error("Product schema fetch error:", error);
  }

  const productSchema = product ? buildProductSchema(baseUrl, product) : null;
  const breadcrumbSchema = product
    ? buildBreadcrumbSchema(baseUrl, [
        { name: product.name, path: `/product/${product.slug || slug}` },
      ])
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <ProductClient />
    </>
  );
}
