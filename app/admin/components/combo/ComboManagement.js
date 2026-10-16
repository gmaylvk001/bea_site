"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import TinyEditor from "@/app/admin/components/product/TinyEditor";

// Helper to safely format Date values into local YYYY-MM-DDTHH:mm for datetime-local input
const toLocalInputDateTime = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    return "";
  }
};

export default function ComboManagement() {
  const [activeTab, setActiveTab] = useState("combos"); // "combos" | "page_settings"
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Product search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    combo_mrp: "",
    combo_price: "",
    quantity: 10,
    status: "Active",
    offer_start: "",
    offer_end: "",
    meta_title: "",
    meta_description: "",
    search_keywords: "",
    page_content: "",
    banner_image: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [existingBanner, setExistingBanner] = useState("");

  // Tab 2 selection
  const [selectedComboForContent, setSelectedComboForContent] = useState(null);

  // Fetch combos
  const fetchCombos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/combos?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setCombos(data.combos || []);
        if (data.combos?.length > 0 && !selectedComboForContent) {
          setSelectedComboForContent(data.combos[0]);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to load combos" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  // Search products debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/admin/combos/search-products?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add product to combo
  const handleAddProduct = (product) => {
    const isAlreadySelected = selectedProducts.some((p) => p._id === product._id);
    if (isAlreadySelected) {
      setMessage({ type: "warning", text: `"${product.name}" is already selected.` });
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Remove product from combo
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  // Calculated totals for selected products
  const combinedMRP = selectedProducts.reduce((sum, p) => {
    const mrp = Number(p.price) > 0 ? Number(p.price) : Number(p.special_price) || 0;
    return sum + mrp;
  }, 0);

  const combinedSellingPrice = selectedProducts.reduce((sum, p) => {
    const special = Number(p.special_price);
    const price = Number(p.price);
    const selling = special > 0 && (price <= 0 || special < price) ? special : (price > 0 ? price : special || 0);
    return sum + selling;
  }, 0);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setFormData({
      name: "",
      slug: "",
      description: "",
      combo_mrp: "",
      combo_price: "",
      quantity: 10,
      status: "Active",
      offer_start: toLocalInputDateTime(now),
      offer_end: toLocalInputDateTime(nextWeek),
      meta_title: "",
      meta_description: "",
      search_keywords: "",
      page_content: "",
      banner_image: "",
    });
    setSelectedProducts([]);
    setImageFiles([]);
    setExistingImages([]);
    setBannerFile(null);
    setExistingBanner("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = async (combo) => {
    setEditingId(combo._id);

    // Initial safe prefill from table row
    setFormData({
      name: combo.name || "",
      slug: combo.slug || "",
      description: combo.description || "",
      combo_mrp: combo.combo_mrp !== undefined && combo.combo_mrp !== null ? combo.combo_mrp : "",
      combo_price: combo.combo_price !== undefined && combo.combo_price !== null ? combo.combo_price : "",
      quantity: combo.quantity !== undefined && combo.quantity !== null ? combo.quantity : 10,
      status: combo.status || "Active",
      offer_start: toLocalInputDateTime(combo.offer_start),
      offer_end: toLocalInputDateTime(combo.offer_end),
      meta_title: combo.meta_title || "",
      meta_description: combo.meta_description || "",
      search_keywords: combo.search_keywords || "",
      page_content: combo.page_content || "",
      banner_image: combo.banner_image || "",
    });
    setSelectedProducts(combo.products || []);
    setImageFiles([]);
    setExistingImages(combo.images || []);
    setBannerFile(null);
    setExistingBanner(combo.banner_image || "");
    setIsModalOpen(true);

    // Also fetch fresh single combo directly from DB to ensure exact data
    try {
      const res = await fetch(`/api/admin/combos/${combo._id}?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.combo) {
        const fresh = data.combo;
        setFormData({
          name: fresh.name || "",
          slug: fresh.slug || "",
          description: fresh.description || "",
          combo_mrp: fresh.combo_mrp !== undefined && fresh.combo_mrp !== null ? fresh.combo_mrp : "",
          combo_price: fresh.combo_price !== undefined && fresh.combo_price !== null ? fresh.combo_price : "",
          quantity: fresh.quantity !== undefined && fresh.quantity !== null ? fresh.quantity : 10,
          status: fresh.status || "Active",
          offer_start: toLocalInputDateTime(fresh.offer_start),
          offer_end: toLocalInputDateTime(fresh.offer_end),
          meta_title: fresh.meta_title || "",
          meta_description: fresh.meta_description || "",
          search_keywords: fresh.search_keywords || "",
          page_content: fresh.page_content || "",
          banner_image: fresh.banner_image || "",
        });
        if (fresh.products && fresh.products.length > 0) {
          setSelectedProducts(fresh.products);
        }
        if (fresh.images) {
          setExistingImages(fresh.images);
        }
        if (fresh.banner_image) {
          setExistingBanner(fresh.banner_image);
        }
      }
    } catch (err) {
      console.error("Failed to fetch fresh combo details:", err);
    }
  };

  // Submit Combo Form
  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setMessage({ type: "error", text: "Please select at least 1 product for this combo." });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Please provide a combo name." });
      return;
    }
    if (formData.combo_price === "" || Number(formData.combo_price) < 0) {
      setMessage({ type: "error", text: "Please provide a valid combo selling price." });
      return;
    }
    if (formData.quantity === "" || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      setMessage({ type: "error", text: "Please provide a valid product count / available quantity (0 or more)." });
      return;
    }
    if (!formData.offer_start || !formData.offer_end) {
      setMessage({ type: "error", text: "Please provide both offer start and end dates." });
      return;
    }

    try {
      setSubmitting(true);
      const parsedQuantity = Number(formData.quantity);
      const dataPayload = {
        name: formData.name.trim(),
        description: formData.description,
        products: selectedProducts.map((p) => p._id),
        combo_mrp: Number(formData.combo_mrp) || combinedMRP,
        combo_price: Number(formData.combo_price),
        quantity: parsedQuantity,
        status: formData.status,
        offer_start: new Date(formData.offer_start).toISOString(),
        offer_end: new Date(formData.offer_end).toISOString(),
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        search_keywords: formData.search_keywords,
        page_content: formData.page_content,
        existingImages,
        existingBanner,
      };

      const bodyData = new FormData();
      bodyData.append("data", JSON.stringify(dataPayload));

      imageFiles.forEach((file) => {
        bodyData.append("images", file);
      });

      if (bannerFile) {
        bodyData.append("banner_image", bannerFile);
      }

      const url = editingId ? `/api/admin/combos/${editingId}` : "/api/admin/combos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: bodyData,
      });
      const result = await res.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: editingId ? "Combo updated successfully!" : "Combo created successfully!",
        });
        setIsModalOpen(false);
        fetchCombos();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save combo." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete combo
  const handleDeleteCombo = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Combo deleted successfully." });
        fetchCombos();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete combo." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Tab 2: Save Banner & Page Content for selected combo
  const handleSavePageSettings = async () => {
    if (!selectedComboForContent) {
      setMessage({ type: "error", text: "Please select a combo to save settings." });
      return;
    }

    try {
      setSubmitting(true);
      const rawContent = selectedComboForContent.page_content;
      const cleanContent =
        typeof rawContent === "string"
          ? rawContent
          : rawContent?.target?.value || "";

      const dataPayload = {
        banner_image: selectedComboForContent.banner_image || "",
        page_content: cleanContent,
      };

      const bodyData = new FormData();
      bodyData.append("data", JSON.stringify(dataPayload));

      if (bannerFile) {
        bodyData.append("banner_image", bannerFile);
      }

      const res = await fetch(`/api/admin/combos/${selectedComboForContent._id}`, {
        method: "PUT",
        body: bodyData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Offer page settings saved successfully!" });
        setBannerFile(null);
        fetchCombos();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save page settings." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-2 sm:px-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icon icon="mdi:package-variant" className="text-blue-600 text-3xl" />
            Combo Products Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Group individual products into discounted combos and configure frontend offer page banners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/combo-offers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
          >
            <Icon icon="mdi:eye-outline" className="text-lg" />
            View Frontend Page
          </a>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <Icon icon="mdi:plus" className="text-lg" />
            Create Combo
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.type === "warning"
              ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={
                message.type === "success"
                  ? "mdi:check-circle"
                  : message.type === "warning"
                  ? "mdi:alert"
                  : "mdi:alert-circle"
              }
              className="text-xl flex-shrink-0"
            />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="text-gray-400 hover:text-gray-700">
            <Icon icon="mdi:close" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-3 shadow-sm">
        <button
          onClick={() => setActiveTab("combos")}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "combos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon icon="mdi:package-variant-closed" className="text-lg" />
          Tab 1: Combo Products ({combos.length})
        </button>
        <button
          onClick={() => setActiveTab("page_settings")}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "page_settings"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Icon icon="mdi:image-filter-frames" className="text-lg" />
          Tab 2: Combo Offer Page Settings
        </button>
      </div>

      {/* TAB 1: COMBO PRODUCTS */}
      {activeTab === "combos" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Icon icon="mdi:loading" className="animate-spin text-4xl mx-auto mb-2 text-blue-600" />
              Loading combo offers...
            </div>
          ) : combos.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Icon icon="mdi:package-variant-closed" className="text-5xl mx-auto mb-3 text-gray-300" />
              <p className="text-base font-semibold text-gray-700">No combo products created yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first combo offer with 11 or more products.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Create First Combo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4">Combo</th>
                    <th className="py-3.5 px-4">Products</th>
                    <th className="py-3.5 px-4">Individual Totals</th>
                    <th className="py-3.5 px-4">Combo Pricing</th>
                    <th className="py-3.5 px-4">Offer Period</th>
                    <th className="py-3.5 px-4">Stock Qty</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {combos.map((combo) => {
                    const now = new Date();
                    const start = new Date(combo.offer_start);
                    const end = new Date(combo.offer_end);
                    const isUpcoming = now < start;
                    const isExpired = now > end;
                    const isActive = !isUpcoming && !isExpired && combo.status === "Active";

                    return (
                      <tr key={combo._id} className="hover:bg-gray-50 transition">
                        {/* Image & Name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 border overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {combo.images?.[0] ? (
                                <img
                                  src={combo.images[0]}
                                  alt={combo.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Icon icon="mdi:image-off" className="text-gray-400 text-2xl" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 line-clamp-1">{combo.name}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">/{combo.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Product count */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <Icon icon="mdi:layers-triple-outline" />
                            {combo.products?.length || 0} Products
                          </span>
                        </td>

                        {/* Individual totals */}
                        <td className="py-4 px-4">
                          <div className="text-xs">
                            <p className="text-gray-500">
                              MRP: <span className="line-through">₹{combo.combined_mrp?.toLocaleString()}</span>
                            </p>
                            <p className="font-semibold text-gray-800">
                              Selling: ₹{combo.combined_selling_price?.toLocaleString()}
                            </p>
                          </div>
                        </td>

                        {/* Combo Pricing */}
                        <td className="py-4 px-4">
                          <div className="text-xs">
                            <p className="text-base font-bold text-red-600">
                              ₹{combo.combo_price?.toLocaleString()}
                            </p>
                            <p className="text-gray-400 line-through">
                              ₹{combo.combo_mrp?.toLocaleString()}
                            </p>
                            {combo.combined_selling_price > combo.combo_price && (
                              <span className="text-[11px] font-bold text-green-600">
                                Extra Save: ₹{(combo.combined_selling_price - combo.combo_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-4 text-xs">
                          <p className="text-gray-700">
                            <span className="text-gray-400">From:</span> {new Date(combo.offer_start).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700">
                            <span className="text-gray-400">To:</span> {new Date(combo.offer_end).toLocaleDateString()}
                          </p>
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-4 px-4 text-xs">
                          <span className="font-bold text-gray-900 block text-sm">{combo.quantity ?? 0}</span>
                          <span className="text-[11px] text-gray-500 font-medium">In Stock</span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                              Active
                            </span>
                          ) : isUpcoming ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Upcoming
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(combo)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                              title="Edit Combo"
                            >
                              <Icon icon="mdi:pencil-outline" className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDeleteCombo(combo._id, combo.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                              title="Delete Combo"
                            >
                              <Icon icon="mdi:trash-can-outline" className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMBO OFFER PAGE SETTINGS */}
      {activeTab === "page_settings" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Icon icon="mdi:image-edit-outline" className="text-blue-600 text-xl" />
              Frontend Combo Offer Page Banner & Custom Content
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Customize the top banner and rich editable content displayed at the top of the frontend Combo Offers page.
            </p>

            {/* Select Combo to Customize */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Combo to Configure:
              </label>
              <select
                value={selectedComboForContent?._id || ""}
                onChange={(e) => {
                  const found = combos.find((c) => c._id === e.target.value);
                  setSelectedComboForContent(found || null);
                  setBannerFile(null);
                }}
                className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {combos.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.products?.length || 0} products)
                  </option>
                ))}
              </select>
            </div>

            {selectedComboForContent ? (
              <div className="space-y-6">
                {/* Banner Upload */}
                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Top Banner Image
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Recommended resolution: 1200x350px or 1920x500px (WebP, PNG, or JPG)
                  </p>

                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Preview */}
                    <div className="w-full sm:w-72 h-36 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center relative">
                      {bannerFile ? (
                        <img
                          src={URL.createObjectURL(bannerFile)}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : selectedComboForContent.banner_image ? (
                        <img
                          src={selectedComboForContent.banner_image}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No banner uploaded</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setBannerFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {(bannerFile || selectedComboForContent.banner_image) && (
                        <button
                          type="button"
                          onClick={() => {
                            setBannerFile(null);
                            setSelectedComboForContent({ ...selectedComboForContent, banner_image: "" });
                          }}
                          className="mt-3 text-xs text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Icon icon="mdi:trash-can" />
                          Remove banner
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rich Content Editor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Offer Section Content & Description (HTML / Rich Text)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    This formatted content will display directly below the banner on the frontend page.
                  </p>
                  <TinyEditor
                    value={
                      typeof selectedComboForContent.page_content === "string"
                        ? selectedComboForContent.page_content
                        : selectedComboForContent.page_content?.target?.value || ""
                    }
                    onChange={(e) => {
                      const content = typeof e === "string" ? e : e?.target?.value || "";
                      setSelectedComboForContent({
                        ...selectedComboForContent,
                        page_content: content,
                      });
                    }}
                    placeholder="Enter attractive offer highlights, promotional terms, or announcements..."
                    fullToolbar={true}
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t flex justify-end">
                  <button
                    onClick={handleSavePageSettings}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Icon icon="mdi:loading" className="animate-spin" />}
                    Save Offer Page Settings
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Please create a combo first to configure its page settings.</p>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT COMBO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon icon={editingId ? "mdi:pencil" : "mdi:plus-box"} className="text-blue-600 text-xl" />
                {editingId ? "Edit Combo Product" : "Create New Combo Product"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitCombo} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Product Selection */}
              <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <Icon icon="mdi:package-variant" className="text-blue-600" />
                    Select Products for Combo (11 or more supported)
                  </label>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                    {selectedProducts.length} Selected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Search by product name, model number, or SKU item code. Duplicates are automatically prevented.
                </p>

                {/* Search Box */}
                <div className="relative mb-3">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <Icon icon="mdi:magnify" className="text-gray-400 text-xl ml-3" />
                    <input
                      type="text"
                      placeholder="Search existing products to add to this combo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                    />
                    {searching && <Icon icon="mdi:loading" className="animate-spin text-blue-600 mr-3 text-lg" />}
                  </div>

                  {/* Dropdown Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 divide-y divide-gray-100">
                      {searchResults.map((prod) => {
                        const isAdded = selectedProducts.some((p) => p._id === prod._id);
                        return (
                          <div
                            key={prod._id}
                            onClick={() => !isAdded && handleAddProduct(prod)}
                            className={`p-2.5 flex items-center justify-between gap-3 text-sm cursor-pointer transition ${
                              isAdded ? "bg-gray-50 opacity-60 cursor-not-allowed" : "hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={prod.images?.[0] ? `/uploads/products/${prod.images[0]}` : "/no-image.jpg"}
                                alt={prod.name}
                                className="w-10 h-10 object-contain rounded border bg-white flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = "/no-image.jpg";
                                }}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{prod.name}</p>
                                <p className="text-xs text-gray-400">SKU: {prod.item_code || "N/A"}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900">
                                ₹{(prod.special_price > 0 ? prod.special_price : prod.price)?.toLocaleString()}
                              </p>
                              <span
                                className={`text-[11px] font-semibold ${
                                  isAdded ? "text-gray-400" : "text-blue-600"
                                }`}
                              >
                                {isAdded ? "Already Added" : "+ Add"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Products List */}
                {selectedProducts.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4 bg-white rounded-lg border border-dashed border-gray-300">
                    No products added yet. Use the search bar above to select 11 or more products.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                    {selectedProducts.map((p, idx) => (
                      <div key={p._id || idx} className="p-2.5 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <img
                            src={
                              p.images?.[0]
                                ? p.images[0].startsWith("http") || p.images[0].startsWith("/")
                                  ? p.images[0]
                                  : `/uploads/products/${p.images[0]}`
                                : "/no-image.jpg"
                            }
                            alt={p.name}
                            className="w-10 h-10 object-contain rounded border bg-white flex-shrink-0"
                            onError={(e) => {
                              e.target.src = "/no-image.jpg";
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              MRP: ₹{(p.price || 0).toLocaleString()} | Selling: ₹
                              {(p.special_price > 0 ? p.special_price : p.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p._id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                          title="Remove from combo"
                        >
                          <Icon icon="mdi:close-circle-outline" className="text-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* READ-ONLY LIVE TOTALS */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600 font-medium">Combined Individual MRP:</span>
                    <span className="text-sm font-bold text-gray-800">
                      ₹{combinedMRP.toLocaleString()}
                      <span className="text-[10px] text-gray-400 block text-right font-normal">(Read-only)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600 font-medium">Combined Individual Selling:</span>
                    <span className="text-sm font-bold text-blue-700">
                      ₹{combinedSellingPrice.toLocaleString()}
                      <span className="text-[10px] text-gray-400 block text-right font-normal">(Read-only)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Combo Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Combo Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Ultimate Festive Mega Kitchen Combo 11-in-1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Combo Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what makes this combo special..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Pricing Fields */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admin Combo MRP (₹) <span className="text-xs text-gray-400 font-normal">(leave blank for combined MRP)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.combo_mrp}
                    onChange={(e) => setFormData({ ...formData, combo_mrp: e.target.value })}
                    placeholder={`e.g., ${combinedMRP || 50000}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admin Combo Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.combo_price}
                    onChange={(e) => setFormData({ ...formData, combo_price: e.target.value })}
                    placeholder="Special price customer pays for combo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-red-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Offer Dates */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Offer Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.offer_start}
                    onChange={(e) => setFormData({ ...formData, offer_start: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Offer End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.offer_end}
                    onChange={(e) => setFormData({ ...formData, offer_end: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Quantity & Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Product Count / Available Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Images Upload */}
              <div className="border border-gray-200 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Combo Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles([...imageFiles, ...Array.from(e.target.files)]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {/* Previews */}
                {(existingImages.length > 0 || imageFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                        <img src={img} alt="Existing" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {imageFiles.map((file, i) => (
                      <div key={i} className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="New"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: SEO Metadata */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">SEO Fields</h3>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Meta title for Google search"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Short SEO meta description..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    value={formData.search_keywords}
                    onChange={(e) => setFormData({ ...formData, search_keywords: e.target.value })}
                    placeholder="combo, appliances, diwali sale, discount package"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Icon icon="mdi:loading" className="animate-spin" />}
                  {editingId ? "Update Combo" : "Create Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
