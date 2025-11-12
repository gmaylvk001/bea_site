"use client";

import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { FaPlus, FaMinus, FaEdit } from "react-icons/fa";
import DateRangePicker from '@/components/DateRangePicker';
import EditProductModal from "./EditProductModal";
import { Icon } from '@iconify/react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from "react-toastify";

export default function CategoryComponent() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [SelectedProduct, setSelectedProduct] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters]   = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const [stockFilter, setStockFilter] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  // Fetch products, categories and brands from API
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/product/get");
      const data = await response.json();
      setProducts(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  const [subcategories, setSubcategories] = useState([]);
  const fetchSubcategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setSubcategories(data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brand/get");
      const data = await response.json();
      if (data.success) {
        setBrands(data.brands);
      }
      
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchSubcategories
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(0);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // const exportToExcel = () => {
  //   // Prepare data in the exact requested format
  //   const dataForExport = filteredProducts.map(product => ({
  //     'Item No.': product.item_code,
  //     'Product Name': product.name,
  //     'StockQty': product.quantity,
  //     'Category': product.category?.category_name || product.category || 'No Category',
  //     'Subcategory': product.sub_category || 'No Subcategory',
  //     'Brand': product.brand?.brand_name || product.brand || 'No Brand',
  //     'Size': product.filter?.size || '',
  //     'Star': product.featured_products?.star_rating || '',
  //     'Movement': product.stock_status === "In Stock" ? "In Stock" : "Out of Stock",
  //     'MRP PRICE': product.price,
  //     'Special Price': product.special_price,
  //     'Description': product.description || '',
  //     'Key Features': product.key_specifications || '',
  //     'image1': product.images?.[0] || '',
  //     'image2': product.images?.[1] || '',
  //     'image3': product.images?.[2] || '',
  //     'overview images': product.overview_image?.join(", ") || '',
  //     'overview_description': product.overviewdescription || '',
  //     'variants': product.hasVariants ? JSON.stringify(product.variants) : '',
  //     'Status': product.status
  //   }));

  //   // Create worksheet with the exact column order
  //   const worksheet = XLSX.utils.json_to_sheet(dataForExport, {
  //     header: [
  //       'Item No.',
  //       'Product Name',
  //       'StockQty',
  //       'Category',
  //       'Subcategory',
  //       'Brand',
  //       'Size',
  //       'Star',
  //       'Movement',
  //       'MRP PRICE',
  //       'Special Price',
  //       'Description',
  //       'Key Features',
  //       'image1',
  //       'image2',
  //       'image3',
  //       'overview images',
  //       'overview_description',
  //       'variants',
  //       'Status'
  //     ]
  //   });
    
  //   // Create workbook
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    
  //   // Generate file and trigger download
  //   XLSX.writeFile(workbook, `products_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  // };

  // Export to Excel function
  // const exportToExcel = () => {
  //   const dataForExport = filteredProducts.map(product => ({
  //     'Item Code': product.item_code,
  //     'Name': product.name,
  //     'Price': product.price,
  //     'Special Price': product.special_price,
  //     'Quantity': product.quantity,
  //     'Status': product.status,
  //     'Brand': product.brand?.brand_name || 'No Brand',
  //     'Category': product.category?.category_name || 'No Category',
  //     'Created At': new Date(product.createdAt).toLocaleDateString()
  //   }));

  //   const worksheet = XLSX.utils.json_to_sheet(dataForExport);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  //   XLSX.writeFile(workbook, `products_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  // };
  
  const exportToExcel = () => {
    // Create mapping objects for faster lookup
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id] = cat.category_name;
    });

    const brandMap = {};
    brands.forEach(brand => {
      // Check what ID field your brands actually have
      const brandId = brand._id || brand.id;
      if (brandId) {
        brandMap[brandId] = brand.brand_name || brand.name;
      }
    });

    // Prepare data with names instead of IDs
    const dataForExport = filteredProducts.map(product => {
      // Resolve category name
      let categoryName = 'No Category';
      if (product.category) {
        if (typeof product.category === 'object') {
          categoryName = product.category.category_name;
        } else if (categoryMap[product.category]) {
          categoryName = categoryMap[product.category];
        }
      }

      // Resolve subcategory name
      let subcategoryName = 'No Subcategory';
      if (product.sub_category) {
        if (typeof product.sub_category === 'object') {
          subcategoryName = product.sub_category.category_name;
        } else if (categoryMap[product.sub_category]) {
          subcategoryName = categoryMap[product.sub_category];
        }
      }

      // Resolve brand name
      let brandName = 'No Brand';
      if (product.brand) {
        if (typeof product.brand === 'object') {
          brandName = product.brand.brand_name || product.brand.name || 'No Brand Name';
        } else {
          // If brand is stored as ID
          brandName = brandMap[product.brand] || 'Brand not found';
        }
      }

      let sizeFilter        = "";
      const filter          = product.sizeFilterDetails;
      const filter_length   = filter.length;    
      filter.forEach(filter_det => {
        if(filter_length > 1) {
          sizeFilter        += filter_det.filter_name +",";
        }else {
          sizeFilter        = filter_det.filter_name;
        }
      });

      //     const brandName = brands.find(b => b._id === product.brand)?.name || '';
      // // const categoryName = categories.find(c => c._id === product.category)?.name || '';
      // const subcategoryName = subcategories.find(sc => sc._id === product.sub_category)?.name || '';

      return {
        'Item No.': product.item_code,
        'Product Name': product.name,
        'StockQty': product.quantity,
        'Category': categoryName.toUpperCase(),
        'Subcategory': subcategoryName.toUpperCase(),
        'Brand': brandName,
        // 'Size': product.size,
        'Size': sizeFilter,
        'Star': product.star || '',
        'Movement': product.movement,
        'MRP PRICE': product.price,
        'Special Price': product.special_price,
        'Description': product.description || '',
        'Key Features': product.key_specifications || '',
        'image1': product.images?.[0] || '',
        'image2': product.images?.[1] || '',
        'image3': product.images?.[2] || '',
        'overview images': product.overview_image?.join(", ") || '',
        'overview_description': product.overviewdescription || '',
        'variants': product.hasVariants ? JSON.stringify(product.variants) : '',
        'Status': product.status
      };
    });

    // Create worksheet with the exact column order
    const worksheet = XLSX.utils.json_to_sheet(dataForExport, {
      header: [
        'Item No.',
        'Product Name',
        'StockQty',
        'Category',
        'Subcategory',
        'Brand',
        'Size',
        'Star',
        'Movement',
        'MRP PRICE',
        'Special Price',
        'Description',
        'Key Features',
        'image1',
        'image2',
        'image3',
        'overview images',
        'overview_description',
        'variants',
        'Status'
      ]
    });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    
    // Generate file and trigger download
    XLSX.writeFile(workbook, `products_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const [isBulkUploadModel, setIsBulkUploadModel] = useState({
    isOpen: false, 
    type: null,
  });

  const OpenModelBulk = (type_val) => {
    if (type_val == "movement") {
      setIsBulkUploadModel({
        isOpen: true, 
        type: type_val,
      });
    }else {
      setIsBulkUploadModel({
        isOpen: true, 
        type: type_val,
      });
    }
  };

  const CloseModal = (type_val) => {
    if (type_val == "movement") {
      setIsBulkUploadModel({
        isOpen: false, 
        type: type_val,
      });
    }else {
      setIsBulkUploadModel({
        isOpen: false,
        type: type_val,
      });
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
    setEditingProduct(product._id);
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleDateChange = ({ startDate, endDate }) => {
    const normalizedStartDate = startDate ? new Date(startDate) : null;
    const normalizedEndDate = endDate ? new Date(endDate) : null;
    
    setDateFilter({ 
      startDate: normalizedStartDate,
      endDate: normalizedEndDate 
    });
    setCurrentPage(0);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch("/api/product/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Product deleted successfully.");
        setShowSuccessModal(true);
        fetchProducts();
      } else {
        console.error("Error:", result.error);
        alert("Failed to delete product.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    } finally {
      setShowConfirmationModal(false);
      setProductToDelete(null);
    }
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null
    });
    setCurrentPage(0);
  };

  const flattenProducts = (products, level = 0, result = []) => {
    products.forEach((product) => {
      if (product.item_code !== 'none') {
        result.push({ ...product, level });
      }
    });
    return result;
  };

  const renderCategoryOptions = () => {
    const mainCategories = categories.filter(cat => cat.parentid === "none").slice() // prevent mutating original
    .sort((a, b) => a.category_name.localeCompare(b.category_name)); // ✅ sort ascending A–Z;
    const options = [];
    
    options.push(
      <option key="all" value="">
        All Categories
      </option>
    );

    mainCategories.forEach(mainCat => {
      options.push(
        <option 
          key={mainCat._id} 
          value={mainCat._id.toString()}
        >
          {mainCat.category_name}
        </option>
      );
    });

    return options;
  };

  const renderBrandOptions = () => {
    return [
      <option key="all" value="">
        All Brands
      </option>,
      ...brands.slice() // create a shallow copy so you don't mutate the original array
      .sort((a, b) => a.brand_name.localeCompare(b.brand_name)).map(brand => (
        <option 
          key={brand.id} 
          value={brand.id}
        >
          {brand.brand_name}
        </option>



      ))
    ];
  };

  const getFilteredProducts = () => {
    const flattenedProducts = flattenProducts(products);
   
    return flattenedProducts.filter((product) => {
      // Search filter
      const matchesSearch = debouncedSearchQuery === "" ||
        product.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.slug?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        product.item_code?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
 
      // Status filter
      const matchesStatus = statusFilter === "" ||
        product.status?.toLowerCase() === statusFilter.toLowerCase();
 
      // Date filter
      let matchesDate = true;
      if (dateFilter.startDate && dateFilter.endDate && product.createdAt) {
        const productDate = new Date(product.createdAt);
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
 
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
 
        matchesDate = productDate >= startDate && productDate <= endDate;
      }
 
      // Category filter
      let matchesCategory = true;
      if (categoryFilter) {
        if (product.category && typeof product.category === 'object') {
          const productCategoryId = product.category._id.toString();
          const selectedCategory = categories.find(cat => cat._id.toString() === categoryFilter);
         
          if (selectedCategory.parentid === "none") {
            const subCategoryIds = categories
              .filter(cat => cat.parentid === categoryFilter)
              .map(cat => cat._id.toString());
           
            matchesCategory = productCategoryId === categoryFilter ||
                            subCategoryIds.includes(productCategoryId);
          } else {
            matchesCategory = productCategoryId === categoryFilter;
          }
        } else if (product.category) {
          const productCategoryId = product.category.toString();
          const selectedCategory = categories.find(cat => cat._id.toString() === categoryFilter);
         
          if (selectedCategory.parentid === "none") {
            const subCategoryIds = categories
              .filter(cat => cat.parentid === categoryFilter)
              .map(cat => cat._id.toString());
           
            matchesCategory = productCategoryId === categoryFilter ||
                            subCategoryIds.includes(productCategoryId);
          } else {
            matchesCategory = productCategoryId === categoryFilter;
          }
        } else {
          matchesCategory = false;
        }
      }
 
      // Brand filter
      let matchesBrand = true;
      if (brandFilter) {
        if (product.brand && typeof product.brand === 'object') {
          matchesBrand = product.brand._id.toString() === brandFilter;
        } else if (product.brand) {
          matchesBrand = product.brand.toString() === brandFilter;
        } else {
          matchesBrand = false;
        }
      }
 
 
     let matchesStock = true;
if (stockFilter) {
  matchesStock = product.stock_status?.toLowerCase() === stockFilter.toLowerCase();
}
 
 
      return matchesSearch && matchesStatus && matchesDate && matchesCategory && matchesBrand && matchesStock;
    });
  };

  // const getFilteredProducts = () => {
  //   const flattenedProducts = flattenProducts(products);
    
  //   return flattenedProducts.filter((product) => {
  //     // Search filter
  //     const matchesSearch = debouncedSearchQuery === "" || 
  //       product.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
  //       product.slug?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
  //       product.item_code?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

  //     // Status filter
  //     const matchesStatus = statusFilter === "" || 
  //       product.status?.toLowerCase() === statusFilter.toLowerCase();

  //     // Date filter
  //     let matchesDate = true;
  //     if (dateFilter.startDate && dateFilter.endDate && product.createdAt) {
  //       const productDate = new Date(product.createdAt);
  //       const startDate = new Date(dateFilter.startDate);
  //       const endDate = new Date(dateFilter.endDate);

  //       startDate.setHours(0, 0, 0, 0);
  //       endDate.setHours(23, 59, 59, 999);

  //       matchesDate = productDate >= startDate && productDate <= endDate;
  //     }

  //     // Category filter
  //     let matchesCategory = true;
  //     if (categoryFilter) {
  //       if (product.category && typeof product.category === 'object') {
  //         const productCategoryId = product.category._id.toString();
  //         const selectedCategory = categories.find(cat => cat._id.toString() === categoryFilter);
          
  //         if (selectedCategory.parentid === "none") {
  //           const subCategoryIds = categories
  //             .filter(cat => cat.parentid === categoryFilter)
  //             .map(cat => cat._id.toString());
            
  //           matchesCategory = productCategoryId === categoryFilter || 
  //                           subCategoryIds.includes(productCategoryId);
  //         } else {
  //           matchesCategory = productCategoryId === categoryFilter;
  //         }
  //       } else if (product.category) {
  //         const productCategoryId = product.category.toString();
  //         const selectedCategory = categories.find(cat => cat._id.toString() === categoryFilter);
          
  //         if (selectedCategory.parentid === "none") {
  //           const subCategoryIds = categories
  //             .filter(cat => cat.parentid === categoryFilter)
  //             .map(cat => cat._id.toString());
            
  //           matchesCategory = productCategoryId === categoryFilter || 
  //                           subCategoryIds.includes(productCategoryId);
  //         } else {
  //           matchesCategory = productCategoryId === categoryFilter;
  //         }
  //       } else {
  //         matchesCategory = false;
  //       }
  //     }

  //     // Brand filter
  //     let matchesBrand = true;
  //     if (brandFilter) {
  //       if (product.brand && typeof product.brand === 'object') {
  //         matchesBrand = product.brand._id.toString() === brandFilter;
  //       } else if (product.brand) {
  //         matchesBrand = product.brand.toString() === brandFilter;
  //       } else {
  //         matchesBrand = false;
  //       }
  //     }

  //     return matchesSearch && matchesStatus && matchesDate && matchesCategory && matchesBrand;
  //   });
  // };

  const filteredProducts = getFilteredProducts();
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/uploads/files/sample_bulk_upload.xlsx?t=${Date.now()}`;
    link.download = 'item_code_movement.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateFile = (file, allowedExtensions) => {
    if (!file) return false;
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => fileName.endsWith(ext));
  };

  const [excelFile ,setExcelFile] = useState();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!excelFile || !validateFile(excelFile, ['.xlsx', '.csv'])) {
      toast.error("Please upload a valid Excel (.xlsx) or CSV (.csv) file.");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("excel", excelFile);

    try {
      const response = await fetch('/api/product/bulk-upload', {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }

    }catch (error){
      toast.error(error);
    }finally {
      setIsLoading(false);
    }

    if (type_val == "movement") {
      setIsBulkUploadModel({
        isOpen: false, 
        type: type_val,
      });
    }else {
      setIsBulkUploadModel({
        isOpen: false,
        type: type_val,
      });
    }

  }


  return (
    <div className="container mx-auto p-4">
      {showAlert && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Product List</h2>
        
        <div className="flex items-center gap-4">
          {/* <button onClick={() => OpenModelBulk("movement")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2" >
            <Icon icon="mdi:upload" className="text-lg" /> Bulk uploads one
          </button>

          <button onClick={() => OpenModelBulk("size")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2" >
            <Icon icon="mdi:upload" className="text-lg" /> Bulk uploads two
          </button> */}

          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Icon icon="mdi:microsoft-excel" className="text-lg" />
            Export to Excel
          </button>

          <Link href="/admin/product/create" className="bg-red-500 text-white px-4 py-2 rounded-md">
            + Add Product
          </Link>
        </div>
      </div>


      {isLoading ? (
        <p>Loading Products...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                {renderCategoryOptions()}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                {renderBrandOptions()}
              </select>
            </div>
<div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Stock</option>
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            {/* Date Range Picker */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <DateRangePicker 
                onChange={handleDateChange}
                onClear={clearDateFilter}
              />
            </div> */}
          </div>

          <hr className="border-t border-gray-200 mb-4" />

          {/* Products Table */}
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Item Code</th>
                <th className="p-2">Image</th>
                <th className="p-2">Name</th>
                <th className="p-2">Price</th>
                <th className="p-2 whitespace-nowrap">Spl Price</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product, index) => (
                  <tr key={product._id} className="text-center border-b">
                    {/* Item Code Column */}
                    <td className="p-2 text-center align-middle">
                      {product.item_code}
                    </td>
                  
                    {/* Image Column */}
                    <td className="p-2">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={`/uploads/products/${product.images[0]}`}
                          alt={product.name}
                          className="w-12 h-12 object-contain mx-auto"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/no-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto">
                          <span className="text-xs text-gray-400">No Image</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Name Column */}
                    <td className="p-2 text-center align-middle">
                      <a
                        href={`/product/${product.slug}`}
                        className="block mx-auto text-center truncate max-w-xs text-sm hover:underline"
                        title={product.name}
                      >
                        {product.name}
                      </a>
                    </td>
                    
                    {/* Price Column */}
                    <td className="p-2">{product.price}</td>
                    
                    {/* Special Price Column */}
                    <td className="p-2">{product.special_price}</td>
                    
                    {/* Quantity Column */}
                    <td className="p-2">{product.quantity}</td>
                    
                    {/* Status Column */}
                    <td className="p-2 font-semibold">
                      {product.status === "Active" ? (
                        <span className="bg-green-100 text-green-600 px-6 py-1.5 rounded-full font-medium text-sm">Active</span>
                      ) : (
                        <span className="bg-red-100 text-red-600 px-6 py-1.5 rounded-full font-medium text-sm">Inactive</span>
                      )}
                    </td>
                    
                    {/* Action Column */}
                    <td>
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(product._id);
                            setShowConfirmationModal(true);
                          }}
                          className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
                          title="Delete"
                        >
                          <Icon icon="mingcute:delete-2-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-4">
                    No Products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              Showing {Math.min(currentPage * itemsPerPage + 1, filteredProducts.length)} to{" "}
              {Math.min((currentPage + 1) * itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </div>

            <div className="pagination flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                «
              </button>

              {Array.from({ length: pageCount }, (_, i) => {
                const isFirst = i === 0;
                const isLast = i === pageCount - 1;
                const isNearCurrent = Math.abs(currentPage - i) <= 1;

                if (isFirst || isLast || isNearCurrent) {
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                        currentPage === i
                          ? "bg-red-500 text-white"
                          : "text-black bg-white hover:bg-gray-100"
                      }`}
                      aria-label={`Page ${i + 1}`}
                      aria-current={currentPage === i ? "page" : undefined}
                    >
                      {i + 1}
                    </button>
                  );
                }

                if (
                  (i === currentPage - 2 && i > 1) ||
                  (i === currentPage + 2 && i < pageCount - 2)
                ) {
                  return (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount - 1))}
                disabled={currentPage === pageCount - 1}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === pageCount - 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Delete Product</h2>
            <p className="mb-4">Are you sure you want to delete this Product?</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-md"
              >
                No, Close
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete)}
                className="bg-red-500 px-4 py-2 rounded-md text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Success</h2>
            <p className="mb-4">{successMessage}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-red-500 px-4 py-2 rounded-md text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && SelectedProduct && (
        <EditProductModal
          product={SelectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
            setSelectedProduct(null);
            fetchProducts();
          }}
        />
      )}

      {/* {isBulkUploadModel.isOpen && isBulkUploadModel.type == "movement" ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-[70vw]">
            <div className="flex mt-5 justify-between">
              <h2 className="text-xl font-semibold mb-4">Bulk Upload (item_code and movement)</h2>
              <button onClick={() => CloseModal("movement")} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>  
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel/CSV File
                </h3>
                <p className="text-sm text-gray-500 mt-1">Upload your product data file</p>
              </div>
              <div className="space-y-4">
                <input type="file" accept=".xlsx,.csv" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-red-100" required />
              </div>

              <button type="button" onClick={handleDownload} className="inline-flex items-center pt-5 text-sm text-blue-600 hover:text-blue-800 transition-colors" >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sample Format
              </button>
            </div>
            <div className="flex mt-5 justify-between">
              
               <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit} className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white px-3 py-2 rounded-md flex items-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>

              <button onClick={() => CloseModal("movement")} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md" >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-[70vw]">
          <div className="flex mt-5 justify-between">
          <h2 className="text-xl font-semibold mb-4">Bulk Upload (item_code and movement)</h2>
          <button onClick={() => CloseModal("size")} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>  
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel/CSV File
                </h3>
                <p className="text-sm text-gray-500 mt-1">Upload your product data file</p>
              </div>
              <div className="space-y-4">
                <input type="file" accept=".xlsx,.csv" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-red-100" required />
              </div>

              <button type="button" onClick={handleDownload} className="inline-flex items-center pt-5 text-sm text-blue-600 hover:text-blue-800 transition-colors" >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sample Format
              </button>
            </div>
            <div className="flex mt-5 justify-between">
              
               <button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit} className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white px-3 py-2 rounded-md flex items-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>

              <button onClick={() => CloseModal("size")} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md" >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}

      {isBulkUploadModel.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-[70vw]">
            <div className="flex mt-5 justify-between">
              <h2 className="text-xl font-semibold mb-4">
                Bulk Upload (item_code and movement)
              </h2>
              <button onClick={CloseModal} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>

            {/* Shared modal content */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel/CSV File
                </h3>
                <p className="text-sm text-gray-500 mt-1">Upload your product data file</p>
              </div>
              <div className="space-y-4">
                <input type="hidden" name="uploadType" value={isBulkUploadModel.type}></input>
                <input type="file" accept=".xlsx,.csv" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-red-100" required />
              </div>

              <button type="button" onClick={handleDownload} className="inline-flex items-center pt-5 text-sm text-blue-600 hover:text-blue-800 transition-colors" >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sample Format
              </button>
            </div>

            <div className="flex mt-5 justify-between">
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="bg-[#3B82F6] hover:bg-[#3B82F6] text-white px-3 py-2 rounded-md flex items-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
              </button>

              <button onClick={CloseModal} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}