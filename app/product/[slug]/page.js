import ProductClient from "./ProductClient";
import {
  getBaseUrl,
  fetchJson,
  productImageUrl,
  stripHtml,
  buildProductSchema,
  buildFAQPageSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

async function getProductData(slug) {
  return fetchJson(`/api/product/${slug}`);
}

async function getProductReviews(productId) {
  if (!productId) return { reviews: [], avgRating: 0, count: 0 };
  const data = await fetchJson(`/api/reviews/${productId}`);
  if (!data?.success) return { reviews: [], avgRating: 0, count: 0 };
  return {
    reviews: data.reviews || [],
    avgRating: data.avgRating || 0,
    count: data.count || 0,
  };
}

async function getBrandName(brand) {
  if (!brand) return null;
  if (typeof brand === "object" && brand.brand_name) return brand.brand_name;
  const brandId = typeof brand === "object" ? brand._id || brand.id : brand;
  if (!brandId) return null;
  const data = await fetchJson("/api/brand");
  const brands = data?.data || data || [];
  if (!Array.isArray(brands)) return null;
  const matched = brands.find(
    (b) => String(b._id) === String(brandId) || String(b.id) === String(brandId)
  );
  return matched?.brand_name || null;
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
      alternates: {
        canonical: `/product/${slug}`,
      },
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
  let reviewData = { reviews: [], avgRating: 0, count: 0 };
  let brandName = null;

  try {
    product = await getProductData(slug);
    if (product?._id) {
      [reviewData, brandName] = await Promise.all([
        getProductReviews(product._id),
        getBrandName(product.brand),
      ]);
    }
  } catch (error) {
    console.error("Product schema fetch error:", error);
  }

  const productSchema = product
    ? buildProductSchema(baseUrl, product, {
        brandName,
        reviews: reviewData.reviews,
        avgRating: reviewData.avgRating,
        reviewCount: reviewData.count,
      })
    : null;

  const faqSchema = product
    ? buildFAQPageSchema(product.faqs || [])
    : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
