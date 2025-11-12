"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  FiSearch,
  FiMapPin,
  FiHeart,
  FiShoppingCart,
  FiUser,
} from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();


  useEffect(() => {
    if (session) {
      console.log("User session:", session);
      alert(`Welcome, ${session.user.email}`);
    }
  }, [session]);
  

  
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, signIn] = useState(false);
  // const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories/get");
        const data = await response.json();
        const parentCategories = data.filter(
          (category) =>
            category.parentid === "none" && category.status === "Active"
        );
        setCategories(parentCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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

  return (
    <>
      <header className="w-full">
        {/* Main Header */}
        <div className="relative py-2 border-b border-gray-300 bg-white text-black">
          <div className="container mx-auto flex items-center justify-between px-4">
            {/* Logo */}
            <Link href="/index">
              <Image
                src="/user/bea.png"
                alt="Marketpro"
                width={70}
                height={30}
                className="h-auto"
              />
            </Link>

            {/* Search & Icons */}
            <div className="flex-1 flex justify-center items-center space-x-10">
              {/* Search */}
              <div className="flex items-center border border-gray-300 rounded-full px-3 bg-white">
                <input
                  type="text"
                  placeholder="Search for a product or brand"
                  className="px-4 py-2 outline-none w-72 text-black placeholder:text-gray-400"
                />
                <button className="bg-customBlue text-white p-2 rounded-full">
                  <FiSearch size={18} />
                </button>
              </div>

              {/* Location */}
              <Link href="/locator" className="flex items-center relative px-2">
                <FiMapPin size={22} className="text-black" />
                <span className="ml-2 hidden md:inline font-bold">Location</span>
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="flex items-center relative px-4">
                <FiHeart size={22} className="text-black" />
                <span className="absolute top-[-5px] right-[-8px] text-xs bg-customBlue text-white rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
                <span className="ml-2 hidden md:inline font-bold">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link href="/cart" className="flex items-center relative px-4">
                <FiShoppingCart size={22} className="text-black" />
                <span className="absolute top-[-5px] right-[-8px] text-xs bg-customBlue text-white rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
                <span className="ml-2 hidden md:inline font-bold">Cart</span>
              </Link>
            </div>


            {session ? (
        <div className="flex items-center space-x-10">
          {/* Signed in as */} {session.user.email} <br />
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      ) : (
        <div className="flex items-center space-x-10">
          {/* Not signed in */} <br />
          <button onClick={() => signIn(true)} className="flex items-center text-black"><FiUser size={22} /><span className="ml-2 hidden md:inline font-bold">Sign In</span></button>
          {/* <Link href="/login" className="flex items-center text-black">
  <FiUser size={22} />
  <span className="ml-2 hidden md:inline font-bold">Sign In</span>
</Link> */}
        </div>
      )}


            {/* Sign In */}
            {/* <div className="flex items-center space-x-10">
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center text-black"
              >
                <FiUser size={22} />
                <span className="ml-2 hidden md:inline font-bold">Sign In</span>
              </button>
            </div> */}
          </div>
        </div>

        {/* Top Blue Bar */}
        <div className="bg-customBlue text-white text-xs py-4 relative">
          {/* Scroll Left */}
          <button
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-customBlue p-2 rounded-full shadow-md z-10"
            onClick={() => scroll("left")}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Categories */}
          <div
            ref={scrollRef}
            className="container mx-auto flex overflow-x-auto scroll-smooth scrollbar-hide gap-4 px-6 header-css"
          >
            {loading ? (
              <div className="flex space-x-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center min-w-[100px]"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded mt-2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/category/${category.category_slug}`}
                  className="flex flex-col items-center min-w-[100px]"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.category_name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1 truncate w-[90px] text-center">
                    {category.category_name}
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Scroll Right */}
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-customBlue p-2 rounded-full shadow-md z-10"
            onClick={() => scroll("right")}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-md w-full">
            {/* Close button */}
            <button
              onClick={() => signIn(false)}
              className="absolute top-2 right-3 text-2xl font-bold text-gray-600"
            >
              &times;
            </button>

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src="/user/bea.png" alt="BEA Logo" className="w-28" />
            </div>

            <h2 className="text-center text-xl font-bold mb-2">Sign In</h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              To Access Your Order Easily
            </p>

            <form className="space-y-4">
              <div>
                <label className="block text-sm mb-1">
                  Email / Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="ecom@bharatelectronics.in"
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div className="flex justify-between text-sm text-blue-600">
                <a href="#">Register</a>
                <a href="#">Forgot Password?</a>
              </div>

              <button
                type="submit"
                className="bg-blue-500 w-full text-white py-2 rounded hover:bg-blue-600"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
