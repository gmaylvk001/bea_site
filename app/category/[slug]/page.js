import CategoryPrimaryPage from "@/components/category/sample_cat";
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

async function getCategoryData(slug) {
  return fetchJson(`/api/categories/${slug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  try {
    const data = await getCategoryData(slug);

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
        canonical: buildCanonicalUrl(`/category/${slug}`),
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/category/${slug}`,
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
  const slug = awaitedParams.slug;
  if (isInvalidCategorySlug(slug)) {
    notFound();
  }
  const baseUrl = getBaseUrl();

  let data = null;
  try {
    data = await getCategoryData(slug);
  } catch (error) {
    console.error("Category schema fetch error:", error);
  }

  const category = data?.main_category || null;
  const path = `/category/${slug}`;

  const categorySchema = category
    ? buildCollectionPageSchema({
        baseUrl,
        path,
        name: category.category_name,
        description: categoryDescription(category),
        products: data.products || [],
      })
    : null;

  const breadcrumbSchema = category
    ? buildBreadcrumbSchema(baseUrl, [
        { name: category.category_name, path },
      ])
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
      <CategoryPrimaryPage />
    </>
  );
}
