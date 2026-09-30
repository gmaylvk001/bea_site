import CategoryClient from "@/components/category/[slug]/[sub_slug]/[sub_slug_one]/page";
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

async function getCategoryData(categorySlug) {
  if (!categorySlug || categorySlug === "undefined" || categorySlug === "null") {
    return null;
  }
  return fetchJson(`/api/categories/${categorySlug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { slug, sub_slug, sub_slug_one } = awaitedParams;
  const baseUrl = getBaseUrl();

  if (
    !slug || slug === "undefined" || slug === "null" ||
    !sub_slug || sub_slug === "undefined" || sub_slug === "null" ||
    !sub_slug_one || sub_slug_one === "undefined" || sub_slug_one === "null"
  ) {
    return {
      title: "Category Not Found",
      description: "This category does not exist",
      robots: { index: false, follow: false },
    };
  }

  try {
    const data = await getCategoryData(sub_slug_one);

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
        canonical: buildCanonicalUrl(`/category/${slug}/${sub_slug}/${sub_slug_one}`),
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/category/${slug}/${sub_slug}/${sub_slug_one}`,
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
  const { slug, sub_slug, sub_slug_one } = awaitedParams;
  const pageNum = Math.max(1, Number(awaitedSearchParams?.page) || 1);

  // Immediately reject any URL containing "undefined" or "null" segments
  if (
    !slug || slug === "undefined" || slug === "null" ||
    !sub_slug || sub_slug === "undefined" || sub_slug === "null" ||
    !sub_slug_one || sub_slug_one === "undefined" || sub_slug_one === "null"
  ) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const path = `/category/${slug}/${sub_slug}/${sub_slug_one}`;

  let data = null;
  let parentData = null;
  let mainData = null;
  try {
    [data, parentData, mainData] = await Promise.all([
      getCategoryData(sub_slug_one),
      getCategoryData(sub_slug),
      getCategoryData(slug),
    ]);
  } catch (error) {
    console.error("Child category schema fetch error:", error);
  }

  const category = data?.main_category || null;
  const parent = parentData?.main_category || null;
  const main = mainData?.main_category || null;

  // All 3 category levels must exist
  if (!category || !parent || !main) {
    notFound();
  }

  // Validate strict 3-tier hierarchy:
  // 1. main must be a top-level parent category
  const mainParentId = String(main.parentid || "").trim();
  if (mainParentId && mainParentId !== "none" && mainParentId !== "null") {
    notFound();
  }

  // 2. sub-category (parent) must belong to main category
  if (String(parent.parentid || "").trim() !== String(main._id)) {
    notFound();
  }

  // 3. child-category (category) must belong to sub-category
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
  if (main) {
    breadcrumbItems.push({
      name: main.category_name,
      path: `/category/${slug}`,
    });
  }
  if (parent) {
    breadcrumbItems.push({
      name: parent.category_name,
      path: `/category/${slug}/${sub_slug}`,
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

  const initialCategoryData = data ? JSON.parse(JSON.stringify({
    category: data.main_category,
    products: data.products || [],
    brands: data.brands || [],
    filters: data.filters || [],
    main_category: data.main_category,
    categoryTree: data.category || [],
    banners: data.main_category?.banners || []
  })) : null;

  const startIndex = (pageNum - 1) * 24;
  const initialProducts = data?.products
    ? JSON.parse(JSON.stringify(data.products.slice(startIndex, startIndex + 24)))
    : [];

  const totalPages = data?.products ? Math.ceil(data.products.length / 24) || 1 : 1;
  const initialPagination = data?.products
    ? {
        currentPage: pageNum,
        totalPages,
        hasNext: pageNum < totalPages,
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
      />
    </>
  );
}
