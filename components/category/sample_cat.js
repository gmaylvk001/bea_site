"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FaSortAmountDown, FaSlidersH } from 'react-icons/fa';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "react-feather";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import { Range as ReactRange } from "react-range";
import FlashCategorySlider from "../FlashCategorySlider";
import BannerSlider from "../main-cat-banner";
import CategoryMainPage from "../main-cat-third";
import ShopByBrand from "@/components/brand/ShopByBrand";
import CategoryPage from "../Fallbackmain";
import CategoryImageSection from "@/components/CategoryImageSection";


export default function CategoryPrimaryPage(params) {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: [],
    main_category: null
  });
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [products, setProducts] = useState([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const { slug } = useParams();
  const [sortOption, setSortOption] = useState('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState(() => {
  // Initialize all filter groups as expanded
  const initialExpanded = {};
  if (categoryData.filters) {
    categoryData.filters.forEach(filter => {
      const groupId = filter.filter_group_name;
      if (groupId) {
        initialExpanded[groupId] = true;
      }
    });
  }
  return initialExpanded;
}); 
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [wishlist, setWishlist] = useState([]); 
  const toggleFilters = () => setIsFiltersExpanded(!isFiltersExpanded);
  const toggleCategories = () => {
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };
  const toggleBrands = () => setIsBrandsExpanded(!isBrandsExpanded);
  const toggleFilterGroup = (id) => {
    setExpandedFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [nofound, setNofound] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isFirstLoadDone = useRef(false);
  // const [currentCategoryBannerIndex, setCurrentCategoryBannerIndex] = useState(0);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0
  });
  const itemsPerPage = 12;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter(); // Added router

  // Fetch initial data
  useEffect(() => {
    if (slug) {
      fetchInitialData();
    }
  }, [slug]);
  
  // In your fetchInitialData function, update the filter grouping:
const fetchInitialData = async () => {
  try {
    setLoading(true);
    console.log('🔍 Fetching category data for slug:', slug);
    
    const categoryRes = await fetch(`/api/categories/${slug}`);
    const categoryData = await categoryRes.json();
    
    console.log('📦 Raw API Response:', categoryData);
    console.log('🎯 Filters from API:', categoryData.filters);
    console.log('📊 Number of filters:', categoryData.filters?.length || 0);

    setCategoryData({
      ...categoryData,
      categoryTree: categoryData.category,
      allCategoryIds: categoryData.allCategoryIds,
      banners: categoryData.main_category?.banners || []
    });

    // Read query params from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlBrands = (urlParams.get("brands") || "").split(",").filter(Boolean);
    const urlFilters = (urlParams.get("filters") || "").split(",").filter(Boolean);
    const urlCategories = (urlParams.get("categories") || urlParams.get("categoryIds") || "").split(",").filter(Boolean);
    const urlMinPrice = urlParams.get("minPrice") !== null && !isNaN(urlParams.get("minPrice")) ? Number(urlParams.get("minPrice")) : null;
    const urlMaxPrice = urlParams.get("maxPrice") !== null && !isNaN(urlParams.get("maxPrice")) ? Number(urlParams.get("maxPrice")) : null;
    const urlSort = urlParams.get("sort") || "";
    if (urlSort) {
      setSortOption(urlSort);
    }

    let minPrice = 0;
    let maxPrice = 100000;

    // Price range logic
    if (categoryData.products?.length > 0) {
      const prices = categoryData.products.map(p => p.special_price || p.price);
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);

      if (minPrice === maxPrice) {
        minPrice = Math.max(1, minPrice - 100);
        maxPrice = maxPrice + 100;
      }
    }

    setPriceRange([minPrice, maxPrice]);

    const activeMin = urlMinPrice !== null ? urlMinPrice : minPrice;
    const activeMax = urlMaxPrice !== null ? urlMaxPrice : maxPrice;

    const initialFilters = {
      categories: urlCategories,
      brands: urlBrands,
      price: { min: activeMin, max: activeMax },
      filters: urlFilters
    };
    setSelectedFilters(initialFilters);

    // IMPROVED FILTER GROUPING LOGIC
    if (categoryData.filters && categoryData.filters.length > 0) {
      console.log('🔄 Processing filters...');
      
      const groups = {};
      
      categoryData.filters.forEach((filter, index) => {
        console.log(`📋 Filter ${index + 1}:`, filter);
        
        // Use filter_group_id as the primary key, fallback to filter_group_name
        const groupId = filter.filter_group_id || filter.filter_group_name;
        
        if (groupId) {
          if (!groups[groupId]) {
            groups[groupId] = {
              _id: groupId,
              name: filter.filter_group_name || 'Unnamed Group',
              slug: (filter.filter_group_name || 'unnamed').toLowerCase().replace(/\s+/g, '-'),
              filters: []
            };
            console.log(`✅ Created new group: ${filter.filter_group_name}`);
          }
          
          // Add filter to group
          groups[groupId].filters.push({
            _id: filter._id,
            filter_name: filter.filter_name,
            count: filter.count || 0
          });
          console.log(`✅ Added filter "${filter.filter_name}" to group "${filter.filter_group_name}"`);
        } else {
          console.log('❌ Filter missing group ID:', filter);
        }
      });
      
      console.log('🏷️ Final filter groups:', groups);
      setFilterGroups(groups);

      // Initialize expanded state
      const initialExpanded = {};
      Object.keys(groups).forEach(groupId => {
        initialExpanded[groupId] = true;
      });
      setExpandedFilters(initialExpanded);
      
    } else {
      console.log('❌ No filters found in category data');
      setFilterGroups({});
    }

    await fetchFilteredProducts(categoryData, 1, true, initialFilters, urlSort);
    
  } catch (error) {
    console.error('💥 Error in fetchInitialData:', error);
    toast.error("Error fetching initial data");
    router.push('/noproduct');
  } finally {
    setInitialLoadComplete(true);
    setLoading(false);
  }
};
  const [brandMap, setBrandMap] = useState([]);
 
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

  const fetchFilteredProducts = useCallback(async (categoryData, pageNum = 1, initialLoad = false, filtersOverride = null, sortOverride = null) => {
    try {
      if (!initialLoad) setIsFiltering(true);
      const query = new URLSearchParams();
      const currentFilters = filtersOverride || selectedFilters;
      const categoryIds = (currentFilters.categories && currentFilters.categories.length > 0)
        ? currentFilters.categories
        : categoryData.allCategoryIds;

      if (categoryIds && categoryIds.length > 0) {
        query.set('categoryIds', categoryIds.join(','));
      }
      query.set('page', pageNum);
      query.set('limit', itemsPerPage);

      if (currentFilters.brands && currentFilters.brands.length > 0) {
        query.set('brands', currentFilters.brands.join(','));
      }
      if (currentFilters.price?.min !== undefined && currentFilters.price?.min !== null) {
        query.set('minPrice', currentFilters.price.min);
      }
      if (currentFilters.price?.max !== undefined && currentFilters.price?.max !== null) {
        query.set('maxPrice', currentFilters.price.max);
      }
      
      if (currentFilters.filters && currentFilters.filters.length > 0) {
        query.set('filters', currentFilters.filters.join(','));
      }

      const activeSort = sortOverride !== null && sortOverride !== undefined ? sortOverride : sortOption;
      if (activeSort) {
        query.set('sort', activeSort);
      }

      const res = await fetch(`/api/product/filter/main-cat?${query}`);
      const { products, pagination: paginationData } = await res.json();

      setProducts(products);
      
      // Update pagination state
      setPagination({
        currentPage: paginationData.currentPage,
        totalPages: paginationData.totalPages,
        hasNext: paginationData.hasNext,
        hasPrev: paginationData.hasPrev,
        totalProducts: paginationData.totalProducts
      });
      
      if (products.length === 0 && pageNum === 1) {
        setNofound(true);
      } else {
        setNofound(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error fetching products. Please try again.');
    } finally {
      if (!initialLoad) setIsFiltering(false);
      setLoading(false);
    }
  }, [selectedFilters, sortOption]);

  const handleProductClick = (product) => {
    const stored = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

    const alreadyViewed = stored.find((p) => p._id === product._id);

    const updated = alreadyViewed
      ? stored.filter((p) => p._id !== product._id)
      : stored;

    updated.unshift(product); // Add to beginning

    const limited = updated.slice(0, 10); // Limit to 10 recent products

    localStorage.setItem('recentlyViewed', JSON.stringify(limited));
  };

  // Sorting functionality
  const getSortedProducts = () => {
    const sortedProducts = [...products];
    switch(sortOption) {
      case 'price-low-high':
        return sortedProducts.sort((a, b) => a.special_price - b.special_price);
      case 'price-high-low':
        return sortedProducts.sort((a, b) => b.special_price - a.special_price);
      case 'name-a-z':
        return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
        return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sortedProducts;
    }
  };

  const handleFilterChange = (type, value, checked = null) => {
  setSelectedFilters(prev => {
    const newFilters = { ...prev };
    
    if (type === 'brands') {
      newFilters.brands = prev.brands.includes(value)
        ? prev.brands.filter(item => item !== value)
        : [...prev.brands, value];
    } else if (type === 'price') {
      newFilters.price = value;
    } else if (type === 'categories') {
      newFilters.categories = prev.categories.includes(value)
        ? prev.categories.filter(item => item !== value)
        : [...prev.categories, value];
    } else if (type === 'filters') {
      // For filters, we need to handle checkbox state properly
      if (checked !== null) {
        newFilters.filters = checked
          ? [...prev.filters, value]
          : prev.filters.filter(item => item !== value);
      } else {
        // Toggle if no checked parameter
        newFilters.filters = prev.filters.includes(value)
          ? prev.filters.filter(item => item !== value)
          : [...prev.filters, value];
      }
    }
    return newFilters;
  });
};

  const handlePriceChange = (values) => {
    let min = Math.max(1, values[0]);     // clamp to >= 1
    let max = Math.max(1, values[1]);   // clamp to <= 100

    // Ensure min never exceeds max
    if (min > max) {
      min = max;
    }

    setSelectedFilters((prev) => ({
      ...prev,
      price: { min, max }
    }));
  };

  const STEP = 100;
  const MIN = priceRange[0];
  const MAX = priceRange[1];

  // slider local state
  const [values, setValues] = useState([
    selectedFilters.price.min,
    selectedFilters.price.max,
  ]);

  // sync with external filters (e.g. reset button)
  useEffect(() => {
    setValues([selectedFilters.price.min, selectedFilters.price.max]);
  }, [selectedFilters.price.min, selectedFilters.price.max]);


  const CategoryTree = ({ 
    categories, 
    level = 0, 
    selectedFilters, 
    onFilterChange 
  }) => {
    const [expandedCategories, setExpandedCategories] = useState([]);
  
    const toggleCategory = (categoryId) => {
      setExpandedCategories(prev => 
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    };
  
    return (
      <div className="mt-2 max-h-48 overflow-y-auto pr-2">
      
        {categories.map((category) => (
          <div key={category._id}>
            <div className={`flex items-center gap-2 ${level > 0 ? `ml-${level * 4}` : ''}`}>
              <Link
                href={`/category/${slug}/${category.category_slug}`}
                className="p-2 hover:bg-gray-100 rounded inline-flex items-center"
              >      {/*
                {category.image && (
                  <div className="w-6 h-6 mr-2 relative">
                    
                    <Image
                      src={category.image.startsWith('http') ? category.image : `${category.image}`}
                      alt={category.category_name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                  */}
                {category.category_name}
              </Link>
            </div>
            
            {category.subCategories?.length > 0 && 
              expandedCategories.includes(category._id) && (
                <CategoryTree 
                  categories={category.subCategories} 
                  level={level + 1}
                  selectedFilters={selectedFilters}
                  onFilterChange={onFilterChange}
                />
              )}
          </div>
        ))}
      </div>
    );
  };

  const updateUrlParams = useCallback((filtersObj, sortOpt) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (filtersObj.brands?.length > 0) {
      params.set("brands", filtersObj.brands.join(","));
    }
    if (filtersObj.categories?.length > 0) {
      params.set("categories", filtersObj.categories.join(","));
    }
    if (filtersObj.filters?.length > 0) {
      params.set("filters", filtersObj.filters.join(","));
    }
    if (filtersObj.price?.min !== undefined && filtersObj.price?.min !== priceRange[0]) {
      params.set("minPrice", filtersObj.price.min);
    }
    if (filtersObj.price?.max !== undefined && filtersObj.price?.max !== priceRange[1]) {
      params.set("maxPrice", filtersObj.price.max);
    }
    if (sortOpt) {
      params.set("sort", sortOpt);
    }
    const queryString = params.toString();
    const newUrl = window.location.pathname + (queryString ? `?${queryString}` : "");
    window.history.replaceState(null, "", newUrl);
  }, [priceRange]);

  useEffect(() => {
    if (categoryData.main_category && categoryData.category && initialLoadComplete) {
      if (!isFirstLoadDone.current) {
        isFirstLoadDone.current = true;
        return;
      }
      updateUrlParams(selectedFilters, sortOption);
      fetchFilteredProducts(categoryData, 1);
    }
  }, [selectedFilters, sortOption, categoryData.main_category, categoryData.category, initialLoadComplete, updateUrlParams]);

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      brands: [],
      price: { min: priceRange[0], max: priceRange[1] },
      filters: []
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchFilteredProducts(categoryData, page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    const hasPrev = pagination.currentPage > 1;
    const hasNext = pagination.currentPage < pagination.totalPages;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
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
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!hasPrev}
          className={`p-2 rounded-md ${!hasPrev ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
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
            {endPage < pagination.totalPages - 1 && <span className="px-2">...</span>}
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
          className={`p-2 rounded-md ${!hasNext ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

 // Add states to track if components have content
   const [hasBannerContent, setHasBannerContent] = useState(false);
   const [hasFlashContent, setHasFlashContent] = useState(false);
   const [hasCategoryMainContent, setHasCategoryMainContent] = useState(false);
   const [checkingContent, setCheckingContent] = useState(false);
   const checkedSlugRef = useRef(null);
 
   // Function to check if components have content
  const checkComponentsContent = useCallback(async () => {
    if (!slug) {
      console.log("❌ No slug provided");
      return;
    }

    if (checkedSlugRef.current === slug) {
      return;
    }
    
    setCheckingContent(true);
    console.log("🔍 Starting content check for slug:", slug);
    
    try {
      const bannerUrl = `/api/main-cat-banner?categorySlug=${slug}`;
      const bannerRes = await fetch(bannerUrl);
      const bannerData = await bannerRes.json();
      const hasBanners = bannerData && bannerData.banners && bannerData.banners.length > 0;
      setHasBannerContent(hasBanners);

      const flashUrl = `/api/fetchflashcat?categorySlug=${slug}`;
      const flashRes = await fetch(flashUrl);
      const flashData = await flashRes.json();
      const hasFlash = flashData && flashData.banners && flashData.banners.length > 0;
      setHasFlashContent(hasFlash);

      const mainUrl = `/api/main-tird-sec/${slug}`;
      const mainRes = await fetch(mainUrl);
      const mainData = await mainRes.json();
      const hasMainContent = mainData && mainData.data && mainData.data.length > 0;
      setHasCategoryMainContent(hasMainContent);

      checkedSlugRef.current = slug;

      console.log("📊 Final content check results:", {
        banners: hasBanners,
        flash: hasFlash,
        main: hasMainContent
      });
    } catch (error) {
      console.error("❌ Error checking component content:", error);
      setHasBannerContent(false);
      setHasFlashContent(false);
      setHasCategoryMainContent(false);
    } finally {
      setCheckingContent(false);
      console.log("✅ Content check completed");
    }
  }, [slug]);
 
   // Check content when slug changes
   useEffect(() => {
     if (slug) {
       checkComponentsContent();
     }
   }, [slug, checkComponentsContent]);
 
   // Determine if we should show the fallback
  const showFallback =
  !hasBannerContent &&
  !hasFlashContent &&
  !hasCategoryMainContent;

 
   // Show loader while checking content or loading
  if (checkingContent || !initialLoadComplete) {
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
         </div>
       </div>
     );
   }
 
   if (!categoryData.category) {
     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-2xl font-bold">Category not found</h1>
       </div>
     );
   }
  console.log("🔍 Debug:", { 
  hasBannerContent, 
  hasFlashContent, 
  hasCategoryMainContent, 
  showFallback,
  checkingContent,
  loading,
  initialLoadComplete
});
console.log("slug:", slug);
  return (
     <div className="px-3 sm:px-8" style={{ backgroundColor: showFallback ? "#FFFFFF" : "#EBEBEB" }}>
      <div className="max-w-7xl container mx-auto">
        <ToastContainer />
        
        {showFallback ? (
          // Show fallback component when all three have no content
          <CategoryPage />
        ) : (
          // Show the original three components
          <>
            <BannerSlider categorySlug={slug} />
            <FlashCategorySlider slug={params.slug} />
            <ShopByBrand categorySlug={slug} />
            <CategoryImageSection categorySlug={slug} index={0}/>
            <CategoryImageSection categorySlug={slug} index={1} />
           <CategoryMainPage categorySlug={slug} />
           <CategoryImageSection categorySlug={slug} index={2} />
          </>
        )} 
      </div>
    </div>
  );
}