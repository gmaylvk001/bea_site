import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Addtocart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";

// Custom Product Card for Category Section
const CategoryProductCard = ({ product }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter(); // Added router
  

   const [brandMap, setBrandMap] = useState([]);
   
    const fetchBrand = async () => {
      try {
        const response = await fetch("/api/brand");
        const result = await response.json();
        if (result.error) {
          console.error(result.error);
        } else {
          const data = result.data;
    
          // Store as map for quick access
          const map = {};
          data.forEach((b) => {
            map[b._id] = b.brand_name;
          });
          setBrandMap(map);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
   
    useEffect(() => {
      fetchBrand();
    }, []);

  const handleWishlistToggle = (productId) => {
    setIsWishlisted(!isWishlisted);
    // Add your wishlist logic here
    console.log('Wishlist toggle for:', productId);
  };

  return (
    <div
  key={product._id}
  className="group flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 relative"
>

 

  {/* Image Section */}
  <div className="relative h-60 w-full overflow-hidden bg-gray-50">
    <Link href={`/product/${product.slug}`} onClick={() => handleProductClick(product)}>
      {product.images?.[0] && (
        <Image
          src={
            product.images[0].startsWith("http")
              ? product.images[0]
              : `/uploads/products/${product.images[0]}`
          }
          alt={product.name}
          fill
          className="object-contain cursor-pointer p-4 transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
      )}
    </Link>

    {/* Discount Badge */}
    {Number(product.special_price) > 0 &&
      Number(product.special_price) < Number(product.price) && (
        <span className="absolute top-3 left-2 bg-orange-500 text-white tracking-wider text-xs font-bold px-2 py-0.5 rounded z-10">
          -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
        </span>
      )}

       <div className="absolute top-2 right-2">
                      <ProductCard productId={product._id} isOutOfStock={product.quantity === 0} />
                    </div>

    {/* Out of Stock */}
    {product.quantity === 0 && (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Out of Stock
        </span>
      </div>
    )}
  </div>

  {/* Content Section */}
  <div className="flex flex-col flex-grow p-4">

    {/* Brand Name */}
    {brandMap[product.brand] && (
      <h4 className="text-xs text-gray-500 uppercase mb-1">
        <Link
          href={`/brand/${brandMap[product.brand]
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {brandMap[product.brand]}
        </Link>
      </h4>
    )}

    {/* Product Title */}
    <Link href={`/product/${product.slug}`} onClick={() => handleProductClick(product)}>
      <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb]  line-clamp-2 min-h-[3rem] sm:min-h-[2.5rem] leading-tight">
        {product.name}
      </h3>
    </Link>

   <div className="mb-3 mt-0.5">
                {product.model_number && (
                  <div className="bg-gray-100 rounded-md inline-block mb-2">
                    <span className="text-sm font-semibold text-gray-700 tracking-wide">
                      Model: <span className="text-[#0069c6]">({product.model_number})</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-semibold text-red-600">
                    ₹ {(
                      product.special_price &&
                      product.special_price > 0 &&
                      product.special_price !== '0' &&
                      product.special_price < product.price
                        ? Math.round(product.special_price)
                        : Math.round(product.price)
                    ).toLocaleString()}
                  </span>

                  {product.special_price > 0 &&
                    product.special_price !== '0' &&
                    product.special_price < product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹ {Math.round(product.price).toLocaleString()}
                      </span>
                  )}
                </div>
              </div>

    {/* Stock Status */}
    <h4
      className={`text-xs mb-3 font-medium ${
        product.quantity > 0 ? "text-green-600" : "text-red-600"
      }`}
    >
      {product.quantity > 0
        ? `In Stock, ${product.quantity} units`
        : "Out Of Stock"}
    </h4>

    {/* Bottom Buttons */}
    <div className="mt-auto flex items-center justify-between gap-2">
      <Addtocart
        productId={product._id}
        stockQuantity={product.quantity}
        special_price={product.special_price}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        Add to Cart
      </Addtocart>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/919865555000?text=${encodeURIComponent(
          `Check Out This Product: ${apiUrl}/product/${product.slug}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors flex items-center justify-center"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 32 32"
          fill="currentColor"
        >
          <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
        </svg>
      </a>
    </div>
  </div>
</div>


  );
};

const scrollSubCats = (dir) => {
  const el = document.getElementById("subCatScroll");
  if (!el) return;

  const amount = 300;

  el.scrollBy({
    left: dir === "left" ? -amount : amount,
    behavior: "smooth",
  });
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

  const fetchCategoryProducts = async (categoryId, limit = 8) => {
    try {
      setLoading(true);
      /*
      console.log('🔄 Fetching products for category:', {
        name: mainCategory.category_name,
        id: categoryId,
        slug: mainCategory.category_slug,
        md5_cat_name: mainCategory.md5_cat_name
      });
      */
      const query = new URLSearchParams();
      //query.set('categoryIds', categoryId);
      query.set('sub_category_new',  mainCategory.md5_cat_name);
      query.set('page', '1');
      query.set('limit', limit.toString());
      query.set('sort', 'featured');

      const apiUrl = `/api/product/filter/main?${query}`;
     // console.log('🌐 API URL:', apiUrl);

      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      console.log('📦 API Response for', mainCategory.category_name, ':', {
        productsCount: data.products?.length || 0,
        pagination: data.pagination,
        rawData: data
      });
      
      setCategoryProducts(data.products || []);
      setHasFetched(true);
    } catch (error) {
      console.error('❌ Error fetching category products:', error);
      setCategoryProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when component mounts or category changes
  useEffect(() => {
    if (mainCategory._id && !hasFetched) {
      fetchCategoryProducts(mainCategory._id, 8);
    }
  }, [mainCategory._id, hasFetched]);

  return (
    <section className={`px-4 md:px-6 py-12 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Category Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{mainCategory.category_name}</h2>
           
          </div>
          <Link 
            href={`/category/${slug}/${mainCategory.category_slug}`}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mt-4 md:mt-0"
          >
            View All
            <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>

        {/* Subcategories Grid - Only show if subcategories exist */}
       {mainCategory.subCategories && mainCategory.subCategories.length > 0 && (
  <div className="mb-10">

   <div className="relative mb-10">

  {/* LEFT ARROW — only when slider mode */}
  {mainCategory.subCategories.length > 6 && (
    <button
      onClick={() => scrollSubCats("left")}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 
                 bg-white shadow-md p-3 rounded-full hidden md:flex"
    >
      ‹
    </button>
  )}

  {/* MAIN WRAPPER (Grid or Slider) */}
 <div
  id="subCatScroll"
  className={
    mainCategory.subCategories.length > 6
      ? "flex overflow-x-auto whitespace-nowrap space-x-6 py-2 px-2 hide-scrollbar scroll-smooth"
      : "flex flex-wrap justify-center gap-8 md:gap-10"
  }
>
  {mainCategory.subCategories.map((subCategory) => (
    <Link
      href={`/category/${slug}/${subCategory.category_slug}`}
      key={subCategory._id}
      className="group flex flex-col items-center flex-shrink-0 inline-block"
    >
      <div
        className={
          mainCategory.subCategories.length > 6
            ? "w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-gray-300 to-white shadow-md border border-gray-200 flex items-center justify-center overflow-hidden"
            : "w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-gray-300 to-white shadow-md border border-gray-200 flex items-center justify-center overflow-hidden"
        }
      >
        <div
          className={
            mainCategory.subCategories.length > 6
              ? "relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
              : "relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
          }
        >
          <Image
            src={subCategory.image || "/images/default-category.jpg"}
            alt={subCategory.category_name}
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
      </div>

      <h4 className="mt-3 text-center text-sm md:text-base font-medium text-gray-800 px-2 line-clamp-2">
        {subCategory.category_name}
      </h4>
    </Link>
  ))}
</div>


  {/* RIGHT ARROW — only when slider mode */}
  {mainCategory.subCategories.length > 6 && (
    <button
      onClick={() => scrollSubCats("right")}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-20 
                 bg-white shadow-md p-3 rounded-full hidden md:flex"
    >
      ›
    </button>
  )}

</div>

  </div>
)}



        {/* Featured Products Slider for this Category */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-700">
              Featured Products
            </h3>
            {categoryProducts.length > 5 && (
              <Link 
                href={`/category/${slug}/${mainCategory.category_slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                See all products
                <ChevronRight size={16} className="ml-1" />
              </Link>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : categoryProducts.length > 0 ? (
            <div className="relative group">
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={2}
                breakpoints={{
                  480: { slidesPerView: 2 },
                  640: { slidesPerView: 3 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 5 }
                }}
                navigation={{
                  nextEl: `.product-swiper-button-next-${index}`,
                  prevEl: `.product-swiper-button-prev-${index}`,
                }}
              >
                {categoryProducts.map(product => (
                  <SwiperSlide key={product._id}>
                    <CategoryProductCard product={product} />
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Custom Navigation for Product Slider */}
              <div className={`product-swiper-button-prev-${index} absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full shadow-lg cursor-pointer transition-all duration-300 border border-gray-200 opacity-0 group-hover:opacity-100`}>
                <ChevronLeft className="text-gray-700" size={18} />
              </div>
              <div className={`product-swiper-button-next-${index} absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full shadow-lg cursor-pointer transition-all duration-300 border border-gray-200 opacity-0 group-hover:opacity-100`}>
                <ChevronRight className="text-gray-700" size={18} />
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <p className="text-gray-500">No products available in this category yet.</p>
              <p className="text-sm text-gray-400 mt-2">Check back soon for new arrivals</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryProductsSection;