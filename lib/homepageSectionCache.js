import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import dbConnect from "@/lib/db";
import CategoryBanner from "@/models/categorybanner";
import FlashSale from "@/models/flashsale";
import HomeSection from "@/models/homeSection";
import SingleBannerNew from "@/models/singlebanner";
import SingleBannerTwo from "@/models/singlebanner-two";

function mapSingleBanners(banners) {
  if (banners.length === 0) {
    return [{
      id: "default",
      redirect_url: "/shop",
      bgImageUrl: "/images/default-singlebanner.png",
    }];
  }

  const activeBanners = banners
    .filter((banner) => banner.status === "Active")
    .map((banner) => ({
      id: banner._id.toString(),
      redirect_url: banner.redirect_url || "/shop",
      bgImageUrl: banner.banner_image,
    }));

  return activeBanners;
}

export function createHomepageSectionReader(key, tag, load) {
  return unstable_cache(
    async () => JSON.parse(JSON.stringify(await load())),
    [key],
    { revalidate: 300, tags: [tag] }
  );
}

export function invalidateHomepageSection(tag) {
  revalidateTag(tag);
}

export async function getHomepageSectionOrder() {
  await dbConnect();
  const sections = await HomeSection.find({ status: "active" })
    .sort({ position: 1 })
    .select("_id name position")
    .lean();

  return sections.map((section) => ({
    id: section._id.toString(),
    name: section.name,
    position: section.position,
  }));
}

export const homepageSectionTags = {
  categoryBanner: "homepage-category-banner",
  flashSale: "homepage-flash-sale",
  singleBanner: "homepage-single-banner",
  singleBannerTwo: "homepage-single-banner-two",
};

export const getCachedCategoryBanner = createHomepageSectionReader(
  "homepage-category-banner-v1",
  homepageSectionTags.categoryBanner,
  async () => {
    await dbConnect();
    return CategoryBanner.findOne({}).lean();
  }
);

export const getCachedFlashSales = createHomepageSectionReader(
  "homepage-flash-sale-v1",
  homepageSectionTags.flashSale,
  async () => {
    await dbConnect();
    return FlashSale.find({}).lean();
  }
);

export const getCachedSingleBanners = createHomepageSectionReader(
  "homepage-single-banner-v1",
  homepageSectionTags.singleBanner,
  async () => {
    await dbConnect();
    return SingleBannerNew.find({}).sort({ order: 1 }).lean();
  }
);

export const getCachedSingleBannersTwo = createHomepageSectionReader(
  "homepage-single-banner-two-v1",
  homepageSectionTags.singleBannerTwo,
  async () => {
    await dbConnect();
    return SingleBannerTwo.find({}).sort({ order: 1 }).lean();
  }
);

export async function getHomepageInitialSections() {
  const [categoryBannerResult, flashSaleResult, singleBannerResult, singleBannerTwoResult] =
    await Promise.allSettled([
      getCachedCategoryBanner(),
      getCachedFlashSales(),
      getCachedSingleBanners(),
      getCachedSingleBannersTwo(),
    ]);

  const getResult = (result, label) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`Error loading homepage ${label}:`, result.reason);
    return null;
  };

  const categoryBannerData = getResult(categoryBannerResult, "Category Banner");
  const flashSalesData = getResult(flashSaleResult, "Flash Sale");
  const singleBannerData = getResult(singleBannerResult, "Single Banner");
  const singleBannerTwoData = getResult(singleBannerTwoResult, "Single Banner Two");

  return {
    categoryBanner: categoryBannerData
      ? (categoryBannerData.banners || [])
          .filter(() => categoryBannerData.status === "Active")
          .map((banner, index) => ({
            imageUrl: banner.banner_image,
            redirectUrl: banner.redirect_url,
            ...(index === 0 ? { categoryname: "SMART PHONE" } : {}),
            ...(index === 1 ? { categoryname: "AIR CONDITIONER" } : {}),
            ...(index === 2 ? { categoryname: "REFRIGERATOR" } : {}),
            ...(index === 3 ? { categoryname: "WASHING MACHINE" } : {}),
          }))
      : null,
    flashSales: flashSalesData
      ? flashSalesData
          .filter((item) => !item.status || item.status.toLowerCase() === "active")
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => {
            const normalizeUrl = (url) => {
              if (!url) return "";
              if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
                return url;
              }
              return `/${url}`;
            };

            return {
              id: item._id.toString(),
              title: item.title,
              productImage: normalizeUrl(
                item.banner_image || item.bannerImage || item.product_image || item.productImage || item.image || ""
              ),
              bgImage: normalizeUrl(
                item.background_image || item.backgroundImage || item.bg_image || item.bgImage || ""
              ),
              redirectUrl: item.redirect_url || item.redirectUrl || "/shop",
            };
          })
      : null,
    singleBanner: singleBannerData ? mapSingleBanners(singleBannerData) : null,
    singleBannerTwo: singleBannerTwoData
      ? mapSingleBanners(singleBannerTwoData)
      : null,
  };
}
