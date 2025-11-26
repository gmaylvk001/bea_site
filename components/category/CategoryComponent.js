"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Navigation, Autoplay,  EffectFade  } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FaSortAmountDown, FaSlidersH } from 'react-icons/fa';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "react-feather";
import CategoryProductsSection from '@/components/category/categoryproductsection'
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import { Range as ReactRange } from "react-range";

export default function CategoryPage() {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: [],
    main_category: null
  });
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [products, setProducts] = useState([]);
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
  const [currentCategoryBannerIndex, setCurrentCategoryBannerIndex] = useState(0);
  
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
     // console.log('🔍 Fetching category data for slug:', slug);
      
      const categoryRes = await fetch(`/api/categories/${slug}`);
      const categoryData = await categoryRes.json();
      
      console.log('📦 Raw API Response:', categoryData);

    setCategoryData({
      ...categoryData,
      categoryTree: categoryData.category,
      allCategoryIds: categoryData.allCategoryIds,
      banners: categoryData.main_category?.banners || []
    });

    // Price range logic
    if (categoryData.products?.length > 0) {
      const prices = categoryData.products.map(p => p.special_price || p.price);
      let minPrice = Math.min(...prices);
      let maxPrice = Math.max(...prices);

      if (minPrice === maxPrice) {
        minPrice = Math.max(1, minPrice - 100);
        maxPrice = maxPrice + 100;
      }

      setPriceRange([minPrice, maxPrice]);
      setSelectedFilters(prev => ({
        ...prev,
        price: { min: minPrice, max: maxPrice }
      }));
    }

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

    await fetchFilteredProducts(categoryData, 1, true);
    
  } catch (error) {
    console.error('💥 Error in fetchInitialData:', error);
    toast.error("Error fetching initial data");
    router.push('/noproduct');
  } finally {
    setInitialLoadComplete(true);
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

  const fetchFilteredProducts = useCallback(async (categoryData, pageNum = 1, initialLoad = false) => {
    try {
      if (!initialLoad) setLoading(true);
      const query = new URLSearchParams();
      const categoryIds = selectedFilters.categories.length > 0
        ? selectedFilters.categories
        : categoryData.allCategoryIds;

     // query.set('categoryIds', categoryIds.join(','));
      query.set('sub_category_new',  categoryData.main_category.md5_cat_name);
      query.set('page', pageNum);
      query.set('limit', itemsPerPage);

      if (selectedFilters.brands.length > 0) {
        query.set('brands', selectedFilters.brands.join(','));
      }
      query.set('minPrice', selectedFilters.price.min);
      query.set('maxPrice', selectedFilters.price.max);
      
      if (selectedFilters.filters.length > 0) {
        query.set('filters', selectedFilters.filters.join(','));
      }

      const res = await fetch(`/api/product/filter/main?${query}`);
      const { products, pagination: paginationData } = await res.json();

     // console.log('Raw filter Response:', products);

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
      toast.error('Error fetching products'+error);
      // Redirect to 404 on error
      router.push('/noproduct');
    } finally {
      if (!initialLoad) setLoading(false);
    }
  }, [selectedFilters]);

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

  useEffect(() => {
    if (categoryData.main_category && categoryData.category && initialLoadComplete) {
      fetchFilteredProducts(categoryData, 1);
    }
  }, [selectedFilters, categoryData.main_category, categoryData.category, initialLoadComplete]);

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

  // Show loader until all data is loaded
  if (loading || !initialLoadComplete) {
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

  return (


   <main className="bg-white min-h-screen">
  {/* ===== Main Hero Banner Section ===== */}
  {categoryData.banners && categoryData.banners.length > 0 && (
    <section className="relative px-4 md:px-6 pt-4 pb-8">
      <Swiper
        modules={[Navigation, Autoplay, EffectFade]}
        effect="fade"
        spaceBetween={0}
        speed={1200}
        slidesPerView={1}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        navigation={{
          nextEl: ".banner-swiper-button-next",
          prevEl: ".banner-swiper-button-prev",
        }}
        className="rounded-3xl overflow-hidden shadow-xl"
      >
        {categoryData.banners.map((banner, index) => (
          <SwiperSlide key={banner._id || index}>
            {banner.redirect_url ? (
              <Link href={banner.redirect_url} className="block w-full">
                <div className="w-full overflow-hidden cursor-pointer">
                  <div className="relative aspect-[1248/390] w-full">
                    <Image
                      src={
                        banner.banner_image.startsWith("http")
                          ? banner.banner_image
                          : `${banner.banner_image}`
                      }
                      alt={banner.banner_name}
                      fill
                      className="object-cover rounded-3xl"
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1248px"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent rounded-3xl"></div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="w-full overflow-hidden">
                <div className="relative aspect-[1248/390] w-full">
                  <Image
                    src={
                      banner.banner_image.startsWith("http")
                        ? banner.banner_image
                        : `${banner.banner_image}`
                    }
                    alt={banner.banner_name}
                    fill
                    className="object-cover rounded-3xl"
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1248px"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent rounded-3xl"></div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}

        {/* Navigation Buttons */}
        <div className="banner-swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300">
          <ChevronLeft className="text-gray-800" size={24} />
        </div>
        <div className="banner-swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg cursor-pointer transition-all duration-300">
          <ChevronRight className="text-gray-800" size={24} />
        </div>
      </Swiper>
    </section>
  )}

  {/* ===== Main Categories Section ===== */}
  <section className="px-4 md:px-6 py-8 bg-gray-100">
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-3 text-left">
          {categoryData.main_category?.category_name ||
           categoryData.categoryTree?.category_name ||
           "Categories"}
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2 justify-items-center">
        {categoryData.category.map((cat) => (
          <Link 
            href={`/category/${slug}/${cat.category_slug}`} 
            key={cat._id}
            className="group"
          >
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300 w-[240px] h-full">
              {/* Category Image with Colorful Gradient Background */}
              <div className={`relative h-48 overflow-hidden rounded-t-2xl ${
                cat.bgColorClass || 
                'bg-gradient-to-br from-[#5ce1e6] via-white to-[#0097b2]'
              }`}>
                <Image 
                  src={cat.image || '/images/default-category.jpg'} 
                  alt={cat.category_name} 
                  fill 
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-center">
                  {cat.category_name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>

  {/* ===== Individual Category Sections with Category Banners and Products ===== */}
  {categoryData.category && categoryData.category.map((mainCategory, index) => (
    <section key={mainCategory._id} className="mb-12">
     

      {/* ===== Small Banner / Flash Sale Section ===== */}
    
{/* ===== Alternative Layout - Category Image on Side ===== */}


      

      {/* Products Section for this Category */}
      <CategoryProductsSection 
        mainCategory={mainCategory} 
        index={index}
        slug={slug}
        brandMap={brandMap}
        apiUrl={apiUrl}
        handleProductClick={handleProductClick}
        categoryData={categoryData}
      />
    </section>
  ))}

  {/* ===== Brands Section ===== */}
  {categoryData.brands && categoryData.brands.length > 0 && (
    <section className="px-4 md:px-6 py-12 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-left text-2xl md:text-3xl font-bold text-gray-800 mb-3">Shop by Brand</h2>
        </div>
        
        <Swiper
          modules={[Autoplay]}
          spaceBetween={20}
          slidesPerView={2}
          autoplay={{ 
            delay: 3000, 
            disableOnInteraction: false 
          }}
          breakpoints={{
            480: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            768: { slidesPerView: 5 },
            1024: { slidesPerView: 6 },
            1280: { slidesPerView: 8 }
          }}
          className="pb-2"
        >
          {categoryData.brands.map(brand => {
            const fullBrandData = brandMap[brand._id] || brand;
            const brandImage = fullBrandData.logo || fullBrandData.image;
            
            return (
              <SwiperSlide key={brand._id}>
                <Link 
                  href={`/brand/${brand.brand_name?.toLowerCase().replace(/\s+/g, "-") || brand._id}`}
                  className="block"
                >
                  <div className="bg-white rounded-xl p-4 h-24 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                    <div className="relative w-full h-12">
                      {brandImage ? (
                        <Image
                          src={
                            brandImage.startsWith("http") 
                              ? brandImage 
                              : `/uploads/Brands/${brandImage}`
                          }
                          alt={brand.brand_name || "Brand"}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-700 text-center">
                          {brand.brand_name || "Brand"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  )}

  <ToastContainer />
</main>
  );
}
