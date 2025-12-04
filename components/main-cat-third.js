import { useEffect, useState } from 'react';
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";

export default function CategoryMainPage({ categorySlug = "large-appliance" }) {
  const [banners, setBanners] = useState({ top: null, sub: [] });
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  

  // Fetch all banners in a single API call
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        
        const res = await fetch(`/api/main-tird-sec/${categorySlug}`);
        const data = await res.json();
        
        if (data.success) {
          setBanners(data.data);
        } else {
          console.error('Error fetching banners:', data.error);
        }
        
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchBanners();
    }
  }, [categorySlug]);



  // Fetch products using your existing filter API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        
        const query = new URLSearchParams();
        query.set('categorySlug', categorySlug);
        query.set('page', 1);
        query.set('limit', 10);
        query.set('minPrice', 0);
        query.set('maxPrice', 1000000);

        const res = await fetch(`/api/product/filter/main?${query}`);
        const data = await res.json();
        
        if (data.products) {
          setProducts(data.products);
        } else if (data.error) {
          console.error('Error from products API:', data.error);
        }
        
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (categorySlug) {
      fetchProducts();
    }
  }, [categorySlug]);

  // Fetch subcategories for this category
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(`/api/subcategories?parentSlug=${categorySlug}`);
        if (res.ok) {
          const data = await res.json();
          setSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };

    if (categorySlug) {
      fetchSubcategories();
    }
  }, [categorySlug]);
  
  const handleProductClick = (product) => {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

    const alreadyViewed = stored.find((p) => p._id === product._id);

    const updated = alreadyViewed
      ? stored.filter((p) => p._id !== product._id)
      : stored;

    updated.unshift(product); // Add to beginning

    const limited = updated.slice(0, 10); // Limit to 10 recent products

    localStorage.setItem('recentlyViewed', JSON.stringify(limited));
  };

    const [brandMap, setBrandMap] = useState([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
   
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Top Banner Section - EXACT DESIGN */}
      <div className="mt-6 overflow-hidden">
        <h2 className="text-2xl font-bold text-center py-4">
          {banners.top?.category_name || "Refrigerator"}
        </h2>
        
        {banners.top ? (
          <a 
            href={banners.top.redirect_url || "#"} 
            target={banners.top.redirect_url ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            <img
              src={banners.top.banner_image}
              alt={banners.top.banner_name}
              className="w-full"
              onError={(e) => {
                e.target.src = "/images/category/default-banner.jpg";
              }}
            />
          </a>
        ) : (
          <img
            src="/images/category/WASHING-MACHINES-HOME-APPLIANCES-W.jpg"
            alt="Category Banner"
            className="w-full"
          />
        )}
      </div>

      {/* Sub Category Banners - EXACT DESIGN */}
      <div className="mt-6 pb-4 bg-white">
        {(banners.sub.length > 0 || subcategories.length > 0) && (
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={20}
            breakpoints={{
              0: { slidesPerView: 2 },
              640: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
            }}
            className="pb-8 customSwiper"
          >
            {banners.sub.length > 0 ? (
              banners.sub.map((banner, index) => (
                <SwiperSlide key={banner._id || index}>
                  <div className="rounded-xl flex flex-col items-center">
                    <a 
                      href={banner.redirect_url || "#"} 
                      target={banner.redirect_url ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <img
                        src={banner.banner_image}
                        alt={banner.banner_name}
                        className="w-full h-full rounded-[10px_10px_10px_10px]"
                        onError={(e) => {
                          e.target.src = "/images/category/default-sub-banner.jpg";
                        }}
                      />
                    </a>
                  </div>
                </SwiperSlide>
              ))
            ) : (
              subcategories.map((cat, index) => (
                <SwiperSlide key={index}>
                  <div className="rounded-xl flex flex-col items-center">
                    <a href={`/category/${cat.slug}`} className="w-full">
                      <img
                        src={cat.img || cat.image || "/images/category/default-sub-banner.jpg"}
                        alt={cat.name}
                        className="w-full h-full rounded-[10px_10px_10px_10px]"
                      />
                    </a>
                  </div>
                </SwiperSlide>
              ))
            )}
          </Swiper>
        )}
      </div>

      {/* Products Section - EXACT DESIGN */}
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Best Deals</h2>

        {loadingProducts ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length > 0 ? (
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 2 },
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 5 },
            }}
            className="customSwiper"
          >
            {products.map((product) => {
              const discount = product.price && product.sale 
                ? Math.round(100 - (product.sale / product.price) * 100)
                : 0;

              return (
                <SwiperSlide key={product._id || product.id}>
                  <div className="relative bg-white border rounded-lg p-3 h-full flex flex-col hover:shadow-lg transition">
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {discount}% OFF
                      </span>
                    )}

                    {/* Wishlist Icon */}
                    <span className="absolute top-2 right-2">
                     <ProductCard productId={product._id} isOutOfStock={product.quantity === 0} />
                    </span>

                    {/* Image */}
                     <Link
                                    href={`/product/${product.slug}`}
                                    className="block mb-2"
                                    onClick={() => handleProductClick(product)}
                                  >
                    <img
                      src={product.image || product.images?.[0] || "/images/category/refrigerator-products.png"}
                      className="h-40 w-full object-contain mb-3"
                      alt={product.name || product.title}
                      onError={(e) => {
                        e.target.src = "/images/products/default-product.jpg";
                      }}
                    />
                    </Link>

                    {/* Brand */}
                    {product.brand && (
                      <h4 className="text-xs text-gray-500 mb-2 uppercase">
                                     <Link
                                       href={`/brand/${brandMap[product.brand] ? brandMap[product.brand].toLowerCase().replace(/\s+/g, "-") : ""}`}
                                       className="hover:text-blue-600"
                                     >
                                       {brandMap[product.brand] || ""}
                                     </Link>
                                   </h4>
                    )}

                    {/* Product Name */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="block mb-2 flex-1"
                      onClick={() => handleProductClick(product)}
                    >
                    <h3 className="text-xs sm:text-sm font-medium line-clamp-2 mb-2 text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                      {product.name || product.title}
                    </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-1">
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

                    {/* Stock */}
                     <h4 className={`text-xs mb-3 ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                {product.quantity > 0
                  ? `In Stock, ${product.quantity} units`
                  : "Out Of Stock"}
              </h4>

                    {/* Buttons */}
                    <div className="mt-auto flex items-center gap-2">
                       <Addtocart
                                        productId={product._id} 
                                        stockQuantity={product.quantity}  
                                        special_price={product.special_price}
                                        className="w-full text-xs sm:text-sm py-1.5"
                                      />
                      <a
                  href={`https://wa.me/919865555000?text=${encodeURIComponent(`Check Out This Product: ${apiUrl}/product/${product.slug}`)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full transition-colors duration-300 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                  </svg>
                </a>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No products available</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new arrivals</p>
          </div>
        )}
      </div>
    </div>
  );
}