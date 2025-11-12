"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FiSearch, FiMapPin, FiHeart, FiShoppingCart, FiUser } from "react-icons/fi";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Header() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2; // Adjust scroll distance
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
  return (
    <header className="w-full">
  {/* Main Header */}
  <div className="relative py-2 border-b border-gray-300 bg-white text-black">
    <div className="container mx-auto flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/">
        <Image src="/user/bea.png" alt="Marketpro" width={70} height={30} className="h-auto" />
      </Link>

      {/* Search Bar & Location */}
      <div className="flex-1 flex justify-center items-center space-x-10">
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

        {/* Location (Near Search Bar) */}
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

      {/* Wishlist & Cart */}
      <div className="flex items-center space-x-10">
        {/* Sign Out */}
        <Link href="/signout" className="flex items-center text-black">
          <FiUser size={22} className="text-black" />
           <span className="ml-2 hidden md:inline font-bold">Sign Out</span>
        </Link>
 
      </div>
    </div>
  </div>

  {/* Top Blue Bar */}
  <div className="bg-customBlue text-white text-xs py-4 relative">
  {/* Left Arrow */}
  <button
    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white text-customBlue p-2 rounded-full shadow-md z-10"
    onClick={() => scroll("left")}
  >
    <ChevronLeft size={20} />
  </button>

  {/* Scrollable Categories Container */}
  <div
    ref={scrollRef}
    className="container mx-auto flex overflow-x-auto scroll-smooth scrollbar-hide gap-4 px-6"
  >
    {/* Category Items */}
    {[
      { name: "Refrigerator", img: "/user/ref.png" },
      { name: "Air Conditioner", img: "/user/air.png" },
      { name: "Washing Machine", img: "/user/wm.png" },
      { name: "Dishwasher", img: "/user/dw.png" },
      { name: "Home Appliances", img: "/user/hm.png" },
      { name: "Kitchen Appliances", img: "/user/ka.jpg" },
      { name: "Mobile Phones", img: "/user/mobile.png" },
      { name: "Television", img: "/user/tv.jpg" },
      { name: "Sound System", img: "/user/sound.png" },
      { name: "Gadgets", img: "/user/gadgets.jpg" },
      { name: "Accessories", img: "/user/accessories.jpg" },
    ].map((category, index) => (
      <div key={index} className="flex flex-col items-center min-w-[100px]">
        {/* Category Image */}
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
          <Image src={category.img} alt={category.name} width={40} height={40} />
        </div>
        {/* Category Name */}
        <span className="text-xs font-medium mt-1 truncate w-[90px] text-center">
          {category.name}
        </span>
      </div>
    ))}
  </div>

  {/* Right Arrow */}
  <button
    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-customBlue p-2 rounded-full shadow-md z-10"
    onClick={() => scroll("right")}
  >
    <ChevronRight size={20} />
  </button>
</div>



</header>

  
  );
}
