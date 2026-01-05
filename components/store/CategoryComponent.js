"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function StoreDetail() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);

  useEffect(() => {
    if (slug) fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`/api/store/${slug}`); // now fetching by slug
      const data = await res.json();
      setStore(data);
    } catch (e) {
      console.error("Error fetching store", e);
    }
  };

  if (!store) return <p className="p-10 text-center">Loading...</p>;

  return (
    <>
      <main className="max-w-full mx-auto px-4 py-6 space-y-10 text-slate-900">

        {/* ================= STORE HEADER ================= */}
        <section className="bg-white grid grid-cols-2 max-sm:grid-cols-1 max-md:grid-cols-1 max-lg:grid-cols-[2fr_4fr] gap-4 rounded-lg">

          {/* LEFT INFO CARD */}
          <div className="border border-gray-300 rounded-2xl">
            <h1 className="text-xl md:text-xl font-semibold p-3.5 border-b border-gray-300">
              {store.organisation_name} - <br /> {store.city}
            </h1>

            <div className="flex px-5 py-2 gap-x-3.5">
              <i className="text-blue-900 text-2xl">🏢</i>
              <div className="text-sm">
                <p className="mb-2">{store.address}</p>
                <p className="mb-2">{store.zipcode}</p>
              </div>
            </div>

            <div className="flex px-5 py-2 gap-x-3.5">
              <i className="text-blue-900 text-2xl">📞</i>
              <div className="text-sm">
                <a href={`tel:+91${store.phone}`}> +91{store.phone} </a>
              </div>
            </div>
          </div>

          {/* RIGHT — BANNERS */}
          {store.banners?.length > 0 && (
            <div className="rounded-lg overflow-hidden relative">
              <Swiper modules={[Navigation]} navigation slidesPerView={1}>
                {store.banners.map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={img} className="w-full h-72 object-cover" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </section>

        {/* ================= FEATURED PRODUCTS ================= */}
        {store.featuredProducts?.length > 0 && (
          <section className="p-7 overflow-hidden bg-blue-600 rounded-xl">
  <h2 className="text-center text-white mb-7 text-xl font-semibold">
    Featured Products
  </h2>

  <Swiper
    modules={[Navigation]}
    navigation
    spaceBetween={15}
    breakpoints={{
      1200: { slidesPerView: 4 },
      992: { slidesPerView: 3 },
      768: { slidesPerView: 2 },
      0: { slidesPerView: 1 },
    }}
  >
    {store.featuredProducts.map((prod, idx) => (
      <SwiperSlide
        key={idx}
        className="!flex !flex-col !items-center"  // ensures centered content
      >
        <div className="w-40 h-40 bg-white rounded-full overflow-hidden shadow flex justify-center">
          <img
            src={prod.image}
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-white text-sm mt-2">{prod.title}</p>
      </SwiperSlide>
    ))}
  </Swiper>
</section>
        )}

        {/* ================= OFFERS ================= */}
        {store.offers?.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl text-center font-semibold">Offers</h2>

            <Swiper modules={[Navigation]} navigation slidesPerView={1}>
              {store.offers.map((offer, idx) => (
                <SwiperSlide key={idx}>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden grid lg:grid-cols-[4fr_2fr]">
                    <img src={offer.image} className="w-full h-52 object-cover" />

                    <div className="p-4 flex flex-col justify-around">
                      <div className="text-center space-y-2">
                        <p className="text-2xl font-semibold">{offer.title}</p>
                        <p className="text-xs text-slate-500">
                          Valid till {offer.validTill}
                        </p>
                      </div>

                      <div className="text-center">
                        <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-full text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* ================= BUSINESS HOURS + NEARBY + ADDRESS ================= */}
        {(store.businessHours?.length > 0 ||
          store.nearbyStores?.length > 0 ||
          store.address) && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* BUSINESS HOURS */}
            {store.businessHours?.length > 0 && (
              <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 text-sm">
                <h3 className="font-semibold text-lg">Business Hours</h3>
                <ul className="text-xs mt-2 space-y-1">
                  {store.businessHours.map((b, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{b.day}</span>
                      <span>{b.timing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ADDRESS / DIRECTION */}
            {store.address && (
              <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 text-sm">
                <h3 className="font-semibold text-lg">Get Direction</h3>
                <p className="text-xs mt-1">{store.address}</p>

                <button className="mt-3 px-4 py-2 border border-blue-600 text-blue-600 rounded-full text-xs">
                  Open in Maps
                </button>
              </div>
            )}

            {/* NEARBY STORES */}
            {store.nearbyStores?.length > 0 && (
              <div className="bg-gray-200 border border-gray-300 rounded-xl p-4 text-sm">
                <h3 className="font-semibold text-lg">Nearby Stores</h3>
                <ul className="mt-2 space-y-1 text-xs">
                  {store.nearbyStores.map((st, idx) => (
                    <li key={idx}>{st.name} — {st.address}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

<section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
    <div className="bg-gray-200 border border-gray-300 rounded-xl p-4">
      <h3 className="font-semibold text-lg">Parking Options</h3>
      <p className="text-xs text-slate-600 font-medium">Free parking on site</p>
    </div>

    <div className="bg-gray-200 border border-gray-300 rounded-xl p-4">
      <h3 className="font-semibold text-lg">Payment Methods</h3>
      <p className="text-xs text-slate-600 font-medium">Cash, Credit Card, Debit Card, Online Payment</p>
    </div>

    {/* Tags Section */}
  {store.tags && store.tags.length > 0 && (
    <div className="rounded-xl border border-gray-300 bg-gray-200 p-4 space-y-3">
      <h3 className="font-semibold">Tags</h3>

      <div className="flex flex-wrap gap-2 text-xs max-h-32 overflow-y-auto">
        {store.tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full bg-slate-100"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )}
  </section>

        {/* ================= HIGHLIGHTS ================= */}
        {store.highlights?.length > 0 && (
          <section className="bg-blue-600 text-white rounded-xl py-6 px-4 md:px-8">
            <h2 className="text-center text-lg md:text-3xl font-semibold mb-4">
              Highlights
            </h2>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm">
              {store.highlights.map((h, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <img src={h.image} className="w-full h-24 object-cover rounded" />
                  <p className="mt-2 text-sm text-center">{h.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= SOCIAL TIMELINE ================= */}
        {store.socialTimeline?.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-center">
              Social Timeline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {store.socialTimeline.map((item, index) => (
                <article
                  key={index}
                  className="bg-white rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative">
                    <img
                      src={item.thumbnail || "/images/default-thumb.png"}
                      className="w-full h-96 object-cover"
                    />

                    <a
                      href={item.media}
                      target="_blank"
                      className="absolute inset-0 flex items-center justify-center text-white text-4xl"
                    >
                      ▶
                    </a>
                  </div>

                  <div className="p-3 text-[14px] font-medium bg-white border-b border-r border-l rounded-b-xl border-gray-300">
                    <p className="mb-4">{item.text}</p>

                    <div className="flex text-xs text-slate-600">
                      <p className="font-medium">Posted On :</p>
                      <span className="ml-1">{item.postedOn}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ================= ABOUT ================= */}
        {store.description && (
          <section className="bg-blue-600 rounded-xl p-6 text-white">
            <h2 className="text-2xl text-center font-semibold">About</h2>
            <p className="text-sm text-center mt-3">{store.description}</p>
          </section>
        )}

      </main>
    </>
  );
}
