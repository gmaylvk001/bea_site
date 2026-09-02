"use client";
import { useEffect, useMemo, useState } from "react";

export default function CategoryBrandBannerAdmin() {
  const [parentCategories, setParentCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [form, setForm] = useState({
    categoryId: "",
    brandId: "",
    bannerName: "",
    bannerImage: null,
    redirectUrl: "",
    bannerStatus: "Active",
    displayOrder: 0,
  });

  const fetchParents = async () => {
    const res = await fetch("/api/categories/banner");
    const data = await res.json();
    const all = data.categories || [];
    const parents = all
      .filter((c) => !c.parentid || c.parentid === "none")
      .sort((a, b) => String(a.category_name).localeCompare(String(b.category_name)));
    setParentCategories(parents);
  };

  const fetchBanners = async () => {
    const res = await fetch("/api/category-brand-banner?admin=1");
    const data = await res.json();
    if (data.success) setBanners(data.banners || []);
  };

  const fetchBrandsForCategory = async (categorySlug) => {
    if (!categorySlug) {
      setBrands([]);
      return;
    }
    setLoadingBrands(true);
    try {
      const res = await fetch(
        `/api/brand/by-category?slug=${encodeURIComponent(categorySlug)}&all=1`
      );
      const data = await res.json();
      setBrands(data.success ? data.brands || [] : []);
    } catch {
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    fetchParents();
    fetchBanners();
  }, []);

  const grouped = useMemo(() => {
    return banners.reduce((acc, banner) => {
      const catSlug = banner.category_slug || "unknown";
      const brandSlug = banner.brand_slug || "unknown";
      const key = `${catSlug}::${brandSlug}`;
      if (!acc[key]) {
        acc[key] = {
          category_name: banner.category_name,
          category_slug: catSlug,
          brand_name: banner.brand_name,
          brand_slug: brandSlug,
          banners: [],
        };
      }
      acc[key].banners.push(banner);
      return acc;
    }, {});
  }, [banners]);

  const openModal = (banner = null) => {
    setSelectedBanner(banner);
    setForm({
      categoryId: banner?.category_id?._id || banner?.category_id || "",
      brandId: banner?.brand_id?._id || banner?.brand_id || "",
      bannerName: banner?.banner_name || "",
      bannerImage: null,
      redirectUrl: banner?.redirect_url || "",
      bannerStatus: banner?.banner_status || "Active",
      displayOrder: banner?.display_order || 0,
    });
    if (banner?.category_slug) {
      fetchBrandsForCategory(banner.category_slug);
    } else {
      setBrands([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBanner(null);
    setBrands([]);
    setForm({
      categoryId: "",
      brandId: "",
      bannerName: "",
      bannerImage: null,
      redirectUrl: "",
      bannerStatus: "Active",
      displayOrder: 0,
    });
  };

  const handleCategoryChange = (categoryId) => {
    setForm((prev) => ({ ...prev, categoryId, brandId: "" }));
    const category = parentCategories.find((c) => String(c._id) === String(categoryId));
    fetchBrandsForCategory(category?.category_slug || "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("banner_name", form.bannerName);
    fd.append("redirect_url", form.redirectUrl);
    fd.append("banner_status", form.bannerStatus);
    fd.append("display_order", form.displayOrder);
    if (form.bannerImage) fd.append("bannerImage", form.bannerImage);
    if (selectedBanner) {
      fd.append("bannerId", selectedBanner._id);
    } else {
      fd.append("categoryId", form.categoryId);
      fd.append("brandId", form.brandId);
    }

    const res = await fetch("/api/category-brand-banner", { method: "POST", body: fd });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setMessageModal(data.message || "Saved successfully!");
      closeModal();
      fetchBanners();
    } else {
      setMessageModal(data.error || "Error saving banner");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch("/api/category-brand-banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: deleteId }),
    });
    const data = await res.json();
    setDeleteId(null);
    if (data.success) {
      setMessageModal("Deleted successfully!");
      fetchBanners();
    } else {
      setMessageModal(data.error || "Error deleting banner");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Category Brand Banners (1920×600)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Shown on /category/brand/parent-category/brand-name. Multiple banners become a carousel.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Banner
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded border">
          No category brand banners found
        </div>
      ) : (
        Object.entries(grouped).map(([key, group]) => (
          <div key={key} className="border border-gray-300 rounded-lg bg-white shadow">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <h3 className="font-bold text-lg">
                {group.category_name} / {group.brand_name}
              </h3>
              <p className="text-sm text-gray-600">
                /category/brand/{group.category_slug}/{group.brand_slug}
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Banner</th>
                  <th className="border px-3 py-2">Redirect URL</th>
                  <th className="border px-3 py-2 w-24">Status</th>
                  <th className="border px-3 py-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.banners
                  .slice()
                  .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                  .map((banner) => (
                    <tr key={banner._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={banner.banner_image}
                            alt={banner.banner_name}
                            className="h-16 w-28 object-cover border rounded"
                          />
                          <div>
                            <p className="font-medium">{banner.banner_name}</p>
                            <p className="text-xs text-gray-500">Order: {banner.display_order}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border px-3 py-2">{banner.redirect_url || "—"}</td>
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
                      <td className="border px-3 py-2 text-center space-x-2">
                        <button
                          onClick={() => openModal(banner)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(banner._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[520px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {selectedBanner ? "Edit Category Brand Banner" : "Add Category Brand Banner"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {!selectedBanner && (
                <>
                  <label className="block text-sm">
                    <span className="font-medium mb-1 block">Parent Category *</span>
                    <select
                      value={form.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full border px-2 py-2 rounded"
                      required
                    >
                      <option value="">Choose a parent category</option>
                      {parentCategories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium mb-1 block">Brand *</span>
                    <select
                      value={form.brandId}
                      onChange={(e) => setForm((prev) => ({ ...prev, brandId: e.target.value }))}
                      className="w-full border px-2 py-2 rounded"
                      required
                      disabled={!form.categoryId || loadingBrands}
                    >
                      <option value="">
                        {!form.categoryId
                          ? "Select a parent category first"
                          : loadingBrands
                            ? "Loading brands..."
                            : brands.length
                              ? "Choose a brand"
                              : "No brands found for this category"}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.brand_name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label className="block text-sm">
                <span className="font-medium mb-1 block">Banner Name *</span>
                <input
                  type="text"
                  value={form.bannerName}
                  onChange={(e) => setForm((prev) => ({ ...prev, bannerName: e.target.value }))}
                  className="w-full border px-2 py-2 rounded"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium mb-1 block">Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full border px-2 py-2 rounded"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium mb-1 block">
                  Banner Image {!selectedBanner && "*"}
                </span>
                <p className="text-gray-500 text-sm mb-2">
                  Recommended size: <span className="font-semibold">1920 × 600 px</span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bannerImage: e.target.files?.[0] || null }))
                  }
                  className="w-full border px-2 py-2 rounded"
                  required={!selectedBanner}
                />
                {selectedBanner?.banner_image && !form.bannerImage && (
                  <img
                    src={selectedBanner.banner_image}
                    alt="Current banner"
                    className="h-24 w-auto object-contain mt-2 border rounded"
                  />
                )}
              </label>

              <label className="block text-sm">
                <span className="font-medium mb-1 block">Redirect URL</span>
                <input
                  type="text"
                  value={form.redirectUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                  className="w-full border px-2 py-2 rounded"
                  placeholder="https://..."
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium mb-1 block">Status</span>
                <select
                  value={form.bannerStatus}
                  onChange={(e) => setForm((prev) => ({ ...prev, bannerStatus: e.target.value }))}
                  className="w-full border px-2 py-2 rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

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
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] text-center">
            <h3 className="text-lg font-semibold mb-2">Delete this banner?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-400 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-4 py-2 rounded text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {messageModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-[320px] text-center">
            <p className="font-medium">{messageModal}</p>
            <button
              onClick={() => setMessageModal(null)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
