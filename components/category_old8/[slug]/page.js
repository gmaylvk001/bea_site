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
    brands: [],
    price: { min: 0, max: 100000 },
    filters: []
  });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filterGroups, setFilterGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const { sub_slug } = useParams();
  const { slug } = useParams();

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5; // 5 records per page
  
    const handlePageClick = ({ selected }) => {
      setCurrentPage(selected);
    };

  useEffect(() => {
    if (sub_slug) {
      fetchInitialData();
    }
  }, [sub_slug]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch category data (brands, filters, etc.)
      const categoryRes = await fetch(`/api/categories/${slug}/${sub_slug}`);
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
      await fetchFilteredProducts(categoryData.category._id);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredProducts = async (categoryId) => {
    try {
      setLoading(true);
      
      const query = new URLSearchParams();
      query.set('categoryId', categoryId);
      
      if (selectedFilters.brands.length > 0) {
        query.set('brands', selectedFilters.brands.join(','));
      }
      
      query.set('minPrice', selectedFilters.price.min);
      query.set('maxPrice', selectedFilters.price.max);
      
      if (selectedFilters.filters.length > 0) {
        query.set('filters', selectedFilters.filters.join(','));
      }
      
      const res =await fetch(`/api/product/filter?${query}`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setLoading(false);
    }
  };
  const pageCount = Math.ceil(products.length / itemsPerPage);

  const handleFilterChange = (type, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      
      if (type === 'brands') {
        newFilters.brands = prev.brands.includes(value)
          ? prev.brands.filter(item => item !== value)
          : [...prev.brands, value];
      } else if (type === 'price') {
        newFilters.price = value;
      } else {
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

  useEffect(() => {
    if (categoryData.category?._id) {
      fetchFilteredProducts(categoryData.category._id);
    }
  }, [selectedFilters]);

  const clearAllFilters = () => {
    setSelectedFilters({
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
 
  return(
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

