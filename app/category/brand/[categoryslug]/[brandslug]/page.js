import BrandComponent from "@/components/category/brand/BrandComponent";
import {
  getBaseUrl,
  fetchJson,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

async function getCategoryBrandData(categorySlug, brandSlug) {
  return fetchJson(
    `/api/brand/categories/${categorySlug}/brand/${brandSlug}`
  );
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { categoryslug, brandslug } = awaitedParams;
  const baseUrl = getBaseUrl();

  try {
    const data = await getCategoryBrandData(categoryslug, brandslug);
    const brand = data?.brand;
    const category = data?.category;

    if (!brand || !category) {
      return {
        title: "Brand Not Found",
        description: "This brand category page does not exist",
      };
    }

    const title = `${brand.brand_name} ${category.category_name}`;
    const description = `Shop ${brand.brand_name} ${category.category_name} products online at best prices`;
    const image = brand.image
      ? brand.image.startsWith("http")
        ? brand.image
        : `${baseUrl}/uploads/Brands/${brand.image}`
      : category.image
        ? `${baseUrl}${category.image}`
        : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/category/brand/${categoryslug}/${brandslug}`,
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
      description: "Browse products by brand and category",
    };
  }
}

export default async function Page({ params }) {
  const awaitedParams = await params;
  const { categoryslug, brandslug } = awaitedParams;
  const baseUrl = getBaseUrl();
  const path = `/category/brand/${categoryslug}/${brandslug}`;

  let data = null;
  try {
    data = await getCategoryBrandData(categoryslug, brandslug);
    if (data?.error) data = null;
  } catch (error) {
    console.error("Category brand schema fetch error:", error);
  }

  const brand = data?.brand || null;
  const category = data?.category || null;

  const pageName = brand && category
    ? `${brand.brand_name} ${category.category_name}`
    : brand?.brand_name || "";

  const brandSchema = brand
    ? buildCollectionPageSchema({
        baseUrl,
        path,
        name: pageName,
        description: `Shop ${pageName} products online at best prices`,
        products: data.products || [],
      })
    : null;

  const breadcrumbItems = [];
  if (category) {
    breadcrumbItems.push({
      name: category.category_name,
      path: `/category/${category.category_slug || categoryslug}`,
    });
  }
  if (brand) {
    breadcrumbItems.push({
      name: brand.brand_name,
      path,
    });
  }

  const breadcrumbSchema = breadcrumbItems.length
    ? buildBreadcrumbSchema(baseUrl, breadcrumbItems)
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
      <BrandComponent
        categorySlug={categoryslug}
        brandSlug={brandslug}
      />
    </>
  );
}
