
import CategoryClient from "@/components/category/[slug]/page";

export async function generateMetadata({ params }) {
  const { sub_slug } = params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${baseUrl}/api/categories/${sub_slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: "Category Not Found",
        description: "This category does not exist",
      };
    }

    const data = await res.json();
    const category = data.main_category;
    //console.log('category',category);
    return {
      title: category.meta_title || category.category_name,
      description:
        category.meta_description ||
        `Browse products in ${category.category_name}`,
      keywords: category.meta_keyword || "",

      openGraph: {
        title: category.meta_title || category.category_name,
        description: category.meta_description,
        url: `${baseUrl}/category/${sub_slug}`,
        images: category.image ? [`${baseUrl}${category.image}`] : [],
        type: "website",
      },

      twitter: {
        card: "summary_large_image",
        title: category.meta_title || category.category_name,
        description: category.meta_description,
      },
    };
  } catch {
    return {
      title: "Category",
      description: "Browse products by category",
    };
  }
}

export default function Page() {
  return <CategoryClient />;
}
