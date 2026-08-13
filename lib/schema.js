export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://www.bharathelectronics.in"
  ).replace(/\/$/, "");
}

/** Selling price shown to users: special_price when valid discount, else price. */
export function getProductSellingPrice(product) {
  if (!product) return null;
  const listPrice = Number(product.price);
  const special = Number(product.special_price);
  if (
    Number.isFinite(special) &&
    special > 0 &&
    (!Number.isFinite(listPrice) || special < listPrice)
  ) {
    return special;
  }
  if (Number.isFinite(listPrice) && listPrice >= 0) return listPrice;
  if (Number.isFinite(special) && special >= 0) return special;
  return null;
}

function pruneUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(pruneUndefined).filter((v) => v !== undefined);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined || entry === null || entry === "") continue;
      out[key] = pruneUndefined(entry);
    }
    return out;
  }
  return value;
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

export function buildProductSchema(baseUrl, product, options = {}) {
  if (!product?.slug) return null;

  const url = `${baseUrl}/product/${product.slug}`;
  const description =
    product.meta_description ||
    stripHtml(product.description || "").slice(0, 300) ||
    "";
  const sellingPrice = getProductSellingPrice(product);
  const images = (product.images || [])
    .map((img) => productImageUrl(baseUrl, img))
    .filter(Boolean);

  const brandName =
    options.brandName ||
    (typeof product.brand === "object" && product.brand?.brand_name) ||
    product.brand_name ||
    product.brand_code ||
    null;

  const inStock =
    product.stock_status === "In Stock" && Number(product.quantity) > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    description: description || undefined,
    sku: product.item_code || undefined,
    mpn: product.model_number || product.item_code || undefined,
    image: images.length ? images : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price:
        sellingPrice != null && Number.isFinite(Number(sellingPrice))
          ? String(Number(sellingPrice))
          : undefined,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (brandName) {
    schema.brand = {
      "@type": "Brand",
      name: brandName,
    };
  }

  // Only include genuine, valid reviews/ratings (never placeholders).
  const reviews = (Array.isArray(options.reviews) ? options.reviews : []).filter(
    (r) => {
      const rating = Number(r.reviews_rating ?? r.rating ?? r.reviewRating);
      return Number.isFinite(rating) && rating >= 1 && rating <= 5;
    }
  );
  const reviewCount =
    options.reviewCount != null && Number(options.reviewCount) > 0
      ? Number(options.reviewCount)
      : reviews.length;
  const avgRating =
    options.avgRating != null && Number(options.avgRating) > 0
      ? Number(options.avgRating)
      : reviews.length
        ? reviews.reduce(
            (sum, r) => sum + Number(r.reviews_rating || r.rating || 0),
            0
          ) / reviews.length
        : 0;

  if (reviewCount > 0 && avgRating > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(avgRating.toFixed(1)),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (reviews.length > 0) {
    schema.review = reviews.slice(0, 10).map((r) => {
      const authorName =
        r.user_id?.name ||
        r.author?.name ||
        (typeof r.author === "string" ? r.author : null) ||
        "Verified Customer";
      const ratingValue = Number(r.reviews_rating || r.rating || r.reviewRating);
      const body = r.reviews_comments || r.reviewBody || r.comment || "";
      const title = r.reviews_title || r.name || undefined;
      const datePublished = toSchemaDate(r.created_date || r.datePublished);

      return {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: authorName,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue,
          bestRating: 5,
          worstRating: 1,
        },
        ...(title ? { name: title } : {}),
        ...(body ? { reviewBody: body } : {}),
        ...(datePublished ? { datePublished } : {}),
      };
    });
  }

  return pruneUndefined(schema);
}

export function buildFAQPageSchema(faqs = []) {
  const items = (faqs || [])
    .map((faq) => {
      const question = faq.question || faq.name || faq.q;
      const answer = faq.answer || faq.text || faq.a;
      if (!question || !answer) return null;
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: stripHtml(String(answer)),
        },
      };
    })
    .filter(Boolean);

  if (!items.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items,
  };
}

export function toSchemaDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split("T")[0];
}

export function buildBlogPostingSchema(baseUrl, blog, options = {}) {
  if (!blog?.blog_slug) return null;

  const siteName =
    options.siteName || "Bharath Electronics & Appliances";
  const authorName =
    options.authorName || "BEA Editorial Team";
  const logoPath = options.logoPath || "/logo.png";
  const url = `${baseUrl}/blog/${blog.blog_slug}`;
  const description = stripHtml(blog.description || "").slice(0, 300);
  const imageUrl = blog.image ? mediaUrl(baseUrl, blog.image) : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.blog_name,
    description: description || undefined,
    datePublished: toSchemaDate(blog.createdAt),
    dateModified: toSchemaDate(blog.updatedAt || blog.createdAt),
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}${logoPath}`,
      },
    },
    mainEntityOfPage: url,
  };

  if (imageUrl) {
    schema.image = [imageUrl];
  }

  return schema;
}

export function buildHomePageSchema(baseUrl, options = {}) {
  const siteName =
    options.siteName || "Bharath Electronics & Appliances";
  const logoPath = options.logoPath || "/logo.png";
  const sameAs = options.sameAs || [
    "https://www.facebook.com/BharathElectronics/",
    "https://www.instagram.com/bharathelectronics/",
    "https://www.youtube.com/@bharathelectronicsandapplian",
  ];
  const homeUrl = `${baseUrl}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: siteName,
        url: homeUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}${logoPath}`,
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: homeUrl,
        name: siteName,
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/search?query={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/#webpage`,
        url: homeUrl,
        name: "Home",
        isPartOf: {
          "@id": `${baseUrl}/#website`,
        },
      },
    ],
  };
}

const DAY_ALIASES = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function expandDayLabel(dayLabel = "") {
  const raw = String(dayLabel).trim();
  if (!raw) return [];

  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/–|—/g, "-");

  if (normalized === "mon-fri" || normalized === "monday-friday") {
    return WEEKDAY_ORDER.slice(0, 5);
  }
  if (normalized === "sat-sun" || normalized === "saturday-sunday") {
    return WEEKDAY_ORDER.slice(5);
  }
  if (normalized === "everyday" || normalized === "daily" || normalized === "alldays") {
    return [...WEEKDAY_ORDER];
  }

  if (normalized.includes("-")) {
    const [startKey, endKey] = normalized.split("-");
    const start = DAY_ALIASES[startKey];
    const end = DAY_ALIASES[endKey];
    if (start && end) {
      const startIdx = WEEKDAY_ORDER.indexOf(start);
      const endIdx = WEEKDAY_ORDER.indexOf(end);
      if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
        return WEEKDAY_ORDER.slice(startIdx, endIdx + 1);
      }
    }
  }

  const single = DAY_ALIASES[normalized] || DAY_ALIASES[raw.toLowerCase()];
  return single ? [single] : [];
}

function to24Hour(timeStr = "") {
  const cleaned = String(timeStr).trim().replace(/\./g, ":");
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = (match[3] || "").toLowerCase();

  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (!meridiem && hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseBusinessTiming(timing = "") {
  const text = String(timing).trim();
  if (!text || /closed/i.test(text)) return null;

  const parts = text.split(/\s*(?:–|—|-|to|until)\s*/i).filter(Boolean);
  if (parts.length < 2) return null;

  const opens = to24Hour(parts[0]);
  const closes = to24Hour(parts[1]);
  if (!opens || !closes) return null;
  return { opens, closes };
}

export function buildOpeningHoursSpecification(businessHours = []) {
  const grouped = new Map();

  for (const entry of businessHours || []) {
    const days = expandDayLabel(entry.day);
    const hours = parseBusinessTiming(entry.timing);
    if (!days.length || !hours) continue;

    const key = `${hours.opens}|${hours.closes}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [],
        opens: hours.opens,
        closes: hours.closes,
      });
    }

    const spec = grouped.get(key);
    for (const day of days) {
      if (!spec.dayOfWeek.includes(day)) spec.dayOfWeek.push(day);
    }
  }

  return [...grouped.values()].map((spec) => ({
    ...spec,
    dayOfWeek: WEEKDAY_ORDER.filter((d) => spec.dayOfWeek.includes(d)),
  }));
}

export function buildStoreSchema(baseUrl, store) {
  if (!store?.slug && !store?.organisation_name) return null;

  const slug = store.slug;
  const url = slug ? `${baseUrl}/store/${slug}` : `${baseUrl}/store`;
  const images = [
    store.logo,
    ...(store.store_images || []),
    ...(store.images || []),
    ...(store.banners || []),
  ]
    .map((img) => mediaUrl(baseUrl, img))
    .filter(Boolean);

  const uniqueImages = [...new Set(images)];
  const openingHours = buildOpeningHoursSpecification(store.businessHours);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.organisation_name,
    url,
  };

  if (store.address || store.city || store.zipcode || store.location) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: store.address || undefined,
      addressLocality: store.city || store.location || undefined,
      postalCode: store.zipcode || undefined,
      addressCountry: "IN",
    };
  }

  if (uniqueImages.length) {
    schema.image = uniqueImages;
  }

  const lat = store.location_map?.lat;
  const lng = store.location_map?.lng;
  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(lat),
      longitude: Number(lng),
    };
  }

  if (store.phone) {
    schema.telephone = store.phone;
  }

  if (openingHours.length) {
    schema.openingHoursSpecification = openingHours;
  }

  if (store.description) {
    schema.description = stripHtml(store.description).slice(0, 300);
  }

  return schema;
}
