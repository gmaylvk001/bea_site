import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Product Card - Exact design as requested
const CategoryProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <div className="bg-gray-50 px-3 py-3 text-center border-r border-gray-300">
      {/* Product Image */}
      <div className="relative h-[140px] mb-3">
        {product.images?.[0] ? (
          <Link href={`/product/${product.slug}`} className="block w-full h-full">
            <Image
              src={
                product.images[0].startsWith("http")
                  ? product.images[0]
                  : `/uploads/products/${product.images[0]}`
              }
              alt={product.name}
              fill
              className="object-contain rounded-md"
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </Link>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <h3 className="text-sm font-semibold text-gray-800">{product.name}</h3>
      <p className="text-xs text-gray-600">
        {product.color && `${product.color}, `}
        {product.ram && `${product.ram}, `}
        {product.storage && `${product.storage}`}
      </p>
      
      {/* Price */}
      <p className="text-lg font-bold text-red-600 mt-1">
        ₹{Math.round(product.special_price && product.special_price > 0 && product.special_price < product.price ? product.special_price : product.price).toLocaleString()}
      </p>
      
      {/* Discount */}
      {product.special_price && product.special_price > 0 && product.special_price < product.price && (
        <p className="text-xs text-green-600">
          Save ₹{Math.round(product.price - product.special_price).toLocaleString()}
        </p>
      )}
    </div>
  );
};

// CategoryProductsSection component
const CategoryProductsSection = ({ 
  mainCategory, 
  index, 
  slug
}) => {
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchCategoryProducts = async (categoryId, limit = 10) => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set('sub_category_new', mainCategory.md5_cat_name);
      query.set('page', '1');
      query.set('limit', limit.toString());
      query.set('sort', 'featured');

      const apiUrl = `/api/product/filter/main?${query}`;
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      setCategoryProducts(data.products || []);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mainCategory._id && !hasFetched) {
      fetchCategoryProducts(mainCategory._id, 10);
    }
  }, [mainCategory._id, hasFetched]);

  return (
    <section className={`py-6 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Category Banner */}
        <div className="mb-6 px-4 md:px-6">
          <Swiper
            modules={[Navigation, Autoplay, EffectFade]}
            effect="fade"
            spaceBetween={0}
            speed={1000}
            slidesPerView={1}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: `.category-banner-swiper-button-next-${index}`,
              prevEl: `.category-banner-swiper-button-prev-${index}`,
            }}
            className="rounded-lg overflow-hidden"
          >
            {mainCategory.banners && mainCategory.banners.map((banner, bannerIndex) => (
              <SwiperSlide key={banner._id || bannerIndex}>
                {banner.redirect_url ? (
                  <Link href={banner.redirect_url} className="block w-full">
                    <div className="w-full overflow-hidden cursor-pointer">
                      <div className="relative aspect-[3/1] w-full">
                        <Image
                          src={
                            banner.banner_image.startsWith("http")
                              ? banner.banner_image
                              : `${banner.banner_image}`
                          }
                          alt={banner.banner_name || mainCategory.category_name}
                          fill
                          className="object-cover" 
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1248px" 
                        />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="w-full overflow-hidden">
                    <div className="relative aspect-[3/1] w-full"> 
                      <Image
                        src={
                          banner.banner_image.startsWith("http")
                            ? banner.banner_image
                            : `${banner.banner_image}`
                        }
                        alt={banner.banner_name || mainCategory.category_name}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1248px" 
                      />
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation buttons */}
          <div className={`category-banner-swiper-button-prev-${index} absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow cursor-pointer transition-all duration-200`}>
            <ChevronLeft className="text-gray-700" size={16} />
          </div>
          <div className={`category-banner-swiper-button-next-${index} absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow cursor-pointer transition-all duration-200`}>
            <ChevronRight className="text-gray-700" size={16} />
          </div>
        </div>

        {/* Category Heading */}
        <div className="flex items-center justify-between mb-4 px-4 md:px-6">
          <h2 className="text-lg font-bold text-gray-900">{mainCategory.category_name}</h2>
          <Link 
            href={`/category/${slug}/${mainCategory.category_slug}`}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>

         {/* 4. Category Circles */}
  {mainCategory.subCategories && mainCategory.subCategories.length > 0 && (
  <div className="mb-10">
    <div className="relative mb-10">
      {/* LEFT ARROW */}
      <button
        onClick={() => scrollSubCats("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 
                   bg-white shadow-md p-3 rounded-full hidden md:flex"
      >
        ‹
      </button>

      {/* MAIN WRAPPER - Slider layout for all categories */}
      <div
        id="subCatScroll"
        className="flex overflow-x-auto whitespace-nowrap space-x-8 py-4 px-4 hide-scrollbar scroll-smooth"
      >
        {mainCategory.subCategories.map((subCategory) => (
          <Link
            href={`/category/${slug}/${subCategory.category_slug}`}
            key={subCategory._id}
            className="group flex flex-col items-center flex-shrink-0 inline-block"
          >
            {/* Dynamic background colors based on category */}
            <div className="w-[400px] h-[235px] rounded-lg shadow-md flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#5ce1e6] via-white to-[#561269]">
              <div className="relative w-[300px] h-[186px]">
                <Image
                  src={subCategory.image || "/images/default-category.jpg"}
                  alt={subCategory.category_name}
                  fill
                  className="object-contain p-3"
                  unoptimized
                />
              </div>
            </div>

            <h4 className="mt-4 text-center text-lg md:text-xl font-medium text-gray-800 px-3 line-clamp-2">
              {subCategory.category_name}
            </h4>
          </Link>
        ))}
      </div>

      {/* RIGHT ARROW */}
      <button
        onClick={() => scrollSubCats("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 
                   bg-white shadow-md p-3 rounded-full hidden md:flex"
      >
        ›
      </button>
    </div>
  </div>
)}

        {/* Products Section - Exact design as requested */}
        <section className="px-4 md:px-6 pb-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : categoryProducts.length > 0 ? (
            <Swiper 
              className='bg-gray-50' 
              modules={[Navigation]} 
              spaceBetween={0} 
              speed={600} 
              slidesPerView={2} 
              navigation
              breakpoints={{ 
                280: { slidesPerView: 2 }, 
                426: { slidesPerView: 3 }, 
                768: { slidesPerView: 5 }, 
                1024: { slidesPerView: 6 } 
              }}
            >
              {categoryProducts.map((product) => (
                <SwiperSlide key={product._id} className='pt-2'>
                  <CategoryProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-8 bg-white rounded">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No products available</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default CategoryProductsSection;