"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion, useAnimation, useInView } from "framer-motion";
import { ShoppingCartSimple, CaretDown } from "@phosphor-icons/react";
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiShoppingCart } from 'react-icons/fi';
import { Heart, ShoppingCart } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function HomeComponent() {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [isFlashSalesLoading, setIsFlashSalesLoading] = useState(true);
  const [bannerData, setBannerData] = useState({
    banner: {
      items: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [flashSalesData, setFlashSalesData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isBrandsLoading, setIsBrandsLoading] = useState(true);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategories, setParentCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Fetch banner data
  useEffect(() => {
    const fetchBannerData = async () => {
      setIsBannerLoading(true);
      try {
        const response = await fetch('/api/design/get?bannerType=topbanner&status=active');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const bannerItems = data.data.map(banner => ({
            id: banner._id,
            title: banner.title,
            buttonText: "Explore Shop",
            buttonLink: banner.redirectUrl || "/shop",
            bgImageUrl: banner.bgImageUrl,
            bannerImageUrl: banner.bannerImageUrl
          }));
          
          setBannerData({
            banner: {
              items: bannerItems
            }
          });
        }
      } catch (error) {
        console.error("Error fetching banner data:", error);
        // Fallback to default banner
        setBannerData({
          banner: {
            items: [
              {
                id: 1,
                title: "Grocery Order and Get Express Delivery",
                buttonText: "Explore Shop",
                buttonLink: "/shop",
                bgImageUrl: "/images/banner-img1.png",
                bannerImageUrl: "/images/banner-product.png"
              }
            ]
          }
        });
      } finally {
        setIsBannerLoading(false);
      }
    };

    // Fetch flash sales data
    const fetchFlashSales = async () => {
      setIsFlashSalesLoading(true);
      try {
        const response = await fetch('/api/design/get?bannerType=flashsale&status=active');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const salesItems = data.data.map(item => ({
            id: item._id,
            title: item.title,
            productImage: item.bannerImageUrl,
            bgImage: item.bgImageUrl,
            redirectUrl: item.redirectUrl || "/shop"
          }));
          setFlashSalesData(salesItems);
        }
      } catch (error) {
        console.error("Error fetching flash sales:", error);
        // Fallback data
        setFlashSalesData([
          {
            id: "fs1",
            title: "Summer Fruits Special",
            productImage: "/images/summer-fruits.png",
            bgImage: "/images/sale-bg1.jpg",
            redirectUrl: "/summer-sale"
          },
          {
            id: "fs2",
            title: "Organic Vegetables",
            productImage: "/images/veggies.png",
            bgImage: "/images/sale-bg2.jpg",
            redirectUrl: "/vegetables"
          }
        ]);
      } finally {
        setIsFlashSalesLoading(false);
      }
    };

    // Fetch brands data
    const fetchBrands = async () => {
      setIsBrandsLoading(true);
      try {
        const response = await fetch('/api/brand/get');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.success) {
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        setBrands([]);
      } finally {
        setIsBrandsLoading(false);
      }
    };

    // Fetch Categories
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories/get");
        const data = await response.json();
        setCategories(data);
        
        // Filter to get only parent categories (where parentid is "none")
        const parentCategories = data.filter(category => category.parentid === "none");
        setParentCategories(parentCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    // Fetch Products
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/product/get");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchBannerData();
    fetchFlashSales();
    fetchBrands();
    fetchCategories();
    fetchProducts();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Animation controls
  const controls = useAnimation();
  const refs = {
    banner: useRef(null),
    flashSales: useRef(null),
    delivery: useRef(null),
  };

  const isInView = {
    banner: useInView(refs.banner, { once: true, amount: 0.1 }),
    flashSales: useInView(refs.flashSales, { once: true, amount: 0.1 }),
    delivery: useInView(refs.delivery, { once: true, amount: 0.1 }),
  };

  useEffect(() => {
    if (isInView.banner) {
      controls.start("visible");
    }
  }, [isInView.banner, controls]);

  // Slider settings with custom arrows
  const CustomPrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"
    >
      ◀
    </button>
  );

  const CustomNextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"
    >
      ▶
    </button>
  );

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
  };

  const flashSalesSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  const brandSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const sectionVariants = {
    hiddenDown: { y: 50, opacity: 0 },
    hiddenUp: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const categoryRef = useRef(null);
  
  // Scroll category list
  const scrollLeft = () => {
    if (categoryRef.current) {
      categoryRef.current.scrollLeft -= 150;
    }
  };

  const scrollRight = () => {
    if (categoryRef.current) {
      categoryRef.current.scrollLeft += 150;
    }
  };

  const getSubcategorySlugs = (parentId) => {
    return categories
      .filter(cat => cat.parentid === parentId)
      .map(sub => sub.category_slug);
  };

  // Filter products by selected category (using ID matching)
  const filteredProducts = selectedCategory
    ? (() => {
        // Get all subcategories of the selected category
        const subCategories = categories.filter(
          cat => cat.parentid === selectedCategory._id
        );

        // Create array of valid category IDs (parent + subcategories)
        const validCategoryIds = [
          selectedCategory._id,
          ...subCategories.map(sub => sub._id)
        ];

        // Filter products matching any of these category IDs
        return products.filter(product => 
          product.category && 
          validCategoryIds.includes(product.category.toString())
        );
      })()
    : products; // Show all products if no category selected

  // Take the first category as the featured banner
  const featuredCategory = parentCategories[0];
  // Use the rest for the product cards
  const dealCategories = parentCategories.slice(1, 4);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5; // 5 records per page
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <>
      {isLoading && (
        <div className="preloader fixed inset-0 z-[9999] flex justify-center items-center bg-white">
          <Image 
            src="/images/thumbs/bea.webp"
            alt="Loading"
            width={64}
            height={64}
            className="animate-spin"
          />
        </div>
      )}
      
      <div 
        className={`relative py-12 px-6 transition-opacity duration-300 ${
          isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
        }`} 
        ref={containerRef}
      >
        {/* Banner Section */}
        <motion.section
          ref={refs.banner}
          initial="hidden"
          animate={isInView.banner ? "visible" : "hidden"}
          variants={containerVariants}
          className=""
        >
          <div className="relative rounded-[30px] ">
            {isBannerLoading ? (
              <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : bannerData.banner.items.length > 0 ? (
              <Slider {...settings} className="relative">
                {bannerData.banner.items.map((item) => (
                  <motion.div 
                    key={item.id} 
                    className="p-6 relative h-[500px]"
                    variants={itemVariants}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 rounded-[30px] overflow-hidden">
                      <Image
                        src={item.bgImageUrl}
                        alt="Background"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-[30px]"
                        priority
                      />
                      <div className="absolute inset-0 bg-opacity-20 rounded-[30px]"></div>
                    </div>
                    
                    <div className="relative flex items-center h-full max-w-7xl mx-auto">
                      <div className="w-full flex flex-wrap md:flex-nowrap items-center gap-6 px-10">
                        <div className="w-full md:w-[50%] text-left relative z-10">
                          <h1 className="text-5xl font-bold text-black leading-tight drop-shadow-lg">
                            {item.title}
                          </h1>
                          <a
                            className="inline-flex items-center justify-center rounded-full gap-2 bg-blue-600 text-white px-6 py-3 hover:bg-blue-700 transition shadow-lg mt-6"
                            href={item.buttonLink}
                          >
                            {item.buttonText}
                            <ShoppingCartSimple size={24} />
                          </a>
                        </div>
                        <div className="w-full md:w-[50%] flex justify-end relative z-10">
                          <Image 
                            src={item.bannerImageUrl} 
                            alt={item.title} 
                            width={500} 
                            height={300} 
                            className=""
                            priority
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </Slider>
            ) : (
              <div className="p-6 text-center">
                <p className="text-lg">No active banners available</p>
              </div>
            )}

            <div className="relative flex items-center justify-center w-full mt-10">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-40 h-16 rounded-b-full shadow-lg-new">
              </div>
              <div
                className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 flex items-center justify-center bg-blue-600 rounded-full shadow-md border-4 border-white cursor-pointer" style={{ top: "-104px" }}
                onClick={() => {
                  window.scrollTo({
                    top: window.scrollY + 500,
                    behavior: "smooth",
                  });
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-0.9 h-6 border-l-2 border-dashed border-white animate-bounce"></div>
                  <CaretDown size={25} className="text-white animate-bounce leading-none" />
                  <CaretDown size={25} className="text-white animate-bounce mt-[-18px]" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Flash Sales Section */}
        <motion.section 
          ref={refs.flashSales}
          initial="hiddenDown"
          animate={isInView.flashSales ? "visible" : "hiddenDown"}
          variants={sectionVariants}
          id="flash-sales-section" 
          className="flash-sales overflow-hidden mb-3"
        >
          <div className="">
            <motion.div variants={itemVariants} className="section-heading flex justify-between items-center mb-6">
              <h5 className="text-2xl font-bold">Flash Sales Today</h5>
              <a href="/shop" className="text-sm font-medium text-gray-700 hover:underline">
                View All Deals
              </a>
            </motion.div>

            {isFlashSalesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <motion.div variants={itemVariants}>
                <Slider {...flashSalesSettings} className="flash-sales-slider">
                  {flashSalesData.map((item) => (
                    <div key={item.id} className="px-2">
                      <motion.div
                        whileHover={{ y: -5 }}
                        className="relative p-6 rounded-lg shadow-lg h-full min-h-[250px] flex items-center overflow-hidden"
                        style={{ 
                          backgroundImage: `url(${item.bgImage})`, 
                          backgroundSize: "cover", 
                          backgroundPosition: "center" 
                        }}
                      >
                        {/* Product Content */}
                        <div className=""></div>
                        
                        <div className="relative z-10 w-full flex">
                          {/* Product Image */}
                          <div className="w-1/2 flex justify-center items-center">
                            <Image
                              src={item.productImage}
                              alt={item.title}
                              width={180}
                              height={180}
                              className="object-contain max-h-[180px]"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="w-1/2 flex flex-col justify-center items-start pl-4">
                            <h6 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h6>
                            <motion.a
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              href={item.redirectUrl}
                              className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-full text-center hover:bg-blue-700 transition"
                            >
                              Shop Now →
                            </motion.a>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </Slider>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Brands Section */}
        <motion.section 
          ref={refs.delivery}
          initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
          animate={isInView.delivery ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
          variants={sectionVariants}
          className="brand overflow-hidden bg-gray-100"
          style={{ borderRadius: '23px', transform: 'none' }}
        >
          <div className="mx-auto p-6">
            <motion.div 
              variants={containerVariants}
              className="rounded-lg"
            >
              <motion.div 
                variants={itemVariants}
                className="flex justify-between items-center mb-4"
              >
                <h5 className="text-lg font-semibold">Shop by Brands</h5>
                <a href="/shop" className="text-sm font-medium text-gray-700 hover:text-main-600">
                  View All Brands
                </a>
              </motion.div>

              {isBrandsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <motion.div variants={itemVariants}>
                  <Slider {...brandSettings} className="brand-slider">
                    {brands.map((brand) => (
                      <motion.div 
                        key={brand.id} 
                        className="p-4 flex justify-center items-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="p-4">
                          <Image 
                            src={`/uploads/Brands/${brand.image}`}
                            alt={brand.brand_name || "Brand Logo"} 
                            width={100} 
                            height={100} 
                            className="object-contain h-34 w-34 mx-auto rounded-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </Slider>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.section>

        {/* Recommended Products Section */}
        <div className="px-4 relative">
          <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>

          {/* Category Filter with Arrows */}
          <div className="relative flex items-center mb-6">
            <button
              onClick={scrollLeft}
              className="z-10"
              style={{ position: "absolute", right: "30px", bottom: "60px" }}
            >
              ◀
            </button>

            <div ref={categoryRef} className="flex space-x-4 overflow-x-hidden scroll-smooth w-full px-10">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !selectedCategory ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All Products
              </button>
              {parentCategories.map((category) => (
                <button
                  key={category._id}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    selectedCategory?.category_slug === category.category_slug
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.category_name}
                </button>
              ))}
            </div>

            <button
              onClick={scrollRight}
              className="z-10"
              style={{ position: "absolute", right: "4px", bottom: "60px" }}
            >
              ▶
            </button>
          </div>

          {/* Product List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="relative border rounded-lg shadow p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-lg group"
              >
                {/* Wishlist Button - Top Right */}
                <ProductCard productId={product._id} wishliststatus={product.wishlist} />

                {/* Discount Badge - Top Left */}
                {product.special_price && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 text-xs text-white bg-red-500 rounded">
                      {Math.round(((product.price - product.special_price) / product.price) * 100)}% OFF
                    </span>
                  </div>
                )}

                {/* Product Image */}
                <img
                  src={`/uploads/products/${product.images?.[0]}`}
                  alt={product.name || "Product image"}
                  className="w-full h-60 object-cover mt-2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                  }}
                />

                {/* Product Name as Link */}
                <Link href={`/product/${product.slug || product._id}`}>
                  <h3 className="mt-3 font-semibold transition-colors group-hover:text-blue-600 cursor-pointer">
                    {product.name}
                  </h3>
                </Link>

                {/* Brand */}
                <p className="text-gray-500 text-sm">By {product.brand || "Unknown Brand"}</p>

                {/* Price */}
                <p className="mt-2 text-lg font-bold text-blue-600">
                  ${product.special_price || product.price}{" "}
                  {product.special_price && (
                    <span className="line-through text-gray-400 text-sm ml-1">
                      ${product.price}
                    </span>
                  )}
                </p>

                {/* Rating */}
                <p className="text-sm text-gray-600">
                  ⭐ {product.rating || "N/A"} ({product.reviews ? product.reviews.toLocaleString() : "0"})
                </p>

                {/* Add to Cart */}
                <button className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-md w-full">
                  Add To Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}