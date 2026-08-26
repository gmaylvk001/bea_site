import CategoryClient from "@/components/category/[slug]/[sub_slug]/page";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import {
  getBaseUrl,
  fetchJson,
  categoryDescription,
  sanitizeMetaKeywords,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";
import { isInvalidCategorySlug } from "@/lib/categoryPath";
import { notFound } from "next/navigation";

async function getCategoryData(categorySlug) {
  return fetchJson(`/api/categories/${categorySlug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { slug, sub_slug } = awaitedParams;
  const baseUrl = getBaseUrl();

  try {
    const data = await getCategoryData(sub_slug);

    if (!data?.main_category) {
      return {
        title: "Category Not Found",
        description: "This category does not exist",
      };
    }

    const category = data.main_category;
    const title =
      category.meta_title && category.meta_title !== "none"
        ? category.meta_title
        : category.category_name;
    const description =
      category.meta_description && category.meta_description !== "none"
        ? category.meta_description
        : `Browse products in ${category.category_name}`;

    const keywords = sanitizeMetaKeywords(category.meta_keyword);

    return {
      title,
      description,
      ...(keywords ? { keywords } : {}),
      alternates: {
        canonical: buildCanonicalUrl(`/category/${slug}/${sub_slug}`),
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/category/${slug}/${sub_slug}`,
        images: category.image ? [`${baseUrl}${category.image}`] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Category",
      description: "Browse products by category",
    };
  }
}

export default async function Page({ params }) {
  const awaitedParams = await params;
  const { slug, sub_slug } = awaitedParams;
  if ([slug, sub_slug].some(isInvalidCategorySlug)) {
    notFound();
  }
  const baseUrl = getBaseUrl();
  const path = `/category/${slug}/${sub_slug}`;

  let data = null;
  let parentData = null;
  try {
    [data, parentData] = await Promise.all([
      getCategoryData(sub_slug),
      getCategoryData(slug),
    ]);
  } catch (error) {
    console.error("Sub-category schema fetch error:", error);
  }

  const category = data?.main_category || null;
  const parent = parentData?.main_category || null;

  const categorySchema = category
    ? buildCollectionPageSchema({
        baseUrl,
        path,
        name: category.category_name,
        description: categoryDescription(category),
        products: data.products || [],
      })
    : null;

  const breadcrumbItems = [];
  if (parent) {
    breadcrumbItems.push({
      name: parent.category_name,
      path: `/category/${slug}`,
    });
  }
  if (category) {
    breadcrumbItems.push({
      name: category.category_name,
      path,
    });
  }

  const breadcrumbSchema = breadcrumbItems.length
    ? buildBreadcrumbSchema(baseUrl, breadcrumbItems)
    : null;

  return (
    <>
      {categorySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <CategoryClient />
    </>
  );
}
