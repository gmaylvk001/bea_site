import CategoryPrimaryPage from "@/components/category/sample_cat";
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

const getCategoryData = cache(async (slug) => {
  return fetchJson(`/api/categories/${slug}`);
});

function isParentCategory(category) {
  if (!category) return false;
  const parentId = String(category.parentid || "").trim();
  return !parentId || parentId === "none" || parentId === "null" || parentId === "";
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  try {
    const data = await getCategoryData(slug);
    const category = data?.main_category;

    if (!category || !isParentCategory(category)) {
      return {
        title: "Category Not Found",
        description: "This category does not exist",
      };
    }

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

export default async function Page({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const slug = awaitedParams.slug;
  const pageNum = Math.max(1, Number(awaitedSearchParams?.page) || 1);
  const baseUrl = getBaseUrl();

  let data = null;
  let bannerData = null;
  let flashData = null;
  let mainData = null;
  try {
    [data, bannerData, flashData, mainData] = await Promise.all([
      getCategoryData(slug),
      fetchJson(`/api/main-cat-banner?categorySlug=${slug}`),
      fetchJson(`/api/fetchflashcat?categorySlug=${slug}`),
      fetchJson(`/api/main-tird-sec/${slug}`),
    ]);
  } catch (error) {
    console.error("Category schema fetch error:", error);
  }

  const category = data?.main_category || null;

  // Disallow sub-categories from opening at 1-level /category/:slug.
  // Only top-level parent categories (parentid === "none") are allowed here.
  if (!category || !isParentCategory(category)) {
    notFound();
  }
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

  const initialCategoryData = data ? JSON.parse(JSON.stringify(data)) : null;
  const startIndex = (pageNum - 1) * 12;
  const initialProducts = data?.products
    ? JSON.parse(JSON.stringify(data.products.slice(startIndex, startIndex + 12)))
    : [];
  const totalPages = data?.products ? Math.ceil(data.products.length / 12) || 1 : 1;
  const initialPagination = data?.products
    ? {
        currentPage: pageNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        totalProducts: data.products.length,
      }
    : null;
  const initialContentFlags = {
    hasBannerContent: Boolean(bannerData?.banners?.length),
    hasFlashContent: Boolean(flashData?.banners?.length),
    hasCategoryMainContent: Boolean(mainData?.data?.length),
  };

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
      <CategoryPrimaryPage
        initialCategoryData={initialCategoryData}
        initialProducts={initialProducts}
        initialPagination={initialPagination}
        initialContentFlags={initialContentFlags}
        slug={slug}
      />
    </>
  );
}
