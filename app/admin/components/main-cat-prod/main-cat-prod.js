"use client";
import { useEffect, useState } from "react";

export default function CategoryProductManager() {
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerType, setBannerType] = useState("top"); // "top" or "sub"
  const [formData, setFormData] = useState({
    bannerName: "",
    bannerImage: null,
    redirectUrl: "",
    bannerStatus: "Active",
    displayOrder: 0,
    categoryId: ""
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    const res = await fetch("/api/categories/banner");
    const data = await res.json();
    if (data.success) setCategories(data.categories);
  };

  // Fetch all banners
  const fetchBanners = async () => {
    const res = await fetch("/api/main-cat-products");
    const data = await res.json();
    if (data.success) setBanners(data.banners);
  };

  useEffect(() => {
    fetchCategories();
    fetchBanners();
  }, []);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const openModal = (type = "top", banner = null) => {
    setBannerType(type);
    setSelectedBanner(banner);
    setFormData({
      bannerName: banner ? banner.banner_name : "",
      bannerImage: null,
      redirectUrl: banner ? banner.redirect_url : "",
      bannerStatus: banner ? banner.banner_status : "Active",
      displayOrder: banner ? banner.display_order : 0,
      categoryId: banner ? (banner.category_id?._id || banner.category_id) : ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Find the selected category to get slug and name
    const selectedCategory = categories.find(cat => cat._id === formData.categoryId);
    
    if (!selectedCategory && !selectedBanner) {
      setMessageModal("Please select a category first");
      setLoading(false);
      return;
    }

    const fd = new FormData();
    fd.append("banner_name", formData.bannerName);
    fd.append("redirect_url", formData.redirectUrl);
    fd.append("banner_status", formData.bannerStatus);
    fd.append("display_order", formData.displayOrder);
    fd.append("banner_type", bannerType);
    fd.append("categoryId", formData.categoryId);
    
    // ADD THESE REQUIRED FIELDS
    fd.append("category_slug", selectedCategory?.category_slug || selectedBanner?.category_slug || "");
    fd.append("category_name", selectedCategory?.category_name || selectedBanner?.category_name || "");

    if (formData.bannerImage) {
      fd.append("bannerImage", formData.bannerImage);
    }

    if (selectedBanner) {
      fd.append("bannerId", selectedBanner._id);
    }

    console.log("📤 Sending form data:", {
      banner_name: formData.bannerName,
      category_slug: selectedCategory?.category_slug || selectedBanner?.category_slug,
      category_name: selectedCategory?.category_name || selectedBanner?.category_name
    });

    const res = await fetch("/api/main-cat-products", {
      method: "POST",
      body: fd,
    });
    
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMessageModal(data.message || "Saved successfully!");
      closeModal();
      fetchBanners();
    } else {
      setMessageModal(data.error || "Error saving data");
    }
  };

  const handleDelete = (bannerId) => {
    setDeleteModal(bannerId);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    const res = await fetch("/api/main-cat-products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: deleteModal }),
    });
    
    const data = await res.json();
    setDeleteModal(null);

    if (data.success) {
      setMessageModal(data.message || "Deleted successfully!");
      fetchBanners();
    } else {
      setMessageModal(data.error || "Error deleting data");
    }
  };

  const updateDisplayOrder = async (bannerId, newOrder) => {
    const res = await fetch("/api/main-cat-products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId, display_order: newOrder }),
    });
    
    const data = await res.json();
    if (data.success) {
      fetchBanners();
    } else {
      setMessageModal(data.error || "Error updating order");
    }
  };

  const closeModal = () => {
    setSelectedBanner(null);
    setBannerType("top");
    setFormData({
      bannerName: "",
      bannerImage: null,
      redirectUrl: "",
      bannerStatus: "Active",
      displayOrder: 0,
      categoryId: ""
    });
    setIsModalOpen(false);
  };

  // Filter banners by type
  const topBanners = banners.filter(banner => banner.banner_type === "top");
  const subBanners = banners.filter(banner => banner.banner_type === "sub");

  // Group banners by category
  const groupBannersByCategory = (banners) => {
    return banners.reduce((acc, banner) => {
      const categoryId = banner.category_id?._id || banner.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: banner.category_id || { 
            category_name: banner.category_name, 
            category_slug: banner.category_slug 
          },
          banners: []
        };
      }
      acc[categoryId].banners.push(banner);
      return acc;
    }, {});
  };

  const groupedTopBanners = groupBannersByCategory(topBanners);
  const groupedSubBanners = groupBannersByCategory(subBanners);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Manage Category Banners</h2>
        <div className="flex gap-3">
          <button
            onClick={() => openModal("top")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            + Add Top Banner
          </button>
          <button
            onClick={() => openModal("sub")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            + Add Sub Banner
          </button>
        </div>
      </div>

      {/* Top Banners Section (1900×400) */}
      <div className="border border-gray-300 rounded-lg bg-white shadow">
        <div className="bg-blue-50 px-4 py-3 border-b border-gray-300">
          <h3 className="font-bold text-lg text-blue-800">Top Category Banners (1900×400)</h3>
          <p className="text-sm text-blue-600">Main category header banners</p>
        </div>

        {Object.keys(groupedTopBanners).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No top category banners found
          </div>
        ) : (
          Object.entries(groupedTopBanners).map(([categoryId, { category, banners }]) => (
            <div key={`top-${categoryId}`} className="border-b border-gray-200 last:border-b-0">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold">{category.category_name}</h4>
                <p className="text-xs text-gray-500">{category.category_slug}</p>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2">Banner (1900×400)</th>
                    <th className="border px-3 py-2">Redirect URL</th>
                    <th className="border px-3 py-2 w-20">Status</th>
                    <th className="border px-3 py-2 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((banner) => (
                    <tr key={banner._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">
                        <div className="flex items-center space-x-3">
                          <img
                            src={banner.banner_image}
                            alt={banner.banner_name}
                            className="h-16 w-40 object-cover border rounded"
                          />
                          <div>
                            <p className="font-medium">{banner.banner_name}</p>
                            <p className="text-xs text-gray-500">
                              Added: {new Date(banner.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border px-3 py-2">
                        <p className="truncate max-w-xs" title={banner.redirect_url}>
                          {banner.redirect_url || '-'}
                        </p>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            banner.banner_status === "Active"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {banner.banner_status}
                        </span>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <div className="space-x-2">
                          <button
                            onClick={() => openModal("top", banner)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(banner._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* Sub Category Banners Section (238×238) - Updated to Table Format */}
     <div className="border border-gray-300 rounded-lg bg-white shadow">
  {/* Page Header */}
  <div className="bg-green-50 px-4 py-3 border-b border-gray-300">
    <h3 className="font-bold text-lg text-green-800">Sub Category Banners (238×238)</h3>
    <p className="text-sm text-green-600">Small square banners for sub-categories</p>
  </div>

  {Object.keys(groupedSubBanners).length === 0 ? (
    <div className="text-center py-8 text-gray-500">No sub-category banners found</div>
  ) : (
    Object.entries(groupedSubBanners).map(([categoryId, { category, banners }]) => (
      <div key={`sub-${categoryId}`} className="py-6 border-b last:border-none">
        
        {/* Category Heading */}
        <div className="px-5 mb-4">
          <h2 className="text-xl font-bold text-gray-800">{category.category_name}</h2>
          <p className="text-sm text-gray-500">{category.category_slug}</p>
        </div>

        {/* Table */}
        <div className="px-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                
                <th className="border px-3 py-2">Banner</th>
                <th className="border px-3 py-2">Redirect URL</th>
                <th className="border px-3 py-2 w-24 text-center">Status</th>
                <th className="border px-3 py-2 w-40 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {banners.sort((a, b) => a.display_order - b.display_order).map((banner) => (
                <tr key={banner._id} className="hover:bg-gray-50">

              

                  {/* Banner Details */}
                  <td className="border px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={banner.banner_image}
                        alt={banner.banner_name}
                        className="h-16 w-16 object-cover border rounded"
                      />
                      <div>
                        <p className="font-medium">{banner.banner_name}</p>
                        <p className="text-xs text-gray-500">
                          Added: {new Date(banner.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Redirect URL */}
                  <td className="border px-3 py-2">
                    <p className="truncate max-w-xs" title={banner.redirect_url}>
                      {banner.redirect_url || "-"}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="border px-3 py-2 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        banner.banner_status === "Active"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {banner.banner_status}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="border px-3 py-2 text-center">
                    <div className="space-x-2">
                      <button
                        onClick={() => openModal("sub", banner)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))
  )}
</div>


      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {selectedBanner ? "Edit Banner" : `Add ${bannerType === "top" ? "Top" : "Sub"} Banner`}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {!selectedBanner && (
               <div>
  <label className="block text-sm font-medium mb-1">
    Select Category *
  </label>
  <select
    value={formData.categoryId}
    onChange={(e) => handleInputChange("categoryId", e.target.value)}
    className="w-full border px-2 py-2 rounded"
    required
  >
    <option value="">Choose a category</option>
    {categories.map((category) => (
      <option 
        key={category._id} 
        value={category._id}
      >
        {category.category_name}
      </option>
    ))}
  </select>
</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Name *
                </label>
                <input
                  type="text"
                  placeholder="Banner Name"
                  value={formData.bannerName}
                  onChange={(e) => handleInputChange("bannerName", e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                  required
                />
              </div>
              
            

              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Image {!selectedBanner && "*"}
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  Recommended Size: <span className="font-semibold">
                    {bannerType === "top" ? "1900 × 400 px" : "238 × 238 px"}
                  </span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChange("bannerImage", e.target.files[0])
                  }
                  className="w-full border px-2 py-1 rounded"
                  required={!selectedBanner}
                />
                {selectedBanner?.banner_image && !formData.bannerImage && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Current Image:</p>
                    <img 
                      src={selectedBanner.banner_image} 
                      alt="Current banner" 
                      className={`${bannerType === "top" ? "h-20 w-full object-cover" : "h-20 w-20 object-cover"} mt-1 border rounded`}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Redirect URL
                </label>
                <input
                  type="text"
                  placeholder="Redirect URL"
                  value={formData.redirectUrl}
                  onChange={(e) => handleInputChange("redirectUrl", e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  value={formData.bannerStatus}
                  onChange={(e) =>
                    handleInputChange("bannerStatus", e.target.value)
                  }
                  className="w-full border px-2 py-1 rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this banner?
            </h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-400 px-4 py-2 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-[300px] text-center shadow-lg">
            <p className="text-lg font-medium">{messageModal}</p>
            <button
              onClick={() => setMessageModal(null)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}