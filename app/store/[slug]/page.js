import CategoryComponent from "@/components/store/CategoryComponent";
import {
  getBaseUrl,
  fetchJson,
  mediaUrl,
  stripHtml,
  buildStoreSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";

async function getStoreData(slug) {
  return fetchJson(`/api/store/${slug}`);
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  try {
    const store = await getStoreData(slug);

    if (!store?.organisation_name) {
      return {
        title: "Store Not Found",
        description: "This store does not exist",
      };
    }

    const title =
      store.meta_title ||
      `${store.organisation_name} | Bharath Electronics & Appliances`;
    const description =
      store.meta_description ||
      stripHtml(store.description || "").slice(0, 160) ||
      `Visit ${store.organisation_name} store${store.city ? ` in ${store.city}` : ""}.`;
    const image = store.logo
      ? mediaUrl(baseUrl, store.logo)
      : store.store_images?.[0]
        ? mediaUrl(baseUrl, store.store_images[0])
        : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/store/${slug}`,
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
      title: "Store",
      description: "Visit our store",
    };
  }
}

export default async function Page({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getBaseUrl();

  let store = null;
  try {
    store = await getStoreData(slug);
    if (store?.error) store = null;
  } catch (error) {
    console.error("Store schema fetch error:", error);
  }

  const storeSchema = store ? buildStoreSchema(baseUrl, store) : null;
  const breadcrumbSchema = store
    ? buildBreadcrumbSchema(baseUrl, [
        { name: "Stores", path: "/location" },
        {
          name: store.organisation_name,
          path: `/store/${store.slug || slug}`,
        },
      ])
    : null;

  return (
    <>
      {storeSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <CategoryComponent />
    </>
  );
}
