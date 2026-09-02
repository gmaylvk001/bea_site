"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import { useEffect, useState } from "react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function CategoryBrandBannerSlider({ categorySlug, brandSlug }) {
  const [banners, setBanners] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!categorySlug || !brandSlug) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/category-brand-banner?categorySlug=${encodeURIComponent(
            categorySlug
          )}&brandSlug=${encodeURIComponent(brandSlug)}`
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setBanners(Array.isArray(data.banners) ? data.banners : []);
        }
      } catch (err) {
        console.error("Category brand banner fetch error:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, brandSlug]);

  if (!ready || banners.length === 0) return null;

  const slide = (banner) => {
    const img = (
      <img
        src={banner.banner_image}
        alt={banner.banner_name || "Brand banner"}
        loading="lazy"
        className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[402px] object-cover"
      />
    );
    if (!banner.redirect_url) return img;
    return (
      <a
        href={banner.redirect_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        {img}
      </a>
    );
  };

  if (banners.length === 1) {
    return <div className="w-full overflow-hidden mb-4">{slide(banners[0])}</div>;
  }

  return (
    <div className="w-full overflow-hidden mb-4">
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        navigation
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop
        className="customSwiper overflow-hidden"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner._id || index}>{slide(banner)}</SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
