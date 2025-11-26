// search-page-fixed.js (client)
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import Addtocart from "@/components/AddToCart";
import { FaSpinner } from "react-icons/fa";
import { Range as ReactRange } from "react-range";
import { ChevronDown, ChevronUp } from "react-feather";
import ProductCard from "@/components/ProductCard";

/* Helpers */
const safeArray = (v) => (Array.isArray(v) ? v : []);

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const searchQuery = params.get("query") || "";
  const category = params.get("category") || "";
  const page = Number(params.get("page") || 1);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(false);

  const [brandMap, setBrandMap] = useState({}); // brandId -> brandName
  const [searchBrands, setSearchBrands] = useState({}); // derived from products => {id:{name,count}}
  const [selectedBrands, setSelectedBrands] = useState([]);

  const [filterGroups, setFilterGroups] = useState({});
  const [filterSummary, setFilterSummary] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [expandedFilters, setExpandedFilters] = useState({});

  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [values, setValues] = useState([0, 500000]);

  const [isBrandsExpanded, setIsBrandsExpanded] = useState(true);

  // Redirect if nothing to search
  useEffect(() => {
    if (!searchQuery && !category) router.push("/");
  }, [searchQuery, category, router]);

  // Load brand master
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/brand");
        const json = await res.json();
        const arr = json?.data || [];
        const map = {};
        arr.forEach((b) => {
          if (b && b._id) map[b._id] = b.brand_name;
        });
        setBrandMap(map);
      } catch (e) {
        console.error("Brand load failed", e);
      }
    };
    load();
  }, []);

  // Load category filters (if category exists)
  useEffect(() => {
    const loadCategory = async () => {
      if (!category) return;
      try {
        const slug = encodeURIComponent(String(category).toLowerCase().replace(/\s+/g, "-"));
        const res = await fetch(`/api/categories/${slug}`);
        const json = await res.json();
        const groups = {};
        safeArray(json.filters).forEach((f) => {
          const g = f.filter_group_name || "Other";
          if (!groups[g]) groups[g] = { _id: g, name: g, filters: [] };
          groups[g].filters.push(f);
        });
        setFilterGroups(groups);
        const expanded = {};
        Object.values(groups).forEach((g) => (expanded[g._id] = true));
        setExpandedFilters(expanded);

        const catProducts = safeArray(json.products);
        if (catProducts.length) {
          const prices = catProducts.map((p) => {
            const sp = Number(p.special_price) || 0;
            const pr = Number(p.price) || 0;
            return sp > 0 && sp < pr ? sp : pr;
          });
          let min = Math.min(...prices);
          let max = Math.max(...prices);
          if (min === max) {
            min = Math.max(0, min - 1);
            max = max + 1;
          }
          setPriceRange([min, max]);
          setValues([min, max]);
        }
      } catch (e) {
        console.error("Category filter load failed", e);
      }
    };
    loadCategory();
  }, [category]);

  
  // Fetch products
  const fetchProducts = async () => {
    if (!searchQuery && !category) return;
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (searchQuery) qp.append("query", searchQuery);
      if (category) qp.append("category", category);
      if (selectedBrands.length) qp.append("brands", selectedBrands.join(","));
      if (selectedFilters.length) qp.append("filters", selectedFilters.join(","));
      qp.append("minPrice", values[0]);
      qp.append("maxPrice", values[1]);
      qp.append("page", page);
      qp.append("limit", 12);

      const res = await axios.get(`/api/search?${qp.toString()}`);
      const data = res?.data || {};

      const list = safeArray(data.products);
      setProducts(list);
      setPagination(data.pagination || { total: list.length, currentPage: page, totalPages: 1, hasNext: false, hasPrev: false });
      setFilterSummary(safeArray(data.filterSummary));

      

     const brandObj = {};

      (data.brandSummary || []).forEach((b) => {
        if (b.brand && brandMap[b.brand]) {
          brandObj[b.brand] = {
            name: brandMap[b.brand],
            count: brandObj[b.brand] ? brandObj[b.brand].count + 1 : 1,
          };
        }
      });

      setSearchBrands(brandObj);

    } catch (e) {
      console.error("Search failed", e);
      setProducts([]);
      setPagination({ total: 0, currentPage: 1, totalPages: 1, hasNext: false, hasPrev: false });
      setSearchBrands({});
      setFilterSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, category, page, selectedBrands.join(","), selectedFilters.join(","), values[0], values[1], Object.keys(brandMap).length]);

  const renderLimitedPagination = () => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, hasNext, hasPrev } = pagination;

  const goToPage = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;

    const params = new URLSearchParams(window.location.search);
    params.set("page", pageNum);
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPages = () => {
    const pages = [];

    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
    }

    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageList = getPages();

  return (
    <div className="flex justify-center items-center gap-2 my-6">
      <button
        disabled={!hasPrev}
        onClick={() => goToPage(currentPage - 1)}
        className={`px-3 py-2 rounded ${
          hasPrev
            ? "bg-gray-100 hover:bg-gray-200"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        Prev
      </button>

      {pageList.map((num, idx) =>
        num === "..." ? (
          <span key={`dots-${idx}`} className="px-3 py-2">…</span>
        ) : (
          <button
            key={num}
            onClick={() => goToPage(num)}
            className={`px-3 py-2 rounded ${
              num === currentPage
                ? "bg-red-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {num}
          </button>
        )
      )}

      <button
        disabled={!hasNext}
        onClick={() => goToPage(currentPage + 1)}
        className={`px-3 py-2 rounded ${
          hasNext
            ? "bg-gray-100 hover:bg-gray-200"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  );
};


  // Handlers
  const toggleBrand = (id) => setSelectedBrands((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
 // const toggleFilter = (id) => setSelectedFilters((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleGroup = (g) => setExpandedFilters((p) => ({ ...p, [g]: !p[g] }));

  // react-range hydration-safe thumb
  const renderThumb = ({ props, index }) => {
    const { key, ...rest } = props;
    return <div key={key} {...rest} className={`w-4 h-4 rounded-full border-2 border-black ${index === 0 ? "bg-blue-500" : "bg-green-500"}`} />;
  };

  const goToPage = (pg) => {
    router.push(`/search?query=${encodeURIComponent(searchQuery || "")}&category=${encodeURIComponent(category || "")}&page=${pg}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-gray-700">Search results {category ? `in ${category}` : ""} {searchQuery ? `for \"${searchQuery}\"` : ""}</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 shrink-0 space-y-4">
            {/* Price */}
            <div className="bg-white p-4 rounded shadow-sm border">
              <h3 className="font-semibold mb-2">Price</h3>
              <ReactRange
                values={values}
                step={100}
                min={priceRange[0]}
                max={priceRange[1]}
                onChange={setValues}
                renderTrack={({ props, children }) => (
                  <div {...props} className="w-full h-2 bg-gray-200 rounded relative">
                    <div
                      className="absolute h-2 bg-gray-500 rounded"
                      style={{
                        left: `${((values[0] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%`,
                        width: `${((values[1] - values[0]) / (priceRange[1] - priceRange[0])) * 100}%`,
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={renderThumb}
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span suppressHydrationWarning>₹{values[0]}</span>
                <span suppressHydrationWarning>₹{values[1]}</span>
              </div>
            </div>

            {/* ✅ Brands (NAME FIXED) */}
            <div className="bg-white p-4 rounded shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Brands</h3>
                <button onClick={() => setIsBrandsExpanded((p) => !p)} className="text-gray-500">
                  {isBrandsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isBrandsExpanded && (
                <ul className="max-h-48 overflow-y-auto pr-2">
                  {Object.entries(searchBrands).map(([id, b]) => (
                    <li key={id} className="py-1">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedBrands.includes(id)} onChange={() => toggleBrand(id)} />
                        <span className="text-sm text-gray-700">{b.name} <span className="text-xs text-gray-400">({b.count})</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dynamic Filters 
            {Object.values(filterGroups).length > 0 && (
              <div className="bg-white p-4 rounded shadow-sm border">
                <h3 className="font-semibold mb-2">Product Filters</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {Object.values(filterGroups).map((group) => (
                    <div key={group._id} className="border-b last:border-0 pb-2">
                      <button onClick={() => toggleGroup(group._id)} className="w-full flex justify-between items-center text-sm font-medium text-gray-700">
                        <span>{group.name}</span>
                        <ChevronDown size={14} className={expandedFilters[group._id] ? "rotate-180" : ""} />
                      </button>
                      {expandedFilters[group._id] && (
                        <ul className="mt-2">
                          {safeArray(group.filters).map((f) => {
                            const cnt = (filterSummary.find((x) => String(x.filterId) === String(f._id)) || {}).count || 0;
                            return (
                              <li key={f._id} className="py-1">
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={selectedFilters.includes(f._id)} onChange={() => toggleFilter(f._id)} />
                                  <span className="text-sm text-gray-700">{f.filter_name} {cnt ? <span className="text-xs text-gray-400">({cnt})</span> : null}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            */}
          </div>

          {/* Products */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-600">{pagination.total || products.length} result{(pagination.total || products.length) !== 1 ? "s" : ""} found</div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64"><FaSpinner className="animate-spin text-4xl text-blue-500" /></div>
            ) : safeArray(products).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div key={p._id} className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                    <div className="relative aspect-square bg-white">
                      <Link href={`/product/${p.slug}`} className="block mb-2">
                        {p.images?.[0] && (
                          <Image
                            src={p.images[0].startsWith("http") ? p.images[0] : `/uploads/products/${p.images[0]}`}
                            alt={p.name}
                            fill
                            className="object-contain p-2 md:p-4"
                            sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                            unoptimized
                          />
                        )}
                      </Link>

                      {Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) && (
                        <span className="absolute top-3 left-2 bg-red-500 text-white text-xs font-bold px-4 py-0.5 rounded z-10">
                          {Math.round(100 - (Number(p.special_price) / Number(p.price)) * 100)}% OFF
                        </span>
                      )}

                      <div className="absolute top-2 right-2"><ProductCard productId={p._id} /></div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="text-xs text-gray-500 mb-2 uppercase">
                        <Link href={`/brand/${(brandMap[p.brand] || "").toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-blue-600">{brandMap[p.brand] || ""}</Link>
                      </h4>
                      <Link href={`/product/${p.slug}`} className="block mb-1">
                        <h3 className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] min-h-[32px] sm:min-h-[40px]">
                          {(p.name || "").length > 60 ? (p.name || "").slice(0, 57) + "..." : p.name}
                        </h3>
                      </Link>
                      <div className="mb-2">
                        <div className="flex items-center gap-2">
                          <span suppressHydrationWarning className="text-base font-semibold text-red-600">₹{Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) ? Math.round(p.special_price) : Math.round(p.price)}</span>
                          {Number(p.special_price) > 0 && Number(p.special_price) < Number(p.price) && (
                            <span suppressHydrationWarning className="text-xs text-gray-500 line-through">₹{Math.round(p.price)}</span>
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs mb-3 ${p.stock_status === "In Stock" ? "text-green-600" : "text-red-600"}`}>
                        {p.stock_status}{p.stock_status === "In Stock" && p.quantity ? `, ${p.quantity} units` : ""}
                      </h4>

                      <div className="mt-auto flex items-center justify-between gap-2">
                        <Addtocart productId={p._id} stockQuantity={p.quantity} special_price={p.special_price} className="w-full text-xs sm:text-sm py-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <img src="/images/no-productbox.png" alt="No products" className="mx-auto w-48 h-48 mb-4" />
                <p className="text-gray-600">No products found</p>
              </div>
            )}

            {/* Pagination */}
            {renderLimitedPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}
