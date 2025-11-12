// components/Header.jsx
'use client';
import { motion } from 'framer-motion';
import Link from "next/link";
import Image from 'next/image';
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiUser, FiMenu, FiX, FiPhoneCall, FiMessageSquare } from "react-icons/fi";
import { FaBars, FaShoppingBag, FaUserShield } from "react-icons/fa";
import { FaHeart, FaShoppingCart, FaSearch } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { IoLogOut } from "react-icons/io5";
import { FaCircleChevronLeft, FaCircleChevronRight, FaLocationDot, FaPhone } from "react-icons/fa6";
import { useCart } from '@/context/CartContext';
import { useWishlist } from "@/context/WishlistContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { useRouter, usePathname } from 'next/navigation';
import { Play } from "lucide-react";
import { Navigation } from 'swiper/modules';
import SideNavbar from '@/components/sideNavbar';
import { useHeaderdetails } from "@/context/HeaderContext";
const Header = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [category, setCategory] = useState('All Categories');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { wishlistCount } = useWishlist();
    const { cartCount, updateCartCount } = useCart();
    const handleCategoryClick = useCallback((categorySlug, categoryName) => {
        const path = `/category/${categorySlug}`;
        setSelectedCategory(categoryName);
        setIsMobileMenuOpen(false);
        router.push(path);
    }, [router]);
    const dropdownRef = useRef(null);
    const [activeTab, setActiveTab] = useState('login');
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    // const [userData, setUserData] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);
    const { userData, isLoggedIn, setIsLoggedIn, setUserData, isAdmin, setIsAdmin } = useHeaderdetails();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [searchQuery, setSearchQuery] = useState("");
    const [placeholder, setPlaceholder] = useState("");
    const [words, setWords] = useState([]);
    const [categorieslist, setCategorieslist] = useState([]);
    const wordIndex = useRef(0);
    const charIndex = useRef(0);
    const isDeleting = useRef(false);

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch("/api/categories/get");
          const data = await response.json();
          setCategorieslist(data);
          setWords(data.map((cat) => cat.category_name));
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };

      fetchCategories();
    }, []);

    useEffect(() => {
      const typeEffect = () => {
        if (words.length === 0) return;

        const currentWord = words[wordIndex.current];
        const updatedText = isDeleting.current
          ? currentWord.substring(0, charIndex.current - 1)
          : currentWord.substring(0, charIndex.current + 1);

        setPlaceholder(updatedText);

        charIndex.current = isDeleting.current
          ? charIndex.current - 1
          : charIndex.current + 1;

        if (!isDeleting.current && charIndex.current === currentWord.length) {
          isDeleting.current = true;
          setTimeout(typeEffect, 1000); // pause before deleting
        } else if (isDeleting.current && charIndex.current === 0) {
          isDeleting.current = false;
          wordIndex.current = (wordIndex.current + 1) % words.length;
          setTimeout(typeEffect, 500); // pause before typing next
        } else {
          setTimeout(typeEffect, isDeleting.current ? 60 : 100);
        }
      };

      typeEffect();
    }, [words]);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const { headerdetails, updateHeaderdetails } = useHeaderdetails();

    const [offers, setOffers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [dropdownLeft, setDropdownLeft] = useState(0);
    const [dropdownTop, setDropdownTop] = useState(0);
    const slideRefs = useRef({});
    const [suggestions, setSuggestions] = useState([]);
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    // Track step
    const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter OTP and new password
    const [resetStep, setResetStep] = useState(1);// 1: enter email, 2: enter OTP, 3: new password
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    // OTP input
    const [forgotOTP, setForgotOTP] = useState('');

    // New password inputs
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Close mobile menu when clicking outside

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
        
    }, []);

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
                if (data.role == "admin") {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setUserData(data.user);
            } else {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
        }
    };

    // ... (keep all your existing state declarations)

    // Add this search handler function
   const handleSearch = () => {

    if (!searchQuery.trim() && selectedCategory === "All Categories") return;

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("query", searchQuery.trim());
    if (selectedCategory !== "All Categories") {
      params.append("category", selectedCategory);
    }

    router.push(`/search?${params.toString()}`);
  };
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      const res = await fetch(`/api/search/suggestions?q=${searchQuery}`);
      const data = await res.json();
      setSuggestions(data);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  
    // Auto-search when typing (debounced)
    useEffect(() => {
      if (searchQuery.trim() || selectedCategory !== "All Categories") {
        const delayDebounce = setTimeout(() => {
          handleSearch();
        }, 500); // 500ms delay after typing stops
  
        return () => clearTimeout(delayDebounce);
      }
    }, [searchQuery, selectedCategory]);

    // Modify the search button to use the handler
    // Also make the search work when pressing Enter in the input field
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: ''
    });
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [formError, setFormError] = useState('');
    const [error, setError] = useState('');
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
            if (data.token) {
                localStorage.setItem('token', data.token);
                setIsLoggedIn(true);
                if (data.user.role == "admin") {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setUserData(data.user);
                setShowAuthModal(false);
                setFormData({
                    name: '',
                    email: '',
                    mobile: '',
                    password: ''
                });
                // Update cart count after login
                const cartResponse = await fetch('/api/cart/count', {
                    headers: {
                        'Authorization': `Bearer ${data.token}`
                    }
                });
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    updateCartCount(cartData.count);
                }
            } else {
                setShowAuthModal(true);
                setActiveTab('login');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAuth(false);
        }
    };
    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserData(null);
        updateCartCount(0); // Reset cart count on logout
    };

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const response = await fetch("/api/offers/get");
                const result = await response.json();

                // Process and format dates before setting state
                const activeOffers = result.data
                    .filter((offer) => offer.fest_offer_status === "active")
                setOffers(activeOffers);
            } catch (err) {
                console.error("Failed to fetch offers", err);
            }
        };
        fetchOffers();
    }, []);

    const hideTimeout = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories/get");
                const data = await response.json();

                // Keep only active categories
                const activeCategories = data.filter(cat => cat.status === "Active");

                const categoryMap = {};
                activeCategories.forEach((cat) => {
                    cat.subcategories = [];
                    categoryMap[cat._id] = cat;
                });

                const nestedCategories = [];
                activeCategories.forEach((cat) => {
                    if (cat.parentid === "none") {
                        nestedCategories.push(cat);
                    } else if (categoryMap[cat.parentid]) {
                        categoryMap[cat.parentid].subcategories.push(cat);
                    }
                });

                setCategories(nestedCategories);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };

        fetchCategories();
        checkAuthStatus();
    }, []);


    // Flatten tree, but skip the main "Large Appliances"
    // const flattenTree = (cat, rootCategory, level = 0) => {
    //     let result = [];
    //     result.push({ ...cat, rootCategory, level });

    //     if (cat.subcategories?.length > 0) {
    //         cat.subcategories.forEach(child => {
    //             result = result.concat(flattenTree(child, rootCategory, level + 1));
    //         });
    //     }
    //     return result;
    // };
const flattenTree = (cat, rootCategory, level = 0) => {
    let result = [];
    
    // Add the category itself
    result.push({ ...cat, rootCategory, level, type: 'category' });

    // Add subcategories
    if (cat.subcategories?.length > 0) {
        cat.subcategories.forEach(child => {
            result = result.concat(flattenTree(child, rootCategory, level + 1));
        });
    }
    
    return result;
};

    // Flatten all starting from actual visible categories (like Refrigerator, AC…)
const flattenAllCategories = (cats) => {
    let result = [];
    let allBrands = [];
    let brandCounter = 0; // Counter for unique keys
    
    cats.forEach(cat => {
        // Add the category and its subcategories
        result = result.concat(flattenTree(cat, cat.category_slug, 0));
        
        // Collect all brands from this category
        if (cat.brands && cat.brands.length > 0) {
            cat.brands.forEach(brand => {
                allBrands.push({
                    ...brand,
                    type: 'brand',
                    sourceCategory: cat.category_name,
                    uniqueKey: `${brand._id}-${cat._id}-${brandCounter++}` // Truly unique key
                });
            });
        }
    });
    
    // Add a single brands header at the end
    if (allBrands.length > 0) {
        result.push({
            _id: 'all-brands-header',
            type: 'brands-header',
            category_name: 'Brands',
            level: 0,
            uniqueKey: 'all-brands-header'
        });
        
        // Add all collected brands with unique keys
        result = result.concat(allBrands.map(brand => ({
            ...brand,
            level: 1,
            uniqueKey: brand.uniqueKey
        })));
    }
    
    return result;
};

    // 🔹 Split into columns (10 items max per column)
    // const chunkFlatList = (flatList, size = 15) => {
    //     const chunks = [];
    //     for (let i = 0; i < flatList.length; i += size) {
    //         chunks.push(flatList.slice(i, i + size));
    //     }
    //     return chunks;
    // };
const chunkFlatList = (flatList, size = 15) => {
    const chunks = [];
    
    // Find where brands section starts
    const brandsStartIndex = flatList.findIndex(item => item.type === 'brands-header');
    
    if (brandsStartIndex === -1) {
        // No brands, just chunk normally
        for (let i = 0; i < flatList.length; i += size) {
            chunks.push(flatList.slice(i, i + size));
        }
        return chunks;
    }
    
    // Chunk categories (before brands)
    for (let i = 0; i < brandsStartIndex; i += size) {
        chunks.push(flatList.slice(i, Math.min(i + size, brandsStartIndex)));
    }
    
    // Chunk brands (keep brands together in their own column(s))
    const brandsSection = flatList.slice(brandsStartIndex);
    const brandsPerColumn = 12; // Adjust as needed
    
    for (let i = 0; i < brandsSection.length; i += brandsPerColumn) {
        chunks.push(brandsSection.slice(i, i + brandsPerColumn));
    }
    
    return chunks;
};

    const cancelHide = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }
    };
    const startHide = (delay = 100) => {
        cancelHide();
        hideTimeout.current = setTimeout(() => {
            setHoveredCategory(null);
        }, delay);
    };
    const handleMouseEnter = (categoryId) => {
        cancelHide();
        const cat = categories.find((c) => c._id === categoryId);
        if (!cat) return;
        setHoveredCategory(cat);

        const el = slideRefs.current[categoryId];
        if (!el) return;

        const rect = el.getBoundingClientRect();
        // Using fixed positioning => use viewport coords (rect.left / rect.bottom)
        setDropdownLeft(rect.left);
        setDropdownTop(rect.bottom);
    };
    // After dropdown mounts, measure and adjust so it never overflows screen or hides under arrows
    useLayoutEffect(() => {
        if (!hoveredCategory || !dropdownRef.current) return;
        const ddRect = dropdownRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        let left = dropdownLeft;

        // If dropdown would overflow right edge, shift it left
        if (left + ddRect.width > screenWidth - 10) {
            left = Math.max(10, screenWidth - ddRect.width - 10);
        }

        // Ensure dropdown is at least after prev arrow
        const prevBtn = document.querySelector(".custom-swiper-prev");
        const prevRight = prevBtn?.getBoundingClientRect().right || 0;
        if (left < prevRight + 8) left = prevRight + 8;

        // Ensure dropdown doesn't go too far left
        if (left < 8) left = 8;
        if (left !== dropdownLeft) setDropdownLeft(left);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hoveredCategory, dropdownLeft]);

    // cleanup hide timeout on unmount
    useEffect(() => {
        return () => {
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
        };
    }, []);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    // Add this function to handle forgot password submission
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotPasswordError('');
        setForgotPasswordMessage('');
        setForgotPasswordLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset link');
            }
            setForgotPasswordMessage(data.message || 'Password reset link sent to your email');
        } catch (err) {
            setForgotPasswordError(err.message);
        } finally {
            setForgotPasswordLoading(false);
        }
    };
    // 🔹 Render flattened category item
const renderFlatItem = (item, hoveredCategory) => {

    // Use uniqueKey instead of _id for the key prop
    const itemKey = item.uniqueKey || item._id;
    
    if (item.type === 'brands-header') {
        return (
            <div key={itemKey} className="" style={{ paddingLeft: `${item.level * 12}px` }}>
                <h3 className="font-semibold text-sm text-blue-600 border-b border-gray-200 pb-1">
                    {item.category_name}
                </h3>
            </div>
        );
    }
    
    if (item.type === 'brand') {
        const href = `/category/brand/${encodeURIComponent(hoveredCategory.category_slug)}/${encodeURIComponent(item.brand_slug)}`;
        
        return (
            <div key={itemKey} style={{ paddingLeft: `${item.level * 12}px` }}>
                <Link
                    href={href}
                    className="flex items-center mb-1 text-sm text-[#8c8c8c] p-[5px] hover:text-[#0e54e6]"
                >
                    <span className="font-normal">{item.brand_name}</span>
                </Link>
            </div>
        );
    }
    
    // Original category rendering code
    const href = item.level === 0
        ? `/category/${encodeURIComponent(item.category_slug)}`
        : `/category/${encodeURIComponent(hoveredCategory.category_slug)}/${encodeURIComponent(item.rootCategory)}/${encodeURIComponent(item.category_slug)}`;

    return (
        <div key={itemKey} style={{ paddingLeft: `${item.level * 12}px` }}>
            <Link
                href={href}
                className={`flex items-center justify-between mb-1 text-sm ${item.level === 0
                        ? "font-semibold text-blue-600"
                        : "text-[#8c8c8c] !p-[5px] hover:text-[#0e54e6]"
                    }`}
            >
                <span className={item.level === 0 ? "font-bold" : "font-normal"}>
                    {item.category_name}
                </span>
                {item.level === 0 && (
                    <Play
                        size={14}
                        strokeWidth={0}
                        className="text-blue-600 fill-blue-600"
                    />
                )}
            </Link>
        </div>
    );
};

    return (
        <header className="sticky top-0 z-50">
            {/* Top Announcement Bar */}
            {/* {offers.some(
                (offer) => String(offer.fest_offer_status).trim().toLowerCase() === "active"
            ) ? (
                // ✅ Active offer banner
                <div className={`bg-customBlue text-yellow-300 px-4 py-1 overflow-hidden relative w-full ${isMobileMenuOpen ? 'hidden' : ''}`}>
                    <div className="relative w-full overflow-hidden h-6 flex items-center">
                        <motion.div initial={{ x: "100%" }} animate={{ x: "-100%" }} transition={{ ease: "linear", duration: 20, repeat: Infinity }} className="absolute whitespace-nowrap flex items-center space-x-8">
                            {offers
                                .filter((offer) => String(offer.fest_offer_status).trim().toLowerCase() === "active")
                                .map((offer, index) => (
                                    <span key={index} className="font-medium text-xs sm:text-sm">
                                        {offer.notes} {offer.percentage}% | Code:{" "}
                                        <strong>{offer.offer_code}</strong>
                                    </span>
                                ))
                            }
                        </motion.div>
                    </div>
                </div>
            ) : (
                // ❌ No active offers
                <div className={`bg-customBlue text-yellow-300 px-4 py-1 overflow-hidden relative w-full ${isMobileMenuOpen ? 'hidden' : ''}`}>
                    <div className="relative w-full overflow-hidden h-6 flex items-center">
                        <motion.div initial={{ x: "100%" }} animate={{ x: "-100%" }} transition={{ ease: "linear", duration: 20, repeat: Infinity }} className="absolute whitespace-nowrap flex items-center space-x-8">
                            <span className="font-medium text-xs sm:text-sm">
                                No current offers available — shop now and stay tuned for exciting discounts coming soon!
                            </span>
                        </motion.div>
                    </div>
                </div>
            )} */}

            {/* Main Header */}
            <div className={`${isMobileMenuOpen ? "fixed inset-0 mt-0 pt-0 z-50 overflow-y-auto" : "bg-white px-4 sm:px-6 md:px-6 py-1 sticky top-0 z-40"}`}>
                <div className="flex justify-between items-center">
                    {/* Mobile Menu Button (Hidden on desktop) */}
                    <div className="sm:hidden flex items-center justify-center w-full relative">
                        <button onClick={toggleMobileMenu} className="text-customBlue absolute left-0 z-50 p-2">
                            {isMobileMenuOpen ? <FiX size={28} /> : <FaBars size={28} />}
                        </button>
                        <Link href="/" className="bg-white p-1 rounded-lg mx-auto">
                            <img src="/user/bea-new.png" alt="Logo" className="h-auto" width={40} height={20} />
                        </Link>
                    </div>

                    {/* Logo (Hidden on mobile) */}
                    <div className="hidden sm:block mr-12 bg-white py-2 rounded-lg">
                        <Link href="/index" className="mx-auto">
                            <img src="/user/bea-new.png" alt="Logo" className="h-auto" width={100} height={30} />
                        </Link>
                    </div>

                    {/* Search Bar (Hidden on mobile - will show in mobile menu) */}
    <div className="relative hidden sm:flex flex-1 max-w-xl items-center bg-white rounded-lg shadow overflow-hidden !border !border-[#8c8c8c]">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-3 py-2 text-xs sm:text-sm text-gray-700 bg-gray-100 border-r border-gray-300 outline-none"
      >
        <option value="All Categories">All Categories</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat.category_name}>
            {cat.category_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder={placeholder || "Search products..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 px-3 py-2 text-sm outline-none"
      />

      <button className="px-3 text-customBlue" onClick={handleSearch}>
        <FaSearch />
      </button>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
          <div className="p-2 text-xs font-semibold text-gray-500">PRODUCTS</div>
          {suggestions.map((p) => (
            <Link
              key={p._id}
              href={`/product/${p.product_slug}`}
              className="flex items-center gap-2 p-2 hover:bg-gray-100"
            >
              <img
                src={p.product_image}
                alt={p.product_name}
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="text-sm font-medium text-gray-800">{p.product_name}</div>
                <div className="text-sm text-customBlue">Rs. {p.price}</div>
              </div>
            </Link>
          ))}
          <div
            onClick={handleSearch}
            className="block p-2 text-center text-sm text-customBlue hover:bg-gray-100 cursor-pointer"
          >
            View all results →
          </div>
        </div>
      )}
    </div>
                    {/* Icons Group */}
                    <div className="flex items-center gap-[2rem] sm:gap-4">
                        {/* Mobile Search Button (Hidden on desktop) */}
                        <button onClick={toggleMobileMenu} className="sm:hidden text-customBlue">
                            <FiSearch size={20} />
                        </button>

                        {/* Feedback Icon */}
                        <Link href="/feedback" className="hidden sm:flex items-center relative">
                            <FiMessageSquare size={18} className="text-customBlue" />
                        </Link>

                        {/* Contact Icon */}
                        <Link href="/contact" className="hidden sm:flex items-center relative">
                            <FiPhoneCall size={18} className="text-customBlue" />
                        </Link>

                        {/* Location (Hidden on mobile) */}
                        <Link href="/location" className="hidden sm:flex items-center relative">
                            <FiMapPin size={18} className="text-customBlue" />
                                {/* <span className="ml-1 text-xs sm:text-sm text-customBlue hidden lg:inline">Location</span> */}
                        </Link>

                        {/* Wishlist */}
                        <Link href="/wishlist" className="flex items-center relative p-1 sm:p-0">
                            <FiHeart size={18} className="text-customBlue" />
                            {/* {wishlistCount > 0 && ( */}
                                <span className="absolute -top-2 -right-2 text-[10px] bg-customBlue text-white rounded-full w-4 h-4 flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            {/* )} */}
                            {/* <span className="ml-1 text-xs sm:text-sm text-customBlue hidden lg:inline">Wishlist</span> */}
                        </Link>

                        {/* Cart */}
                        <Link href="/cart" className="flex items-center relative p-1 sm:p-0 ">
                            <FiShoppingCart size={18} className="text-customBlue" />
                            <span className="absolute -top-2 -right-2 text-[10px] bg-customBlue text-white rounded-full w-4 h-4 flex items-center justify-center">
                                {cartCount}
                            </span>
                            {/* <span className="ml-1 text-xs sm:text-sm text-customBlue hidden lg:inline">Cart</span> */}
                        </Link>

                        {/* User Account */}
                        <div className="relative" ref={dropdownRef}>
                            {isLoggedIn ? (
                                <>
                                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-black focus:outline-none p-1 sm:p-0">
                                        <FiUser size={18} className="text-customBlue" />
                                        <span className="ml-1 font-bold text-xs sm:text-sm text-customBlue hidden lg:inline">
                                            Hi, {userData?.name || userData?.username || "User"}
                                        </span>
                                    </button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-48 sm:w-56 bg-white rounded-xl shadow-xl z-50 transition-all">
                                            <div className="py-2 px-2">
                                                {isAdmin && (
                                                    <>
                                                        <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                                                            <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-customBlue text-white">
                                                                <FaUserShield className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            </span>
                                                            Admin Panel
                                                        </Link>
                                                    </>
                                                )}
                                                <Link href="/order" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-blue-50 transition-colors">
                                                    <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-customBlue text-white">
                                                        <FaShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </span>My Orders</Link>
                                                <hr className="my-2 border-gray-200" />
                                                <button onClick={handleLogout} className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-red-50 transition-colors">
                                                    <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-customBlue text-white">
                                                        <IoLogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    </span>Logout</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="flex items-center text-black p-1 sm:p-0">
                                    <FiUser size={18} className="text-customBlue" />
                                    {/* <span className="ml-1 font-bold text-xs sm:text-sm text-customBlue hidden lg:inline">Sign In</span> */}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu (Hidden on desktop) */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden bg-white fixed inset-0 z-50 p-4 rounded-lg shadow-lg overflow-y-auto transition-all duration-300"
                         style={{ touchAction: 'auto', userSelect: 'auto', WebkitUserSelect: 'auto' }}>
                        {/* Mobile Search Bar */}
                        <div className="flex items-center bg-gray-100 rounded-lg shadow overflow-hidden mb-4">
                            <input type="text" tabIndex={0} autoFocus placeholder={placeholder || "Search products..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyPress} className="flex-1 px-3 py-2 text-sm outline-none bg-white" />
                            <button className="px-3 text-customBlue" onClick={handleSearch} tabIndex={0}>
                                <FaSearch />
                            </button>
                        </div>
                        {/* Category List */}
                        <div className="mb-4">
                            <div className="font-bold mb-2 text-blue-700">Categories</div>
                            <nav className="space-y-2">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={`block w-full text-left px-2 py-1 rounded cursor-pointer ${selectedCategory === 'All Categories' ? 'bg-blue-100' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log('All categories clicked');
                                        setSelectedCategory('All Categories');
                                        setIsMobileMenuOpen(false);
                                        setTimeout(() => {
                                            window.location.href = 'https://bea.divinfosys.com/category';
                                        }, 50);
                                    }}>
                                    All Categories
                                </div>
                                {categories.map(cat => {
                                    const url = `https://bea.divinfosys.com/category/${cat.category_slug}`;
                                    // console.log('Rendering category:', cat.category_name, 'URL:', url);
                                    
                                    const handleCategoryClick = () => {
                                        console.log('Category clicked:', cat.category_name, 'navigating to:', url);
                                        setSelectedCategory(cat.category_name);
                                        setIsMobileMenuOpen(false);
                                        setTimeout(() => {
                                            console.log('Navigating now to:', url);
                                            window.location.href = url;
                                        }, 50);
                                    };

                                    return (
                                        <button
                                            key={cat._id}
                                            type="button"
                                            className={`block w-full text-left px-2 py-1 rounded cursor-pointer hover:bg-blue-50 active:bg-blue-100 ${selectedCategory === cat.category_name ? 'bg-blue-100' : ''}`}
                                            style={{ WebkitTapHighlightColor: 'rgba(0,0,0,0)' }}
                                            onClick={handleCategoryClick}
                                            onTouchEnd={(e) => {
                                                e.preventDefault();
                                                console.log('Touch event on category:', cat.category_name);
                                                handleCategoryClick();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    console.log('Keyboard event on category:', cat.category_name);
                                                    handleCategoryClick();
                                                }
                                            }}>
                                            {cat.category_name}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                        {/* Mobile Menu Links */}
                        <div className="space-y-3">
                            <Link href="/location" className="flex items-center text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaLocationDot className="mr-2 text-customBlue" />Location
                            </Link>
                            <Link href="/wishlist" className="flex items-center text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaHeart className="mr-2 text-customBlue" />Wishlist
                                {wishlistCount > 0 && (
                                    <span className="ml-auto bg-customBlue text-white text-xs px-2 py-1 rounded-full">{wishlistCount}</span>
                                )}
                            </Link>
                            <Link href="/cart" className="flex items-center text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>
                                <FaShoppingCart className="mr-2 text-customBlue" />Cart
                                {cartCount > 0 && (
                                    <span className="ml-auto bg-customBlue text-white text-xs px-2 py-1 rounded-full">{cartCount}</span>
                                )}
                            </Link>
                            {isLoggedIn && isAdmin && (
                                <Link href="/admin/dashboard" className="flex items-center text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}><FaUserShield className="mr-2 text-customBlue" />Admin Panel</Link>
                            )}
                            {isLoggedIn ? (
                                <>
                                    <Link href="/order" className="flex items-center text-gray-700 p-2 rounded hover:bg-gray-100" onClick={() => setIsMobileMenuOpen(false)}>
                                        <FaShoppingBag className="mr-2 text-customBlue" />My Orders
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center text-gray-700 p-2 rounded hover:bg-gray-100">
                                        <IoLogOut className="mr-2 text-customBlue" />Logout
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center text-gray-700 p-2 rounded hover:bg-gray-100">
                                    <FiUser className="mr-2 text-customBlue" />Sign In
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Auth Modal */}
                {showAuthModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
                            <button onClick={() => { setShowAuthModal(false); setFormError(''); setError(''); }} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
                                &times;
                            </button>
                            <div className="flex gap-4 mb-6 border-b">
                                <button className={`pb-2 px-1 ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('login')}>
                                    Login
                                </button>
                                <button className={`pb-2 px-1 ${activeTab === 'register' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('register')}>
                                    Register
                                </button>
                            </div>

                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                {activeTab === 'register' && (
                                    <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                )}
                                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                {activeTab === 'register' && (
                                    <input type="tel" placeholder="Mobile" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                )}
                                <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required minLength={6} />
                                {(formError || error) && (
                                    <div className="text-red-500 text-sm">
                                        {formError || error}
                                    </div>
                                )}
                                <button type="submit" disabled={loadingAuth} className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200">
                                    {loadingAuth ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
                                </button>

                                {/* Moved Forgot Password button here - better placement */}
                                {activeTab === 'login' && (
                                    <div className="text-center mt-2">
                                        <button type="button" onClick={() => { setShowAuthModal(false); setShowForgotPasswordModal(true); setForgotStep(1); setForgotPasswordEmail(formData.email || ''); setForgotOTP(''); setNewPassword(''); setConfirmPassword(''); setForgotPasswordMessage(''); setForgotPasswordError(''); }} className="text-sm text-blue-500 hover:underline">
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
                {showForgotPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96 max-w-full relative">
                            <button onClick={() => setShowForgotPasswordModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                            {/* STEP 1: Enter Email */}
                            {forgotStep === 1 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault(); setForgotPasswordError(''); setForgotPasswordMessage(''); setForgotPasswordLoading(true);
                                        try {
                                            const res = await fetch('/api/auth/request-reset', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: forgotPasswordEmail }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Error sending OTP');
                                            setForgotPasswordMessage('OTP sent to your email.');
                                            setForgotStep(2);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading}
                                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                                        >
                                            {forgotPasswordLoading ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STEP 2: Enter OTP */}
                            {forgotStep === 2 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Enter OTP</h2>
                                    <p className="text-sm mb-2">Email: <strong>{forgotPasswordEmail}</strong></p>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault(); setForgotPasswordError(''); setForgotPasswordMessage('');
                                        if (!forgotOTP.trim()) {
                                            setForgotPasswordError('Please enter OTP.');
                                            return;
                                        }
                                        setForgotPasswordLoading(true);
                                        try {
                                            const res = await fetch('/api/auth/verify-otp', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: forgotPasswordEmail,
                                                    otp: forgotOTP,
                                                }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Invalid OTP');
                                            setForgotPasswordMessage('OTP verified. Please set your new password.');
                                            setForgotStep(3);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input type="text" placeholder="Enter OTP" value={forgotOTP} onChange={(e) => setForgotOTP(e.target.value)} required className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button type="submit" disabled={forgotPasswordLoading} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                                            {forgotPasswordLoading ? 'Validating...' : 'Validate OTP'}
                                        </button>
                                    </form>
                                </>
                            )}

                            {/* STEP 3: New Password */}
                            {forgotStep === 3 && (
                                <>
                                    <h2 className="text-lg font-semibold mb-4">Set New Password</h2>
                                    <p className="text-sm mb-2">Email: <strong>{forgotPasswordEmail}</strong></p>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault(); setForgotPasswordError(''); setForgotPasswordMessage('');
                                        if (newPassword !== confirmPassword) {
                                            setForgotPasswordError('Passwords do not match.');
                                            return;
                                        }
                                        setForgotPasswordLoading(true);
                                        try {
                                            const res = await fetch('/api/auth/reset-password', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    email: forgotPasswordEmail,
                                                    otp: forgotOTP,
                                                    newPassword,
                                                }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Error resetting password');

                                            setForgotPasswordMessage('Password reset successful.');
                                            setTimeout(() => {
                                                setShowForgotPasswordModal(false);
                                                setShowAuthModal(true); // reopen login
                                            }, 1500);
                                        } catch (err) {
                                            setForgotPasswordError(err.message);
                                        } finally {
                                            setForgotPasswordLoading(false);
                                        }
                                    }} className="space-y-4">
                                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        {forgotPasswordError && (
                                            <p className="text-red-500 text-sm">{forgotPasswordError}</p>
                                        )}
                                        {forgotPasswordMessage && (
                                            <p className="text-green-500 text-sm">{forgotPasswordMessage}</p>
                                        )}
                                        <button type="submit" disabled={forgotPasswordLoading} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                                            {forgotPasswordLoading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

          <div className="relative p-2  mt-0 px-1 bg-[#2453D3] min-h-[64px]  border-gray-200 shadow flex items-center">
                <div className="w-full  relative">
                    {/* Arrows */}
                    {/*
                    <div className="absolute left-0 sm:-left-2 top-1/2 z-20 -translate-y-1/2 custom-swiper-prev cursor-pointer">
                        <div className="p-0 bg-white rounded-full shadow">
                            <FiChevronLeft size={20} className="text-black" />
                        </div>
                    </div>
                    <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2 custom-swiper-next cursor-pointer">
                        <div className="p-0 bg-white rounded-full shadow">
                            <FiChevronRight size={20} className="text-black" />
                        </div>
                    </div>
                    */}
                    {/* Swiper */}
                    <div className="relative">
                        <div className="flex justify-center overflow-x-auto scrollbar-hide">

                            <Swiper modules={[Navigation]} navigation={{ prevEl: ".custom-swiper-prev", nextEl: ".custom-swiper-next", }} spaceBetween={20} slidesPerView="auto" watchOverflow={true} className="pl-10 pr-14">
                                {categories.map((category) => (
                                    <SwiperSlide key={category._id} className="!w-auto">
                                        <div ref={(el) => (slideRefs.current[category._id] = el)} onMouseEnter={() => handleMouseEnter(category._id)} onMouseLeave={() => startHide(120)} className="px-5 py-2 flex flex-col items-center text-center" >
                                            <Link href={`/category/${category.category_slug}`} className="text-sm text-base text-white hover:text-orange-500 whitespace-nowrap" >
                                                {category.category_name}
                                            </Link>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>

                {/* DROPDOWN OUTSIDE SWIPER (fixed so it won't be clipped) */}
                {hoveredCategory && hoveredCategory.subcategories?.length > 0 && (
                    <div
                        ref={dropdownRef}
                        className="fixed z-50 border-t border-gray-200 shadow-xl"
                        style={{
                            top: `${dropdownTop}px`,
                            left: `${dropdownLeft}px`,
                            maxWidth: "calc(100% - 20px)",

                        }}
                        onMouseEnter={cancelHide}
                        onMouseLeave={() => startHide(120)}
                    >
                        <div className="flex flex-wrap bg-white h-auto max-h-[450px] overflow-y-auto">
    {chunkFlatList(
        flattenAllCategories(hoveredCategory.subcategories, hoveredCategory.category_slug),
        11
    ).map((chunk, index) => (
        <div
            key={index}
            className="min-w-[220px] max-w-[250px] p-3 flex flex-col justify-start"
        >
            {chunk.map(item => renderFlatItem(item, hoveredCategory))}
        </div>
    ))}

                            {(hoveredCategory.navImage || hoveredCategory.image) && (
                                <div className="min-w-[220px] max-w-[250px] flex items-center justify-center h-full ">
                                    <Link href={``} className="w-full h-full">
                                        <Image
                                            src={hoveredCategory.navImage || hoveredCategory.image}
                                            alt="Category Navigation Image"
                                            width={220}
                                            height={390}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            className="object-cover rounded"
                                        />
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </header>
    );
};
export default Header;
