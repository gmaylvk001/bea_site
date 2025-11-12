"use client";
import  React,{ useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "react-feather";
import { FaPlus, FaMinus } from "react-icons/fa";
import ReactPaginate from "react-paginate";

export default function CategoryPage() {
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: []
  });
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

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5; // 5 records per page
  
    const handlePageClick = ({ selected }) => {
      setCurrentPage(selected);
    };

    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

    // Toggle function
    const toggleCategories = () => {
      setIsCategoriesExpanded(!isCategoriesExpanded);
    };

  useEffect(() => {
    if (slug) {
      fetchInitialData();
    }
  }, [slug]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch category data (brands, filters, etc.)
      const categoryRes = await fetch(`/api/categories/${slug}`);
      const categoryData = await categoryRes.json();
      setCategoryData(categoryData);
      
      // Set initial price range based on products in category
      if (categoryData.products?.length > 0) {
        const prices = categoryData.products.map(p => p.special_price || p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);
        setSelectedFilters(prev => ({
          ...prev,
          price: { min: minPrice, max: maxPrice }
        }));
      }
      
      // Organize filters by their groups
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
      setFilterGroups(groups);
      
      // Fetch initial products
      await fetchFilteredProducts(categoryData.category);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredProducts = async (category) => {
    try {
      setLoading(true);
      
      const query = new URLSearchParams();
      const categoryId = category.map(category => category._id);
      // query.set('categoryIds', categoryId.join(','));
      const categoryIds = selectedFilters.categories.length > 0 
      ? selectedFilters.categories 
      : category?.map(c => c._id);

    query.set('categoryIds', categoryIds.join(','));
      query.set('categoryId', categoryId);
      
      if (selectedFilters.brands.length > 0) {
        query.set('brands', selectedFilters.brands.join(','));
      }
      
      query.set('minPrice', selectedFilters.price.min);
      query.set('maxPrice', selectedFilters.price.max);
      
      if (selectedFilters.filters.length > 0) {
        query.set('filters', selectedFilters.filters.join(','));
      }
      
      const res =await fetch(`/api/product/filter/main?${query}`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setLoading(false);
    }
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
      } else  if (type === 'categories') {
        newFilters.categories = prev.categories.includes(value)
          ? prev.categories.filter(item => item !== value)
          : [...prev.categories, value];
      }
       else {
        newFilters.filters = prev.filters.includes(value)
          ? prev.filters.filter(item => item !== value)
          : [...prev.filters, value];
      }
      return newFilters;
    });
  };

  const handlePriceChange = (values) => {
    setSelectedFilters(prev => ({
      ...prev,
      price: { min: values[0], max: values[1] }
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // useEffect(() => {
  //   if (categoryData.category?._id) {
  //     fetchFilteredProducts(categoryData.category._id);
  //   }
  // }, [selectedFilters]);

  useEffect(() => {
    if (categoryData.main_category && categoryData.category) {
      fetchFilteredProducts( categoryData.category);
    }
  }, [selectedFilters, categoryData.main_category, categoryData.category]);

  const clearAllFilters = () => {
    setSelectedFilters({
      categories: [],
      brands: [],
      price: { min: priceRange[0], max: priceRange[1] },
      filters: []
    });
  };

  if (loading && !categoryData.category) {
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
  const pageCount = Math.ceil(products.length / itemsPerPage);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{categoryData.category.category_name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Filters */}
          {(selectedFilters.brands.length > 0 || 
           selectedFilters.filters.length > 0 ||
           selectedFilters.price.min !== priceRange[0] || 
           selectedFilters.price.max !== priceRange[1]) && (
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

          {/* Category Filter */}
          {/* <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Subcategories</h3>
            <ul className="space-y-2">
              {categoryData.category?.map(subCategory => (
                <li key={subCategory._id}>
                  <button
                    onClick={() => handleFilterChange('categories', subCategory._id)}
                    className={`block w-full text-left p-2 rounded ${
                      selectedFilters.categories.includes(subCategory._id)
                        ? 'bg-blue-100 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {subCategory.category_name}
                  </button>
                </li>
              ))}
            </ul>
          </div> */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li key='Categories'>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className={`flex-1 text-left p-2 rounded hover:bg-gray-100`}
                    onClick={toggleCategories} // Add click handler
                  >
                    {categoryData.main_category?.category_name || slug}
                  </button>
                  {categoryData.category?.length > 0 && (
                    <button 
                      className="p-2 hover:bg-gray-100 rounded"
                      onClick={toggleCategories}
                    >
                      {isCategoriesExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  )}
                </div>
                {isCategoriesExpanded && categoryData.category?.length > 0 && (
                  <ul className="ml-4 mt-2 border-l-2 border-gray-100 pl-4">
                    {categoryData.category.map(subCategory => (
                      <li key={subCategory._id}>
                        <button
                          onClick={() => handleFilterChange('categories', subCategory._id)}
                          className={`block w-full text-left p-2 rounded ${
                            selectedFilters.categories.includes(subCategory._id)
                              ? 'bg-blue-100 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {subCategory.category_name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </div>

          {/* Price Filter */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Price Range</h3>
            <div className="space-y-4">
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                step="100"
                value={selectedFilters.price.max}
                onChange={(e) => handlePriceChange([
                  selectedFilters.price.min, 
                  parseInt(e.target.value)
                ])}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>₹{selectedFilters.price.min}</span>
                <span>₹{selectedFilters.price.max}</span>
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Brands</h3>
            <ul className="space-y-2">
              {categoryData.brands.map(brand => (
                <li key={brand._id}>
                  <button
                    onClick={() => handleFilterChange('brands', brand._id)}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      selectedFilters.brands.includes(brand._id) 
                        ? 'bg-blue-100 font-medium' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {brand.image && (
                      <div className="w-8 h-8 mr-2 relative">
                        <Image
                          src={brand.image.startsWith('http') ? brand.image : `/uploads/brands/${brand.image}`}
                          alt={brand.brand_name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span>{brand.brand_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Filters */}
          {Object.values(filterGroups).map(group => (
            <div key={group._id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">{group.name}</h3>
              <ul className="space-y-2">
                {group.filters.map(filter => (
                  <li key={filter._id}>
                    <button
                      onClick={() => handleFilterChange('filters', filter._id)}
                      className={`block w-full text-left p-2 rounded ${
                        selectedFilters.filters.includes(filter._id)
                          ? 'bg-blue-100 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {filter.filter_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No products found matching your filters</h3>
              <button 
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p>{products.length} products found</p>
                {/* Sorting options can be added here */}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map(product => (
                  <div key={product._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="relative h-48 mb-4">
                      {product.images?.[0] && (
                        <Image
                          src={
                            product.images[0].startsWith('http') 
                              ? product.images[0] 
                              : `/uploads/products/${product.images[0]}`
                          }
                          alt={product.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      <Link href={`/products/${product.slug}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      {product.special_price && product.special_price !== product.price && (
                        <span className="text-gray-500 line-through">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xl font-bold text-blue-600">
                        ₹{(product.special_price || product.price).toLocaleString()}
                      </span>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
                {/* Pagination */}
                <ReactPaginate
                  previousLabel={"Previous"}
                  nextLabel={"Next"}
                  breakLabel={"..."}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  containerClassName={"pagination flex justify-center mt-4"}
                  activeClassName={"active"}
                  pageClassName={"page-item"}
                  pageLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
                  previousClassName={"page-item"}
                  nextClassName={"page-item"}
                  previousLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
                  nextLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
                  breakClassName={"page-item"}
                  breakLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
                />
    </div>
  );
}

// "use client";
// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { ChevronDown, ChevronUp } from "react-feather";

// export default function CategoryPage() {
//   const [categoryData, setCategoryData] = useState({
//     category: null,
//     brands: [],
//     filters: [],
//     pagination: {
//       total: 0,
//       page: 1,
//       pages: 1
//     }
//   });
//   const [products, setProducts] = useState([]);
//   const [selectedFilters, setSelectedFilters] = useState({
//     brands: [],
//     price: { min: 0, max: 100000 },
//     filters: []
//   });
//   const [priceRange, setPriceRange] = useState([0, 100000]);
//   const [filterGroups, setFilterGroups] = useState({});
//   const [loading, setLoading] = useState(true);
//   const { slug } = useParams();
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   // Get current page from URL or default to 1
//   const currentPage = parseInt(searchParams.get('page')) || 1;

//   useEffect(() => {
//     if (slug) {
//       fetchInitialData();
//     }
//   }, [slug, currentPage]);

//   const fetchInitialData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch category data with pagination
//       const categoryRes = await fetch(`/api/categories/${slug}?page=${currentPage}`);
//       const categoryData = await categoryRes.json();
      
//       setCategoryData(categoryData);
      
//       // Set initial price range based on products in category
//       if (categoryData.products?.length > 0) {
//         const prices = categoryData.products.map(p => p.special_price || p.price);
//         const minPrice = Math.min(...prices);
//         const maxPrice = Math.max(...prices);
//         setPriceRange([minPrice, maxPrice]);
//         setSelectedFilters(prev => ({
//           ...prev,
//           price: { min: minPrice, max: maxPrice }
//         }));
//       }
      
//       // Organize filters by their groups
//       const groups = {};
//       categoryData.filters.forEach(filter => {
//         const groupId = filter.filter_group_name;
        
//         if (groupId) {
//           if (!groups[groupId]) {
//             groups[groupId] = {
//               _id: groupId,
//               name: filter.filter_group_name,
//               slug: filter.filter_group_name.toLowerCase().replace(/\s+/g, '-'),
//               filters: []
//             };
//           }
//           groups[groupId].filters.push(filter);
//         }
//       });
//       setFilterGroups(groups);
      
//       // Set products from initial fetch
//       setProducts(categoryData.products);
//     } catch (error) {
//       console.error('Error fetching initial data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchFilteredProducts = async (categoryId) => {
//     try {
//       setLoading(true);
      
//       const query = new URLSearchParams();
//       query.set('categoryId', categoryId);
//       query.set('page', currentPage);
      
//       if (selectedFilters.brands.length > 0) {
//         query.set('brands', selectedFilters.brands.join(','));
//       }
      
//       query.set('minPrice', selectedFilters.price.min);
//       query.set('maxPrice', selectedFilters.price.max);
      
//       if (selectedFilters.filters.length > 0) {
//         query.set('filters', selectedFilters.filters.join(','));
//       }
      
//       const res = await fetch(`/api/product/filter?${query}`);
//       const data = await res.json();
//       setProducts(data);
      
//       // Update pagination if available in response
//       if (data.pagination) {
//         setCategoryData(prev => ({
//           ...prev,
//           pagination: data.pagination
//         }));
//       }
//     } catch (error) {
//       console.error('Error fetching filtered products:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ... (keep all your existing handler functions the same)

//   const handlePageChange = (newPage) => {
//     router.push(`/category/${slug}?page=${newPage}`);
//   };

//   // ... (rest of your component remains the same until the products grid)
//   const handleFilterChange = (type, value) => {
//     setSelectedFilters(prev => {
//       const newFilters = { ...prev };
      
//       if (type === 'brands') {
//         newFilters.brands = prev.brands.includes(value)
//           ? prev.brands.filter(item => item !== value)
//           : [...prev.brands, value];
//       } else if (type === 'price') {
//         newFilters.price = value;
//       } else {
//         newFilters.filters = prev.filters.includes(value)
//           ? prev.filters.filter(item => item !== value)
//           : [...prev.filters, value];
//       }
//       return newFilters;
//     });
//   };

//   const handlePriceChange = (values) => {
//     setSelectedFilters(prev => ({
//       ...prev,
//       price: { min: values[0], max: values[1] }
//     }));
//   };

//   useEffect(() => {
//     if (categoryData.category?._id) {
//       fetchFilteredProducts(categoryData.category._id);
//     }
//   }, [selectedFilters]);

//   const clearAllFilters = () => {
//     setSelectedFilters({
//       brands: [],
//       price: { min: priceRange[0], max: priceRange[1] },
//       filters: []
//     });
//   };

//   if (loading && !categoryData.category) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!categoryData.category) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold">Category not found</h1>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-6">{categoryData.category.category_name}</h1>
      
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* Filters Sidebar */}
//         <div className="lg:col-span-1 space-y-6">
//           {/* Active Filters */}
//           {(selectedFilters.brands.length > 0 || 
//            selectedFilters.filters.length > 0 ||
//            selectedFilters.price.min !== priceRange[0] || 
//            selectedFilters.price.max !== priceRange[1]) && (
//             <div className="bg-white p-4 rounded shadow">
//               <div className="flex justify-between items-center mb-2">
//                 <h3 className="font-semibold">Active Filters</h3>
//                 <button 
//                   onClick={clearAllFilters}
//                   className="text-blue-600 text-sm hover:underline"
//                 >
//                   Clear all
//                 </button>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {selectedFilters.brands.map(brandId => {
//                   const brand = categoryData.brands.find(b => b._id === brandId);
//                   return brand ? (
//                     <span 
//                       key={brandId}
//                       className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
//                     >
//                       {brand.brand_name}
//                       <button 
//                         onClick={() => handleFilterChange('brands', brandId)}
//                         className="ml-1 text-gray-500 hover:text-gray-700"
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ) : null;
//                 })}
                
//                 {selectedFilters.filters.map(filterId => {
//                   const filter = Object.values(filterGroups)
//                     .flatMap(g => g.filters)
//                     .find(f => f._id === filterId);
//                   return filter ? (
//                     <span 
//                       key={filterId}
//                       className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center"
//                     >
//                       {filter.filter_name}
//                       <button 
//                         onClick={() => handleFilterChange('filters', filterId)}
//                         className="ml-1 text-gray-500 hover:text-gray-700"
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ) : null;
//                 })}
                
//                 {(selectedFilters.price.min !== priceRange[0] || 
//                  selectedFilters.price.max !== priceRange[1]) && (
//                   <span className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
//                     ₹{selectedFilters.price.min} - ₹{selectedFilters.price.max}
//                     <button 
//                       onClick={() => setSelectedFilters(prev => ({
//                         ...prev,
//                         price: { min: priceRange[0], max: priceRange[1] }
//                       }))}
//                       className="ml-1 text-gray-500 hover:text-gray-700"
//                     >
//                       ×
//                     </button>
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Price Filter */}
//           <div className="bg-white p-4 rounded shadow">
//             <h3 className="text-lg font-semibold mb-4">Price Range</h3>
//             <div className="space-y-4">
//               <input
//                 type="range"
//                 min={priceRange[0]}
//                 max={priceRange[1]}
//                 step="100"
//                 value={selectedFilters.price.max}
//                 onChange={(e) => handlePriceChange([
//                   selectedFilters.price.min, 
//                   parseInt(e.target.value)
//                 ])}
//                 className="w-full"
//               />
//               <div className="flex justify-between text-sm">
//                 <span>₹{selectedFilters.price.min}</span>
//                 <span>₹{selectedFilters.price.max}</span>
//               </div>
//             </div>
//           </div>

//           {/* Brand Filter */}
//           <div className="bg-white p-4 rounded shadow">
//             <h3 className="text-lg font-semibold mb-4">Brands</h3>
//             <ul className="space-y-2">
//               {categoryData.brands.map(brand => (
//                 <li key={brand._id}>
//                   <button
//                     onClick={() => handleFilterChange('brands', brand._id)}
//                     className={`flex items-center w-full text-left p-2 rounded ${
//                       selectedFilters.brands.includes(brand._id) 
//                         ? 'bg-blue-100 font-medium' 
//                         : 'hover:bg-gray-100'
//                     }`}
//                   >
//                     {brand.image && (
//                       <div className="w-8 h-8 mr-2 relative">
//                         <Image
//                           src={brand.image.startsWith('http') ? brand.image : `/uploads/brands/${brand.image}`}
//                           alt={brand.brand_name}
//                           fill
//                           className="object-contain"
//                           unoptimized
//                         />
//                       </div>
//                     )}
//                     <span>{brand.brand_name}</span>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Dynamic Filters */}
//           {Object.values(filterGroups).map(group => (
//             <div key={group._id} className="bg-white p-4 rounded shadow">
//               <h3 className="text-lg font-semibold mb-4">{group.name}</h3>
//               <ul className="space-y-2">
//                 {group.filters.map(filter => (
//                   <li key={filter._id}>
//                     <button
//                       onClick={() => handleFilterChange('filters', filter._id)}
//                       className={`block w-full text-left p-2 rounded ${
//                         selectedFilters.filters.includes(filter._id)
//                           ? 'bg-blue-100 font-medium'
//                           : 'hover:bg-gray-100'
//                       }`}
//                     >
//                       {filter.filter_name}
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//       {/* Products Grid */}
//       <div className="lg:col-span-3">
//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         ) : 
        
//         products.length === 0 ? (
//           <div className="text-center py-12">
//             <h3 className="text-lg font-medium">No products found matching your filters</h3>
//             <button 
//               onClick={clearAllFilters}
//               className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               Clear all filters
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="mb-4 flex justify-between items-center">
//               <p>
//                 Showing {(currentPage - 1) * 12 + 1}-{Math.min(currentPage * 12, categoryData.pagination.total)} 
//                 of {categoryData.pagination.total} products
//               </p>
//               {/* Sorting options can be added here */}
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {products.map(product => (
//               <div key={product._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
//                     <div className="relative h-48 mb-4">
//                       {product.images?.[0] && (
//                         <Image
//                           src={
//                             product.images[0].startsWith('http') 
//                               ? product.images[0] 
//                               : `/uploads/products/${product.images[0]}`
//                           }
//                           alt={product.name}
//                           fill
//                           className="object-contain"
//                           unoptimized
//                         />
//                       )}
//                     </div>
//                     <h3 className="text-lg font-semibold mb-2 line-clamp-2">
//                       <Link href={`/products/${product.slug}`}>
//                         {product.name}
//                       </Link>
//                     </h3>
//                     <div className="flex items-center gap-2 mb-4">
//                       {product.special_price && product.special_price !== product.price && (
//                         <span className="text-gray-500 line-through">
//                           ₹{product.price.toLocaleString()}
//                         </span>
//                       )}
//                       <span className="text-xl font-bold text-blue-600">
//                         ₹{(product.special_price || product.price).toLocaleString()}
//                       </span>
//                     </div>
//                     <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
//                       Add to Cart
//                     </button>
//                   </div>
//                 ))}
//             </div>

//             {/* Pagination Controls */}
//             <div className="flex justify-center mt-8">
//               <nav className="inline-flex rounded-md shadow">
//                 <button
//                   onClick={() => handlePageChange(currentPage - 1)}
//                   disabled={currentPage === 1}
//                   className={`px-4 py-2 rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//                 >
//                   Previous
//                 </button>
//                 {Array.from({ length: Math.min(5, categoryData.pagination.pages) }, (_, i) => {
//                   let pageNum;
//                   if (categoryData.pagination.pages <= 5) {
//                     pageNum = i + 1;
//                   } else if (currentPage <= 3) {
//                     pageNum = i + 1;
//                   } else if (currentPage >= categoryData.pagination.pages - 2) {
//                     pageNum = categoryData.pagination.pages - 4 + i;
//                   } else {
//                     pageNum = currentPage - 2 + i;
//                   }
                  
//                   return (
//                     <button
//                       key={pageNum}
//                       onClick={() => handlePageChange(pageNum)}
//                       className={`px-4 py-2 border-t border-b ${currentPage === pageNum ? 'bg-blue-100 text-blue-600 font-medium' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//                     >
//                       {pageNum}
//                     </button>
//                   );
//                 })}
//                 <button
//                   onClick={() => handlePageChange(currentPage + 1)}
//                   disabled={currentPage === categoryData.pagination.pages}
//                   className={`px-4 py-2 rounded-r-md border ${currentPage === categoryData.pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//                 >
//                   Next
//                 </button>
//               </nav>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//     </div>
//   );
// }