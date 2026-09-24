"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin, FiClock, FiEye, FiEyeOff } from "react-icons/fi";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { IoReload, IoStorefront, IoCardOutline, IoShieldCheckmark } from "react-icons/io5";
import { TbTruckDelivery } from "react-icons/tb";
import Image from "next/image";
import { MdAccountCircle } from "react-icons/md";
import { FaShoppingBag } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import OurLocations from '@/components/OurLocations';
import {
  Tv,
  Laptop,
  Smartphone,
  WashingMachine,
  Refrigerator,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({ main: [], subs: {} });
  const [stores, setStores] = useState([]);
  
  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    const getCached = (key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.__ts) return null;
        if (Date.now() - parsed.__ts > CACHE_TTL) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.data;
      } catch (e) {
        return null;
      }
    };

    const setCached = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify({ __ts: Date.now(), data }));
      } catch (e) {
        // ignore  test pull
      }
    };

    const makeGrouped = (data) => {
      const activeCategories = Array.isArray(data) ? data.filter(cat => cat.status === 'Active') : [];
      const main = activeCategories.filter(cat => cat.parentid === 'none');
      const subs = {};
      activeCategories.forEach(cat => {
        if (cat.parentid !== 'none') {
          if (!subs[cat.parentid]) subs[cat.parentid] = [];
          subs[cat.parentid].push(cat);
        }
      });
      return { main, subs };
    };

    const fetchCategories = async () => {
      const key = 'cache_footer_categories_v1';
      const cached = getCached(key);
      if (cached) {
        setGroupedCategories(makeGrouped(cached));
        return;
      }

      try {
        const res = await fetch('/api/categories/get');
        const data = await res.json();
        if (data) {
          setGroupedCategories(makeGrouped(data));
          setCached(key, data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    const fetchStores = async () => {
      const key = 'cache_footer_stores_v1';
      const cached = getCached(key);
      if (cached) {
        setStores(cached);
        return;
      }

      try {
        const res = await fetch('/api/store/get');
        const data = await res.json();
        if (data && data.success) {
          setStores(data.data);
          setCached(key, data.data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };

    fetchCategories();
    fetchStores();
  }, []);

  const categoryIcons = {
    "TELEVISIONS": Tv,
    "COMPUTERS & LAPTOPS": Laptop,
    "MOBILES & ACCESSORIES": Smartphone,
    "LARGE APPLIANCES": Refrigerator,
    "SMALL APPLIANCES": WashingMachine,
    "OUR LOCATION": MapPin,
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

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError('');
    setLoadingAuth(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      setUserData(data.user);
      setShowAuthModal(false);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
  };
  
  const groupedStores = stores.reduce((acc, store) => {
    const city = store.city; // or store.store_city based on your API
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(store.organisation_name);
    return acc;
  }, {});

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);
    
  // Case-insensitive membership helper
  const inSetCI = (name, arr) => arr.includes(String(name || '').toLowerCase());

  const groupCategories = (categories) => {
    const grouped = { main: [], subs: {} };
    
    const mainCats = categories.filter(cat => cat.parentid === "none");
    
    mainCats.forEach(mainCat => {
      const subs = categories.filter(cat => cat.parentid === mainCat._id.toString());
      grouped.main.push(mainCat);
      grouped.subs[mainCat._id] = subs;
    });
    
    return grouped;
  };

  const DEFAULT_SEO_SECTIONS = [
    {
      key: "def-tv",
      title: "Televisions",
      brandTitle: "Television Brands",
      items: [
        { name: "Smart TVs", href: "/category/televisions/smart-tvs" },
        { name: "32 Inch TVs", href: "/category/televisions/32-inch-tvs" },
        { name: "43 Inch TVs", href: "/category/televisions/43-inch-tvs" },
        { name: "50 Inch TVs", href: "/category/televisions/50-inch-tvs" },
        { name: "55 Inch TVs", href: "/category/televisions/55-inch-tvs" },
        { name: "65 Inch TVs", href: "/category/televisions/65-inch-tvs" },
        { name: "4K Ultra HD TVs", href: "/category/televisions/4k-ultra-hd-tvs" },
        { name: "OLED TVs", href: "/category/televisions/oled-tvs" },
        { name: "QLED TVs", href: "/category/televisions/qled-tvs" },
        { name: "LED TVs", href: "/category/televisions/led-tvs" },
        { name: "Google TVs", href: "/category/televisions/google-tvs" },
        { name: "Android TVs", href: "/category/televisions/android-tvs" },
      ],
      brands: [
        { name: "Sony", href: "/category/brand/televisions/sony" },
        { name: "Samsung", href: "/category/brand/televisions/samsung" },
        { name: "LG", href: "/category/brand/televisions/lg" },
        { name: "OnePlus", href: "/category/brand/televisions/oneplus" },
        { name: "TCL", href: "/category/brand/televisions/tcl" },
        { name: "Xiaomi", href: "/category/brand/televisions/xiaomi" },
        { name: "Vu", href: "/category/brand/televisions/vu" },
        { name: "Haier", href: "/category/brand/televisions/haier" },
        { name: "Lloyd", href: "/category/brand/televisions/lloyd" },
        { name: "Onida", href: "/category/brand/televisions/onida" },
        { name: "Sansui", href: "/category/brand/televisions/sansui" },
        { name: "Acer", href: "/category/brand/televisions/acer" },
      ],
    },
    {
      key: "def-ref",
      title: "Refrigerators",
      brandTitle: "Refrigerator Brands",
      items: [
        { name: "Single Door Refrigerators", href: "/category/large-appliances/refrigerators/single-door" },
        { name: "Double Door Refrigerators", href: "/category/large-appliances/refrigerators/double-door" },
        { name: "Side by Side Refrigerators", href: "/category/large-appliances/refrigerators/side-by-side" },
        { name: "French Door Refrigerators", href: "/category/large-appliances/refrigerators/french-door" },
        { name: "Triple Door Refrigerators", href: "/category/large-appliances/refrigerators/triple-door" },
        { name: "Bottom Freezer Refrigerators", href: "/category/large-appliances/refrigerators/bottom-freezer" },
        { name: "Mini Refrigerators", href: "/category/large-appliances/refrigerators/mini-refrigerator" },
        { name: "Inverter Refrigerators", href: "/category/large-appliances/refrigerators/inverter-refrigerator" },
      ],
      brands: [
        { name: "LG", href: "/category/brand/refrigerators/lg" },
        { name: "Samsung", href: "/category/brand/refrigerators/samsung" },
        { name: "Whirlpool", href: "/category/brand/refrigerators/whirlpool" },
        { name: "Haier", href: "/category/brand/refrigerators/haier" },
        { name: "Godrej", href: "/category/brand/refrigerators/godrej" },
        { name: "Bosch", href: "/category/brand/refrigerators/bosch" },
        { name: "Liebherr", href: "/category/brand/refrigerators/liebherr" },
        { name: "Panasonic", href: "/category/brand/refrigerators/panasonic" },
        { name: "Voltas Beko", href: "/category/brand/refrigerators/voltas-beko" },
      ],
    },
    {
      key: "def-wm",
      title: "Washing Machines",
      brandTitle: "Washing Machine Brands",
      items: [
        { name: "Front Load Washing Machines", href: "/category/large-appliances/washing-machines/front-load" },
        { name: "Top Load Washing Machines", href: "/category/large-appliances/washing-machines/top-load" },
        { name: "Semi Automatic Washing Machines", href: "/category/large-appliances/washing-machines/semi-automatic" },
        { name: "Fully Automatic Washing Machines", href: "/category/large-appliances/washing-machines/fully-automatic" },
        { name: "Washer Dryers", href: "/category/large-appliances/washing-machines/washer-dryer" },
        { name: "Inverter Washing Machines", href: "/category/large-appliances/washing-machines/inverter" },
      ],
      brands: [
        { name: "LG", href: "/category/brand/washing-machines/lg" },
        { name: "Samsung", href: "/category/brand/washing-machines/samsung" },
        { name: "Bosch", href: "/category/brand/washing-machines/bosch" },
        { name: "IFB", href: "/category/brand/washing-machines/ifb" },
        { name: "Whirlpool", href: "/category/brand/washing-machines/whirlpool" },
        { name: "Godrej", href: "/category/brand/washing-machines/godrej" },
        { name: "Panasonic", href: "/category/brand/washing-machines/panasonic" },
        { name: "Lloyd", href: "/category/brand/washing-machines/lloyd" },
        { name: "Haier", href: "/category/brand/washing-machines/haier" },
      ],
    },
    {
      key: "def-ac",
      title: "Air Conditioners",
      brandTitle: "Air Conditioner Brands",
      items: [
        { name: "Split ACs", href: "/category/large-appliances/air-conditioners/split-ac" },
        { name: "Inverter ACs", href: "/category/large-appliances/air-conditioners/inverter-ac" },
        { name: "Window ACs", href: "/category/large-appliances/air-conditioners/window-ac" },
        { name: "1 Ton ACs", href: "/category/large-appliances/air-conditioners/1-ton-ac" },
        { name: "1.5 Ton ACs", href: "/category/large-appliances/air-conditioners/1-5-ton-ac" },
        { name: "2 Ton ACs", href: "/category/large-appliances/air-conditioners/2-ton-ac" },
        { name: "5 Star ACs", href: "/category/large-appliances/air-conditioners/5-star-ac" },
        { name: "3 Star ACs", href: "/category/large-appliances/air-conditioners/3-star-ac" },
        { name: "Hot & Cold ACs", href: "/category/large-appliances/air-conditioners/hot-cold-ac" },
      ],
      brands: [
        { name: "Daikin", href: "/category/brand/air-conditioners/daikin" },
        { name: "Voltas", href: "/category/brand/air-conditioners/voltas" },
        { name: "Blue Star", href: "/category/brand/air-conditioners/blue-star" },
        { name: "LG", href: "/category/brand/air-conditioners/lg" },
        { name: "Lloyd", href: "/category/brand/air-conditioners/lloyd" },
        { name: "Carrier", href: "/category/brand/air-conditioners/carrier" },
        { name: "Hitachi", href: "/category/brand/air-conditioners/hitachi" },
        { name: "Panasonic", href: "/category/brand/air-conditioners/panasonic" },
        { name: "Samsung", href: "/category/brand/air-conditioners/samsung" },
        { name: "Mitsubishi", href: "/category/brand/air-conditioners/mitsubishi" },
      ],
    },
    {
      key: "def-dw",
      title: "Dishwashers",
      brandTitle: "Dishwasher Brands",
      items: [
        { name: "12 Place Settings Dishwashers", href: "/category/large-appliances/dishwashers/12-place-settings" },
        { name: "14 Place Settings Dishwashers", href: "/category/large-appliances/dishwashers/14-place-settings" },
        { name: "16 Place Settings Dishwashers", href: "/category/large-appliances/dishwashers/16-place-settings" },
        { name: "Free Standing Dishwashers", href: "/category/large-appliances/dishwashers/free-standing" },
        { name: "Built-in Dishwashers", href: "/category/large-appliances/dishwashers/built-in" },
      ],
      brands: [
        { name: "Bosch", href: "/category/brand/dishwashers/bosch" },
        { name: "IFB", href: "/category/brand/dishwashers/ifb" },
        { name: "LG", href: "/category/brand/dishwashers/lg" },
        { name: "Siemens", href: "/category/brand/dishwashers/siemens" },
        { name: "Faber", href: "/category/brand/dishwashers/faber" },
        { name: "Voltas Beko", href: "/category/brand/dishwashers/voltas-beko" },
      ],
    },
    {
      key: "def-laptop",
      title: "Laptops & Computers",
      brandTitle: "Laptop Brands",
      items: [
        { name: "Laptops", href: "/category/computers-laptops/laptops" },
        { name: "Gaming Laptops", href: "/category/computers-laptops/gaming-laptops" },
        { name: "Thin & Light Laptops", href: "/category/computers-laptops/thin-light-laptops" },
        { name: "Student Laptops", href: "/category/computers-laptops/student-laptops" },
        { name: "Business Laptops", href: "/category/computers-laptops/business-laptops" },
        { name: "All-in-One PCs", href: "/category/computers-laptops/all-in-one-pcs" },
        { name: "Desktop Computers", href: "/category/computers-laptops/desktop-computers" },
      ],
      brands: [
        { name: "HP", href: "/category/brand/computers-laptops/hp" },
        { name: "Dell", href: "/category/brand/computers-laptops/dell" },
        { name: "Lenovo", href: "/category/brand/computers-laptops/lenovo" },
        { name: "Asus", href: "/category/brand/computers-laptops/asus" },
        { name: "Apple", href: "/category/brand/computers-laptops/apple" },
        { name: "Acer", href: "/category/brand/computers-laptops/acer" },
        { name: "MSI", href: "/category/brand/computers-laptops/msi" },
        { name: "Samsung", href: "/category/brand/computers-laptops/samsung" },
      ],
    },
    {
      key: "def-mobiles",
      title: "Mobile Phones & Tablets",
      brandTitle: "Mobile Brands",
      items: [
        { name: "5G Mobile Phones", href: "/category/mobiles-accessories/5g-mobiles" },
        { name: "Android Smartphones", href: "/category/mobiles-accessories/android-smartphones" },
        { name: "iPhones", href: "/category/mobiles-accessories/iphones" },
        { name: "Feature Phones", href: "/category/mobiles-accessories/feature-phones" },
        { name: "Tablets", href: "/category/mobiles-accessories/tablets" },
        { name: "iPads", href: "/category/mobiles-accessories/ipads" },
        { name: "Smartwatches", href: "/category/mobiles-accessories/smartwatches" },
      ],
      brands: [
        { name: "Apple", href: "/category/brand/mobiles-accessories/apple" },
        { name: "Samsung", href: "/category/brand/mobiles-accessories/samsung" },
        { name: "OnePlus", href: "/category/brand/mobiles-accessories/oneplus" },
        { name: "Vivo", href: "/category/brand/mobiles-accessories/vivo" },
        { name: "Oppo", href: "/category/brand/mobiles-accessories/oppo" },
        { name: "Realme", href: "/category/brand/mobiles-accessories/realme" },
        { name: "Xiaomi", href: "/category/brand/mobiles-accessories/xiaomi" },
        { name: "Motorola", href: "/category/brand/mobiles-accessories/motorola" },
        { name: "Nothing", href: "/category/brand/mobiles-accessories/nothing" },
      ],
    },
    {
      key: "def-kitchen",
      title: "Kitchen Appliances",
      brandTitle: "Kitchen Appliance Brands",
      items: [
        { name: "Mixer Grinders", href: "/category/small-appliances/mixer-grinders" },
        { name: "Microwave Ovens", href: "/category/small-appliances/microwave-ovens" },
        { name: "Air Fryers", href: "/category/small-appliances/air-fryers" },
        { name: "Induction Cooktops", href: "/category/small-appliances/induction-cooktops" },
        { name: "Water Purifiers", href: "/category/small-appliances/water-purifiers" },
        { name: "Electric Kettles", href: "/category/small-appliances/electric-kettles" },
        { name: "Kitchen Chimneys", href: "/category/small-appliances/chimneys" },
        { name: "Gas Stoves", href: "/category/small-appliances/gas-stoves" },
      ],
      brands: [
        { name: "Philips", href: "/category/brand/small-appliances/philips" },
        { name: "Prestige", href: "/category/brand/small-appliances/prestige" },
        { name: "Butterfly", href: "/category/brand/small-appliances/butterfly" },
        { name: "Preethi", href: "/category/brand/small-appliances/preethi" },
        { name: "Faber", href: "/category/brand/small-appliances/faber" },
        { name: "Kent", href: "/category/brand/small-appliances/kent" },
        { name: "Bosch", href: "/category/brand/small-appliances/bosch" },
        { name: "Crompton", href: "/category/brand/small-appliances/crompton" },
        { name: "Bajaj", href: "/category/brand/small-appliances/bajaj" },
      ],
    },
    {
      key: "def-home",
      title: "Home Appliances",
      brandTitle: "Home Appliance Brands",
      items: [
        { name: "Vacuum Cleaners", href: "/category/small-appliances/vacuum-cleaners" },
        { name: "Water Heaters (Geysers)", href: "/category/small-appliances/water-heaters" },
        { name: "Air Coolers", href: "/category/small-appliances/air-coolers" },
        { name: "Ceiling Fans", href: "/category/small-appliances/ceiling-fans" },
        { name: "Irons & Garment Steamers", href: "/category/small-appliances/irons" },
        { name: "Voltage Stabilizers", href: "/category/small-appliances/voltage-stabilizers" },
      ],
      brands: [
        { name: "Havells", href: "/category/brand/small-appliances/havells" },
        { name: "Crompton", href: "/category/brand/small-appliances/crompton" },
        { name: "Bajaj", href: "/category/brand/small-appliances/bajaj" },
        { name: "Philips", href: "/category/brand/small-appliances/philips" },
        { name: "Usha", href: "/category/brand/small-appliances/usha" },
        { name: "V-Guard", href: "/category/brand/small-appliances/v-guard" },
      ],
    },
    {
      key: "def-audio",
      title: "Audio & Sound",
      brandTitle: "Audio Brands",
      items: [
        { name: "Bluetooth Speakers", href: "/category/mobiles-accessories/bluetooth-speakers" },
        { name: "Soundbars", href: "/category/televisions/soundbars" },
        { name: "Home Theatres", href: "/category/televisions/home-theatres" },
        { name: "Truly Wireless Earbuds", href: "/category/mobiles-accessories/true-wireless-earbuds" },
        { name: "Neckbands", href: "/category/mobiles-accessories/neckbands" },
        { name: "Headphones", href: "/category/mobiles-accessories/headphones" },
      ],
      brands: [
        { name: "Sony", href: "/category/brand/mobiles-accessories/sony" },
        { name: "JBL", href: "/category/brand/mobiles-accessories/jbl" },
        { name: "boAt", href: "/category/brand/mobiles-accessories/boat" },
        { name: "Bose", href: "/category/brand/mobiles-accessories/bose" },
        { name: "Marshall", href: "/category/brand/mobiles-accessories/marshall" },
        { name: "Noise", href: "/category/brand/mobiles-accessories/noise" },
      ],
    },
    {
      key: "def-personal",
      title: "Personal Care",
      brandTitle: "Personal Care Brands",
      items: [
        { name: "Hair Dryers", href: "/category/small-appliances/hair-dryers" },
        { name: "Hair Straighteners", href: "/category/small-appliances/hair-straighteners" },
        { name: "Beard Trimmers", href: "/category/small-appliances/trimmers" },
        { name: "Shavers", href: "/category/small-appliances/shavers" },
      ],
      brands: [
        { name: "Philips", href: "/category/brand/small-appliances/philips" },
        { name: "Havells", href: "/category/brand/small-appliances/havells" },
        { name: "Vega", href: "/category/brand/small-appliances/vega" },
        { name: "Braun", href: "/category/brand/small-appliances/braun" },
      ],
    },
  ];

  // Helper to find fallback section by name
  const findFallbackSection = (title) => {
    const lower = String(title || "").toLowerCase();
    return DEFAULT_SEO_SECTIONS.find((s) => {
      const sLower = s.title.toLowerCase();
      const firstWord = sLower.split(" ")[0];
      return lower.includes(firstWord) || sLower.includes(lower) || lower.includes(sLower);
    });
  };

  // Prepare normalized sections for rendering SEO category & brand directory:
  // - For Large Appliances: one block per subcategory (Refrigerator, Washing Machine, Air Conditioner, Dishwasher, etc.)
  //   with format: subcategory name -> products / children, and subcategory name brands -> brands.
  // - For others: category name -> subcategories / products, and category name brands -> brands.
  const prepareFooterSections = (grouped) => {
    if (!grouped || !Array.isArray(grouped.main) || grouped.main.length === 0) {
      return DEFAULT_SEO_SECTIONS;
    }

    const sections = [];
    const LARGE_SET = new Set([
      "dishwasher",
      "air conditioner",
      "washing machine",
      "refrigerator",
    ]);

    grouped.main.forEach((mainCat) => {
      const subs = grouped.subs[mainCat._id] || [];
      const mainName = (mainCat.category_name || "").toLowerCase();

      if (mainName.includes("large appliance")) {
        subs.forEach((subcat) => {
          const children = grouped.subs[subcat._id] || [];
          const brands =
            (Array.isArray(subcat.brands) && subcat.brands.length
              ? subcat.brands
              : mainCat.brands) || [];

          const fallback = findFallbackSection(subcat.category_name);

          const items =
            children.length > 0
              ? children.map((c) => ({
                  key: `child-${c._id}`,
                  name: c.category_name,
                  href: `/category/${mainCat.category_slug}/${subcat.category_slug}/${c.category_slug}`,
                }))
              : fallback?.items || [
                  {
                    key: `sub-${subcat._id}`,
                    name: subcat.category_name,
                    href: `/category/${mainCat.category_slug}/${subcat.category_slug}`,
                  },
                ];

          const brandList =
            brands.length > 0
              ? brands.map((b) => ({
                  key: `b-${b._id || b.brand_slug}`,
                  name: b.brand_name || b,
                  href: `/category/brand/${subcat.category_slug || mainCat.category_slug}/${b.brand_slug || String(b.brand_name || b).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                }))
              : fallback?.brands || [];

          sections.push({
            key: `la-${subcat._id}`,
            title: subcat.category_name,
            brandTitle: `${subcat.category_name} Brands`,
            items,
            brands: brandList,
          });
        });
      } else {
        const fallback = findFallbackSection(mainCat.category_name);
        const brands = mainCat.brands || [];

        const items =
          subs.length > 0
            ? subs.map((s) => ({
                key: `sub-${s._id}`,
                name: s.category_name,
                href: `/category/${mainCat.category_slug}/${s.category_slug}`,
              }))
            : fallback?.items || [];

        const brandList =
          brands.length > 0
            ? brands.map((b) => ({
                key: `b-${b._id || b.brand_slug}`,
                name: b.brand_name || b,
                href: `/category/brand/${mainCat.category_slug}/${b.brand_slug || String(b.brand_name || b).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              }))
            : fallback?.brands || [];

        sections.push({
          key: `def-${mainCat._id}`,
          title: mainCat.category_name,
          brandTitle: `${mainCat.category_name} Brands`,
          items,
          brands: brandList,
        });
      }
    });

    return sections.length > 0 ? sections : DEFAULT_SEO_SECTIONS;
  };

  const preparedSections = useMemo(
    () => prepareFooterSections(groupedCategories),
    [groupedCategories]
  );

  return (
    <>
        <footer className="bg-white overflow-hidden w-full max-w-full">
          {/* TOP FEATURES */}
          <div className="py-3 bg-gray-50">
            <div className="container mx-auto px-4 lg:max-w-[1400px] lg:px-2 min-[1440px]:max-w-[1600px] min-[1440px]:px-1 min-[2560px]:max-w-[2200px] min-[2560px]:px-1 min-[3840px]:max-w-[3200px] min-[3840px]:px-0">

              <div className="w-full lg:w-12/12 mx-auto bg-white rounded-2xl shadow-xl px-6 py-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

                  {/* Item 1 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoShieldCheckmark className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        100% Original Products
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Authorized Brand Partner
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoShieldCheckmark className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        2 Year Warranty
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        On Select Products
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <TbTruckDelivery className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Fast Delivery
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Across Tamil Nadu
                      </p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoReload className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Easy Returns
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Hassle Free
                      </p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-center gap-3 px-6 lg:border-r border-gray-200">
                    <IoStorefront className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        Best Prices
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Top Brands
                      </p>
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-center gap-3 px-6">
                    <IoCardOutline className="text-3xl text-blue-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-[#041b4d] text-sm whitespace-nowrap">
                        No Cost EMI
                      </h4>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        Easy EMI
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* WHITE FOOTER */}
          <div className="container mx-auto px-4 py-3 lg:max-w-[1400px] lg:px-2 min-[1440px]:max-w-[1600px] min-[1440px]:px-1 min-[2560px]:max-w-[2200px] min-[2560px]:px-1 min-[3840px]:max-w-[3200px] min-[3840px]:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT LOGO SECTION */}
              <div className="lg:col-span-3 lg:border-r border-gray-200 lg:pr-8">
                <Image
                  src="/user/bea-new.png"
                  alt="Bharath Electronics & Appliances"
                  width={150}
                  height={70}
                />

                <p className="text-gray-600 mt-4 text-sm leading-6">
                  Bharath Electronics & Appliances – Trusted by lakhs of customers for the best brands, unbeatable prices and reliable services.
                </p>

                <div className="mt-5 space-y-3 text-sm text-gray-600">

                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-blue-600 text-lg mt-1 shrink-0" />
                    <p>
                      26/1 Dr. Alagappa Chettiyar Rd, Tatabad,
                      Near Kovai Scan Centre, Coimbatore - 641012,
                      Tamil Nadu
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPhone className="text-blue-600 text-lg" />
                    <a
                      href="tel:9842344323"
                      className="text-blue-600 hover:text-blue-600"
                    >
                      9842344323
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiMail className="text-blue-600 text-lg shrink-0" />

                    <a
                      href="mailto:customercare@bharathelectronics.in"
                      className="text-blue-600 hover:text-blue-600 break-all"
                    >
                      customercare@bharathelectronics.in
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiClock className="text-blue-600 text-lg" />
                    <p>Mon - Sun : 10:00 AM - 09:00 PM</p>
                  </div>

                </div>
              </div>

              {/* MIDDLE SECTION */}
              <div className="lg:col-span-7 lg:border-r border-gray-200 lg:pr-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                  {/* SHOP BY CATEGORY */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      SHOP BY CATEGORY
                    </h3>

                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>

                    <ul className="space-y-2 text-gray-600 text-sm">
                      {groupedCategories.main.slice(0,8).map((cat) => (
                        <li key={cat._id}>
                          <Link href={`/category/${cat.category_slug}`}>
                            {cat.category_name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href="/open-box">
                          Open Box Deal
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* CUSTOMER SERVICE */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      CUSTOMER SERVICE
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>

                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li><Link href="/shipping">Shipping & Delivery Policy</Link></li>
                      <li><Link href="/cancellation-refund-policy">Cancellation & Refund Policy</Link></li>
                      <li><Link href="/feedback">Customer Support & feedback centre</Link></li>
                      <li><Link href="/contact">Contact</Link></li>
                      <li><Link href="/live-video-demo">Live Video Demo</Link></li>
                      <li><Link href="/bulk-orders-and-gift-card-enquiry">B2B / Corporate Enquiries</Link></li>
                      <li><Link href="/bajaj-finance">Bajaj Finance EMI</Link></li>
                    </ul>
                  </div>

                  {/* COMPANY */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      COMPANY
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li><Link href="/aboutus">About Us</Link></li>
                      <li><Link href="/blog">Blog</Link></li>
                      <li><Link href="/careers">Careers</Link></li>
                      <li><Link href="/location">Our Stores</Link></li>
                      <li><Link href="/loyalty">Loyalty Points</Link></li>
                    </ul>
                  </div>

                  {/* MY ACCOUNT */}
                  <div>
                    <h3 className="font-bold text-[#041b4d] text-sm uppercase">
                      MY ACCOUNT
                    </h3>
                    <div className="w-8 h-[2px] bg-blue-600 mt-2 mb-3"></div>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      {isLoggedIn ? (
                        <>
                          <li><Link href="/order">My Orders</Link></li>
                          <li>
                            <button onClick={handleLogout}>
                              Logout
                            </button>
                          </li>
                        </>
                      ) : (
                        <li>
                          <button onClick={() => setShowAuthModal(true)}>
                            Sign In / Register
                          </button>
                        </li>
                      )}
                      <li><Link href="/orders">My Orders</Link></li>
                      <li><Link href="/wishlist">Wishlist</Link></li>
                    </ul>
                  </div>

                </div>
              </div>

              {/* RIGHT SOCIAL SECTION */}
              <div className="lg:col-span-2">
                <h3 className="font-bold text-[#041b4d] mb-4">
                  CONNECT WITH US
                </h3>
                <p className="text-gray-600 mt-2 text-sm leading-6">
                  Stay Connected for the latest offers & updates
                </p>
                <div className="flex gap-4 text-xl mb-6 mt-5">
                  <Link href="https://web.whatsapp.com/send?phone=919842344323&text=Hi" aria-label="Chat on WhatsApp" title="Chat on WhatsApp" target="_blank" rel="noopener noreferrer">
                    <FaWhatsapp className="text-green-500" aria-hidden="true" />
                  </Link>
                  <Link href="https://www.facebook.com/BharathElectronics/" aria-label="Facebook" title="Facebook" target="_blank" rel="noopener noreferrer">
                    <FaFacebookF className="text-blue-600" aria-hidden="true" />
                  </Link>
                  <Link href="https://www.instagram.com/bharathelectronics/" aria-label="Instagram" title="Instagram" target="_blank" rel="noopener noreferrer">
                    <FaInstagram className="text-pink-500" aria-hidden="true" />
                  </Link>
                  <Link href="https://www.youtube.com/@bharathelectronicsandapplian" aria-label="YouTube" title="YouTube" target="_blank" rel="noopener noreferrer">
                    <FaYoutube className="text-red-500" aria-hidden="true" />
                  </Link>
                  <Link href="https://twitter.com/bharath_bea" aria-label="X (Twitter)" title="X (Twitter)" target="_blank" rel="noopener noreferrer">
                    <FaXTwitter aria-hidden="true" />
                  </Link>
                  <Link href="https://in.linkedin.com/company/bharath-electronics-and-appliances" aria-label="LinkedIn" title="LinkedIn" target="_blank" rel="noopener noreferrer">
                    <FaLinkedinIn className="text-blue-700" aria-hidden="true" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

{/* DARK BLUE CATEGORY FOOTER */}
<div className="bg-[#041b4d] text-white py-10 overflow-x-hidden lg:overflow-visible">
  <div className="container mx-auto px-2 sm:px-3 lg:max-w-[1400px] lg:px-1 min-[1440px]:max-w-[1600px] min-[1440px]:px-0.5 min-[2560px]:max-w-[2200px] min-[2560px]:px-1 min-[3840px]:max-w-[3200px] min-[3840px]:px-0">

    {/* lg (1024): compact; 1440–2K: wider categories/brands, capped Truco width */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[repeat(6,minmax(0,4.25rem))_minmax(155px,170px)_minmax(310px,1fr)] xl:grid-cols-[repeat(6,minmax(0,6.75rem))_minmax(180px,200px)_minmax(300px,1fr)] min-[1440px]:grid-cols-[repeat(6,minmax(0,9rem))_minmax(210px,240px)_minmax(300px,380px)] min-[2560px]:grid-cols-[repeat(6,minmax(0,12rem))_minmax(250px,290px)_minmax(340px,440px)] min-[3840px]:grid-cols-[repeat(6,minmax(0,14rem))_minmax(280px,320px)_minmax(380px,480px)] gap-y-10 gap-x-3 lg:gap-x-4 xl:gap-x-5 min-[1440px]:gap-x-6 min-[2560px]:gap-x-8 text-sm">

      {groupedCategories.main.slice(0, 5).map((main) => {
        const Icon =
          categoryIcons[main.category_name?.toUpperCase()] || MapPin;

        return (
          <div
            key={main._id}
            className="lg:border-r border-[#14346d] px-2 lg:px-2 xl:px-4 min-[1440px]:px-3 min-[2560px]:px-4 min-w-0"
          >
           <h4 className="flex items-center gap-2 font-semibold uppercase mb-4 flex-wrap">
  <Icon size={18} className="shrink-0" />
  <span className="text-[13px] leading-snug">{main.category_name}</span>
</h4>

            <ul className="space-y-2 text-gray-300 text-sm">
              {(groupedCategories.subs[main._id] || [])
                .slice(
                  0,
                  main.category_name?.toLowerCase().includes("small appliance") ? 3 : 5
                )
                .map((sub) => (
                  <li
                    key={sub._id}
  className="hover:text-white transition-colors"
>
                    <Link
                      href={`/category/${main.category_slug}/${sub.category_slug}`}
                    >
                      {sub.category_name}
                    </Link>
                  </li>
                ))}

              <li className="whitespace-nowrap">
                <Link
                  href={`/category/${main.category_slug}`}
                  className="text-blue-300 hover:text-white transition-colors"
                >
                  View All →
                </Link>
              </li>
            </ul>
          </div>
        );
      })}

      {/* Top Brands */}
      <div className="lg:border-r border-[#14346d] px-2 lg:px-2 xl:px-4 min-[1440px]:px-3 min-[2560px]:px-4 min-w-0">
        <h4 className="font-semibold uppercase mb-4 whitespace-nowrap">
          Top Brands
        </h4>

        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">LG</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Samsung</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Sony</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Whirlpool</li>
          <li className="whitespace-nowrap hover:text-white transition-colors cursor-pointer">Bosch</li>
        </ul>
      </div>

      {/* Our Location — fixed track width; content fills it */}
      <div className="sm:col-span-2 lg:col-span-1 lg:border-r border-[#14346d] px-2 lg:px-3 min-w-0">
        <div className="w-full">
          <h4 className="font-semibold uppercase mb-4 whitespace-nowrap">
            Our Location
          </h4>

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d391.02517849236526!2d76.9626592!3d11.0194039!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8585cc4962b87%3A0x38eddb57f0f66203!2sBharath%20Electronics%20%26%20Appliances!5e0!3m2!1sen!2sin!4v1740660808642!5m2!1sen!2sin"
            width="100%"
            height="110"
            className="w-full"
            style={{ border: 0, borderRadius: '6px', display: 'block' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps - Bharath Electronics & Appliances Location"
          />

          <a
            href="https://maps.app.goo.gl/aceBM5ztAjNQLx217"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 text-sm mt-3 inline-block whitespace-nowrap hover:text-white transition-colors"
          >
            View on Google Maps →
          </a>
        </div>
      </div>

      {/* Our App Section — baseline at lg (1024); 1440–2K: capped width, tight text↔phone gap */}
      <div className="sm:col-span-2 lg:col-span-1 px-2 lg:px-3 lg:pr-0 min-w-0 lg:min-w-[310px] xl:min-w-0 flex items-start justify-start gap-2 lg:gap-3 min-[1440px]:gap-2 min-[2560px]:gap-3 overflow-visible min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] min-[1440px]:min-h-[220px] min-[2560px]:min-h-[260px] py-1">
        <div className="relative z-10 flex flex-col justify-start min-w-0 flex-none w-auto max-w-[58%] lg:max-w-[55%] min-[1440px]:max-w-[58%] lg:-translate-x-3 min-[1440px]:-translate-x-1">
          <h4 className="text-white leading-tight mb-3 min-[1440px]:mb-3 min-[2560px]:mb-4">
            <span className="block text-[12px] lg:text-[13px] min-[1440px]:text-[15px] min-[2560px]:text-[18px] font-medium w-fit whitespace-nowrap">
               Download
            </span>
            <span className="block text-2xl min-[1440px]:text-3xl min-[2560px]:text-4xl font-extrabold mt-1 pb-1.5 w-fit whitespace-nowrap">
              <span className="relative inline-block pb-1.5 min-[1440px]:pb-2">
                BEA
                <span className="absolute left-0 bottom-0 h-[2px] min-[1440px]:h-[3px] min-[2560px]:h-[4px] w-full bg-[#3B82F6] rounded-full" />
              </span>
              {" "}TRUCO App
            </span>
          </h4>
          <p className="text-gray-300 text-[11px] lg:text-xs min-[1440px]:text-sm min-[2560px]:text-base leading-relaxed mb-3 min-[1440px]:mb-3 min-[2560px]:mb-4">
            Rewards, exclusive offers &amp; order tracking —<br /> always in your pocket.
          </p>

          <div className="flex flex-nowrap items-center gap-2 min-[1440px]:gap-2 min-[2560px]:gap-3 mt-auto">
            <Link
              href="https://play.google.com/store/apps/details?id=com.avaniko.truco&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/uploads/GooglePlayDark.png"
                alt="Get it on Google Play"
                width={110}
                height={32}
                className="object-contain rounded h-7 lg:h-8 min-[1440px]:h-9 min-[2560px]:h-11 w-auto"
              />
            </Link>
            <Link
              href="https://apps.apple.com/in/app/bea-truco/id6751942292"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/uploads/AppStoreDark.png"
                alt="Download on the App Store"
                width={110}
                height={32}
                className="object-contain rounded h-7 lg:h-8 min-[1440px]:h-9 min-[2560px]:h-11 w-auto"
              />
            </Link>
          </div>
        </div>

        <div className="shrink-0 self-start pointer-events-none lg:translate-x-2 min-[1440px]:translate-x-4 min-[2560px]:translate-x-5">
          <img
            src="/uploads/mobiletruco.png"
            alt="BEA Mobile App Mockup"
            width={120}
            height={160}
            className="object-contain drop-shadow-xl w-[85px] sm:w-[95px] lg:w-[115px] min-[1440px]:w-[140px] min-[2560px]:w-[175px] h-auto"
          />
        </div>
      </div>
    </div>
  </div>
</div>

          {/* SEO CATEGORY & BRAND DIRECTORY */}
          <div className="bg-[#02133a] border-t border-[#0e2c69] text-gray-400 py-6 sm:py-8 text-xs overflow-hidden w-full">
            <div className="container mx-auto px-3 sm:px-4 lg:max-w-[1400px] lg:px-2 min-[1440px]:max-w-[1600px] min-[1440px]:px-1 min-[2560px]:max-w-[2200px] min-[2560px]:px-1 min-[3840px]:max-w-[3200px] min-[3840px]:px-0 w-full max-w-full">
              <div className="space-y-4 w-full">
                {preparedSections.map((sec, idx) => (
                  <div key={sec.key || `seo-sec-${idx}`} className="text-[11px] sm:text-xs leading-relaxed break-words [overflow-wrap:anywhere]">
                    {/* Subcategory / Category Name: Products */}
                    {sec.items && sec.items.length > 0 && (
                      <p className="text-gray-400 break-words [overflow-wrap:anywhere]">
                        <span className="font-semibold text-white">
                          {sec.title}:
                        </span>{" "}
                        {sec.items.map((item, i) => (
                          <span key={item.key || `item-${i}`} className="inline">
                            <Link
                              href={item.href}
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {item.name}
                            </Link>
                            {i < sec.items.length - 1 && (
                              <span className="text-gray-600 mx-1.5">|</span>
                            )}
                            {" "}
                          </span>
                        ))}
                      </p>
                    )}

                    {/* Subcategory Name that's Brand: Brands */}
                    {sec.brands && sec.brands.length > 0 && (
                      <p className="text-gray-400 mt-1 break-words [overflow-wrap:anywhere]">
                        <span className="font-semibold text-white">
                          {sec.brandTitle || `${sec.title} Brands`}:
                        </span>{" "}
                        {sec.brands.map((brand, i) => (
                          <span key={brand.key || `brand-${i}`} className="inline">
                            <Link
                              href={brand.href}
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {brand.name}
                            </Link>
                            {i < sec.brands.length - 1 && (
                              <span className="text-gray-600 mx-1.5">|</span>
                            )}
                            {" "}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#02133a] border-t border-[#0d2a6b] text-gray-300 py-4">
            <div className="container mx-auto px-3 sm:px-4 lg:max-w-[1400px] lg:px-2 min-[1440px]:max-w-[1600px] min-[1440px]:px-1 min-[2560px]:max-w-[2200px] min-[2560px]:px-1 min-[3840px]:max-w-[3200px] min-[3840px]:px-0 flex flex-col md:flex-row items-center justify-between gap-4">

              {/* Left Side */}
              <div className="flex items-center gap-3 text-sm">
                <div className="text-xl">🔒</div>
                <div>
                  <p className="font-medium text-white">Secure Payments</p>
                  <p className="text-xs text-gray-400">
                    Your data is protected with 256-bit encryption
                  </p>
                </div>
              </div>

              {/* Center */}
              <div className="text-center text-sm">
                <p>© 2026 Bharath Electronics & Appliances. All Rights Reserved.</p>

                <div className="flex justify-center gap-4 mt-1 text-xs">
                  <Link href="/terms-and-condition" className="hover:text-white">
                    Terms & Conditions
                  </Link>
                  <span>|</span>
                  <Link href="/privacypolicy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                  {/* <span>|</span>
                  <Link href="/sitemap" className="hover:text-white">
                    Sitemap
                  </Link> */}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4 shrink-0">
                <img
                  src="/uploads/payment.png"
                  alt="Accepted payment methods"
                  className="h-7 sm:h-7 lg:h-8 w-auto max-w-[200px] sm:max-w-[220px] lg:max-w-[240px] object-contain"
                  width={240}
                  height={32}
                />
              </div>

            </div>
          </div>
        </footer>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#677279] rounded-lg p-8 w-96 max-w-full relative">
            <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setFormError('');
                  setError('');
                }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close login dialog"
            >
              ×
            </button>
            <div className="flex gap-4 mb-6 border-b">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => { setActiveTab('login'); setShowPassword(false); }}
              >
                Login
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'register'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => { setActiveTab('register'); setShowPassword(false); }}
              >
                Register
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <>
                  <label htmlFor="footer-auth-name" className="sr-only">Name</label>
                  <input
                    id="footer-auth-name"
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </>
              )}
              <label htmlFor="footer-auth-email" className="sr-only">Email</label>
              <input
                id="footer-auth-email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {activeTab === 'register' && (
                <>
                  <label htmlFor="footer-auth-mobile" className="sr-only">Mobile</label>
                  <input
                    id="footer-auth-mobile"
                    type="tel"
                    placeholder="Mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </>
              )}
              <label htmlFor="footer-auth-password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="footer-auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              
              {(formError || error) && (
                <div className="text-red-500 text-sm">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-blue-500 text-[#677279] py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200"
              >
                {loadingAuth ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default Footer;
//footer bharath 