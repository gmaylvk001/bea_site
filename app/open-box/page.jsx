"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "react-feather";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from "react-toastify";
import { Range as ReactRange } from "react-range";

const CategoryTreeFilter = ({
  categories,
  level = 0,
  selectedCategory,
  onCategorySelect,
}) => {
  const [expandedCategories, setExpandedCategories] = useState({});

  // Initialize with all categories expanded
  useEffect(() => {
    const allExpanded = {};
    const expandAll = (cats) => {
      cats.forEach((cat) => {
        if (cat.subCategories?.length > 0) {
          allExpanded[cat._id] = true;
          expandAll(cat.subCategories);
        }
      });
    };
    expandAll(categories);
    setExpandedCategories(allExpanded);
  }, [categories]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category._id}>
          <div
            className={`flex items-center gap-2 ${
              level > 0 ? `ml-${Math.min(level * 4, 8)}` : ""
            }`}
          >
            <label className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === category.category_name}
                onChange={() => onCategorySelect(category.category_name)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span
                className={`text-sm ${
                  selectedCategory === category.category_name
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
              >
                {category.category_name}
                {category.hasProducts && (
                  <span className="text-xs text-gray-400 ml-1">
                    (has products)
                  </span>
                )}
              </span>
            </label>

            {category.subCategories?.length > 0 && (
              <button
                type="button"
                onClick={() => toggleCategory(category._id)}
                className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
              >
                {expandedCategories[category._id] ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            )}
          </div>

          {category.subCategories?.length > 0 &&
            expandedCategories[category._id] && (
              <div className={`mt-1 ${level === 0 ? "ml-4" : "ml-6"}`}>
                <CategoryTreeFilter
                  categories={category.subCategories}
                  level={level + 1}
                  selectedCategory={selectedCategory}
                  onCategorySelect={onCategorySelect}
                />
              </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default function OpenBoxPage() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [loading, setLoading] = useState(true);
  const [nofound, setNofound] = useState(false);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [sortOption, setSortOption] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    brands: [],
    price: { min: 0, max: 100000 },
    category: "",
    subCategory: "",
  });
  const [values, setValues] = useState([0, 100000]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0,
  });
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [categoryTree, setCategoryTree] = useState([]);
  const STEP = 100;
  const MIN = priceRange[0];
  const MAX = priceRange[1];

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return; // initial load skip பண்ணும்
    }
    fetchProducts(1);
  }, [selectedFilters]);
  // Sync slider values
  useEffect(() => {
    setValues([selectedFilters.price.min, selectedFilters.price.max]);
  }, [selectedFilters.price.min, selectedFilters.price.max]);

  const fetchProducts = async (page = 1, initial = false) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();
      query.set("page", page);
      query.set("limit", 20);
      query.set("minPrice", selectedFilters.price.min);
      query.set("maxPrice", selectedFilters.price.max);

      if (selectedFilters.brands.length > 0) {
        query.set("brands", selectedFilters.brands.join(","));
      }
      if (selectedFilters.subCategory) {
        query.set("category", selectedFilters.subCategory);
      } else if (selectedFilters.category) {
        query.set("category", selectedFilters.category);
      }
      if (selectedFilters.categories && selectedFilters.categories.length > 0) {
        query.set("categories", selectedFilters.categories.join(","));
      }
      if (sortOption) {
        query.set("sortBy", sortOption);
      }

      const res = await fetch(`/api/open-box?${query}`);
      const data = await res.json();

      if (!data.success) {
        toast.error("Failed to fetch products");
        return;
      }

      setProducts(data.products);
      setBrands(data.brands);
      setCategories(data.categories);
      setCategoryTree(data.categoryTree || []);
      setPagination(data.pagination);

      if (initial) {
        const { minPrice, maxPrice } = data.priceRange;
        let min = minPrice;
        let max = maxPrice;
        if (min === max) {
          min -= 1;
          max += 1;
        }
        setPriceRange([min, max]);
        setSelectedFilters((prev) => ({
          ...prev,
          price: { min, max },
        }));
        setValues([min, max]);
      }

      setNofound(data.products.length === 0);
    } catch (error) {
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/openboxbanner");
      const data = await res.json();
      if (data.success && data.openBoxBanners) {
        // Active banners மட்டும் filter
        const activeBanners = data.openBoxBanners.banners.filter(
          (b) => b.banner_image && b.status === "Active",
        );
        setBanners(activeBanners);
      }
    } catch (error) {
      console.error("Banner fetch error:", error);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchProducts(1, true);
  }, []);

  // Sort change
  useEffect(() => {
    if (!isInitialLoad.current) {
      fetchProducts(1);
    }
  }, [sortOption]);

  const handleFilterChange = (type, value) => {
    setSelectedFilters((prev) => {
      const newFilters = { ...prev };
      if (type === "brands") {
        newFilters.brands = prev.brands.includes(value)
          ? prev.brands.filter((id) => id !== value)
          : [...prev.brands, value];
      } else if (type === "price") {
        newFilters.price = value;
      } else if (type === "category") {
        newFilters.category = prev.category === value ? "" : value;
        newFilters.selectedParent = prev.category === value ? "" : value;
        newFilters.subCategory = "";
      } else if (type === "subCategory") {
        newFilters.subCategory = prev.subCategory === value ? "" : value;
      }

      return newFilters;
    });
  };

  const handlePriceChange = (vals) => {
    let min = Math.max(1, vals[0]);
    let max = Math.max(1, vals[1]);
    if (min > max) min = max;
    setSelectedFilters((prev) => ({ ...prev, price: { min, max } }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      brands: [],
      price: { min: priceRange[0], max: priceRange[1] },
      category: "",
      subCategory: "",
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchProducts(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProductClick = (product) => {
    const stored = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    const alreadyViewed = stored.find((p) => p._id === product._id);
    const updated = alreadyViewed
      ? stored.filter((p) => p._id !== product._id)
      : stored;
    updated.unshift(product);
    localStorage.setItem(
      "recentlyViewed",
      JSON.stringify(updated.slice(0, 10)),
    );
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    const pages = [];
    const maxVisiblePages = 5;
    const hasPrev = pagination.currentPage > 1;
    const hasNext = pagination.currentPage < pagination.totalPages;
    let startPage = Math.max(
      1,
      pagination.currentPage - Math.floor(maxVisiblePages / 2),
    );
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1,
    );
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            pagination.currentPage === i
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>,
      );
    }
    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!hasPrev}
          className={`p-2 rounded-md ${
            !hasPrev
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages}
        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && (
              <span className="px-2">...</span>
            )}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!hasNext}
          className={`p-2 rounded-md ${
            !hasNext
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // Add this component right after imports and before export default function OpenBoxPage()

  {
    /* Product Grid */
  }
  {
    loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border shadow-sm flex flex-col animate-pulse"
          >
            <div className="aspect-square bg-gray-200 rounded-t-lg" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-1" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-200 rounded w-full mt-1" />
            </div>
          </div>
        ))}
      </div>
    ) : !nofound ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full"
            >
              {/* Image */}
              <div className="relative aspect-square bg-white">
                {product.images?.[0] && (
                  <Image
                    src={
                      product.images[0].startsWith("http")
                        ? product.images[0]
                        : `/uploads/products/${product.images[0]}`
                    }
                    alt={product.name}
                    fill
                    className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                    unoptimized
                  />
                )}
                {/* Discount Badge */}
              
                {product.special_price &&
                  product.special_price !== product.price &&
                  100 - (product.special_price / product.price) * 100 > 0 && (
                    <span className="absolute top-2 left-2 bg-orange-500 tracking-wider text-white text-xs font-bold px-2 py-1 rounded z-10">
                      -
                      {Math.round(
                        100 - (product.special_price / product.price) * 100,
                      )}
                      %
                    </span>
                  )}
                {/* Wishlist */}
                <div className="absolute top-2 right-2">
                  <ProductCard productId={product._id} />
                </div>
              </div>

              {/* Info */}
              <div className="p-2 md:p-4 flex flex-col h-full">
                <Link
                  href={`/product/${product.slug}`}
                  className="block mb-2"
                  onClick={() => handleProductClick(product)}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2 min-h-[40px]">
                    {product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-semibold text-red-600">
                    ₹
                    {(product.special_price &&
                    product.special_price > 0 &&
                    product.special_price < product.price
                      ? Math.round(product.special_price)
                      : Math.round(product.price)
                    ).toLocaleString()}
                  </span>
                  {product.special_price > 0 &&
                    product.special_price < product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{Math.round(product.price).toLocaleString()}
                      </span>
                    )}
                </div>

                {/* Stock */}
                <div className="mb-2">
                  {product.quantity > 0 ? (
                    <span className="text-xs text-green-600 font-medium">
                      In Stock, {product.quantity} units
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Addtocart
                    productId={product._id}
                    stockQuantity={product.quantity}
                    special_price={product.special_price}
                    className="w-full text-xs sm:text-sm py-1.5"
                  />
                  <a
                    href={`https://wa.me/?text=Check this out: ${product.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full transition-colors duration-300 flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 32 32"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        {renderPagination()}
      </>
    ) : (
      <div className="text-center py-10 mx-auto">
        <img
          src="/images/no-productbox.png"
          alt="No Products"
          className="mx-auto mb-4 w-32 h-32 md:w-40 md:h-40 object-contain"
        />
        <p className="text-gray-500">No Open Box products found</p>
      </div>
    );
  }

  if (values[0] < MIN) values[0] = MIN;
  if (values[1] > MAX) values[1] = MAX;

  const getSortedProducts = () => {
    const sortedProducts = [...products];

    switch (sortOption) {
      case "price-low-high":
        return sortedProducts.sort((a, b) => a.special_price - b.special_price);

      case "price-high-low":
        return sortedProducts.sort((a, b) => b.special_price - a.special_price);

      case "name-a-z":
        return sortedProducts.sort((a, b) => {
          if (a.name.toLowerCase() === "capacity") return -1;
          if (b.name.toLowerCase() === "capacity") return 1;
          return a.name.localeCompare(b.name);
        });

      case "name-z-a":
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));

      // ✅ NEW: Quantity Low → High
      case "quantity-low-to-high":
        return sortedProducts.sort(
          (a, b) => (a.quantity || 0) - (b.quantity || 0),
        );

      // ✅ NEW: Quantity High → Low
      case "quantity-high-to-low":
        return sortedProducts.sort(
          (a, b) => (b.quantity || 0) - (a.quantity || 0),
        );

      default:
        return sortedProducts;
    }
  };

  return (
    <div className="container mx-auto px-4 py-2 pb-3 max-w-7xl">
      {/* Marquee Banner */}
      <div
        className="w-full overflow-hidden mb-4"
        style={{ backgroundColor: "#1E5FA8" }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: "marquee 20s linear infinite",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.animationPlayState = "paused")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.animationPlayState = "running")
          }
        >
          {/* Text 2 times */}
          {[...Array(2)].map((_, i) => (
            <span
              key={i}
              className="inline-block px-8 py-2 text-sm font-semibold"
              style={{ color: "#F7941D" }}
            >
              🏷️ <span style={{ color: "#ffffff" }}>Open Box Sale</span> — These
              are products previously used as display units in our showroom. Now
              available at discounted prices in excellent condition!
              &nbsp;&nbsp;&nbsp;✅{" "}
              <span style={{ color: "#ffffff" }}>Verified Quality</span>
              &nbsp;&nbsp;&nbsp;💰{" "}
              <span style={{ color: "#F7941D" }}>Best Price Guaranteed</span>
              &nbsp;&nbsp;&nbsp;🚀{" "}
              <span style={{ color: "#ffffff" }}>Limited Stock Available</span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      {/* Banners */}
      {banners.length > 0 && (
        <div className="relative w-full mb-6 overflow-hidden">
          <div
            className="relative w-full cursor-pointer"
            onClick={() => {
              const url = banners[currentBannerIndex]?.redirect_url;
              if (url) window.location.href = url;
            }}
          >
            <Image
              src={banners[currentBannerIndex].banner_image}
              alt={`Open Box Banner ${currentBannerIndex + 1}`}
              width={1920}
              height={600}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>

          {/* 👈 Prev/Next buttons சேர்த்தேன் */}
          {banners.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBannerIndex((prev) =>
                    prev === 0 ? banners.length - 1 : prev - 1,
                  );
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBannerIndex((prev) =>
                    prev === banners.length - 1 ? 0 : prev + 1,
                  );
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <label
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBannerIndex(index);
                  }}
                  className="cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      index === currentBannerIndex
                        ? "bg-white border-white"
                        : "bg-transparent border-white/70"
                    }`}
                  >
                    {index === currentBannerIndex && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-700">Open Box Products</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar */}

        <div className="w-full md:w-[250px] shrink-0">
          {/* Active Filters */}
          {(selectedFilters.brands.length > 0 ||
            selectedFilters.price.min !== priceRange[0] ||
            selectedFilters.price.max !== priceRange[1] ||
            selectedFilters.category !== "" ||
            selectedFilters.subCategory !== "") && (
            <div className="bg-white p-4 rounded shadow mb-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Active Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.brands.map((brandId) => {
                  const brand = brands.find((b) => b._id === brandId);
                  return brand ? (
                    <span
                      key={brandId}
                      className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                    >
                      {brand.brand_name}
                      <button
                        onClick={() => handleFilterChange("brands", brandId)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                {(selectedFilters.price.min !== priceRange[0] ||
                  selectedFilters.price.max !== priceRange[1]) && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                    ₹{selectedFilters.price.min} - ₹{selectedFilters.price.max}
                    <button
                      onClick={() =>
                        setSelectedFilters((prev) => ({
                          ...prev,
                          price: { min: priceRange[0], max: priceRange[1] },
                        }))
                      }
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Category tag */}
                {selectedFilters.category && (
                  <span className="bg-blue-50 border border-blue-200 px-2 py-1 rounded text-sm flex items-center text-blue-700">
                    {selectedFilters.category}
                    <button
                      onClick={() =>
                        setSelectedFilters((prev) => ({
                          ...prev,
                          category: "",
                          subCategory: "",
                        }))
                      }
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* SubCategory tag */}
                {selectedFilters.subCategory && (
                  <span className="bg-green-50 border border-green-200 px-2 py-1 rounded text-sm flex items-center text-green-700">
                    {selectedFilters.subCategory}
                    <button
                      onClick={() =>
                        setSelectedFilters((prev) => ({
                          ...prev,
                          subCategory: "",
                        }))
                      }
                      className="ml-1 text-green-400 hover:text-green-600"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
            <h3 className="text-base font-semibold mb-4 text-gray-700">
              Price Range
            </h3>
            <ReactRange
              values={values}
              step={STEP}
              min={MIN}
              max={MAX}
              onChange={(newValues) => setValues(newValues)}
              onFinalChange={(newValues) => handlePriceChange(newValues)}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  className="w-full h-2 rounded-lg bg-gray-200 relative"
                >
                  <div
                    className="absolute h-2 bg-gray-500 rounded-lg"
                    style={{
                      left: `${((values[0] - MIN) / (MAX - MIN)) * 100}%`,
                      width: `${
                        ((values[1] - values[0]) / (MAX - MIN)) * 100
                      }%`,
                    }}
                  />
                  {children}
                </div>
              )}
              renderThumb={({ props, index }) => {
                const { key, ...rest } = props;
                return (
                  <div
                    key={key}
                    {...rest}
                    className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer relative ${
                      index === 0 ? "bg-blue-500 z-10" : "bg-green-500 z-20"
                    }`}
                  />
                );
              }}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-6">
              <span>₹{values[0].toLocaleString()}</span>
              <span>₹{values[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Categories — subcategories */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
            <div className="flex items-center justify-between pb-2 bg-gray-300 p-2">
              <h3 className="text-base font-semibold text-gray-700">
                Categories
              </h3>
              <button
                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              >
                {isCategoriesExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {isCategoriesExpanded && (
              <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                <li>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="category"
                      checked={
                        selectedFilters.subCategory === "" &&
                        selectedFilters.category === ""
                      }
                      onChange={() =>
                        setSelectedFilters((prev) => ({
                          ...prev,
                          category: "",
                          subCategory: "",
                        }))
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      All Categories
                    </span>
                  </label>
                </li>

                {categoryTree.flatMap((topCat) =>
                  topCat.subCategories?.length > 0
                    ? topCat.subCategories.map((sub) => (
                        <li key={sub._id}>
                          <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="radio"
                              name="category"
                              checked={
                                selectedFilters.category === sub.category_name
                              }
                              onChange={() =>
                                setSelectedFilters((prev) => ({
                                  ...prev,
                                  category: sub.category_name,
                                  subCategory: "",
                                }))
                              }
                              className="h-4 w-4 text-blue-600"
                            />
                            <span
                              className={`text-sm ${
                                selectedFilters.category === sub.category_name
                                  ? "text-blue-600 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {sub.category_name}
                            </span>
                          </label>
                        </li>
                      ))
                    : [],
                )}
              </ul>
            )}
          </div>

          {/* Children — category select */}
          {selectedFilters.category &&
            (() => {
              let children = [];
              for (const topCat of categoryTree) {
                const found = topCat.subCategories?.find(
                  (s) => s.category_name === selectedFilters.category,
                );
                if (found) {
                  children = found.subCategories || [];
                  break;
                }
              }

              if (children.length === 0) return null;

              return (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <div className="bg-gray-300 p-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-700">
                      {selectedFilters.category}
                    </h3>
                  </div>
                  <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                    <li>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="subcategory"
                          checked={selectedFilters.subCategory === ""}
                          onChange={() =>
                            setSelectedFilters((prev) => ({
                              ...prev,
                              subCategory: "",
                            }))
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          All {selectedFilters.category}
                        </span>
                      </label>
                    </li>
                    {children.map((child) => (
                      <li key={child._id}>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="subcategory"
                            checked={
                              selectedFilters.subCategory ===
                              child.category_name
                            }
                            onChange={() =>
                              setSelectedFilters((prev) => ({
                                ...prev,
                                subCategory: child.category_name,
                              }))
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <span
                            className={`text-sm ${
                              selectedFilters.subCategory ===
                              child.category_name
                                ? "text-blue-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {child.category_name}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

          {/* Brands */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
            <div className="flex items-center justify-between pb-2 bg-gray-300 p-2">
              <h3 className="text-base font-semibold text-gray-700">Brands</h3>
              <button
                onClick={() => setIsBrandsExpanded(!isBrandsExpanded)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isBrandsExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>
            {isBrandsExpanded && (
              <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                {brands.map((brand) => (
                  <li key={brand._id} className="flex items-center">
                    <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedFilters.brands.includes(brand._id)}
                        onChange={() => handleFilterChange("brands", brand._id)}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">
                        {brand.brand_name} ({brand.count})
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1">
          {/* Sort Bar */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-sm text-gray-600">
              {pagination.totalProducts} products found
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 border rounded-md text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A-Z</option>
                <option value="name-z-a">Name: Z-A</option>
                <option value="quantity-low-to-high">
                  Quantity: Low to High
                </option>
                <option value="quantity-high-to-low">
                  Quantity: High to Low
                </option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {!nofound ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {getSortedProducts().map((product) => (
                  <div
                    key={product._id}
                    className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-white">
                      {product.images?.[0] && (
                        <Image
                          src={
                            product.images[0].startsWith("http")
                              ? product.images[0]
                              : `/uploads/products/${product.images[0]}`
                          }
                          alt={product.name}
                          fill
                          className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                          unoptimized
                        />
                      )}
                      {/* Discount Badge */}
                      <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse tracking-wide uppercase">
                       🏷️ Clearance Sale
                      </span>
                      {product.special_price &&
                        product.special_price !== product.price &&
                        100 - (product.special_price / product.price) * 100 >
                          0 && (
                          <span className="absolute top-2 left-2 bg-orange-500 tracking-wider text-white text-xs font-bold px-2 py-1 rounded z-10">
                            -
                            {Math.round(
                              100 -
                                (product.special_price / product.price) * 100,
                            )}
                            %
                          </span>
                        )}

                      {/* Wishlist */}
                      <div className="absolute top-2 right-2">
                        <ProductCard productId={product._id} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2 md:p-4 flex flex-col h-full">
                      <Link
                        href={`/product/${product.slug}`}
                        className="block mb-2"
                        onClick={() => handleProductClick(product)}
                      >
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2 min-h-[40px]">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base font-semibold text-red-600">
                          ₹
                          {(product.special_price &&
                          product.special_price > 0 &&
                          product.special_price < product.price
                            ? Math.round(product.special_price)
                            : Math.round(product.price)
                          ).toLocaleString()}
                        </span>
                        {product.special_price > 0 &&
                          product.special_price < product.price && (
                            <span className="text-xs text-gray-500 line-through">
                              ₹{Math.round(product.price).toLocaleString()}
                            </span>
                          )}
                      </div>
                      <div className="mb-2">
                        {product.quantity > 0 ? (
                          <span className="text-xs text-green-600 font-medium">
                            In Stock, {product.quantity} units
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      {/* Buttons */}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <Addtocart
                          productId={product._id}
                          stockQuantity={product.quantity}
                          special_price={product.special_price}
                          className="w-full text-xs sm:text-sm py-1.5"
                        />
                        <a
                          href={`https://wa.me/?text=Check this out: ${product.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full transition-colors duration-300 flex items-center justify-center"
                        >
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 32 32"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-10 mx-auto">
              <img
                src="/images/no-productbox.png"
                alt="No Products"
                className="mx-auto mb-4 w-32 h-32 md:w-40 md:h-40 object-contain"
              />
              <p className="text-gray-500">No Open Box products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
