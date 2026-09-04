import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus, FaEdit, FaEye } from "react-icons/fa";
import { Icon } from '@iconify/react';
import DateRangePicker from '@/components/DateRangePicker';
import TinyEditor from "@/app/admin/components/product/TinyEditor";

export default function BlogComponent() {
  // State declarations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [blogData, setBlogData] = useState({
    name: "",
    image: null,
    description: "",
    status: "Active",
    videoType: "url", // 'url' or 'file'
    videoUrl: "",
    videoFile: null,
    meta_title: "",
    meta_description: "",
    meta_keyword: "",
  });
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBlogData, setEditBlogData] = useState({
    id: "",
    name: "",
    image: null,
    existingImage: "",
    description: "",
    status: "Active",
    videoType: "url", // 'url' or 'file'
    videoUrl: "",
    videoFile: null,
    existingVideo: "",
    meta_title: "",
    meta_description: "",
    meta_keyword: "",
  });
  const [editSelectedCategories, setEditSelectedCategories] = useState(new Set());
  const [previewBlog, setPreviewBlog] = useState(null);

  // Fetch categories and blogs on component mount
  useEffect(() => {
    fetchCategories();
    fetchBlogs();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories/get");
      const result = await response.json();
      if (result.error) {
        console.error("API Error:", result.error);
      } else {
        setCategories(buildCategoryTree(result));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs/get?admin=true");
      const text = await response.text();
      if (!text) {
        console.error("Empty response from API");
        return;
      }
      const result = JSON.parse(text);
      if (result.success) {
        setBlogs(result.data);
      } else {
        console.error("API Error:", result.error);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter blogs based on search, status, and date
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = blog.blog_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || blog.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter.startDate && dateFilter.endDate && blog.createdAt) {
      const blogDate = new Date(blog.createdAt);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      matchesDate = blogDate >= startDate && blogDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination variables
  const totalEntries = filteredBlogs.length;
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);
  const totalPages = Math.ceil(totalEntries / itemsPerPage);

  // Helper functions
  const buildCategoryTree = (categories, parentId = "none") => {
    return categories
      .filter((category) => category.parentid === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(categories, category._id),
      }));
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: null, endDate: null });
    setCurrentPage(1);
  };

  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    setBlogData({ ...blogData, [e.target.name]: e.target.value });
  };

  const handleDescriptionChange = (content) => {
    setBlogData({ ...blogData, description: content });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlogData({ ...blogData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCategoryChange = (category, isChecked) => {
    const updatedSelection = new Set(selectedCategories);

    const toggleChildren = (children, select) => {
      children.forEach((child) => {
        if (select) {
          updatedSelection.add(child._id);
        } else {
          updatedSelection.delete(child._id);
        }
        if (child.children.length > 0) {
          toggleChildren(child.children, select);
        }
      });
    };

    if (isChecked) {
      updatedSelection.add(category._id);
      toggleChildren(category.children, true);
    } else {
      updatedSelection.delete(category._id);
      toggleChildren(category.children, false);
    }

    const toggleParents = (parentId) => {
      if (!parentId || parentId === "none") return;
      const parent = findCategoryById(categories, parentId);
      if (parent) {
        const allChildrenSelected = parent.children.every((child) =>
          updatedSelection.has(child._id)
        );
        if (allChildrenSelected) {
          updatedSelection.add(parent._id);
        } else {
          updatedSelection.delete(parent._id);
        }
        toggleParents(parent.parentid);
      }
    };

    toggleParents(category.parentid);
    setSelectedCategories(updatedSelection);
  };

  const findCategoryById = (categories, id) => {
    for (const category of categories) {
      if (category._id === id) return category;
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
    return null;
  };

  const renderCategoryTree = (categories, level = 0, isEditMode = false) => {
    return categories.map((category) => (
      <div key={category._id} style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center cursor-pointer p-2">
          {category.children.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category._id);
              }}
              className="mr-2 text-red-500"
            >
              {expandedCategories[category._id] ? <FaMinus /> : <FaPlus />}
            </button>
          )}
          <input
            type="checkbox"
            value={category._id}
            checked={isEditMode 
              ? editSelectedCategories.has(category._id) 
              : selectedCategories.has(category._id)}
            onChange={(e) => isEditMode 
              ? handleEditCategoryChange(category, e.target.checked)
              : handleCategoryChange(category, e.target.checked)}
            className="mr-2"
          />
          <span
            className={`font-semibold ${
              (isEditMode ? editSelectedCategories.has(category._id) : selectedCategories.has(category._id)) 
                ? "text-red-500" 
                : "text-black"
            }`}
          >
            {category.category_name}
          </span>
        </div>
        {expandedCategories[category._id] && renderCategoryTree(category.children, level + 1, isEditMode)}
      </div>
    ));
  };

  // Edit functions
  const handleEdit = (blog) => {
    const isFileVideo = blog.video && blog.video.startsWith('/uploads/');
    
    setEditBlogData({
      id: blog._id,
      name: blog.blog_name,
      description: blog.description,
      status: blog.status,
      existingImage: blog.image || "",
      videoType: isFileVideo ? "file" : "url",
      videoUrl: isFileVideo ? "" : (blog.video || ""),
      videoFile: null,
      existingVideo: blog.video || "",
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
      meta_keyword: blog.meta_keyword || "",
    });
    
    const newSelected = new Set();
    if (blog.category && blog.category._id) {
      newSelected.add(blog.category._id);
    }
    setEditSelectedCategories(newSelected);
    
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    setEditBlogData({ ...editBlogData, [e.target.name]: e.target.value });
  };

  const handleEditDescriptionChange = (content) => {
    setEditBlogData({ ...editBlogData, description: content });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditBlogData({ 
        ...editBlogData, 
        image: file,
        existingImage: "" 
      });
    }
  };

  const handleEditCategoryChange = (category, isChecked) => {
    const updatedSelection = new Set(editSelectedCategories);

    const toggleChildren = (children, select) => {
      children.forEach((child) => {
        if (select) {
          updatedSelection.add(child._id);
        } else {
          updatedSelection.delete(child._id);
        }
        if (child.children.length > 0) {
          toggleChildren(child.children, select);
        }
      });
    };

    if (isChecked) {
      updatedSelection.add(category._id);
      toggleChildren(category.children, true);
    } else {
      updatedSelection.delete(category._id);
      toggleChildren(category.children, false);
    }

    const toggleParents = (parentId) => {
      if (!parentId || parentId === "none") return;
      const parent = findCategoryById(categories, parentId);
      if (parent) {
        const allChildrenSelected = parent.children.every((child) =>
          updatedSelection.has(child._id)
        );
        if (allChildrenSelected) {
          updatedSelection.add(parent._id);
        } else {
          updatedSelection.delete(parent._id);
        }
        toggleParents(parent.parentid);
      }
    };

    toggleParents(category.parentid);
    setEditSelectedCategories(updatedSelection);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (editSelectedCategories.size === 0) {
      setAlertMessage("Please select at least one category");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    setIsEditSubmitting(true);
    const formData = new FormData();
    formData.append("id", editBlogData.id);
    formData.append("name", editBlogData.name);
    formData.append("description", editBlogData.description);
    formData.append("category", Array.from(editSelectedCategories)[0] || "");
    formData.append("status", editBlogData.status);
    formData.append("meta_title", editBlogData.meta_title || "");
    formData.append("meta_description", editBlogData.meta_description || "");
    formData.append("meta_keyword", editBlogData.meta_keyword || "");
    
    if (editBlogData.image) {
      formData.append("image", editBlogData.image);
    }
    formData.append("existingImage", editBlogData.existingImage);

    if (editBlogData.videoType === "file") {
      if (editBlogData.videoFile) {
        formData.append("video", editBlogData.videoFile);
      } else {
        formData.append("existingVideo", editBlogData.existingVideo);
      }
    } else {
      formData.append("video", editBlogData.videoUrl);
    }

    try {
      const response = await fetch("/api/blogs/update", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAlertMessage("Blog updated successfully!");
        setShowAlert(true);
        setIsEditModalOpen(false);
        fetchBlogs();
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        setAlertMessage("Error: " + result.error);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setAlertMessage("Failed to update blog.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCategories.size === 0) {
      setAlertMessage("Please select at least one category");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", blogData.name);
    formData.append("description", blogData.description);
    formData.append("category", Array.from(selectedCategories)[0]);
    formData.append("status", blogData.status);
    formData.append("meta_title", blogData.meta_title || "");
    formData.append("meta_description", blogData.meta_description || "");
    formData.append("meta_keyword", blogData.meta_keyword || "");
    
    if (blogData.image) {
      formData.append("image", blogData.image);
    }

    if (blogData.videoType === "file" && blogData.videoFile) {
      formData.append("video", blogData.videoFile);
    } else if (blogData.videoType === "url" && blogData.videoUrl) {
      formData.append("video", blogData.videoUrl);
    }

    try {
      const response = await fetch("/api/blogs/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAlertMessage("Blog added successfully!");
        setShowAlert(true);
        setIsModalOpen(false);
        setBlogData({ 
          name: "", 
          image: null, 
          description: "", 
          status: "Active",
          videoType: "url",
          videoUrl: "",
          videoFile: null,
          meta_title: "",
          meta_description: "",
          meta_keyword: "",
        });
        setSelectedCategories(new Set());
        setImagePreview(null);
        fetchBlogs();
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        setAlertMessage("Error: " + result.error);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setAlertMessage("Failed to add blog.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!blogToDelete) return;
    
    try {
      const response = await fetch(`/api/blogs/delete?id=${blogToDelete}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      if (result.success) {
        setAlertMessage('Blog deleted successfully!');
        fetchBlogs();
      } else {
        setAlertMessage('Error: ' + (result.error || result.message));
      }
      
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setShowConfirmationModal(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error deleting blog:', error);
      setAlertMessage('Failed to delete blog: ' + error.message);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    if (pageNumbers.length <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>
        <ul className="pagination flex items-center space-x-1" role="navigation" aria-label="Pagination">
          <li className="page-item">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
              aria-label="Previous page"
            >
              «
            </button>
          </li>
          {pageNumbers.map((number) => (
            <li key={number} className={`page-item ${currentPage === number ? 'bg-red-500 text-white' : ''}`}>
              <button
                onClick={() => paginate(number)}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
              >
                {number}
              </button>
            </li>
          ))}
          <li className="page-item">
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === pageNumbers.length}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
              aria-label="Next page"
            >
              »
            </button>
          </li>
        </ul>
      </div>
    );
  };

  // Regular expression cleanup method to strip <tags> from displaying inside your list map loop
  const stripHtml = (htmlString) => {
    if (!htmlString) return "";
    return htmlString
      .replace(/<[^>]*>/g, "")   // Automatically strips out structural HTML tags 
      .replace(/&nbsp;/g, " ")   // Clears out visual raw blank space entities
      .trim();
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = String(url).match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Blog List</h2>
      </div>
      
      {showAlert && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
          alertMessage.includes("Error") || alertMessage.includes("Failed") 
            ? "bg-red-500 text-white" 
            : "bg-green-500 text-white"
        }`}>
          {alertMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-5">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon icon="ic:baseline-search" className="w-4 h-4 text-gray-500" />
                </span>
                <input
                  type="text"
                  placeholder="Search Blog..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="w-full col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <DateRangePicker onDateChange={handleDateChange} />
                </div>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="p-2 text-sm text-red-600 hover:text-red-800 bg-red-50 rounded-md"
                    title="Clear date filter"
                  >
                    <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition duration-150"
              >
                + Add Blog
              </button>
            </div>
          </div>
          <hr className="border-t border-gray-200 mb-4" />
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-8">
              <p>No blogs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Image</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlogs
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((blog) => (
                        <tr key={blog._id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-bold">{blog.blog_name}</td>
                          <td className="p-2">
                            {/* FIXED ROW: Uses stripHtml here to clean raw display string */}
                            <div className="max-w-xs truncate text-sm text-gray-600">
                              {stripHtml(blog.description)}
                            </div>
                          </td>
                          <td className="p-2">
                            {blog.category ? blog.category.category_name : "No Category"}
                          </td>
                          <td className="p-2 font-semibold">
                            <span className={blog.status === "Active" ? "text-green-500" : "text-red-500"}>
                              {blog.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {blog.image && (
                              <img 
                                src={blog.image} 
                                alt="Blog" 
                                className="h-8 object-contain" 
                              />
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {blog.blog_slug && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewBlog(blog)}
                                  className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center hover:bg-blue-200 transition"
                                  title="Preview"
                                >
                                  <FaEye />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(blog)}
                                className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center hover:bg-red-200 transition"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => {
                                  setBlogToDelete(blog._id);
                                  setShowConfirmationModal(true);
                                }}
                                className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center hover:bg-pink-200 transition"
                                title="Delete"
                              >
                                <Icon icon="mingcute:delete-2-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      )}

      {/* Add Blog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Blog</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="blog_name" className="block mb-1 text-sm font-semibold text-gray-700">
                    Blog Name
                  </label>
                  <input
                    name="name"
                    value={blogData.name}
                    onChange={handleInputChange}
                    id="blog_name"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Blog Name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Upload Banner Image</label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Banner preview" className="mt-3 h-24 rounded-md object-contain mx-auto" />
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Select Category</label>
                  <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                    {categories.length > 0 ? renderCategoryTree(categories) : <p className="text-gray-500">No categories available</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="meta_title" className="block mb-1 text-sm font-semibold text-gray-700">Meta Title</label>
                  <input
                    name="meta_title"
                    value={blogData.meta_title}
                    onChange={handleInputChange}
                    id="meta_title"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta title (shown in view source)"
                  />
                </div>
                <div>
                  <label htmlFor="meta_description" className="block mb-1 text-sm font-semibold text-gray-700">Meta Description</label>
                  <textarea
                    name="meta_description"
                    value={blogData.meta_description}
                    onChange={handleInputChange}
                    id="meta_description"
                    rows={3}
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta description (shown in view source)"
                  />
                </div>
                <div>
                  <label htmlFor="meta_keyword" className="block mb-1 text-sm font-semibold text-gray-700">Meta Keyword</label>
                  <input
                    name="meta_keyword"
                    value={blogData.meta_keyword}
                    onChange={handleInputChange}
                    id="meta_keyword"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta keywords, comma separated"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Blog Description</label>
                  <div className="bg-white">
                    {isModalOpen && (
                      <TinyEditor
                        value={blogData.description}
                        fullToolbar
                        placeholder="Enter blog description..."
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Blog Video</label>
                  <div className="flex gap-4 mb-3">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="radio"
                        name="videoType"
                        value="url"
                        checked={blogData.videoType === "url"}
                        onChange={handleInputChange}
                        className="mr-2 text-red-500 focus:ring-red-400"
                      />
                      Video URL (YouTube/Vimeo)
                    </label>
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="radio"
                        name="videoType"
                        value="file"
                        checked={blogData.videoType === "file"}
                        onChange={handleInputChange}
                        className="mr-2 text-red-500 focus:ring-red-400"
                      />
                      Upload Local File
                    </label>
                  </div>

                  {blogData.videoType === "url" ? (
                    <input
                      type="url"
                      name="videoUrl"
                      value={blogData.videoUrl}
                      onChange={handleInputChange}
                      placeholder="Paste YouTube or Vimeo link here"
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400 text-sm"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setBlogData({ ...blogData, videoFile: e.target.files[0] })}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block mb-1 text-sm font-semibold text-gray-700">Status</label>
                  <select
                    name="status"
                    id="status"
                    value={blogData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin" />
                        <span>Adding Blog...</span>
                      </>
                    ) : (
                      "Add Blog"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Blog Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Update Blog</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label htmlFor="edit_blog_name" className="block mb-1 text-sm font-semibold text-gray-700">Blog Name</label>
                  <input
                    name="name"
                    value={editBlogData.name}
                    onChange={handleEditInputChange}
                    id="edit_blog_name"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Enter Blog Name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Upload Banner Image</label>
                  <input
                    type="file"
                    onChange={handleEditImageChange}
                    accept="image/*"
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {editBlogData.existingImage && !editBlogData.image && (
                    <img src={editBlogData.existingImage} alt="Current banner" className="mt-3 h-24 rounded-md object-contain mx-auto" />
                  )}
                  {editBlogData.image && (
                    <img src={URL.createObjectURL(editBlogData.image)} alt="New banner" className="mt-3 h-24 rounded-md object-contain mx-auto" />
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Select Category</label>
                  <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                    {categories.length > 0 ? renderCategoryTree(categories, 0, true) : <p className="text-gray-500">No categories available</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="edit_meta_title" className="block mb-1 text-sm font-semibold text-gray-700">Meta Title</label>
                  <input
                    name="meta_title"
                    value={editBlogData.meta_title}
                    onChange={handleEditInputChange}
                    id="edit_meta_title"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta title (shown in view source)"
                  />
                </div>
                <div>
                  <label htmlFor="edit_meta_description" className="block mb-1 text-sm font-semibold text-gray-700">Meta Description</label>
                  <textarea
                    name="meta_description"
                    value={editBlogData.meta_description}
                    onChange={handleEditInputChange}
                    id="edit_meta_description"
                    rows={3}
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta description (shown in view source)"
                  />
                </div>
                <div>
                  <label htmlFor="edit_meta_keyword" className="block mb-1 text-sm font-semibold text-gray-700">Meta Keyword</label>
                  <input
                    name="meta_keyword"
                    value={editBlogData.meta_keyword}
                    onChange={handleEditInputChange}
                    id="edit_meta_keyword"
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400"
                    placeholder="Meta keywords, comma separated"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Blog Description</label>
                  <div className="bg-white">
                    {isEditModalOpen && (
                      <TinyEditor
                        value={editBlogData.description}
                        fullToolbar
                        placeholder="Enter blog description..."
                        onChange={(e) => handleEditDescriptionChange(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Blog Video</label>
                  <div className="flex gap-4 mb-3">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="radio"
                        name="videoType"
                        value="url"
                        checked={editBlogData.videoType === "url"}
                        onChange={handleEditInputChange}
                        className="mr-2 text-red-500 focus:ring-red-400"
                      />
                      Video URL (YouTube/Vimeo)
                    </label>
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="radio"
                        name="videoType"
                        value="file"
                        checked={editBlogData.videoType === "file"}
                        onChange={handleEditInputChange}
                        className="mr-2 text-red-500 focus:ring-red-400"
                      />
                      Upload Local File
                    </label>
                  </div>

                  {editBlogData.videoType === "url" ? (
                    <input
                      type="url"
                      name="videoUrl"
                      value={editBlogData.videoUrl}
                      onChange={handleEditInputChange}
                      placeholder="Paste YouTube or Vimeo link here"
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-400 text-sm"
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setEditBlogData({ ...editBlogData, videoFile: e.target.files[0] })}
                        className="block w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      {editBlogData.existingVideo && editBlogData.existingVideo.startsWith('/uploads/') && !editBlogData.videoFile && (
                        <p className="text-xs text-gray-500 mt-1 italic">Current File: {editBlogData.existingVideo.split('/').pop()}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="edit_status" className="block mb-1 text-sm font-semibold text-gray-700">Status</label>
                  <select
                    name="status"
                    id="edit_status"
                    value={editBlogData.status}
                    onChange={handleEditInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="w-full bg-red-600 text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isEditSubmitting ? (
                      <>
                        <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin" />
                        <span>Updating Blog...</span>
                      </>
                    ) : (
                      "Update Blog"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Blog preview popup — stays on admin, does not open the storefront */}
      {previewBlog && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 overflow-y-auto p-4"
          onClick={() => setPreviewBlog(null)}
        >
          <div
            className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-preview-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white border-b px-5 py-3">
              <h3 className="text-base font-semibold text-gray-900">Blog Preview</h3>
              <button
                type="button"
                onClick={() => setPreviewBlog(null)}
                className="w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-2xl leading-none flex items-center justify-center"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <article className="px-5 sm:px-8 py-6 max-h-[80vh] overflow-y-auto">
              {previewBlog.category?.category_name && (
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                  {previewBlog.category.category_name}
                </span>
              )}

              <h1
                id="blog-preview-title"
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight"
              >
                {previewBlog.blog_name}
              </h1>

              <div className="flex items-center text-gray-500 text-sm gap-3 mb-6">
                {previewBlog.createdAt && (
                  <span>
                    Published on{" "}
                    {new Date(previewBlog.createdAt).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {previewBlog.status && (
                  <span
                    className={
                      previewBlog.status === "Active"
                        ? "text-green-600 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {previewBlog.status}
                  </span>
                )}
              </div>

              {previewBlog.video && String(previewBlog.video).trim() !== "" ? (
                <>
                  <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-black">
                    {getYouTubeId(previewBlog.video) ? (
                      <div className="aspect-video">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeId(previewBlog.video)}`}
                          title="Blog video preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video
                        className="w-full"
                        src={previewBlog.video}
                        controls
                        playsInline
                      />
                    )}
                  </div>
                  {previewBlog.image && (
                    <div className="mb-6 rounded-lg overflow-hidden shadow border border-gray-100">
                      <img
                        src={previewBlog.image}
                        alt={previewBlog.blog_name}
                        className="w-full h-56 object-cover"
                      />
                    </div>
                  )}
                </>
              ) : previewBlog.image ? (
                <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={previewBlog.image}
                    alt={previewBlog.blog_name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : null}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-8">
                <style>{`
                  .admin-blog-preview-body { font-family: Roboto, Calibri, Helvetica, Arial, sans-serif; font-size: 16.5px; line-height: 1.8; color: #1f2937; }
                  .admin-blog-preview-body p { margin-bottom: 1.15rem; }
                  .admin-blog-preview-body h1 { font-size: 2rem; font-weight: 700; margin: 1.75rem 0 1rem; color: #111827; }
                  .admin-blog-preview-body h2 { font-size: 1.6rem; font-weight: 700; margin: 1.5rem 0 0.85rem; color: #111827; }
                  .admin-blog-preview-body h3 { font-size: 1.3rem; font-weight: 600; margin: 1.25rem 0 0.7rem; color: #111827; }
                  .admin-blog-preview-body h4 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; }
                  .admin-blog-preview-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.15rem; }
                  .admin-blog-preview-body ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.15rem; }
                  .admin-blog-preview-body li { margin-bottom: 0.4rem; }
                  .admin-blog-preview-body a { color: #2563eb; text-decoration: underline; }
                  .admin-blog-preview-body img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
                  .admin-blog-preview-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
                  .admin-blog-preview-body th, .admin-blog-preview-body td { border: 1px solid #e5e7eb; padding: 0.6rem 0.75rem; text-align: left; }
                  .admin-blog-preview-body iframe, .admin-blog-preview-body video { max-width: 100%; margin: 1.5rem 0; }
                `}</style>
                <div className="admin-blog-preview-body">
                  {previewBlog.description && /<\/?[a-z][\s\S]*>/i.test(previewBlog.description) ? (
                    <div dangerouslySetInnerHTML={{ __html: previewBlog.description }} />
                  ) : (
                    (previewBlog.description || "").split("\n").map((paragraph, index) =>
                      paragraph.trim() ? (
                        <p key={index} className="mb-5 last:mb-0">
                          {paragraph}
                        </p>
                      ) : null
                    )
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Confirm Deletion</h3>
            <p className="mb-6 text-sm text-gray-600">Are you sure you want to mark this blog as Inactive?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}