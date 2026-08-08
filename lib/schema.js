export function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

export function productImageUrl(baseUrl, image) {
  if (!image) return undefined;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${baseUrl}${image}`;
  return `${baseUrl}/uploads/products/${image}`;
}

export function mediaUrl(baseUrl, path) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${baseUrl}${path}`;
  return `${baseUrl}/${path}`;
}

export function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").trim();
}

export function categoryDescription(category) {
  if (!category) return "";
  if (category.meta_description && category.meta_description !== "none") {
    return category.meta_description;
  }
  return category.category_description || "";
}

export async function fetchJson(path) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export function buildItemList(baseUrl, products = []) {
  return {
    "@type": "ItemList",
    itemListElement: products.slice(0, 50).map((p, index) => {
      const item = {
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/product/${p.slug}`,
        name: p.name,
      };
      const image = productImageUrl(baseUrl, p.images?.[0]);
      if (image) item.image = image;
      return item;
    }),
  };
}

export function buildCollectionPageSchema({
  baseUrl,
  path,
  name,
  description = "",
  products = [],
}) {
  if (!name || !path) return null;
  const url = `${baseUrl}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name,
    description: description || "",
    url,
    mainEntity: buildItemList(baseUrl, products),
  };
}

/** items: [{ name, path }] — path is site path like /category/foo (Home is prepended). */
export function buildBreadcrumbSchema(baseUrl, items = []) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.name,
        item: `${baseUrl}${item.path}`,
      })),
    ],
  };
}

export function buildProductSchema(baseUrl, product) {
  if (!product?.slug) return null;

  const url = `${baseUrl}/product/${product.slug}`;
  const description =
    product.meta_description ||
    stripHtml(product.description).slice(0, 160) ||
    "";
  const price = product.special_price || product.price;
  const images = (product.images || [])
    .map((img) => productImageUrl(baseUrl, img))
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: product.name,
    description,
    url,
    sku: product.item_code || product.model_number || undefined,
    image: images.length ? images : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: price != null ? String(price) : undefined,
      availability:
        product.stock_status === "Out of Stock" || Number(product.quantity) <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (product.brand_code) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand_code,
    };
  }

  return schema;
}
