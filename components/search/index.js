"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { ChevronDown, ChevronUp } from "react-feather";
import { FaSpinner } from "react-icons/fa";
import { Range as ReactRange } from "react-range";
import { ToastContainer } from "react-toastify";

/**
 * Safe helpers
 */
const safeArray = (v) => (Array.isArray(v) ? v : []);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export default function SearchComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const { slug } = useParams();

  // state
  const [products, setProducts] = useState([]); // always array
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    total: 0,
  });

  const [totalProducts, setTotalProducts] = useState(0);

  const [loading, setLoading] = useState(false);
  const [categoryData, setCategoryData] = useState({
    category: null,
    brands: [],
    filters: [],
    main_category: null,
    categoryTree: [],
    allCategoryIds: [],
    banners: [],
  });

  const [brandMap, setBrandMap] = useState({});
const [brands, setbrands] = useState([]);
  const [filterGroups, setFilterGroups] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    filters: [],
    price: { min: 0, max: 100000 },
  });

  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [values, setValues] = useState([0, 100000]);
  const [sortOption, setSortOption] = useState("");
  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({});

  const itemsPerPage = 12;
  const page = Number(searchParams.get("page") || 1);

  // Redirect to home when no query & no category (Option C)
  useEffect(() => {
    if (!searchQuery && !category) {
      router.push("/");
    }
  }, [searchQuery, category, router]);

  // Load brand map (id -> name)
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch("/api/brand");
        const json = await res.json();
        const arr = json?.data || [];
        const map = {};
        arr.forEach((b) => {
          if (b && b._id) map[b._id] = b.brand_name;
        });
        setBrandMap(map);
      } catch (err) {
        console.error("fetchBrand error", err);
      }
    };
    fetchBrand();
  }, []);

  // Fetch category meta when slug or category present
  useEffect(() => {
    const loadCategoryMeta = async () => {
      const search_slug = slug || category || null;
      if (!search_slug) return;
      try {
        const normalized = String(search_slug)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "and");
        const res = await fetch(`/api/categories/${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (data) {
          const banners = data.main_category?.banners || [];
          setCategoryData((prev) => ({
            ...prev,
            ...data,
            categoryTree: data.category || [],
            allCategoryIds: data.allCategoryIds || [],
            banners,
          }));

          // set up filters & price range from category products if available
          const catProducts = safeArray(data.products);
          if (catProducts.length > 0) {
            const prices = catProducts.map((p) => {
              const sp = Number(p.special_price) || 0;
              const p0 = Number(p.price) || 0;
              return sp > 0 && sp < p0 ? sp : p0;
            });
            let minPrice = Math.min(...prices);
            let maxPrice = Math.max(...prices);
            if (minPrice === maxPrice) {
              minPrice = Math.max(0, minPrice - 1);
              maxPrice = maxPrice + 1;
            }
            setPriceRange([minPrice, maxPrice]);
            setSelectedFilters((s) => ({ ...s, price: { min: minPrice, max: maxPrice } }));
            setValues([minPrice, maxPrice]);
          }

          // group filters
          const groups = {};
          safeArray(data.filters).forEach((filter) => {
            const groupId = filter.filter_group_name || "Other";
            if (!groups[groupId]) {
              groups[groupId] = { _id: groupId, name: groupId, filters: [] };
            }
            groups[groupId].filters.push(filter);
          });
          setFilterGroups(groups);
        }
      } catch (err) {
        console.error("loadCategoryMeta err", err);
      }
    };

    loadCategoryMeta();
  }, [slug, category]);

  useEffect(() => {
  if (Object.keys(filterGroups).length > 0) {
    const expanded = {};
    Object.values(filterGroups).forEach(group => {
      expanded[group._id] = true; // expand all groups
    });
    setExpandedFilters(expanded);
  }
}, [filterGroups]);

  // Core search fetch (server-side filtering when query or category exist)
  useEffect(() => {
    const fetchSearch = async () => {
      // if nothing to search & nothing category, we've already redirected - skip
      if (!searchQuery && !category) return;

      setLoading(true);
      try {
        let url = `/api/search?`;
        if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        url += `page=${page}&limit=${itemsPerPage}`;
        url += `&t=${Date.now()}`;

        const res = await axios.get(url);
        const data = res?.data || {};
        const productsFromApi = safeArray(data.products || []);
        setProducts(productsFromApi);
        setbrands(data.allbrand);

        setTotalProducts(res.data.pagination.total);

        // pagination guard
        const p = data.pagination || {};
        setPagination({
          currentPage: p.currentPage || page,
          totalPages: p.totalPages || Math.ceil((p.total || productsFromApi.length) / itemsPerPage),
          hasNext: Boolean(p.hasNext),
          hasPrev: Boolean(p.hasPrev),
          total: p.total || productsFromApi.length,
        });

        // compute price range from returned products if not set by category
        if (productsFromApi.length > 0) {
          const prices = productsFromApi.map((p) => {
            const sp = Number(p.special_price) || 0;
            const p0 = Number(p.price) || 0;
            return sp > 0 && sp < p0 ? sp : p0;
          });
          let minPrice = Math.min(...prices);
          let maxPrice = Math.max(...prices);
          if (minPrice === maxPrice) {
            minPrice = Math.max(0, minPrice - 1);
            maxPrice = maxPrice + 1;
          }
          setPriceRange([minPrice, maxPrice]);
          setSelectedFilters((s) => ({ ...s, price: { min: minPrice, max: maxPrice } }));
          setValues([minPrice, maxPrice]);
        }

        // extract brands counts for sidebar
        const brandCounts = {};
        productsFromApi.forEach((prd) => {
          const b = prd.brand || null;
          if (!b) return;
          brandCounts[b] = (brandCounts[b] || 0) + 1;
        });

        const brandsFromResults = Object.keys(brandCounts).map((id) => ({
          _id: id,
          brand_name: brandMap[id] || id,
          count: brandCounts[id],
        }));

        setCategoryData((prev) => ({ ...prev, brands: brandsFromResults }));
      } catch (err) {
        console.error("fetchSearch error", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, category, page, brandMap]);

  // Server-side category filter (when viewing a category page without 'searchQuery')
  const fetchFilteredProducts = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        // call the product filter API
        const query = new URLSearchParams();
        const categoryIds = selectedFilters.categories.length
          ? selectedFilters.categories.join(",")
          : (categoryData.allCategoryIds || []).join(",");
        if (categoryIds) query.set("categoryIds", categoryIds);
        query.set("page", pageNum);
        query.set("limit", itemsPerPage);
        if (selectedFilters.brands.length) query.set("brands", selectedFilters.brands.join(","));
        query.set("minPrice", selectedFilters.price.min || 0);
        query.set("maxPrice", selectedFilters.price.max || 1000000);
        if (selectedFilters.filters.length) query.set("filters", selectedFilters.filters.join(","));

        const res = await fetch(`/api/product/filter/main?${query.toString()}`);
        const json = await res.json();
        const productsFromApi = safeArray(json.products || []);
        setProducts(productsFromApi);

        const p = json.pagination || {};
        setPagination({
          currentPage: p.currentPage || pageNum,
          totalPages: p.totalPages || Math.ceil((p.total || productsFromApi.length) / itemsPerPage),
          hasNext: Boolean(p.hasNext),
          hasPrev: Boolean(p.hasPrev),
          total: p.total || productsFromApi.length,
        });
      } catch (err) {
        console.error("fetchFilteredProducts", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedFilters, categoryData]
  );

   useEffect(() => {
  //console.log("Updated brands:", brands);
}, [brands]);

  useEffect(() => {
    // If we are on a category page but not doing a query, use server-side category filter
    if (!searchQuery && categoryData.main_category && categoryData.category) {
      fetchFilteredProducts(1);
    }
  }, [searchQuery, categoryData, fetchFilteredProducts]);

  // Client-side filtering utility (safe)
  const filterProductsClientSide = (list) => {
    const base = safeArray(list);
    const filtered = base.filter((product) => {
      // brand filter
      if (selectedFilters.brands.length && !selectedFilters.brands.includes(product.brand)) return false;

      // categories filter (client side fallback)
      if (selectedFilters.categories.length && !selectedFilters.categories.includes(product.category)) return false;

      // dynamic filters (assumes your filter ids are in product.attributes or similar - adapt if different)
      if (selectedFilters.filters.length) {
        // If product has filter ids in product.filters (adjust according to your product schema)
        const productFilters = safeArray(product.filters || []);
        const hasAll = selectedFilters.filters.every((fId) => productFilters.includes(fId));
        if (!hasAll) return false;
      }

      // price
      const priceVal = Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price)
        ? Number(product.special_price)
        : Number(product.price);
      if (priceVal < (selectedFilters.price.min || 0) || priceVal > (selectedFilters.price.max || Infinity)) {
        return false;
      }
      return true;
    });

    // sorting
    const listCopy = [...filtered];
    switch (sortOption) {
      case "price-low-high":
        return listCopy.sort((a, b) => {
          const pa = Number(a.special_price) > 0 && Number(a.special_price) < Number(a.price) ? Number(a.special_price) : Number(a.price);
          const pb = Number(b.special_price) > 0 && Number(b.special_price) < Number(b.price) ? Number(b.special_price) : Number(b.price);
          return pa - pb;
        });
      case "price-high-low":
        return listCopy.sort((a, b) => {
          const pa = Number(a.special_price) > 0 && Number(a.special_price) < Number(a.price) ? Number(a.special_price) : Number(a.price);
          const pb = Number(b.special_price) > 0 && Number(b.special_price) < Number(b.price) ? Number(b.special_price) : Number(b.price);
          return pb - pa;
        });
      case "name-a-z":
        return listCopy.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "name-z-a":
        return listCopy.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      default:
        return listCopy;
    }
  };

  // UI actions
  const handleFilterToggle = (type, id) => {
    setExpandedFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFilterChange = (type, value) => {
    setSelectedFilters((prev) => {
      const out = { ...prev };
      if (type === "brands") {
        out.brands = prev.brands.includes(value) ? prev.brands.filter((v) => v !== value) : [...prev.brands, value];
      } else if (type === "categories") {
        out.categories = prev.categories.includes(value) ? prev.categories.filter((v) => v !== value) : [...prev.categories, value];
      } else if (type === "filters") {
        out.filters = prev.filters.includes(value) ? prev.filters.filter((v) => v !== value) : [...prev.filters, value];
      } else if (type === "price") {
        out.price = value;
      }
      return out;
    });
  };

  const applyFilters = async (pageNum = 1) => {
    setLoading(true);
    try {
      if (searchQuery || category) {
        // server-side filtered search
        const query = new URLSearchParams();
        if (searchQuery) query.set("query", searchQuery);
        if (category) query.set("category", category);
        if (selectedFilters.brands.length) query.set("brands", selectedFilters.brands.join(","));
        if (selectedFilters.categories.length) query.set("categories", selectedFilters.categories.join(","));
        if (selectedFilters.filters.length) query.set("filters", selectedFilters.filters.join(","));
        query.set("minPrice", selectedFilters.price.min || 0);
        query.set("maxPrice", selectedFilters.price.max || 1000000);
        query.set("page", pageNum);
        query.set("limit", itemsPerPage);

        const res = await fetch(`/api/search?${query.toString()}`);
        const json = await res.json();
        const productsFromApi = safeArray(json.products || []);
        setProducts(productsFromApi);
        const p = json.pagination || {};
        setPagination({
          currentPage: p.currentPage || pageNum,
          totalPages: p.totalPages || Math.ceil((p.total || productsFromApi.length) / itemsPerPage),
          hasNext: Boolean(p.hasNext),
          hasPrev: Boolean(p.hasPrev),
          total: p.total || productsFromApi.length,
        });
      } else if (categoryData.main_category) {
        await fetchFilteredProducts(pageNum);
      }
    } catch (err) {
      console.error("applyFilters", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // apply client or server filters when selectedFilters changes
    // if searchQuery or category is present, we re-run server-side filters (applyFilters)
    if (searchQuery || category) {
      applyFilters(1);
    } else {
      // if no query and no category page, we already redirected to home (Option C)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  // render helpers
  const renderPagination = () => {
    const { currentPage, totalPages, hasNext, hasPrev } = pagination;
    if (totalPages <= 1) return null;

    const pages = [];
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      if (i > 0 && i <= totalPages) pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    const goTo = (pg) => {
      router.push(`/search?query=${encodeURIComponent(searchQuery || "")}&category=${encodeURIComponent(category || "")}&page=${pg}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <div className="flex justify-center items-center gap-2 my-6">
        <button
          disabled={!hasPrev}
          onClick={() => goTo(currentPage - 1)}
          className={`px-3 py-2 rounded ${hasPrev ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          Prev
        </button>
        {pages.map((p, idx) =>
          p === "..." ? <span key={idx} className="px-3 py-2">…</span> : (
            <button key={idx} onClick={() => goTo(p)} className={`px-3 py-2 rounded ${p === currentPage ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
              {p}
            </button>
          )
        )}
        <button
          disabled={!hasNext}
          onClick={() => goTo(currentPage + 1)}
          className={`px-3 py-2 rounded ${hasNext ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
        >
          Next
        </button>
      </div>
    );
  };

  // final product list to render (if search/category present, we already fetched server results; additionally apply client-side filters if desired)
  const filteredProducts = (searchQuery || category) ? filterProductsClientSide(products) : filterProductsClientSide(products);

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 text-gray-600 pl-1">
          Search Results for {category && ` ${category} `} '{searchQuery && `${searchQuery}`}'
        </h1>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 gap-4">
          <p className="text-gray-600">
            
             {totalProducts} result{totalProducts !== 1 ? 's' : ''} found
          </p>
          <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-4 py-2 border rounded-md text-sm bg-white shadow-sm">
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
          <div className="flex justify-center items-center h-64"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
        ) : safeArray(products).length > 0 ? (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <aside className="w-full md:w-[250px] shrink-0">
              {/* Active Filters */}
              {(selectedFilters.brands.length > 0 || selectedFilters.categories.length > 0 || selectedFilters.filters.length > 0 || selectedFilters.price.min !== priceRange[0] || selectedFilters.price.max !== priceRange[1]) && (
                <div className="bg-white p-4 rounded shadow mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Active Filters</h3>
                    <button onClick={() => {
                      setSelectedFilters({ categories: [], brands: [], filters: [], price: { min: priceRange[0], max: priceRange[1] } });
                      setValues([priceRange[0], priceRange[1]]);
                    }} className="text-blue-600 text-sm hover:underline">Clear all</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.categories.map((cid) => {
                      const c = (categoryData.category || []).find((x) => x._id === cid);
                      if (!c) return null;
                      return (
                        <span key={cid} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                          {c.category_name}
                          <button onClick={() => handleFilterChange("categories", cid)} className="ml-1 text-gray-500">×</button>
                        </span>
                      );
                    })}

                    {selectedFilters.brands.map((bid) => {
                      const b = (categoryData.brands || []).find((x) => x._id === bid);
                      if (!b) return null;
                      return (
                        <span key={bid} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                          {b.brand_name}
                          <button onClick={() => handleFilterChange("brands", bid)} className="ml-1 text-gray-500">×</button>
                        </span>
                      );
                    })}

                    {selectedFilters.filters.map((fid) => {
                      const f = Object.values(filterGroups).flatMap(g => g.filters).find(x => x._id === fid);
                      if (!f) return null;
                      return (
                        <span key={fid} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                          {f.filter_name}
                          <button onClick={() => handleFilterChange("filters", fid)} className="ml-1 text-gray-500">×</button>
                        </span>
                      );
                    })}

                    {(selectedFilters.price.min !== priceRange[0] || selectedFilters.price.max !== priceRange[1]) && (
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                        ₹{selectedFilters.price.min} - ₹{selectedFilters.price.max}
                        <button onClick={() => {
                          setSelectedFilters(prev => ({ ...prev, price: { min: priceRange[0], max: priceRange[1] } }));
                          setValues([priceRange[0], priceRange[1]]);
                        }} className="ml-1 text-gray-500">×</button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <h3 className="text-base font-semibold mb-4 text-gray-700">Price Range</h3>
                <ReactRange
                  values={values}
                  step={100}
                  min={priceRange[0] || 0}
                  max={priceRange[1] || 100000}
                  onChange={(v) => setValues(v)}
                  onFinalChange={(v) => {
                    const min = clamp(Number(v[0]), 0, Number(v[1]));
                    const max = clamp(Number(v[1]), Number(v[0]), 100000000);
                    setValues([min, max]);
                    handleFilterChange("price", { min, max });
                  }}
                  renderTrack={({ props, children }) => (
                    <div {...props} className="w-full h-2 rounded-lg bg-gray-200 relative">
                      <div className="absolute h-2 bg-gray-500 rounded-lg" style={{
                        left: `${((values[0] - (priceRange[0] || 0)) / ((priceRange[1] || 100000) - (priceRange[0] || 0))) * 100}%`,
                        width: `${((values[1] - values[0]) / ((priceRange[1] || 100000) - (priceRange[0] || 0))) * 100}%`
                      }} />
                      {children}
                    </div>
                  )}
                  renderThumb={({ props, index }) => {
                    // Remove key so it's not spread accidentally
                    const { key, ...rest } = props;

                    return (
                      <div
                        {...rest}
                        key={key}   // React needs the key directly here
                        className={`w-4 h-4 rounded-full border-2 border-black shadow cursor-pointer ${
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

              {/* Brands */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-base font-semibold text-gray-700">Brands</h3>
                  <button onClick={() => setIsBrandsExpanded(!isBrandsExpanded)} className="text-gray-500">
                    {isBrandsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {isBrandsExpanded && (
                  <ul className="mt-2 max-h-48 overflow-y-auto pr-2">
                    {Array.from(new Set(safeArray(brands).map(p => p.brand)))
                      .filter(brandId => brandId)
                      .map(brandId => {
                        const brandName = brandMap[brandId] || brandId;
                        const brandCount = safeArray(brands).filter(p => p.brand === brandId).length;
                        return (
                          <li key={brandId} className="flex items-center">
                            <label className="flex items-center space-x-2 w-full cursor-pointer hover:bg-gray-50 rounded p-2">
                              <input type="checkbox" checked={selectedFilters.brands.includes(brandId)} onChange={() => handleFilterChange("brands", brandId)} className="mr-2 h-4 w-4" />
                              <span className="text-sm text-gray-600">{brandName} ({brandCount})</span>
                            </label>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>

              {/* Dynamic Filters */}
              {isFiltersExpanded && Object.values(filterGroups).length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                  <h3 className="text-base font-semibold text-gray-700 mb-2">Product Filters</h3>
                  <div className="space-y-4">
                    {Object.values(filterGroups).map(group => (
                      <div key={group._id}>
                        <button onClick={() => handleFilterToggle("group", group._id)} className="flex justify-between w-full items-center">
                          <span className="text-sm font-medium text-gray-700">{group.name}</span>
                          <ChevronDown size={18} className={`${expandedFilters[group._id] ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedFilters[group._id] && (
                          <ul className="mt-2 max-h-48 overflow-y-auto">
                            {safeArray(group.filters).map(f => (
                              <li key={f._id} className="py-1">
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={selectedFilters.filters.includes(f._id)} onChange={() => handleFilterChange("filters", f._id)} />
                                  <span className="text-sm text-gray-600">{f.filter_name} {f.count ? `(${f.count})` : ""}</span>
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
            </aside>

            {/* Products Grid */}
            <main className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {safeArray(filteredProducts).map(product => (
                  <div key={product._id} className="group relative bg-white rounded-lg border hover:border-blue-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                    <div className="relative aspect-square bg-white">
                      <Link href={`/product/${product.slug}`} className="block mb-2">
                        {product.images?.[0] && (
                          <Image
                            src={product.images[0].startsWith("http") ? product.images[0] : `/uploads/products/${product.images[0]}`}
                            alt={product.name}
                            fill
                            className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                            unoptimized
                          />
                        )}
                      </Link>

                      {Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price) && (
                        <span className="absolute top-3 left-2 bg-red-500 text-white text-xs font-bold px-4 py-0.5 rounded z-10">
                          {Math.round(100 - (Number(product.special_price) / Number(product.price)) * 100)}% OFF
                        </span>
                      )}

                      <div className="absolute top-2 right-2"><ProductCard productId={product._id} /></div>
                    </div>

                    <div className="p-2 md:p-4 flex flex-col h-full">
                      <h4 className="text-xs text-gray-500 mb-2 uppercase">
                        <Link href={`/brand/${(brandMap[product.brand] || "").toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-blue-600">{brandMap[product.brand] || ""}</Link>
                      </h4>

                      <Link href={`/product/${product.slug}`} className="block mb-1">
                        <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                          {(product.name || "").length > 60 ? (product.name || "").slice(0, 57) + "..." : product.name}
                        </h3>
                      </Link>

                      <div className="mb-3">
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-semibold text-red-600">
                            ₹{(Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price) ? Math.round(product.special_price) : Math.round(product.price)).toLocaleString()}
                          </span>
                          {Number(product.special_price) > 0 && Number(product.special_price) < Number(product.price) && (
                            <span className="text-xs text-gray-500 line-through">₹{Math.round(product.price).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs mb-3 ${product.stock_status === "In Stock" ? "text-green-600" : "text-red-600"}`}>
                        {product.stock_status}{product.stock_status === "In Stock" && product.quantity ? `, ${product.quantity} units` : ""}
                      </h4>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <Addtocart productId={product._id} stockQuantity={product.quantity} special_price={product.special_price} className="w-full text-xs sm:text-sm py-1.5" />
                        <a href={`https://wa.me/919865555000?text=${encodeURIComponent(`Check Out This Product:${process.env.NEXT_PUBLIC_API_URL}/product/${product.slug}`)}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full">
                          <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </main>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <img src="/images/no-productbox.png" alt="No products found" className="mx-auto mb-6 w-48 h-48" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h2>
              <p className="text-gray-600">Try different search terms or browse our categories</p>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}
