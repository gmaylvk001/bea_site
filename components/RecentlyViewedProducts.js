"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "react-feather";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";

const RecentlyViewedProducts = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [brandMap, setBrandMap] = useState([]);
  
  useEffect(() => {
    const checkIfMobile = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w < 640) setVisibleCount(2);
      else if (w < 768) setVisibleCount(3);
      else if (w < 1024) setVisibleCount(4);
      else if (w < 1280) setVisibleCount(5);
      else setVisibleCount(6);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    const handleRouteChange = () => setNavigating(false);
    if (router?.events?.on) {
      router.events.on('routeChangeComplete', handleRouteChange);
      router.events.on('routeChangeError', handleRouteChange);
    }
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      if (router?.events?.off) {
        router.events.off('routeChangeComplete', handleRouteChange);
        router.events.off('routeChangeError', handleRouteChange);
      }
    };
  }, [router]);

  useEffect(() => {
    const fetchRecentProductsWithBrands = async () => {
      setIsLoading(true);
      /*
      const stored = localStorage.getItem('recentlyViewed');
      if (!stored) {
        setIsLoading(false);
        return;
      }
      const products = JSON.parse(stored);
      */
      
      // Step 1: Get localStorage value safely
    const storedString = localStorage.getItem('recentlyViewed');
    let stored_new = [];

    try {
      stored_new = JSON.parse(storedString) || [];
    } catch (e) {
      stored_new = [];
    }

    // Step 2: Ensure it's an array
    if (!Array.isArray(stored_new)) {
      stored_new = [];
    }

    // Step 3: Filter quantity > 0
    const stored = stored_new.filter(product => product.quantity > 0);

    // Step 4: Log the result
    //console.log(stored);

    // Step 5: Use stored directly (no JSON.parse here!)
    if (stored.length === 0) {
      setIsLoading(false);
      return;
    }

    // stored is already an array of products
    const products = stored;

      try {
        const response = await fetch("/api/brand");
        const result = await response.json();
        
        if (result.error) {
          console.error(result.error);
          setRecentProducts(products); // Use products without brand names if fetch fails
        } else {
          const brandData = result.data;
          const brandMap = {};
          brandData.forEach((b) => {
            brandMap[b._id] = b.brand_name;
          });

          // Map brand names to products before setting state
          const productsWithBrands = products.map(product => ({
            ...product,
            brand: brandMap[product.brand] || product.brand // Use brand name if found, otherwise keep original
          }));
          setRecentProducts(productsWithBrands);
        }
      } catch (error) {
        console.error(error.message);
        setRecentProducts(products); // Fallback to products without brand names
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentProductsWithBrands();
  }, []); // Run only once when the component mounts
  const visibleProducts = recentProducts.slice(startIndex, startIndex + visibleCount);
  const totalPages = Math.ceil(recentProducts.length / visibleCount);
  const currentPage = Math.floor(startIndex / visibleCount);


  const handleProductClick = (product) => {
    if (navigating) return;
    
    setNavigating(true);
    const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    const updated = stored.filter(p => p._id !== product._id);
    updated.unshift(product);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated.slice(0, 10)));
    router.push(`/product/${product.slug || product._id}`);
  };


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

  const prev = () => {
    const step = visibleCount;
    setStartIndex(Math.max(0, startIndex - step));
  };

  const next = () => {
    const step = visibleCount;
    setStartIndex(Math.min(startIndex + step, recentProducts.length - visibleCount));
  };

  useEffect(() => {
    const maxStart = Math.max(0, recentProducts.length - visibleCount);
    if (startIndex > maxStart) {
      setStartIndex(maxStart);
    }
  }, [visibleCount, recentProducts.length, startIndex]);

  if (isLoading || recentProducts.length === 0) return null;

  return (
    <>
      {navigating && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black bg-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      
      <section className="home-section mb-10 pt-8">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-lg font-bold uppercase tracking-wide">Recently Viewed</h5>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={prev}
            disabled={startIndex === 0}
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-blue-600 hover:text-white transition disabled:opacity-40"
            aria-label="Previous recently viewed products"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={startIndex + visibleCount >= recentProducts.length}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-blue-600 hover:text-white transition disabled:opacity-40"
            aria-label="Next recently viewed products"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>

          {/* Products Row */}
          <div className="flex flex-row gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {visibleProducts.map((product) => (
                    <div
                      key={product._id}
                      className="group relative border border-gray-200 hover:border-[#0069c1] hover:shadow-md transition-all duration-300 rounded-md flex-shrink-0 min-w-[220px] bg-white h-[138px] sm:h-[148px]"
                      style={{ flex: `0 0 calc((100% - ${(visibleCount - 1) * 12}px) / ${visibleCount})` }}

                    >
                      <div className="flex h-full">
                      {/* Product Image */}
                      <div className="relative w-[46%] h-full flex-shrink-0 rounded-l-md bg-white overflow-hidden border-r border-gray-100">
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => handleProductClick(product)}
                          className="block w-full h-full"
                        >
                          {product.images?.[0] && (
                            <Image
                              src={
                                product.images[0].startsWith("http")
                                  ? product.images[0]
                                  : `/uploads/products/${product.images[0]}`
                              }
                              alt={product.name}
                              fill
                              className="object-contain p-2"
                              sizes="220px"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/uploads/products/placeholder.jpg";
                              }}
                            />
                          )}
                        </Link>
                        {Number(product.special_price) > 0 &&
                          Number(product.special_price) < Number(product.price) && (
                            <span className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1 py-0.5 rounded z-20">
                              -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
                            </span>
                          )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between p-2.5">
                         <h4 className="text-[10px] text-gray-500 mb-1 uppercase leading-none">
                            <Link
                              href={`/brand/${product.brand.toLowerCase().replace(/\s+/g, "-")}`}
                              className="hover:text-blue-600"
                            >
                              {product.brand}
                            </Link>
                          </h4>

                        {/* Title truncate */}
                        <Link
                          href={`/product/${product.slug}`}
                          className="block mb-1"
                          onClick={() => handleProductClick(product)}
                        >
                          <h3 className="text-[11px] sm:text-xs font-medium text-[#0069c6] hover:text-[#00badb] line-clamp-2 min-h-[32px]">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[13px] font-semibold text-red-600">
                            ₹ {(
                              product.special_price && product.special_price > 0 && product.special_price != '0'  && product.special_price != 0 && product.special_price < product.price
                                ? product.special_price
                                : product.price
                            ).toLocaleString()}
                          </span>
    
    
                          {product.special_price > 0 && product.special_price != '0'  && product.special_price != 0 &&   product.special_price &&
                            product.special_price < product.price &&
                            (
                              <span className="text-[10px] text-gray-500 line-through">
                                ₹ {product.price.toLocaleString()}
                              </span>
                          )}
                        </div>

                        <h4 className={`text-[10px] mb-0 ${product.stock_status === "In Stock" && product.quantity ? "text-green-600" : "text-red-600"}`}>
                          {product.stock_status === "In Stock" && product.quantity ? ` ${product.stock_status}` : "Out Of Stock"}
                          {product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
                        </h4>

                      </div>
                      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ProductCard productId={product._id} isOutOfStock={product.quantity === 0} />
                      </div>
                      </div>


                      
                    </div>
                  ))}
                </div>

                {/* Fake Pagination Dots */}
                {/* <div className="flex justify-end mt-6 space-x-2">
                  {clickElement === "next" ? (
                    <>
                      <span className="w-2.5 h-2.5 bg-gray-300 rounded-full"></span>
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                      <span className="w-2.5 h-2.5 bg-gray-300 rounded-full"></span>
                    </>
                  )}
                </div> */}

          </div>
      </div>
      </section>

    </>
  );
};

export default RecentlyViewedProducts;
























