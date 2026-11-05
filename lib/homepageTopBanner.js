import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import dbConnect from "@/lib/db";
import TopBanner from "@/models/topbanner";

const TOP_BANNER_CACHE_TAG = "homepage-topbanner";

const getCachedTopBannerRecords = unstable_cache(
  async () => {
    await dbConnect();
    const banners = await TopBanner.find({}).sort({ order: 1 }).lean();

    return banners.map((banner) => ({
      ...banner,
      _id: banner._id.toString(),
      createdAt: banner.createdAt?.toISOString(),
      updatedAt: banner.updatedAt?.toISOString(),
    }));
  },
  ["homepage-topbanner-v1"],
  { revalidate: 300, tags: [TOP_BANNER_CACHE_TAG] }
);

export function getTopBannerRecords() {
  return getCachedTopBannerRecords();
}

export async function getHomepageTopBannerItems() {
  const banners = await getCachedTopBannerRecords();

  return banners
    .filter((banner) => !banner.status || banner.status.toLowerCase() === "active")
    .map((banner) => ({
      id: banner._id,
      buttonLink: banner.redirect_url || "/shop",
      bgImageUrl: banner.banner_image,
      bannerImageUrl: banner.banner_image,
      mobileBgImageUrl: banner.mobile_banner_image || "",
      redirectUrl: banner.redirect_url,
    }));
}

export function invalidateTopBannerCache() {
  revalidateTag(TOP_BANNER_CACHE_TAG);
}
