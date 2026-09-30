import CategoryClient from "@/components/category/[slug]/[sub_slug]/page";
import { buildCanonicalUrl } from "@/components/CanonicalLink";
import { notFound } from "next/navigation";
import {
  getBaseUrl,
  fetchJson,
  categoryDescription,
  sanitizeMetaKeywords,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

import { cache } from "react";

const getCategoryData = cache(async (categorySlug) => {
  if (!categorySlug || categorySlug === "undefined" || categorySlug === "null") {
    return null;
  }
  return fetchJson(`/api/categories/${categorySlug}`);
});

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { slug, sub_slug } = awaitedParams;
  const baseUrl = getBaseUrl();

  if (
    !slug || slug === "undefined" || slug === "null" ||
    !sub_slug || sub_slug === "undefined" || sub_slug === "null"
  ) {
    return {
      title: "Category Not Found",
      description: "This category does not exist",
      robots: { index: false, follow: false },
    };
  }

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

export default async function Page({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const { slug, sub_slug } = awaitedParams;
  const pageNum = Math.max(1, Number(awaitedSearchParams?.page) || 1);

  // Immediately reject any URL containing "undefined" or "null" segments
  if (
    !slug || slug === "undefined" || slug === "null" ||
    !sub_slug || sub_slug === "undefined" || sub_slug === "null"
  ) {
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

  // Both categories must exist in the database
  if (!category || !parent) {
    notFound();
  }

  // 1. Parent must be a top-level parent category
  const parentParentId = String(parent.parentid || "").trim();
  if (parentParentId && parentParentId !== "none" && parentParentId !== "null") {
    notFound();
  }

  // 2. Sub-category must belong to parent category
  if (String(category.parentid || "").trim() !== String(parent._id)) {
    notFound();
  }

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

  const initialCategoryData = data ? JSON.parse(JSON.stringify(data)) : null;
  const startIndex = (pageNum - 1) * 24;
  const initialProducts = data?.products
    ? JSON.parse(JSON.stringify(data.products.slice(startIndex, startIndex + 24)))
    : [];
  const initialPagination = data?.products
    ? {
        currentPage: pageNum,
        totalPages: Math.ceil(data.products.length / 24) || 1,
        hasNext: data.products.length > startIndex + 24,
        hasPrev: pageNum > 1,
        totalProducts: data.products.length,
      }
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
      <CategoryClient
        initialCategoryData={initialCategoryData}
        initialProducts={initialProducts}
        initialPagination={initialPagination}
        initialSearchParams={awaitedSearchParams}
      />
    </>
  );
}
