import { useEffect, useState } from 'react';
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

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
        console.error('Error fetching products:', error);
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
                    <span className="absolute top-2 right-2 border rounded-full p-1">
                      🤍
                    </span>

                    {/* Image */}
                    <img
                      src={product.image || product.images?.[0] || "/images/category/refrigerator-products.png"}
                      className="h-40 w-full object-contain mb-3"
                      alt={product.name || product.title}
                      onError={(e) => {
                        e.target.src = "/images/products/default-product.jpg";
                      }}
                    />

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
                    <h3 className="text-sm font-medium text-blue-600 line-clamp-2 mb-2">
                      {product.name || product.title}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-600 font-semibold">
                        ₹ {product.sale ? product.sale.toLocaleString() : (product.price || 0).toLocaleString()}
                      </span>
                      {product.price && product.sale && product.price > product.sale && (
                        <span className="text-xs line-through text-gray-500">
                          ₹ {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <p className="text-xs text-green-600 mb-2">
                      {product.stock > 0 
                        ? `In Stock, ${product.stock} units` 
                        : 'Out of Stock'}
                    </p>

                    {/* Buttons */}
                    <div className="mt-auto flex items-center gap-2">
                      <button className="flex-1 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700">
                        🛒 Add to Cart
                      </button>
                      <button className="bg-green-500 text-white p-2 rounded-full">
                        💬
                      </button>
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