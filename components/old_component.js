"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/slick-custom.css";
import { motion, useAnimation, useInView } from "framer-motion";
//import { ShoppingCartSimple, CaretDown } from "@phosphor-icons/react";
import { X } from "lucide-react"; 
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiArrowRight } from "react-icons/hi";
import { FiChevronLeft, FiChevronRight, FiShoppingCart } from 'react-icons/fi';
import { Heart, ShoppingCart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from "swiper/modules";
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
import { ChevronRight } from "lucide-react";
import 'swiper/css';
import 'swiper/css/navigation';
export default function HomeComponent() {
  function slugify(text) {
  return text
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // replace spaces with -
    .replace(/[^\w\-]+/g, "")    // remove special chars
    .replace(/\-\-+/g, "-");     // collapse multiple -
}
    const features = [
        { image: "/images/delivery-truck.png", title: "Free Shipping", description: "Free shipping all over the US" },
        { image: "/images/reputation.png", title: "100% Satisfaction", description: "Guaranteed satisfaction with every order" },
        { image: "/images/payment-protection.png", title: "Secure Payments", description: "We ensure secure transactions" },
        { image: "/images/support.png", title: "24/7 Support", description: "We're here to help anytime" },
    ];
    const scrollContainerRef = useRef(null);
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBannerLoading, setIsBannerLoading] = useState(true);
    const [isFlashSalesLoading, setIsFlashSalesLoading] = useState(true);
    const [navigating, setNavigating] = useState(false);
    const [bannerData, setBannerData] = useState({
        banner: {
        items: []
        }
    });
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [flashSalesData, setFlashSalesData] = useState([]);
    const [brands, setBrands] = useState([]);
    const [isBrandsLoading, setIsBrandsLoading] = useState(true);
    const [scrollDirection, setScrollDirection] = useState('down');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState();
    const [parentCategories, setParentCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [categoryBanner, setCategoryBanner] = useState([]);
  const [sections, setSections] = useState([]);
   const [homeSectionData, setHomeSectionData] = useState({ sections: [] });
  //const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Cateogry Scroll
    const categoryScrollRef = useRef(null);
const [videos, setVideos] = useState([]);
const [activeVideo, setActiveVideo] = useState(null);

// commit: added localStorage read/write helpers for daily cache
const DAILY_CACHE_KEY = 'site_daily_cache_v1';
const _todayStr = () => new Date().toISOString().slice(0,10);
const readDailyCache = () => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(DAILY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.date !== _todayStr()) return null; // expired or different day
    return parsed.payload || null;
  } catch (e) {
    return null;
  }
};
const writeDailyCache = (payload) => {
  try {
    if (typeof window === 'undefined') return;
    const obj = { date: _todayStr(), payload };
    localStorage.setItem(DAILY_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
};
  const scrollCategories = (direction) => {
  if (categoryScrollRef.current) {
    categoryScrollRef.current.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }
};
  const [brandMap, setBrandMap] = useState([]);


 const priorityCategories = ["air-conditioner", "mobile-phones", "television", "refrigerator", "washing-machine"];
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

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videocard");
        const data = await res.json();
        if (data.success) setVideos(data.videoCards);
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };
    fetchVideos();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
   // ✅ Extract YouTube ID
  const getYoutubeId = (url) => {
    try {
      const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Fetch banner data
useEffect(() => {
    const fetchBannerData = async () => {
        setIsBannerLoading(true);
        try {
            const response = await fetch('/api/topbanner');
            const data = await response.json();

            if (data.success && data.banners?.length > 0) {
                const bannerItems = data.banners
                    .filter(banner => banner.status === "Active") // ✅ only Active
                    .map(banner => ({
                        id: banner._id,
                        buttonLink: banner.redirect_url || "/shop",
                        bgImageUrl: banner.banner_image,
                        bannerImageUrl: banner.banner_image
                    }));

                setBannerData({
                    banner: { items: bannerItems }
                });
            }
        } catch (error) {
            console.error("Error fetching banner data:", error);
            setBannerData({
                banner: {
                    items: [{
                        id: 1,
                        buttonLink: "/shop",
                        bgImageUrl: "/images/banner-img1.png",
                        bannerImageUrl: "/images/banner-product.png"
                    }]
                }
            });
        } finally {
            setIsBannerLoading(false);
        }
    };

    const fetchFlashSales = async () => {
      setIsFlashSalesLoading(true);
      try {
        const response = await fetch("/api/flashsale");
        const data = await response.json();

        if (data.success && data.flashSales.length > 0) {
          const salesItems = data.flashSales
            .filter(item => item.status === "Active")   // ✅ only active
            .map((item) => ({
              id: item._id,
              title: item.title,
              productImage: item.banner_image,
              bgImage: item.background_image,
              redirectUrl: item.redirect_url || "/shop",
            }));
          setFlashSalesData(salesItems);
        }
      } catch (error) {
        console.error("Error fetching flash sales:", error);
        setFlashSalesData([
          {
            id: "fs1",
            title: "Summer Fruits Special",
            productImage: "/images/summer-fruits.png",
            bgImage: "/images/sale-bg1.jpg",
            redirectUrl: "/summer-sale",
          },
          {
            id: "fs2",
            title: "Organic Vegetables",
            productImage: "/images/veggies.png",
            bgImage: "/images/sale-bg2.jpg",
            redirectUrl: "/vegetables",
          },
        ]);
      } finally {
        setIsFlashSalesLoading(false);
      }
    };

    const fetchHomeSections = async () => {
      setIsSectionLoading(true);
      try {
        const response = await fetch("/api/home-sections");
        const data = await response.json();

        if (data.success && data.data?.length > 0) {
          const sectionItems = data.data
            .filter(section => section.status === "active") // ✅ only active
            .map(section => ({
              id: section._id,
              name: section.name,
              position: section.position
            }));

          setHomeSectionData({
            sections: sectionItems
          });
        }
      } catch (error) {
        console.error("Error fetching home sections:", error);
        setHomeSectionData({
          sections: []
        });
      } finally {
        setIsSectionLoading(false);
      }
    };

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

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories/get");
        const data    = await response.json();
        setCategories(data);
        const rootIds = data
        .filter(cat => cat.parentid === "none" && cat.status === "Active")
        .map(cat => cat._id);
        console.log(rootIds);
        // 2. Get only categories whose parentid is in rootIds → second level
        const secondLevelCategories = data.filter(
          cat => rootIds.includes(cat.parentid) && cat.status === "Active"
        );
        console.log(secondLevelCategories);
        setParentCategories(secondLevelCategories);
        setSelectedCategory(secondLevelCategories[0]);
      } catch (error) {
          console.error("Error fetching categories:", error);
      }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/product/get");
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchCategoryBanners = async () => {
      try {
        const response = await fetch("/api/categorybanner"); 
        const res = await response.json();

        if (res.success && res.categoryBanners && res.categoryBanners.banners) {
          const formatted = res.categoryBanners.banners
            .filter(banner => res.categoryBanners.status === "Active") // 👈 only if whole doc is Active
            .map((banner) => ({
              imageUrl: banner.banner_image,
              redirectUrl: banner.redirect_url,
            }));
          setCategoryBanner(formatted);
        }
      } catch (error) {
        console.error("Error fetching category banners:", error);
      }
    };

    const fetchSingleBannerData = async () => {
      setIsSingleBannerLoading(true);
      try {
        const response = await fetch("/api/singlebanner");
        const data = await response.json();

        if (data.success && data.banners?.length > 0) {
          const singleBannerItems = data.banners
            .filter((banner) => banner.status === "Active") // ✅ only Active
            .map((banner) => ({
              id: banner._id,
            redirect_url: banner.redirect_url || "/shop",
              bgImageUrl: banner.banner_image,
              singleBannerImageUrl: banner.banner_image,
            }));

          setSingleBannerData({
            singlebanner: { items: singleBannerItems },
          });
        } else {
          // if no data, fallback default
          setSingleBannerData({
            singlebanner: {
              items: [
                {
                  id: 1,
                  buttonLink: "/shop",
                  bgImageUrl: "/images/singlebanner-img1.png",
                  singleBannerImageUrl: "/images/singlebanner-product.png",
                },
              ],
            },
          });
        }
      } catch (error) {
        console.error("Error fetching single banner data:", error);
        setSingleBannerData({
          singlebanner: {
            items: [
              {
                id: 1,
                buttonLink: "/shop",
                bgImageUrl: "/images/singlebanner-img1.png",
                singleBannerImageUrl: "/images/singlebanner-product.png",
              },
            ],
          },
        });
      } finally {
        setIsSingleBannerLoading(false);
      }
    };

    const fetchSingleBannerDatatwo = async () => {
      setIsSingleBannerLoading(true);
      try {
        const response = await fetch("/api/singlebanner-two");
        const data = await response.json();

        if (data.success && data.banners?.length > 0) {
          const singleBannerItems = data.banners
            .filter((banner) => banner.status === "Active")
            .map((banner) => ({
              id: banner._id,
              redirect_url: banner.redirect_url || "/shop",
              bgImageUrl: banner.banner_image,
              singleBannerImageUrl: banner.banner_image,
            }));

          setSingleBannerData((prev) => ({
            ...prev,
            singlebannerTwo: { items: singleBannerItems },
          }));
        } else {
          setSingleBannerData((prev) => ({
            ...prev,
            singlebannerTwo: {
              items: [
                {
                  id: 1,
                  redirect_url: "/shop",
                  bgImageUrl: "/images/singlebanner-img1.png",
                  singleBannerImageUrl: "/images/singlebanner-product.png",
                },
              ],
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching single banner-two data:", error);
        setSingleBannerData((prev) => ({
          ...prev,
          singlebannerTwo: {
            items: [
              {
                id: 1,
                redirect_url: "/shop",
                bgImageUrl: "/images/singlebanner-img1.png",
                singleBannerImageUrl: "/images/singlebanner-product.png",
              },
            ],
          },
        }));
      } finally {
        setIsSingleBannerLoading(false);
      }
    };

    // Call all fetch functions
    fetchCategoryBanners();
    fetchBannerData();
    fetchFlashSales();
    fetchBrands();
    fetchCategories();
    fetchProducts();
    fetchSingleBannerData();
    fetchSingleBannerDatatwo();
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
}, []);

useEffect(() => {
    // commit: consolidated first-load daily cache logic
    let mounted = true;

    const populateFromCache = (payload) => {
      try {
        // Banners
        if (payload.banners) {
          const data = payload.banners;
          const bannerItems = (data.banners || data.items || []).filter(b => b.status !== 'Inactive').map(b => ({ id: b._id || b.id, redirect_url: b.redirect_url || b.buttonLink, banner_image: b.banner_image || b.bgImageUrl, status: b.status }));
          setBannerData({ banner: { items: bannerItems } });
        }

        // Flash sales
        if (payload.flashsales) {
          const data = payload.flashsales;
          const sales = (data.flashSales || data.items || []).filter(s => s.status !== 'Inactive').map(s => ({ id: s._id || s.id, title: s.title, banner_image: s.banner_image || s.productImage, background_image: s.background_image || s.bgImage, redirect_url: s.redirect_url || s.redirectUrl, status: s.status }));
          setFlashSalesData(sales);
        }

        // Brands
        if (payload.brands) {
          const data = payload.brands;
          const list = (data.brands || data.data || data) || [];
          setBrands(list);
        }

        // Categories
        if (payload.categories) {
          const data = payload.categories;
          const cats = Array.isArray(data) ? data : (data.data || []);
          setCategories(cats);
          const rootIds = cats.filter(cat => cat.parentid === 'none' && cat.status === 'Active').map(cat => cat._id);
          const secondLevel = cats.filter(cat => rootIds.includes(cat.parentid) && cat.status === 'Active');
          setParentCategories(secondLevel);
          setSelectedCategory(secondLevel[0]);
        }

        // Products
        if (payload.products) {
          const data = payload.products;
          const prods = Array.isArray(data) ? data : (data.data || []);
          setProducts(prods);
        }

        // Category banners
        if (payload.categoryBanners) {
          const data = payload.categoryBanners;
          const formatted = (data.banners || data.items || []).map(b => ({ imageUrl: b.banner_image, redirectUrl: b.redirect_url }));
          setCategoryBanner(formatted);
        }

        // Single banners
        if (payload.singlebanner) {
          setSingleBannerData(prev => ({ ...prev, singlebanner: { items: payload.singlebanner.banners || payload.singlebanner.items || payload.singlebanner } }));
        }
        if (payload.singlebannerTwo) {
          setSingleBannerData(prev => ({ ...prev, singlebannerTwo: { items: payload.singlebannerTwo.banners || payload.singlebannerTwo.items || payload.singlebannerTwo } }));
        }

        // Home sections
        if (payload.homeSections) {
          const data = payload.homeSections;
          const secs = data.data || data.sections || data || [];
          setHomeSectionData({ sections: Array.isArray(secs) ? secs : [] });
        }

        // Videos
        if (payload.videos) {
          const data = payload.videos;
          const vids = data.videoCards || data || [];
          setVideos(vids);
        }
      } catch (e) {
        console.error('populateFromCache error', e);
      }
    };

    const loadAll = async () => {
      const cached = readDailyCache();
      if (cached) {
        populateFromCache(cached);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch in parallel
        const endpoints = {
          banners: '/api/topbanner',
          flashsales: '/api/flashsale',
          brands: '/api/brand/get',
          categories: '/api/categories/get',
          products: '/api/product/get',
          categoryBanners: '/api/categorybanner',
          singlebanner: '/api/singlebanner',
          singlebannerTwo: '/api/singlebanner-two',
          homeSections: '/api/home-sections',
          videos: '/api/videocard'
        };

        const keys = Object.keys(endpoints);
        const promises = keys.map(k => fetch(endpoints[k]).then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null));
        const results = await Promise.all(promises);
        const payload = {};
        keys.forEach((k, i) => { payload[k] = results[i]; });

        // write daily cache
        writeDailyCache(payload); // commit: write daily cache after first-load fetch

        if (!mounted) return;
        populateFromCache(payload);
      } catch (err) {
        console.error('loadAll error', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();

    return () => { mounted = false; };
}, []);

    // Animation controls
    const controls = useAnimation();
    const refs = {
        banner: useRef(null),
        flashSales: useRef(null),
        delivery: useRef(null),
    };
    const checkAuthStatus = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
    
          const response = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            }
          });
    
          if (response.ok) {
            const data = await response.json();
            setIsLoggedIn(true);
            setUserData(data.user);
          } else {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
        }
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

    const CustomPrevArrow = ({ onClick }) => (
        <button onClick={onClick} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"> ◀ </button>
    );

    const CustomNextArrow = ({ onClick }) => (
        <button onClick={onClick} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"> ▶ </button>
    );

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
    };

    // const settings = {
    //     dots: true,
    //     infinite: true,
    //     speed: 500,
    //     slidesToShow: 1,
    //     slidesToScroll: 1,
    //     autoplay: true,
    //     autoplaySpeed: 5000,
    //     arrows: false,
    //     prevArrow: <CustomPrevArrow />,
    //     nextArrow: <CustomNextArrow />,
    // };

    const flashSalesSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
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
  infinite: true,
  speed: 3000, // Continuous effect
  slidesToShow: 6, // Default for large screens
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 0,
  cssEase: "linear",
  arrows: false,
  pauseOnHover: true,

  responsive: [
    {
      breakpoint: 1024, // Tablets
      settings: {
        slidesToShow: 5,
      },
    },
    {
      breakpoint: 768, // Mobile
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 480, // Extra-small devices
      settings: {
        slidesToShow: 2,
      },
    },
  ],
};

   
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
// ✅ State for single banner
const [singleBannerData, setSingleBannerData] = useState({
  singlebanner: { items: [] }
});
const [isSingleBannerLoading, setIsSingleBannerLoading] = useState(false);

    // const scrollLeft = () => {
    //     scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    // };
      
    // const scrollRight = () => {
    //     scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    // };

    const categoryScrollRefs = useRef({});
      const scrollLeft = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: -300, behavior: "smooth" });
    }
    };

    const scrollRight = (categoryId) => {
    if (categoryScrollRefs.current[categoryId]) {
      categoryScrollRefs.current[categoryId].scrollBy({ left: 300, behavior: "smooth" });
    }
    };
    
    const getSubcategorySlugs = (parentId) => {
    return categories
        .filter(cat => cat.parentid === parentId)
        .map(sub => sub.category_slug);
    };

    const filteredProducts = selectedCategory
    ? (() => {
        const subCategories = categories.filter(
          cat => cat.parentid === selectedCategory._id
        );

        const validCategoryIds = [
          selectedCategory._id,
          ...subCategories.map(sub => sub._id)
        ];
        return products.filter(product => 
          product.category && 
          validCategoryIds.includes(product.category.toString())
        );
    })() : products;

console.log("Filtered Products:", filteredProducts);

    const handleProductClick = (product) => {
        if (navigating) return;

        setNavigating(true);
        const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

        const alreadyViewed = stored.find((p) => p._id === product._id);

        const updated = alreadyViewed
            ? stored.filter((p) => p._id !== product._id)
            : stored;

        updated.unshift(product); // Add to beginning

        const limited = updated.slice(0, 10); // Limit to 10 recent products

        localStorage.setItem('recentlyViewed', JSON.stringify(limited));
    };

   // 1. Define the handler function with proper parameters
const handleCategoryClick = useCallback((category) => (e) => {
    if (navigating) {
        e.preventDefault();
        return;
    }

    setNavigating(true);

    // Optional: Save to recently viewed categories
    // const stored = JSON.parse(localStorage.getItem('recentlyViewedCategories')) || [];
    // const updated = stored.filter(c => c._id !== category._id); // Remove if already exists
    // updated.unshift(category);
    // localStorage.setItem('recentlyViewedCategories', JSON.stringify(updated.slice(0, 10)));

    router.push(`/category/${category.category_slug}`);
}, [navigating, router]);



    // Handle route events
       useEffect(() => {
        const handleRouteChange = () => setNavigating(false);
    
        if (!router?.events?.on) return;
    
        router.events.on('routeChangeComplete', handleRouteChange);
        router.events.on('routeChangeError', handleRouteChange);
    
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
            router.events.off('routeChangeError', handleRouteChange);
        };
    }, [router]);


    const featuredCategory = parentCategories[0];
    const dealCategories = parentCategories.slice(1, 4);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const [offers, setOffers] = useState([]);
    const [offerProducts, setOfferProducts] = useState([]);
    const bgClasses = ["bg-purple-50", "bg-green-50", "bg-amber-50", "bg-pink-50"];

    useEffect(() => {
      const fetchOfferProducts = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
    
          const res = await fetch('api/offers/offer-products', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await res.json();
  
          if (data.success) {
            setOfferProducts(data.data);
          }
        } catch (err) {
          console.error("Error loading offer products", err);
        }
      };
  
      fetchOfferProducts();
    }, []);
  
        // Helper function to render sections in the correct order
        const renderSection = (sectionName) => {
            switch(sectionName) {
                case 'category_banner':
                    return (
                      <section id="category_banner">
                        <div className="px-0 sm:px-6 md:px-6  pt-7">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {categoryBanner.map((banner, index) => (
                                    <div key={index} className="col-span-1">
                                        <div className="card  overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <Link href={banner.redirectUrl || "#"} className="no-underline">
                                                <img
                                                    src={banner.imageUrl}
                                                    alt={`Category Banner ${index + 1}`}
                                                    // title={`Category Banner ${index + 1}`}
                                                    className="w-full h-auto object-cover"
                                                    width={400}
                                                    height={400}
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </section>
                    );
                case 'product':
                  return (
                    <motion.section
                      id="product"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.6 }}
                      className="recommended-products px-4 sm:px-6 md:px-6 pt-6"
                    >
                      <div className="rounded-[23px] py-4 p-2">
                        {/* Section Header */}
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                          <h5 className="text-xl sm:text-2xl font-bold">
                            Shop by Category
                          </h5>
                        </div>
                        
                        {/* Category-based Product Display */}
                        <div className="space-y-8">            
                          {parentCategories
                            .filter(category => priorityCategories.includes(category.category_slug))
                            .sort((a, b) => {
                              // Sort by the order in priorityCategories array
                              return priorityCategories.indexOf(a.category_slug) - priorityCategories.indexOf(b.category_slug);
                            })
                            .map((category, index) => {
                              // Get products for this category
                              const categoryProducts = (() => {
                                const subCategories = categories.filter(
                                  cat => cat.parentid === category._id
                                );
                          
                                const validCategoryIds = [
                                  category._id,
                                  ...subCategories.map(sub => sub._id)
                                ];
                          
                                const allProducts = products.filter(product => 
                                  product.category && 
                                  validCategoryIds.includes(product.category.toString())
                                );
                                
                                return allProducts.slice(0, 50);
                              })();
                          
                              // Skip empty categories
                              if (categoryProducts.length === 0) return null;
                          
                              return (
                                <div  key={category._id}  className={`bg-white rounded-lg p-0 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} flex flex-col md:flex-row`}>
                                  {/* Category Banner */}
                                  <div className="flex-shrink-0 w-full md:w-1/3 relative">
                                    <div className="absolute inset-0"  style={{ backgroundImage: `url(${'/uploads/small-appliance-banner.webp'})` }}></div>
                                    <div className="relative z-10 h-full flex flex-col p-6 text-white">
                                      <h2 className="text-2xl font-bold">{category.category_name}</h2>
                                      
                                      <Link   href={`/category/${category.category_slug || category._id}`} className="mt-3 bg-white hover:bg-gray-100 text-blue-700 text-sm font-semibold py-2 px-4 rounded w-fit"> Shop Now → </Link>
                                    </div>
                                  </div>

                                  {/* Products Grid */}
                                  <div className="w-full md:w-2/3">
                                    <div className={` relative flex-1 pt-2 pb-2 ${index % 2 === 1 ? 'pr-4' : ' pl-4'} overflow-hidden group`} >
                                      {/* Left Arrow */}
                                      <button
                                        onClick={() => scrollLeft(category._id)}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 
                                                  w-8 h-8 flex items-center justify-center 
                                                  rounded-full bg-white text-black border border-gray 
                                                  hover:bg-black hover:text-white hover:border-white
                                                  shadow-sm z-20 transition-all duration-300"
                                      >
                                        <FiChevronLeft size={18} />
                                      </button>

                                      {/* Right Arrow */}
                                      <button
                                        onClick={() => scrollRight(category._id)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 
                                                  w-8 h-8 flex items-center justify-center 
                                                  rounded-full bg-white text-black border border-gray 
                                                  hover:bg-black hover:text-white hover:border-white
                                                  shadow-sm z-20 transition-all duration-300"
                                      >
                                        <FiChevronRight size={18} />
                                      </button>
                                      <div   ref={(el) => (categoryScrollRefs.current[category._id] = el)} className="flex overflow-x-auto scrollbar-hide scroll-smooth gap-4">
                                        {categoryProducts.slice(0, 6).map((product) => (
                                          <div  key={product._id} className="relative border border-gray-300 shadow bg-white flex-shrink-0 w-60 flex flex-col justify-between p-4  transition-all duration-300 hover:border-blue-500 group rounded">
                                            <div className="absolute top-3 left-3">
                                              
                                                {product.special_price && product.price > product.special_price ? (
                                                (() => {
                                                  const discount = Math.floor(
                                                    ((product.price - product.special_price) / product.price) * 100
                                                  );

                                                  console.log(product);

                                                  return discount && discount > 0 ? (

                                                      <span className="px-2 py-1 text-xs text-white bg-red-500 rounded">
                                                        {discount}% OFF
                                                      </span>
                                                  
                                                  ) : (
                                                    null
                                                  );
                                                })()
                                              ) : (
                                                null
                                              )}

                                            </div>
                                            <div className="h-28 flex items-center justify-center mt-4">
                                              <img
                                                src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"} 
                                                alt={product.images?.[0] || "Product image"} 
                                                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => { 
                                                  e.target.onerror = null; 
                                                  e.target.src = "/uploads/products/placeholder.jpg";
                                                }} 
                                              />
                                            </div>

                                            <h4 className="text-xs text-gray-500 mb-2 uppercase hover:text-blue-600">
                                              <Link
                                                href={`/brand/${brandMap[product.brand] ? brandMap[product.brand].toLowerCase().replace(/\s+/g, "-") : ""}`}
                                                className="hover:text-blue-600"
                                              >
                                                {brandMap[product.brand] || ""}
                                              </Link>
                                            </h4>
                                            <Link
                                              href={`/product/${product.slug || product._id}`}
                                              className="block mb-2"
                                            >
                                            <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] line-clamp-2 min-h-[40px]">
                                              {product.name}
                                            </h3>
                                            </Link>
                                            <div className="mt-2 text-lg font-bold text-blue-600">
                                                Rs. {product.special_price || product.price}
                                              <span className="line-through text-gray-400 text-sm ml-1">
                                                Rs. {product.price}
                                              </span>
                                            </div>
                                            <p className={`text-sm mt-1 ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                              {product.quantity > 0
                                                ? `In stock, ${product.quantity} units`
                                                : "Out of stock"}
                                            </p>

                                            <div className="mt-3 flex items-center justify-between gap-2">
                                              <Addtocart productId={product._id} stockQuantity={product.quantity}  special_price={product.special_price} className="flex-1" />
                                              <a 
                                              href={`https://wa.me/919865555000?text=${encodeURIComponent(`Check Out This Product: ${apiUrl}/product/${product.slug}`)}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-300 flex items-center justify-center"
                                              >
                                                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                                                    <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                                                </svg>
                                              </a>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    </motion.section>
                  );
                case 'flash_sales':
                    return (
                       <motion.section
  ref={refs.flashSales}
  initial="hiddenDown"
  animate="visible"
  variants={sectionVariants}
  id="flash_sales"
  className="px-4 sm:px-6 md:px-6 pt-6"
>
  {flashSalesData.filter(item => item.bgImage && item.productImage).length > 0 && (
    <div className="py-0">
      <motion.div
        variants={itemVariants}
        className="section-heading flex justify-between items-center  p-2 md:px-6"
      >
        {/* Optional Heading */}
      </motion.div>

      {isFlashSalesLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
   <div className="grid grid-cols-12 gap-4">
  {flashSalesData
    .filter(item => item.bgImage && item.productImage)
    .map((item, index) => (
      <motion.div
        key={item.id}
        whileHover={{ y: -5 }}
        className={`relative p-6 shadow-lg h-full min-h-[250px] flex items-center overflow-hidden 
          ${index === 0 ? "col-span-3" : index === 1 ? "col-span-6" : "col-span-3"}`}
        style={{
          backgroundImage: `url(${item.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`relative z-10 w-full flex flex-col items-center text-center md:flex-row  ${
            index === 0
              ? "items-start text-left"
              : index === 1
              ? "items-center text-center"
              : "items-end text-right"
          }`}
        >
          <div className="p-1 text-left">
            <h6 className="text-lg font-semibold mt-3 text-gray-900">
            {item.title}
          </h6>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={item.redirectUrl}
            className="mt-2 inline-flex items-center text-sm font-medium text-gray-800 hover:text-black transition"
          >
            Shop Now
            <ChevronRight className="ml-1 h-4 w-4" />
          </motion.a>
          </div>
          <div className="p-1 ">
          <Image
            src={item.productImage}
            alt={item.title}
            width={index === 1 ? 200 : 120}
            height={index === 1 ? 200 : 120}
            className="object-contain max-h-[200px] transform transition-transform duration-300 hover:scale-110"
          />
          </div>
        </div>
      </motion.div>
    ))}
</div>

      )}
    </div>
  )}
</motion.section>

                    );
                case 'features':
                    return (
                <section className="pt-7 px-4 sm:px-6 md:px-6" id="features">
  <div className="max-w-7xl mx-auto px-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
      {features.map((feature, index) => (
        <div
          key={index}
          className="flex flex-col items-center cursor-pointer group"
          onMouseEnter={(e) => {
            const img = e.currentTarget.querySelector(".img-flip");
            if (img) img.style.transform = "rotateY(360deg)";
          }}
          onMouseLeave={(e) => {
            const img = e.currentTarget.querySelector(".img-flip");
            if (img) img.style.transform = "rotateY(0deg)";
          }}
        >
          {/* Image instead of Icon */}
          <div
            className="mb-4 img-flip"
            style={{
              transition: "transform 0.5s",
              transformStyle: "preserve-3d",
            }}
          >
            <img
              src={feature.image}
              alt={feature.title}
              className="w-16 h-16 object-contain"
            />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:transition-colors duration-300">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed max-w-[250px] group-hover:transition-colors duration-300">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

                    );
                case 'brands':
                    return (
                   <motion.section id="brands"
                            ref={refs.delivery} 
                            initial={scrollDirection === 'down' ? 'hiddenDown' : 'hiddenUp'} 
                            animate= 'visible' 
                            variants={sectionVariants} 
                            className="px-4 sm:px-6 md:px-6 pt-7"
                        >
                            <div>
                                <motion.div variants={containerVariants} className="  rounded-[23px] mx-2">
                                    <motion.div variants={itemVariants} className="flex justify-between items-center mb-4">
                                        <h5 className= "text-lg font-semibold">Shop by Brands</h5>
                                    </motion.div>
    
                                    {isBrandsLoading ? (
                                        <div className="flex justify-center items-center h-32">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <motion.div variants={itemVariants}>
                                            <Slider {...brandSettings} className="brand-slider px-2 sm:px-[50px] relative">
                                                {brands.map((brand) => (
                                                    <motion.div
                                                        key={brand.id}
                                                        className="p-4 flex justify-center items-center"
                                                        whileHover={{ scale: 1.1 }}
                                                    >
                                                    <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                                                      <Link href={`/brand/${slugify(brand.brand_name)}`}>
                                                        <Image
                                                          src={`/uploads/Brands/${brand.image}`}
                                                          alt={brand.brand_name || "Brand Logo"}
                                                          width={100}
                                                          height={100}
                                                          className="object-contain w-full h-full cursor-pointer"
                                                          unoptimized
                                                        />
                                                      </Link>
                                                    </div>
                                                    </motion.div>
                                                ))}
                                            </Slider>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.section>
                    );
                    
                case 'topbanner':
                  return(
                        <motion.section id="topbanner"
                                                ref={refs.banner}
                                                initial="hidden"
                                                animate="visible"
                                                variants={containerVariants}
                                                className="overflow-hidden pt-0 m-0 "
                                              >
                    <div className="relative">
                      {isBannerLoading ? (
                        <div className="p-6 flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                      ) : bannerData.banner.items.length > 0 ? (
                        bannerData.banner.items.length > 1 ? (
                          <Slider {...settings} className="relative">
                            {bannerData.banner.items.map((item) => (
                              <motion.div
                                key={item.id}
                                className="relative w-full 
                                          aspect-[16/9] max-h-[110px] 
                                          sm:aspect-[16/6] sm:max-h-[180px]
                                          md:aspect-[16/8] md:max-h-[200px]
                                          lg:aspect-[16/9] lg:max-h-[300px]
                                          xl:aspect-[16/10] xl:max-h-[400px]
                                          2xl:aspect-[16/12] 2xl:max-h-[700px]"
                                variants={itemVariants}
                              >
                                <div className="absolute inset-0 overflow-hidden">
                                  <Image
                                    src={item.bgImageUrl}
                                    alt="Banner"
                                    fill
                                    quality={100}
                                    className="object-fill w-full h-full"
                                    style={{ objectPosition: "center 30%" }}
                                    priority
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </Slider>
                        ) : (
                          <motion.div
                            className="p-4 md:p-6 relative h-[250px] md:h-[500px]"
                            variants={itemVariants}
                          >
                            <div className="absolute inset-0 flex justify-center items-center bg-white">
                              <Image
                                src={bannerData.banner.items[0].bgImageUrl}
                                alt="Banner"
                                fill
                                className=" object-fill w-full h-full"
                                priority
                              />
                            </div>
                          </motion.div>
                        )
                      ) : (
                        <div>
                          </div>
                        // <div className="p-6 text-center">
                        //   <p className="text-lg">No active banners available</p>
                        // </div>
                      )}
                    </div>
                  </motion.section>
                  )
                case 'singlebanner':
                  return (
                    <motion.section id="singlebanner"
                      ref={refs.singlebanner}
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="overflow-hidden pt-7 px-4 sm:px-6 md:px-6"
                    >
                      <div className="relative">
                        {isSingleBannerLoading ? (
                          <div className="p-2 flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full border-t-2 border-b-2 border-blue-600"></div>
                          </div>
                        ) : singleBannerData.singlebanner.items.length > 0 ? (
                          singleBannerData.singlebanner.items.length > 1 ? (
                            <Slider {...settings} className="relative">
                              {singleBannerData.singlebanner.items.map((item) => (
                                <motion.div
                                  key={item.id}
                                  className="relative w-full 
                                            aspect-[16/9] max-h-[110px] 
                                            sm:aspect-[16/6] sm:max-h-[180px]
                                            md:aspect-[16/8] md:max-h-[200px]
                                            lg:aspect-[16/9] lg:max-h-[300px]
                                            xl:aspect-[16/10] xl:max-h-[400px]
                                            2xl:aspect-[16/12] 2xl:max-h-[700px]"
                                  variants={itemVariants}
                                >
                                  <Link href={item.redirect_url || "#"} className="block w-full h-full">
                                    <div className="absolute inset-0 flex justify-center items-center bg-white">
                                      <Image
                                        src={item.bgImageUrl}
                                        alt="Banner"
                                        fill
                                        quality={100}
                                        className="object-fill w-full h-full"
                                        priority
                                      />
                                    </div>
                                  </Link>
                                </motion.div>
                              ))}
                            </Slider>
                          ) : (
                            <motion.div
                              className="relative w-full "
                              variants={itemVariants}
                            >
                              <Link
                                href={singleBannerData.singlebanner.items[0].redirect_url || "#"}
                                className="block w-full h-full"
                              >
                                <div className="relative w-full">
                                  <Image
                                    src={singleBannerData.singlebanner.items[0].bgImageUrl}
                                     alt="Single Banner"
                                     width={1920}
                                     height={500}
                                     quality={100}
                                     className="w-full h-auto object-contain"
                                     priority
                                  />
                                </div>
                              </Link>
                            </motion.div>

                          )
                        ) : (
                          <div className="p-6 text-center">
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )
                case 'singlebanner-two':
                  return (
                    <motion.section id="singlebanner-two"
                      ref={refs.singlebanner}
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="overflow-hidden pt-7 px-4 sm:px-6 md:px-6"
                    >
                      <div className="relative">
                        {isSingleBannerLoading ? (
                          <div className="p-2 flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full border-t-2 border-b-2 border-blue-600"></div>
                          </div>
                        ) : singleBannerData.singlebannerTwo?.items?.length > 0 ? (
                          singleBannerData.singlebannerTwo.items.length > 1 ? (
                            <Slider {...settings} className="relative">
                              {singleBannerData.singlebannerTwo.items.map((item) => (
                                <motion.div
                                  key={item.id}
                                  className="relative w-full"
                                  variants={itemVariants}
                                >
                                  <Link href={item.redirect_url || "#"} className="block w-full h-full">
                                    <div className="absolute inset-0 flex justify-center items-center bg-white mb-4">
                                      <Image
                                        src={item.bgImageUrl}
                                        alt="Single Banner"
                                        fill
                                        quality={100}
                                        className="object-fill w-full h-full"
                                        priority
                                      />
                                    </div>
                                  </Link>
                                </motion.div>
                              ))}
                            </Slider>
                          ) : (
                            <motion.div
                              className="relative w-full"
                              variants={itemVariants}
                            >
                              <Link
                                href={singleBannerData.singlebannerTwo.items[0].redirect_url || "#"}
                                className="block w-full h-full"
                              >
                                <div className="relative w-full">
                                  <Image
                                    src={singleBannerData.singlebannerTwo.items[0].bgImageUrl}
                                    alt="Single Banner two"
                                     width={1920}
                                     height={500}
                                     quality={100}
                                     className="w-full h-auto object-contain"
                                     priority
                                  />
                                </div>
                              </Link>
                            </motion.div>
                          )
                        ) : (
                          <div className="">
                           
                          </div>
                        )}
                      </div>
                    </motion.section>
                  );

                case 'videocard':
                  return(
                   <motion.section id="videocard"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.6 }}
                      className="px-4 sm:px-6 md:px-6 pt-7"
                    >
                      <div className=" rounded-2xl">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6 md:px-4">
                          <h5 className="text-xl font-bold">What's Trending</h5>
                          <div className="flex gap-2">
                            <button
                              onClick={() => scroll("left")}
                              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <CaretLeft size={20} weight="bold" />
                            </button>
                            <button
                              onClick={() => scroll("right")}
                              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <CaretRight size={20} weight="bold" />
                            </button>
                          </div>
                        </div>

                        {/* Video Scroll */}
                       <div
  ref={scrollRef}
  className="flex gap-4 overflow-x-hidden scroll-smooth px-2 scrollbar-hide"
>
  {videos.map((video) => {
    let thumb = video.thumbnail_image;

    if (thumb) {
      // Ensure correct path
      if (!thumb.startsWith("http") && !thumb.startsWith("/")) {
        thumb = "/" + thumb;
      }
    } else if (video.video_url) {
      const ytId = getYoutubeId(video.video_url);
      if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/0.jpg`;
    }

    if (!thumb) thumb = "/placeholder.jpg";

    return (
      <motion.div
        key={video._id}
        whileHover={{ scale: 1.05 }}
        className="min-w-[320px]  shadow-md bg-white overflow-hidden"
      >
        {/* 👉 Thumbnail click = same as title click */}
        <div
          className="h-48 relative flex items-center justify-center bg-gray-200 cursor-pointer"
          onClick={() => setActiveVideo(video)}
        >
          <img
            src={thumb}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <img
            src="https://img.poorvika.com//play_video.png"
            alt="play"
            className="absolute w-12 h-12"
          />
        </div>

        {/* 👉 Title click */}
        <div className="p-3">
          <p
            className="text-sm font-medium text-gray-800 line-clamp-2 cursor-pointer hover:text-orange-600"
            onClick={() => setActiveVideo(video)}
          >
            {video.title}
          </p>
        </div>
      </motion.div>
    );
  })}
</div>


                        {/* ✅ Modal for YouTube video */}
                        {activeVideo && (
                          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                            <div className="bg-white  overflow-hidden relative w-[90%] md:w-[700px] h-[400px]">
                              {/* Close Button */}
                              <button
                                className="absolute top-2 right-2 bg-black text-white rounded-full p-1"
                                onClick={() => setActiveVideo(null)}
                              >
                                <X size={20} />
                              </button>

                              {/* YouTube Embed */}
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${getYoutubeId(
                                  activeVideo.video_url
                                )}?autoplay=1`}
                                title={activeVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.section>
                     )
                default:
                    return null;
            }
        };
    
        // Map section names from API to our component names
        const getSectionComponentName = (sectionName) => {
            const mapping = {
                'categorybanner': 'category_banner',
                'flashsale': 'flash_sales',
                'Brands': 'brands',
                'topbanner' : 'topbanner',
                'features' : 'features',
                'product'  :'product',
                // Add more mappings as needed
            };
            
            return mapping[sectionName] || sectionName.toLowerCase();
        };
 
    return (
        <>

            {navigating && (
            <div className="fixed inset-0 z-[9999] flex justify-center items-center bg-black bg-opacity-30">
              <div className="p-4  shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          )}
            {isLoading && (
                // <div className="preloader fixed inset-0 z-[9999] flex justify-center items-center bg-white">
                //     <Image 
                //     src="/images/thumbs/bea.webp"
                //     alt="Loading"
                //     width={64}
                //     height={64}
                //     className="animate-spin"
                //     />
                // </div>
               <div className="preloader fixed inset-0 z-[9999] flex justify-center items-center bg-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                </div>
            )}
            {/* main div start */}
            <div className={`relative transition-opacity duration-300 ${isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`} ref={containerRef} >
              
                    
                          
                  {/* Banner Section start */}
              
                  <div className="home-container">
                    {isSectionLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : homeSectionData.sections.length > 0 ? (
                        // Render sections in the order specified by homeSectionData
                        homeSectionData.sections
                            .sort((a, b) => a.position - b.position)
                            .map(section => (
                                <div key={section.id}>
                                    {renderSection(getSectionComponentName(section.name))}
                                </div>
                            ))
                    ) : (
                        // Fallback order if no sections are configured
                        <>
                            {renderSection('category_banner')}
                            {renderSection('flash_sales')}
                            {renderSection('brands')}
                            {renderSection('features')}
                        </>
                    )}
                  </div>
              
                  

                  {/* Existing offer code start */}
                  {offerProducts.length > 0 && (
                    <section id="offer">
                    <div className="px-2 py-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Exciting Offers</h2>
                        {offerProducts.length > 3 && (
                          <div className="flex gap-2">
                            {/* Optional navigation buttons */}
                          </div>
                        )}
                      </div>

                      {/* Mobile view: static grid */}
                      {offerProducts.length >= 3 && (
                        <div className="grid grid-cols-2 gap-4 sm:hidden">
                          {offerProducts.slice(0, 4).map((product, index) => (
                            <div
                              key={product._id}
                              className={`card  shadow-sm h-[140px] min-h-[140px] flex overflow-hidden ${bgClasses[index % bgClasses.length]}`}
                            >
                              <div className="flex items-center">
                                <div className="w-1/3 p-2">
                                  <Link href={`/product/${product.slug}`} className="block">
                                    <div className="h-[100px] sm:h-[120px] md:h-[130px] bg-white flex items-center justify-center overflow-hidden rounded-md">
                                      <img
                                        src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"}
                                        alt={product.item_code}
                                        className="object-contain w-full h-full"
                                      />
                                    </div>
                                  </Link>
                                </div>
                                <div className="w-2/3 p-4">
                                  <Link href={`/product/${product.slug}`} className="block">
                                    <div className="text-sm line-clamp-2">{product.name}</div>
                                  </Link>
                                  <div className="mt-1">
                                    <span className="text-sm font-medium text-gray-700">Rs.</span>
                                    <span className="ml-1 font-semibold">{product.price}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <div className="text-sm font-medium text-gray-400 line-through whitespace-nowrap">
                                      <span className="text-sm font-medium text-gray-400">Rs.</span>
                                      {product.special_price ? product.price : product.price + 20}
                                    </div>
                                    <div className="text-xs font-semibold text-green-600 bg-white rounded px-2 py-0.5 whitespace-nowrap">
                                      {product.special_price ? "Special Offer" : "Limited Time"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Desktop view: Swiper */}
                      <div className="hidden sm:block">
                        {offerProducts.length && (
                          <Swiper
                            modules={[Navigation, Autoplay]}
                            navigation={{
                              nextEl: ".swiper-button-next",
                              prevEl: ".swiper-button-prev",
                            }}
                            autoplay={{
                              delay: 5000,
                              disableOnInteraction: false,
                            }}
                            slidesPerView={4}
                            spaceBetween={0}
                            loop={true}
                          >
                            {offerProducts.map((product, index) => (
                              <SwiperSlide key={product._id}>
                                <div
                                  className={`card  shadow-sm h-[140px] min-h-[140px] flex overflow-hidden ${bgClasses[index % bgClasses.length]}`}
                                >
                                  <div className="flex items-center">
                                    <div className="w-1/3 p-2">
                                      <Link href={`/product/${product.slug}`} className="block">
                                        <div className="h-[100px] sm:h-[120px] md:h-[130px] flex items-center justify-center overflow-hidden rounded-md">
                                          <img
                                            src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"}
                                            alt={product.item_code}
                                            className="object-contain w-full h-full"
                                          />
                                        </div>
                                      </Link>
                                    </div>
                                    <div className="w-2/3 p-4">
                                      <Link href={`/product/${product.slug}`} className="block">
                                        <div className="text-sm line-clamp-2">{product.name}</div>
                                      </Link>
                                      <div className="mt-1">
                                        <span className="text-sm font-medium text-gray-700">Rs.</span>
                                        <span className="ml-1 font-semibold">{product.price}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="text-sm font-medium text-gray-400 line-through whitespace-nowrap">
                                          <span className="text-sm font-medium text-gray-400">Rs.</span>
                                          {product.special_price ? product.price : product.price + 20}
                                        </div>
                                        <div className="text-sm font-semibold text-green-600 bg-white rounded px-2 whitespace-nowrap">
                                          {product.special_price ? "Special Offer" : "Limited Time"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        )}
                      </div>
                    </div>
                    </section>
                  )}



                  

                  <RecentlyViewedProducts />
                  

                
            </div>
        </>
    );
}
