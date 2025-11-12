"use client";
import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "react-feather";
import Addtocart from "@/components/AddToCart";
import { ToastContainer, toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { Range as ReactRange } from "react-range";

export default function SearchComponent() {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: [],
    main_category: null
  });
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const urlQuery = { slug: searchParams.get("slug") || null, category: category || null };
  const [products, setProducts] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const { slug } = useParams();
  const [sortOption, setSortOption] = useState('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({}); 
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [wishlist, setWishlist] = useState([]); 
  const toggleFilters = () => setIsFiltersExpanded(!isFiltersExpanded);
  const toggleCategories = () => {
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };
  const toggleFilterGroup = (id) => {
    setExpandedFilters(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleBrands = () => setIsBrandsExpanded(!isBrandsExpanded);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    // Fetch initial data
    useEffect(() => {
        let slug = urlQuery.slug || urlQuery.category;
      console.log("Slug/category changed:", slug);
      if (slug ) {
        fetchInitialData(slug);
      }
    }, [urlQuery.slug, urlQuery.category]);
    
    const fetchInitialData = async (slug) => {
      try {
        setLoading(true);
        let search_slug = slug;
        if( search_slug == "Large Appliance" ){
          search_slug = "large-appliance";
        }
        if( search_slug == "Small Appliances" ){
          search_slug = "small-appliances";
        }
        if( search_slug == "Televisions" ){
          search_slug = "televisions";
        }
        if( search_slug == "Computers & Laptops" ){
          search_slug = "computers-laptops";
        }
        if( search_slug == "Mobiles & Accessories" ){
          search_slug = "mobiles-accessories";
        }
        if( search_slug == "Gadgets" ){
          search_slug = "gadgets";
        }
        if( search_slug == "Accessories" ){
          search_slug = "accessories";
        }
        if( search_slug == "Sound Systems" ){
          search_slug = "sound-systems";
        }
        const categoryRes = await fetch(`/api/categories/${search_slug}`);
        const categoryData = await categoryRes.json();
        const banners = categoryData.main_category?.banners || [];
        setCategoryData({
          ...categoryData,
          categoryTree: categoryData.category,
          allCategoryIds: categoryData.allCategoryIds,
          banners: banners
        });
  
        if (categoryData.products?.length > 0) {
          const prices = categoryData.products.map(p => p.special_price);
          let minPrice = Math.min(...prices);
          let maxPrice = Math.max(...prices);
  
          // ✅ Fix: If only one product, add a small buffer
          if (minPrice === maxPrice) {
            minPrice = minPrice - 1; // or e.g., minPrice * 0.95
            maxPrice = maxPrice + 1; // or e.g., maxPrice * 1.05
          }
  
          setPriceRange([minPrice, maxPrice]);
          setSelectedFilters(prev => ({
            ...prev,
            price: { min: minPrice, max: maxPrice }
          }));
        }
  
        const groups = {};
        categoryData.filters.forEach(filter => {
          const groupId = filter.filter_group_name;
          if (groupId) {
            if (!groups[groupId]) {
              groups[groupId] = {
                _id: groupId,
                name: filter.filter_group_name,
                slug: filter.filter_group_name.toLowerCase().replace(/\s+/g, '-'),
                filters: []
              };
            }
            groups[groupId].filters.push(filter);
          }
        });
        console.log("Filter groups:", groups);
        setFilterGroups(groups);
        
        // Fetch products after setting up initial data
        await fetchFilteredProducts(categoryData, 1, true);
      } catch (error) {
        ////toast.error("Error fetching initial data");
      } finally {
        setInitialLoadComplete(true);
        // setLoading(false);
      }
    };
    const [brandMap, setBrandMap] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        let url = '/api/search?';
        
        if (searchQuery) {
          url += `query=${encodeURIComponent(searchQuery)}`;
        }
        
        if (category) {
          if (searchQuery) url += '&';
          url += `category=${encodeURIComponent(category)}`;
        }

        // Add cache-busting timestamp and log outgoing request
        url += (url.endsWith('?') ? '' : '&') + `t=${Date.now()}`;
        console.log('[SearchComponent] Calling:', url);

        const res = await axios.get(url);
        const searchData = res.data;
        const productsData = searchData.products || searchData;

        console.log('[SearchComponent] /api/search responded with products:', Array.isArray(productsData) ? productsData.length : 'unknown');

        setProducts(productsData);
        
        // Calculate price range from search results
        if (productsData.length > 0) {
          const prices = productsData.map(p => {
            const price = p.special_price > 0 && p.special_price < p.price 
              ? Number(p.special_price) 
              : Number(p.price);
            return price;
          });
          
          let minPrice = Math.min(...prices);
          let maxPrice = Math.max(...prices);

          // If only one product, add a small buffer
          if (minPrice === maxPrice) {
            minPrice = Math.max(1, minPrice - 100);
            maxPrice = maxPrice + 100;
          }

          setPriceRange([minPrice, maxPrice]);
          setSelectedFilters(prev => ({
            ...prev,
            price: { min: minPrice, max: maxPrice }
          }));
          
          // Also update the slider values
          setValues([minPrice, maxPrice]);
        }

        // Extract brands from search results for filtering
        const brandsFromResults = Array.from(new Set(productsData.map(product => product.brand) || []))
          .filter(brandId => brandId && brandMap[brandId])
          .map(brandId => ({
            _id: brandId,
            brand_name: brandMap[brandId],
            count: productsData.filter(product => product.brand === brandId).length || 0
          }));

        // Update categoryData with brands from search results
        setCategoryData(prev => ({
          ...prev,
          brands: brandsFromResults
        }));

      } catch (err) {
        //toast.error("Failed to load search results");
        console.error("[SearchComponent] /api/search error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery || category) {
      fetchResults();
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [searchQuery, category]);

  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        console.error(result.error);
      } else {
        const data = result.data;
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

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalProducts: 0
  });
  const itemsPerPage = 12;

  const fetchFilteredProducts = useCallback(async (categoryData, pageNum = 1, initialLoad = false) => {
    try {
      if (!initialLoad) setLoading(true);
      const query = new URLSearchParams();
      const categoryIds = selectedFilters.categories.length > 0
        ? selectedFilters.categories
        : categoryData.allCategoryIds;

      query.set('categoryIds', categoryIds.join(','));
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
      //toast.error('Error fetching products'+error);
    } finally {
      if (!initialLoad) setLoading(false);
    }
  }, [selectedFilters]);

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

  const handleProductClick = (product) => {
    // You can add any tracking logic here if needed
  };

 const handleFilterChange = (type, value) => {
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
    } else {
      newFilters.filters = prev.filters.includes(value)
        ? prev.filters.filter(item => item !== value) // Fixed: was filtering wrong
        : [...prev.filters, value];
    }
    return newFilters;
  });
};

const applyFilters = useCallback(async (pageNum = 1) => {
  try {
    setLoading(true);
    
    // For search results (query or category search)
    if (searchQuery || category) {
      const filteredResults = await filterSearchResults(pageNum);
      setProducts(filteredResults.products);
      setPagination(filteredResults.pagination);
    } 
    // For category pages
    else if (categoryData.main_category && categoryData.category) {
      await fetchFilteredProducts(categoryData, pageNum);
    }
  } catch (error) {
    //toast.error('Error applying filters: ' + error.message);
  } finally {
    setLoading(false);
  }
}, [searchQuery, category, categoryData, selectedFilters]);

useEffect(() => {
  if (initialLoadComplete) {
    applyFilters(1);
  }
}, [selectedFilters, initialLoadComplete, applyFilters]);


const filterProductsClientSide = (products) => {
  let filtered = products.filter(product => {
    // Brand filter
    if (selectedFilters.brands.length > 0 && !selectedFilters.brands.includes(product.brand)) {
      return false;
    }
    
    // Price filter - FIXED THIS PART
    const productPrice = product.special_price > 0 && product.special_price < product.price 
      ? Number(product.special_price) 
      : Number(product.price);
    
    if (productPrice < selectedFilters.price.min || productPrice > selectedFilters.price.max) {
      return false;
    }
    
    return true;
  });

  // Apply sorting to filtered results
  switch(sortOption) {
    case 'price-low-high':
      return filtered.sort((a, b) => {
        const priceA = a.special_price > 0 && a.special_price < a.price ? Number(a.special_price) : Number(a.price);
        const priceB = b.special_price > 0 && b.special_price < b.price ? Number(b.special_price) : Number(b.price);
        return priceA - priceB;
      });
    case 'price-high-low':
      return filtered.sort((a, b) => {
        const priceA = a.special_price > 0 && a.special_price < a.price ? Number(a.special_price) : Number(a.price);
        const priceB = b.special_price > 0 && b.special_price < b.price ? Number(b.special_price) : Number(b.price);
        return priceB - priceA;
      });
    case 'name-a-z':
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-z-a':
      return filtered.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return filtered;
  }
};



const filterSearchResults = async (pageNum = 1) => {
  const queryParams = new URLSearchParams();
  
  // Add search parameters
  if (searchQuery) queryParams.set('query', searchQuery);
  if (category) queryParams.set('category', category);
  
  // Add filter parameters
  if (selectedFilters.brands.length > 0) {
    queryParams.set('brands', selectedFilters.brands.join(','));
  }
  if (selectedFilters.categories.length > 0) {
    queryParams.set('categories', selectedFilters.categories.join(','));
  }
  queryParams.set('minPrice', selectedFilters.price.min);
  queryParams.set('maxPrice', selectedFilters.price.max);
  
  if (selectedFilters.filters.length > 0) {
    queryParams.set('filters', selectedFilters.filters.join(','));
  }
  
  // Add pagination
  queryParams.set('page', pageNum);
  queryParams.set('limit', itemsPerPage);
  
  const res = await fetch(`/api/search/filter?${queryParams}`);
  return await res.json();
};
  
  const handlePriceChange = (values) => {
  let min = Math.max(1, Number(values[0]));     // Convert to number
  let max = Math.max(1, Number(values[1]));   // Convert to number

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
const MIN = priceRange[0] || 0;
const MAX = priceRange[1] || 100000;
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

  // Add this variable right before return
  const filteredProducts = searchQuery || category 
    ? filterProductsClientSide(products)
    : getSortedProducts();


  return (
    <div className="container mx-auto px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-gray-600 pl-1">
          Search Results for 
          {category && `  ${category}`}
        </h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 gap-4">
          <p className="text-gray-600">
            {products.length} result{products.length !== 1 ? 's' : ''} found
          </p>
          
          <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  </select>
                </div>
              </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : products.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="w-full md:w-[250px] shrink-0">
              {(selectedFilters.brands.length > 0 || selectedFilters.categories.length > 0 || selectedFilters.filters.length > 0 || selectedFilters.price.min !== priceRange[0] || selectedFilters.price.max !== priceRange[1]) && (
                <div className="bg-white p-4 rounded shadow">
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
                    {selectedFilters.categories.map(categoryId => {
                      const category = categoryData.category?.find(c => c._id === categoryId);
                      return category ? (
                        <span
                          key={categoryId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {category.category_name}
                          <button
                            onClick={() => handleFilterChange('categories', categoryId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                    {selectedFilters.brands.map(brandId => {
                      const brand = categoryData.brands.find(b => b._id === brandId);
                      return brand ? (
                        <span
                          key={brandId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {brand.brand_name}
                          <button
                            onClick={() => handleFilterChange('brands', brandId)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}

                    {selectedFilters.filters.map(filterId => {
                      const filter = Object.values(filterGroups)
                        .flatMap(g => g.filters)
                        .find(f => f._id === filterId);
                      return filter ? (
                        <span
                          key={filterId}
                          className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
                        >
                          {filter.filter_name}
                          <button
                            onClick={() => handleFilterChange('filters', filterId)}
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
                            onClick={() => setSelectedFilters(prev => ({
                              ...prev,
                              price: { min: priceRange[0], max: priceRange[1] }
                            }))}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <h3 className="text-base font-semibold mb-4 text-gray-700">Price Range</h3>
                <ReactRange values={values} step={STEP} min={MIN} max={MAX} onChange={(newValues) => setValues(newValues)} onFinalChange={(newValues) => handlePriceChange(newValues)} renderTrack={({ props, children }) => (
                  <div {...props} className="w-full h-2 rounded-lg bg-gray-200 relative" >
                    <div
                      className="absolute h-2 bg-gray-500 rounded-lg"
                      style={{
                        left: `${((values[0] - MIN) / (MAX - MIN)) * 100}%`,
                        width: `${((values[1] - values[0]) / (MAX - MIN)) * 100}%`,
                      }}
                    />
                      {children}
                    </div>
                  )}
                  renderThumb={({ props, index }) => {
                    const { key, ...rest } = props; // remove key from spread

                    return (
                      <div
                        key={key} // assign key directly
                        {...rest} // spread remaining props
                        className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer relative
                              ${index === 0 ? "bg-blue-500 z-10" : "bg-green-500 z-20"}`}
                      >
                        {/*
                            <span className="absolute -top-6 text-xs bg-gray-700 text-white px-2 py-1 rounded">
                              {index === 0 ? "Min" : "Max"}
                            </span>
                            */}
                      </div>
                    );
                  }}
                />

                <div className="flex justify-between text-sm text-gray-600 mt-6">
                  <span>₹{values[0].toLocaleString()}</span>
                  <span>₹{values[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                  <button onClick={toggleBrands} className="text-gray-500 hover:text-gray-700">
                    {isBrandsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {isBrandsExpanded && (
                  <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                    {/* Get unique brands from search results */}
                    {Array.from(new Set(products.map(product => product.brand)))
                      .filter(brandId => brandId && brandMap[brandId]) // Filter out null/undefined brands
                      .map(brandId => {
                        const brandName = brandMap[brandId];
                        const brandCount = products.filter(product => product.brand === brandId).length;
                        
                        return (
                          <li key={brandId} className="flex items-center">
                            <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedFilters.brands.includes(brandId)}
                                onChange={() => handleFilterChange("brands", brandId)}
                                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-600">
                                {brandName} ({brandCount})
                              </span>
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>  

               {/* Dynamic Filters */}
                {isFiltersExpanded && Object.values(filterGroups).length > 0 &&  (
                  <div className="bg-white p-4 rounded-lg shadow-sm border mb-3 border-gray-100">
                    <div className="pb-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-700">Product Filters</h3>
                    </div>
                    <div className="space-y-4">
                      {Object.values(filterGroups).map(group => (
                        <div key={group._id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <button onClick={() => toggleFilterGroup(group._id)} className="flex justify-between items-center w-full group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{group.name}</span>
                            <ChevronDown 
                              size={18}
                              className={`text-gray-400 transition-transform duration-200 ${
                                expandedFilters[group._id] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
  
                          {expandedFilters[group._id] && (
                            <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                              {group.filters.map(filter => (
                                <li key={filter._id} className="flex items-center">
                                  <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={selectedFilters.filters.includes(filter._id)}
                                      onChange={() => handleFilterChange('filters', filter._id)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">{filter.filter_name}</span>
                                    {filter.count && (
                                      <span className="text-xs text-gray-400 ml-auto">
                                        ({filter.count})
                                      </span>
                                    )}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {filteredProducts.map(product => (
                  <div key={product._id} className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                    <div className="relative aspect-square bg-white">
                       <Link
                        href={`/product/${product.slug}`}
                        className="block mb-2"
                        onClick={() => handleProductClick(product)}
                      >
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
                      </Link>
                    
                      {(() => {
                          const discount = Math.round(
                            100-(Number(product.special_price) / Number(product.price)) * 100
                          );

                          return (
                            Number(product.special_price) > 0 &&
                            Number(product.special_price) < Number(product.price) &&
                            discount > 0 && (
                              <span className="absolute top-3 left-2 bg-red-500 text-white text-xs font-bold px-4 py-0.5 rounded z-10">
                                {discount}% OFF
                              </span>
                            )
                          );
                        })()}

                    
                      <div className="absolute top-2 right-2">
                        <ProductCard productId={product._id} />
                      </div>
                    </div>
                
                    <div className="p-2 md:p-4 flex flex-col h-full">
                      <h4 className="text-xs text-gray-500 mb-2 uppercase">
                      <Link
                                              href={`/brand/${brandMap[product.brand] ? brandMap[product.brand].toLowerCase().replace(/\s+/g, "-") : ""}`}
                                              className="hover:text-blue-600"
                                            >
                                              {brandMap[product.brand] || ""}
                                            </Link>
                                            </h4>
                      <Link
                        href={`/product/${product.slug}`}
                        className="block mb-2"
                        onClick={() => handleProductClick(product)}
                      >
                        <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] line-clamp-2 min-h-[40px]">
                          {product.name}
                        </h3>
                      </Link>
                      
                          <div className="mb-3">
                           {product.model_number && ( 
                              <div className="bg-gray-100 rounded-md inline-block mb-2">
                                <span className="text-sm font-semibold text-gray-700 tracking-wide">
                                  Model: <span className="text-[#0069c6]">({product.model_number})</span>
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-base font-semibold text-red-600">
                                ₹ {(
                                  product.special_price &&
                                  product.special_price > 0 &&
                                  product.special_price !== '0' &&
                                  product.special_price < product.price
                                    ? Math.round(product.special_price)
                                    : Math.round(product.price)
                                ).toLocaleString()}
                              </span>

                              {product.special_price > 0 &&
                                product.special_price !== '0' &&
                                product.special_price < product.price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₹ {Math.round(product.price).toLocaleString()}
                                  </span>
                              )}
                            </div>
                          </div>
                    
                      <h4
                        className={`text-xs mb-3 ${
                          product.stock_status === "In Stock" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.stock_status}
                        {product.stock_status === "In Stock" && product.quantity
                          ? `, ${product.quantity} units`
                          : ""}
                      </h4>
                    
                      <div className="mt-auto flex items-center justify-between gap-2 ccs">
                        <Addtocart
                          productId={product._id} 
                          stockQuantity={product.quantity}  
                          special_price={product.special_price}
                          className="w-full text-xs sm:text-sm py-1.5"
                        />
                        <a
                          href={`https://wa.me/919865555000?text=${encodeURIComponent(`Check Out This Product:${apiUrl}/product/${product.slug}`)}`} 
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
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <img 
                src="/images/no-productbox.png" 
                alt="No products found" 
                className="mx-auto mb-6 w-48 h-48"
              />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Products Found
              </h2>
              <p className="text-gray-600">
                Try different search terms or browse our categories
              </p>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}