"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { MdAccountCircle } from "react-icons/md";
import { FaShoppingBag } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { CircleUser, ShoppingBag, LogOut } from 'lucide-react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import Logout from "@/components/Logout";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from '@/context/CartContext';
import { sortCategories } from '../utils/categoryUtils';

export default function Header() {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
  const { wishlistCount } = useWishlist();
  const { cartCount, updateCartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    // Load categories from localStorage if available
    const savedCategories = typeof window !== 'undefined' ? localStorage.getItem('headerCategories') : null;
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    

    const fetchCategories = async () => {
      if (!hasMounted) return;
      try {
        const response = await fetch('/api/categories/get');
        const data = await response.json();
        const sortedData = sortCategories(data);
        const parentCategories = sortedData.filter(category => category.parentid === "none" && category.status === "Active");
        setCategories(parentCategories);
        if (typeof window !== 'undefined') {
          localStorage.setItem('headerCategories', JSON.stringify(parentCategories));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
    checkAuthStatus();
  }, [hasMounted]);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/cart/count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          updateCartCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch cart count:', error);
      }
    };
  
    fetchCartCount();
  }, [updateCartCount]);

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
    updateCartCount(0); // Reset cart count on logout
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white text-black border-b border-gray-200">
        <div className="container mx-auto px-2 py-2 flex items-center justify-between">
          {/* Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Logo - Centered */}
          <Link href="/index" className="mx-auto">
            <Image 
              src="/user/bea.png" 
              alt="Marketpro" 
              width={60} 
              height={30} 
              className="h-auto"
              priority // Prevents layout shift
            />
          </Link>

          {/* Icons - Search, Wishlist, Cart */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2"
            >
              <FiSearch size={20} />
            </button>
            
            <Link href="/wishlist" className="relative p-2">
              <FiHeart size={20} />
              {hasMounted && wishlistCount > 0 && (
                <span className="absolute top-0 right-0 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            
            <Link href="/cart" className="relative p-2">
              <FiShoppingCart size={20} />
              {hasMounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 text-xs bg-customBlue text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar - appears when toggled */}
        {showSearch && (
          <div className="px-3 pb-3">
            <div className="flex items-center border border-gray-300 rounded-full px-3 bg-white">
              <input
                type="text"
                placeholder="Search for products..."
                className="px-4 py-2 outline-none w-full text-black placeholder:text-gray-400"
              />
              <button className="bg-customBlue text-white p-2 rounded-full">
                <FiSearch size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white z-50 shadow-lg border-t border-gray-200">
            <div className="container mx-auto px-4 py-3">
              {/* User Section */}
              <div className="pb-3 border-b border-gray-200">
                {isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser size={18} />
                    </div>
                    <div>
                      <p className="font-medium">Hi, {userData?.username || userData?.name || 'User'}</p>
                      <Link href="/account" className="text-sm text-blue-500">My Account</Link>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <FiUser size={18} />
                    </div>
                    <span className="font-medium">Sign In / Register</span>
                  </button>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="py-3 border-b border-gray-200">
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="block py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                  </li>
                  <li>
                    <Link href="/locator" className="block py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center">
                        <FiMapPin className="mr-2" /> Location
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="block py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center">
                        <FiHeart className="mr-2" /> Wishlist
                        {wishlistCount > 0 && (
                          <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                  {isLoggedIn && (
                    <>
                      <li>
                        <Link href="/order" className="block py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                      </li>
                      <li>
                        <button 
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="block py-2 font-medium text-left w-full"
                        >
                          Logout
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </nav>

              {/* Categories Section */}
              <div className="py-3">
                <h3 className="font-bold text-lg mb-2">Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 6).map(category => (
                    <Link
                      key={category._id}
                      href={`/category/${category.category_slug}`}
                      className="block py-2 px-3 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category.category_name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        {/* Main Header */}
        <div className="relative py-1 border-b border-gray-300 bg-white text-black">
          <div className="container mx-auto flex items-center justify-between px-4">
            {/* Left Side: Logo + Search */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link href="/index">
                <Image 
                  src="/user/bea.png" 
                  alt="Marketpro" 
                  width={70} 
                  height={30} 
                  className="h-auto"
                  priority 
                />
              </Link>

              
            </div>
            <div className="w-[45%]">
              {/* Search Bar */}
              <div className="flex items-center border border-gray-300 rounded-full px-3 bg-white">
                <input
                  type="text"
                  placeholder="Search for a product or brand"
                  className="px-4 py-2 outline-none w-full text-black placeholder:text-gray-400"
                />
                <button className="bg-customBlue text-white p-2 rounded-full">
                  <FiSearch size={18} />
                </button>
              </div>
            </div>

            {/* Right Side: All Links closer together */}
            <div className="flex items-center space-x-6">
              {/* Location */}
              <Link href="/locator" className="flex items-center relative">
                <FiMapPin size={22} className="text-black" />
                <span className="ml-1 font-bold text-sm">Location</span>
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="flex items-center relative">
                <FiHeart size={22} className="text-black" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white px-1 rounded-full">
                    {wishlistCount}
                  </span>
                )}
                <span className="ml-1 font-bold text-sm">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="flex items-center relative  px-4">
                <FiShoppingCart size={22} className="text-black" />
                <span className="absolute top-[-5px] right-[-8px] text-xs bg-customBlue text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
                <span className="ml-1 font-bold text-sm">Cart</span>
              </Link>

              {/* User Account */}
              <div className="relative" ref={dropdownRef}>
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center text-black focus:outline-none"
                    >
                      <FiUser size={22} className="text-black" />
                      <span className="ml-1 font-bold text-sm">
                        Hi, {userData?.username || userData?.name || "User"}
                      </span>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl z-50 transition-all">
                        {/* Top Arrow */}
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 shadow-md"></div>

                        <div className="py-2 px-2">
                          {/* <Link
                            href="/account"
                            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-customBlue text-white">
                              <MdAccountCircle className="w-4 h-4" />
                            </span>
                            My Account
                          </Link> */}

                          <Link
                            href="/order"
                            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-customBlue text-white">
                              <FaShoppingBag className="w-5 h-5" />
                            </span>
                            My Orders
                          </Link>

                          <hr className="my-2 border-gray-200" />

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-2 rounded-md text-sm text-gray-700 hover:bg-red-50 transition-colors"
                          >
                            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-customBlue text-white">
                              <IoLogOut className="w-5 h-5" />
                            </span>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center text-black"
                  >
                    <FiUser size={22} className="text-black" />
                    <span className="ml-1 font-bold text-sm">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Categories Bar (visible on all screens) */}
      {hasMounted && categories.length > 0 && (
  <div 
    className={`overflow-hidden bg-customBlue text-white text-xs py-2 relative transition-opacity duration-300 ${
      categories.length > 0 ? 'opacity-100' : 'opacity-0 h-0 py-0'
    }`}
  >
    {categories.length > 9 && (
      <>
        <button
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-black p-2 rounded-full shadow-md z-10"
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-black p-2 rounded-full shadow-md z-10"
          onClick={() => scroll('right')}
        >
          <ChevronRight size={20} />
        </button>
      </>
    )}

    <div
      ref={scrollRef}
      className={`px-2 ${
        categories.length > 9 
          ? 'flex overflow-x-auto scroll-smooth scrollbar-hide gap-8'
          : 'grid grid-cols-9 justify-center gap-8'
      }`}
    >
      {categories.map((category) => (
        <Link 
          key={category._id} 
          href={`/category/${category.category_slug}`}
          className="flex flex-col items-center flex-shrink-0 transform transition-transform duration-500 ease-out hover:scale-[1.12] active:scale-[1.05]"
        >
         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-transform duration-500 ease-out group-hover:scale-[1.12] group-active:scale-[1.05]">


            {category.image ? (
              <Image 
                src={category.image} 
                alt={category.category_name} 
                width={80} 
                height={80} 
                className="object-contain"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            )}
          </div>
          <span className="text-sm font-medium mt-1 text-center w-[110px]  whitespace-nowrap">
  {category.category_name}
</span>

        </Link>
      ))}
    </div>
  </div>
)}



      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setFormError('');
                setError('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>

            <div className="flex gap-4 mb-6 border-b">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'login' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'register'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {activeTab === 'register' && (
                <input
                  type="tel"
                  placeholder="Mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              
              {(formError || error) && (
                <div className="text-red-500 text-sm">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200"
              >
                {loadingAuth ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}