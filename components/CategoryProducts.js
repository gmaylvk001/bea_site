// components/CategoryProducts.jsx
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Addtocart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
const CategoryProducts = () => {
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [brandMap, setBrandMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const categoryScrollRefs = useRef({});

  const priorityCategories = ["air-conditioner", "mobile-phones", "television", "refrigerator", "washing-machine"];
    const getSanitizedImage = (img) => {
      if (!img || img.trim() === "") return null;

      // If multiple images separated by commas, pick the last one
      const parts = img.split(",");
      const lastImg = parts[parts.length - 1].trim();

      // Replace spaces with underscores
      return lastImg.replace(/\s+/g, "_");
    };
  
    const categoryStyles = {
      "air-conditioner": {
        backgroundImage: "/uploads/categories/category-darling-img/air-conditoner-one.jpg",
        borderColor: "#060F16",
        showallCategoryLink : "/category/large-appliance/air-conditioner",
        subcategoryList: [
          { categoryname: "Cassette AC", category_slug: "/category/large-appliance/air-conditioner/cassette-ac" },
          { categoryname: "Inverter AC", category_slug: "/category/large-appliance/air-conditioner/inverter-ac" },
          { categoryname: "Split AC", category_slug: "/category/large-appliance/air-conditioner/split-ac" },
          { categoryname: "Window AC", category_slug: "/category/large-appliance/air-conditioner/window-ac" },
        ],
      },
      "mobile-phones": {
        backgroundImage: "/uploads/categories/category-darling-img/smartphone.png",
        borderColor: "#68778B",
        showallCategoryLink : "/category/mobiles-accessories/mobile-phones",
        subcategoryList: [
          { categoryname: "Smart Phone", category_slug: "/category/mobiles-accessories/mobile-phones/smart-phone" },
          { categoryname: "Tablet", category_slug: "/category/mobiles-accessories/mobile-phones/tablet" },
        ],
      },
      "television": {
        backgroundImage: "/uploads/categories/category-darling-img/television-one.jpg",
        borderColor: "#A9A097",
        showallCategoryLink : "/category/televisions/television",
        subcategoryList: [
          { categoryname: "FULL HD", category_slug: "/category/televisions/television/full-hd" },
          { categoryname: "HD Ready", category_slug: "/category/televisions/television/hd-ready" },
          { categoryname: "ULTRA HD", category_slug: "/category/televisions/television/ultra-hd" },
        ],
      },
      "refrigerator": {
        backgroundImage: "/uploads/categories/category-darling-img/refirgrator-two.jpg",
        borderColor: "#5C8B99",
        showallCategoryLink : "/category/large-appliance/refrigerator",
        subcategoryList: [
          { categoryname: "Bottom Mount", category_slug: "/category/large-appliance/refrigerator/bottom-mount" },
          { categoryname: "Deep Freezer", category_slug: "/category/large-appliance/refrigerator/deep-freezer" },
          { categoryname: "Double Door", category_slug: "/category/large-appliance/refrigerator/double-door" },
          { categoryname: "Mini Fridge", category_slug: "/category/large-appliance/refrigerator/mini-fridge" },
          { categoryname: "Side by Side", category_slug: "/category/large-appliance/refrigerator/side-by-side" },
          { categoryname: "Single Door", category_slug: "/category/large-appliance/refrigerator/single-door" },
          { categoryname: "Triple Door", category_slug: "/category/large-appliance/refrigerator/triple-door" },
        ],
      },
      "washing-machine": {
        backgroundImage: "/uploads/categories/category-darling-img/washine-machine-one.jpg",
        borderColor: "#69AEA2",
        showallCategoryLink : "/category/large-appliance/washing-machine",
        subcategoryList: [
          { categoryname: "Front Loading", category_slug: "/category/large-appliance/washing-machine/front-loading" },
          { categoryname: "Top Loading", category_slug:  "/category/large-appliance/washing-machine/top-loading"},
          { categoryname: "Semi Automatic", category_slug:  "/category/large-appliance/washing-machine/semi-automatic"},
        ],
      },
      "dishwasher": {
        backgroundImage: "/uploads/categories/category-darling-img/washine-machine-one.jpg",
        borderColor: "#69AEA2",
        showallCategoryLink : "/category/large-appliance/dishwasher",
        subcategoryList: [
          { categoryname: "12 PLACE SETTING", category_slug: "/category/large-appliance/dishwasher/12-place-setting" },
          { categoryname: "13 PLACE SETTING", category_slug:  "/category/large-appliance/dishwasher/13-place-setting"},
          { categoryname: "14 PLACE SETTING", category_slug:  "/category/large-appliance/dishwasher/14-place-setting"},
          { categoryname: "15 PLACE SETTING", category_slug: "/category/large-appliance/dishwasher/15-place-setting" },
          { categoryname: "16 PLACE SETTING", category_slug:  "/category/large-appliance/dishwasher/16-place-setting"}
        ],
      },
    };


  const scrollLeft = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  const handleProductClick = (product) => {
    setNavigating(true);
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const updated = [product, ...recentlyViewed.filter(p => p._id !== product._id)].slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  };

  const BanneritemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/categoryproduct/settings");
        const result = await response.json();
        if (result.ok) setCategoryProducts(result.data);

        const brandResponse = await fetch("/api/brand");
        const brandResult = await brandResponse.json();
        if (!brandResult.error) {
          const map = {};
          brandResult.data.forEach((b) => { map[b._id] = b.brand_name; });
          setBrandMap(map);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (categoryProducts.length === 0) return null;

  return (
    <>
      {navigating && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black bg-opacity-30">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      <motion.section id="category-products" initial="hidden" animate="visible" className="category-products px-3 sm:px-6 pt-6">
        <div className="rounded-[23px] py-4">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-3 sm:mb-5">
              <h5 className="text-lg sm:text-2xl font-bold">Shop by Category</h5>
            </div>
              {categoryProducts.map((categoryProduct) => {
                const category = categoryProduct.subcategoryId;
                const products = categoryProduct.products || [];
                const alignment = categoryProduct.alignment || "left";
                if (!category || products.length === 0) return null;
                const categoryStyle = categoryStyles[category.category_slug] || {
                  backgroundImage: '/uploads/small-appliance-banner.webp',
                  borderColor: '#1F3A8C'
                };
                const sanitizedCategoryImage = getSanitizedImage(categoryProduct.categoryImage);
                const sanitizedBackgroundImage = getSanitizedImage(categoryStyle.backgroundImage);
                const finalBgUrl = sanitizedCategoryImage || sanitizedBackgroundImage || "/default-image.jpg"; 
                const styleObj = { backgroundImage: `url("${finalBgUrl}")` };
                const visibleDesktopCount = 5;
                const fewProducts = products.length > 0 && products.length < visibleDesktopCount;

                return (
                  <div key={categoryProduct._id} className="space-y-4">
                    {/* Category Products Section */}
                    <div className={`bg-white flex flex-col md:flex-row mb-8 ${alignment === "right" ? "md:flex-row-reverse" : ""}`} >
                      {/* Category Banner */}
                      <div className="flex-shrink-0 relative w-full md:w-[350px] h-48 sm:h-64 md:h-auto">
                        <div style={styleObj} className={`absolute inset-0 bg-cover bg-center    ${alignment === "right" ? "md:rounded-tr-lg md:rounded-br-lg" : "md:rounded-tl-lg md:rounded-bl-lg" }`}/>
                        <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 text-white">
                                <div className="w-full flex items-center justify-between mt-6 sm:mt-8 px-0 py-3 -mb-[11%]" style={{ margin: "0% 0% -9.5%" }}>
                                <Link
                                  href={categoryProduct.categoryRedirectUrl || `/category/${category.category_slug}`}
                                  className="bg-gradient-to-r from-black/40 to-black/20 hover:from-black/60 hover:to-black/30 text-white text-xs sm:text-sm font-semibold py-1 px-2 rounded-lg backdrop-blur-sm shadow-md transition-all duration-300"
                                  style={{
                                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)",
                                  }}
                                  onClick={() => setNavigating(true)}
                                >
                                Shop Now →
                                </Link>
                               <h2
                                className="text-base sm:text-xl font-semibold leading-tight text-right"
                                style={{
                                  color: "#ffffff",
                                  textShadow: "rgba(49, 39, 39, 0.8) 0px 0px 3px, rgb(28 16 16 / 60%) 0px 0px 6px",
                                }}
                              >
                                {category.category_name}
                              </h2>
                              </div>
                          </div>
                        </div>

                        {/* Products Scroll */}
                        <div className="w-full md:w-[calc(100%-350px)]">
                          <div
                            className={`relative flex-1 py-2 border overflow-visible ${ alignment === "right" ? "pr-3 pl-2" : "pl-3 pr-2" }`}
                            style={{  borderTop: `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}`, borderBottom: `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}`,
                              borderLeft: alignment === "right" ? `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}` : "0px",
                              borderRight: alignment === "left" ? `4px solid ${categoryProduct.borderColor || categoryStyle.borderColor}` : "0px",
                            }}
                          >
                          {/* Category Links Section */}
                          <div className={`flex flex-wrap items-center gap-2 mb-3 text-sm font-medium ${ alignment === "right" ? "justify-start" : "justify-end" }`} >
                            {categoryStyle.showallCategoryLink && (
                              <Link href={categoryStyle.showallCategoryLink} className="px-3 py-1  text-blue-600 hover:underline" >
                                Show All
                              </Link>
                            )}

                            {categoryStyles[category.category_slug]?.subcategoryList?.map(
                              (sub, idx) =>
                                sub.category_slug && (
                                  <Link key={idx} href={sub.category_slug} className="px-3 py-1  text-gray-500 hover:text-blue-600 transition hover:underline">
                                    {sub.categoryname}
                                  </Link>
                                )
                            )}
                          </div>

                          {/* Scroll Arrows */}
                          <button
                            onClick={() => scrollLeft(categoryProduct._id)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white text-black border hover:bg-black hover:text-white shadow-sm z-20 transition"
                          >
                            <FiChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => scrollRight(categoryProduct._id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white text-black border hover:bg-black hover:text-white shadow-sm z-20 transition"
                          >
                            <FiChevronRight size={16} />
                          </button>
                          {/* Scrollable Products */}
                              <div
                                ref={(el) => (categoryScrollRefs.current[categoryProduct._id] = el)}
                                className={`flex overflow-x-auto scrollbar-hide scroll-smooth gap-4 py-3 px-4 ${fewProducts ? "justify-center" : "justify-start"}`}
                                style={{ WebkitOverflowScrolling: "touch" }}
                              >
                              {products.slice(0, 15).map((product) => (
                                    <div
                                      key={product._id}
                                      // fixed responsive card widths so 5 fit on large screens; min-width keeps consistency
                                      className="relative bg-white flex-none flex flex-col justify-between p-1 rounded-lg border border-gray-200 hover:border-[#0069c1] hover:shadow-md transition cursor-pointer h-full w-[48%] sm:w-[31%] md:w-[24%] lg:w-[23.9%] min-w-[160px]"
                                    >
                                      {/* Image */}
                                      <div className="relative aspect-square bg-white overflow-hidden">
                                        <Link href={`/product/${product.slug}`} onClick={() => handleProductClick(product)} className="block mb-1">
                                        {product.images?.[0] && (
                                          <>
                                            <Image
                                              src={product.images[0].startsWith("http") ? product.images[0] : `/uploads/products/${product.images[0]}`}
                                              alt={product.name}
                                              fill
                                              // ensure the image fits without stretching
                                              className="object-contain p-2 sm:p-3"
                                              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 18vw"
                                              unoptimized
                                            />
                                            {Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price) && (
                                              <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded">
                                                -{Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}%
                                              </span>
                                            )}
                                            <div className="absolute top-2 right-2">
                                              <ProductCard productId={product._id} />
                                            </div>
                                          </>
                                        )}
                                        </Link>
                                      </div>
 
                                       {/* Info */}
                                       <div className="p-2 flex flex-col h-full">
                                         <h4 className="text-[10px] sm:text-xs text-gray-500 mb-1 uppercase">
                                           <Link href={`/brand/${brandMap[product.brand]?.toLowerCase().replace(/\s+/g, "-") || ""}`} className="hover:text-blue-600">
                                             {brandMap[product.brand] || ""}
                                           </Link>
                                         </h4>
                                         
                                        <Link
                                          href={`/product/${product.slug}`}
                                          onClick={() => handleProductClick(product)}
                                          className="block mb-1"
                                        >
                                          <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                                            {(() => {
                                              const model = product.model_number ? `(${product.model_number.trim()})` : "";
                                              const name = product.name ? product.name.trim() : "";
                                              const maxLen = 40;

                                              if (model) {
                                                const remaining = maxLen - model.length - 1; // 1 for space before model
                                                const truncatedName =
                                                  name.length > remaining ? name.slice(0, remaining - 3) + `${model}...` : name;
                                                return `${truncatedName} `;
                                              } else {
                                                return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
                                              }
                                            })()}
                                          </h3>
                                        </Link>

                                         <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                           <span className="text-sm sm:text-base font-semibold text-red-600">
                                             ₹ {(product.special_price > 0 && product.special_price < product.price
                                               ? Math.round(product.special_price)
                                               : Math.round(product.price)
                                             ).toLocaleString()}
                                           </span>
                                           {product.special_price > 0 && product.special_price < product.price && (
                                             <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                                               ₹ {Math.round(product.price).toLocaleString()}
                                             </span>
                                           )}
                                         </div>
 
                                         <h4 className={`text-[10px] sm:text-xs mb-2 ${product.stock_status === "In Stock" ? "text-green-600" : "text-red-600"}`}>
                                           {product.stock_status}{product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
                                         </h4>
 
                                         {/* Actions */}
                                        <div
                                            className="mt-auto flex items-center gap-0 text-[12.5px] sm:text-[11.5px]  font-semibold"
                                          >
                                          <Addtocart
                                            productId={product._id}
                                            stockQuantity={product.quantity}
                                            special_price={product.special_price}
                                            className="flex-1 whitespace-nowrap text-[10px] sm:text-sm py-1.5"
                                            
                                          />
                                          <a
                                            href={`https://wa.me/919865555000?text=${encodeURIComponent(`Check Out This Product: ${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.slug}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-full flex items-center justify-center flex-shrink-0"
                                          >
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 32 32" fill="currentColor">
                                              <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                                            </svg>
                                          </a>
                                        </div>
                                       </div>
                                 </div>
                                 ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                );
              })}
          </div>
        </div>
      </motion.section>
    </>
  );
};
export default CategoryProducts;