"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // + dnd import

const ALLOWED_EXTENSIONS = [".webp", ".avif"];
const ALLOWED_MIME_TYPES = ["image/webp", "image/avif"];

const isWebpOrAvif = (file) => {
  if (!file) return true;
  const fileName = (file.name || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = ALLOWED_MIME_TYPES.includes(fileType);
  return hasValidExt || hasValidMime;
};

export default function TopBannerPage() {
  const [banners, setBanners] = useState([]);
  const [newBanner, setNewBanner] = useState({
    banner_image: null,
    mobile_banner_image: null,
    redirect_url: "",
    status: "Active",
  });
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [editingStates, setEditingStates] = useState({});

  // Fetch banners
  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/topbanner");
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners);
        // Initialize editing states
        const states = {};
        data.banners.forEach((banner) => {
          states[banner._id] = {
            redirect_url: banner.redirect_url || "",
            status: banner.status || "Active",
            banner_image: null,
            mobile_banner_image: null,
            remove_mobile_banner: false,
            hasChanges: false,
            saving: false,
            error: "", // ✅ per-banner error state
          };
        });
        setEditingStates(states);
      }
    } catch (err) {
      setError("Failed to fetch banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Save new banner
  const handleSave = async () => {
    setError("");
    setImageError("");

    if (!newBanner.banner_image) {
      setImageError("Please choose a desktop banner image.");
      return;
    }
    if (!isWebpOrAvif(newBanner.banner_image)) {
      setImageError("Desktop Banner: Only WebP (.webp) and AVIF (.avif) formats are allowed.");
      return;
    }
    if (newBanner.mobile_banner_image && !isWebpOrAvif(newBanner.mobile_banner_image)) {
      setImageError("Mobile Banner: Only WebP (.webp) and AVIF (.avif) formats are allowed.");
      return;
    }
    if (!newBanner.redirect_url) {
      setError("Redirect URL is required.");
      return;
    }

    const formData = new FormData();
    formData.append("banner_image", newBanner.banner_image);
    if (newBanner.mobile_banner_image) {
      formData.append("mobile_banner_image", newBanner.mobile_banner_image);
    }
    formData.append("redirect_url", newBanner.redirect_url);
    formData.append("status", newBanner.status);

    try {
      const res = await fetch("/api/topbanner", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setNewBanner({ banner_image: null, mobile_banner_image: null, redirect_url: "", status: "Active" });
        setShowAddForm(false);
        fetchBanners();
      } else {
        if (data.message && data.message.includes("1920x550")) {
          setImageError(data.message);
        } else {
          setError(data.message || "Something went wrong.");
        }
      }
    } catch (err) {
      setError("Failed to save banner");
    }
  };

  // Save all inputs for an existing banner with a single button
  const handleSaveBanner = async (id) => {
    const state = editingStates[id];
    if (!state) return;

    setError("");
    setImageError("");

    if (state.banner_image && !isWebpOrAvif(state.banner_image)) {
      setEditingStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], error: "Desktop image: Only WebP (.webp) and AVIF (.avif) formats are allowed." },
      }));
      return;
    }
    if (state.mobile_banner_image && !isWebpOrAvif(state.mobile_banner_image)) {
      setEditingStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], error: "Mobile image: Only WebP (.webp) and AVIF (.avif) formats are allowed." },
      }));
      return;
    }

    const formData = new FormData();
    formData.append("id", id);
    if (state.redirect_url !== undefined && state.redirect_url !== null) {
      formData.append("redirect_url", state.redirect_url);
    }
    if (state.status) {
      formData.append("status", state.status);
    }
    if (state.banner_image) {
      formData.append("banner_image", state.banner_image);
    }
    if (state.mobile_banner_image) {
      formData.append("mobile_banner_image", state.mobile_banner_image);
    } else if (state.remove_mobile_banner) {
      formData.append("remove_mobile_banner", "true");
    }

    setEditingStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], saving: true, error: "" },
    }));

    try {
      const res = await fetch("/api/topbanner", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setEditingStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            banner_image: null,
            mobile_banner_image: null,
            remove_mobile_banner: false,
            hasChanges: false,
            saving: false,
            error: "",
          },
        }));
        fetchBanners();
      } else {
        setEditingStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            saving: false,
            error: data.message || "Update failed.",
          },
        }));
      }
    } catch (err) {
      setEditingStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          error: "Failed to update banner",
        },
      }));
    }
  };

  // Handle input changes for existing banners
  const handleInputChange = (id, field, value) => {
    if ((field === "banner_image" || field === "mobile_banner_image") && value instanceof File) {
      if (!isWebpOrAvif(value)) {
        setEditingStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            error: "Only WebP (.webp) and AVIF (.avif) formats are allowed.",
          },
        }));
        return;
      }
    }
    setEditingStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        hasChanges: true,
        error: "", // ✅ clear old error on change
      },
    }));
  };

  // Delete banner
  const handleDelete = async () => {
    if (!bannerToDelete) return;

    try {
      await fetch("/api/topbanner", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bannerToDelete._id }),
      });
      fetchBanners();
      closeDeleteModal();
    } catch (err) {
      setError("Failed to delete banner");
      closeDeleteModal();
    }
  };

  const openDeleteModal = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setBannerToDelete(null);
  };

  // + drag end handler to reorder, update 1-based order locally, and persist
  const onDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    const prev = banners;
    const reordered = Array.from(banners);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Optimistic UI: also set 1-based order locally
    const reorderedWithOrder = reordered.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(reorderedWithOrder);

    const orderedIds = reordered.map((b) => b._id);
    try {
      const res = await fetch("/api/topbanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        setError("Failed to update order");
        setBanners(prev);
        // restore from server
        fetchBanners();
      }
    } catch {
      setError("Failed to update order");
      setBanners(prev);
      fetchBanners();
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Top Banner Manager</h2>
        <Link
          href="/admin/homesettings"
          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Add New Banner */}
        <div className="mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              + Add New Banner
            </button>
          ) : (
            <div className="border p-4 rounded-lg space-y-4 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h3 className="font-semibold text-lg text-gray-800">Add New Banner</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 font-semibold rounded">
                    🖥️ Desktop: 2000 × 667 px
                  </span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 font-semibold rounded">
                    📱 Mobile: 800 × 800 px
                  </span>
                </div>
              </div>

              {/* Dimension & Format Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="font-bold text-blue-800 block">🖥️ Desktop Size:</span>
                  <span className="font-semibold text-blue-700 text-sm">2000 × 667 px</span>
                  <span className="text-gray-500 block text-[11px]">Landscape (3:1 aspect ratio)</span>
                </div>
                <div>
                  <span className="font-bold text-indigo-800 block">📱 Mobile Size:</span>
                  <span className="font-semibold text-indigo-700 text-sm">800 × 800 px</span>
                  <span className="text-gray-500 block text-[11px]">Square (1:1 ratio for mobile screens)</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-800 block">📁 Allowed Formats:</span>
                  <span className="font-semibold text-emerald-700 text-sm">.webp, .avif only</span>
                  <span className="text-gray-500 block text-[11px]">JPEG/PNG are not supported</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Banner Image */}
                <div className="border p-3 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Desktop Banner Image *
                    </label>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">
                      2000 × 667 px
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">
                    Exact Size: <strong className="text-blue-600">2000 × 667 px</strong> (3:1 Aspect Ratio) <br/>
                    Formats: <strong className="text-emerald-600">.webp, .avif only</strong>
                  </p>
                  <input
                    type="file" 
                    accept=".webp,.avif,image/webp,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!isWebpOrAvif(file)) {
                          setImageError("Desktop Banner: Only WebP (.webp) and AVIF (.avif) formats are allowed.");
                          e.target.value = "";
                          return;
                        }
                        setImageError("");
                        setNewBanner({ ...newBanner, banner_image: file });
                      }
                    }}
                    className="border px-2 py-1.5 rounded w-full text-sm"
                  />
                  {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                </div>

                {/* Mobile Banner Image */}
                <div className="border p-3 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Mobile Banner Image <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-200">
                      800 × 800 px
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mb-2">
                    Exact Size: <strong className="text-indigo-600">800 × 800 px</strong> (Square 1:1 Aspect Ratio) <br/>
                    Formats: <strong className="text-emerald-600">.webp, .avif only</strong> (If empty, desktop banner will be used)
                  </p>
                  <input
                    type="file" 
                    accept=".webp,.avif,image/webp,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!isWebpOrAvif(file)) {
                          setImageError("Mobile Banner: Only WebP (.webp) and AVIF (.avif) formats are allowed.");
                          e.target.value = "";
                          return;
                        }
                        setImageError("");
                        setNewBanner({ ...newBanner, mobile_banner_image: file });
                      }
                    }}
                    className="border px-2 py-1.5 rounded w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Redirect URL *</label>
                <input
                  type="text"
                  placeholder="e.g. /category/refrigerators or https://..."
                  value={newBanner.redirect_url}
                  onChange={(e) =>
                    setNewBanner({ ...newBanner, redirect_url: e.target.value })
                  }
                  className="border px-3 py-1.5 rounded w-full text-sm"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={newBanner.status}
                  onChange={(e) =>
                    setNewBanner({ ...newBanner, status: e.target.value })
                  }
                  className="border px-3 py-1.5 rounded w-full text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition"
                >
                  Save Banner
                </button>
                <button
                  onClick={() => {
                    setNewBanner({ banner_image: null, mobile_banner_image: null, redirect_url: "", status: "Active" });
                    setShowAddForm(false);
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Banners (now draggable) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="banners">
            {(dropProvided) => (
              <div
                className="space-y-4"
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
              >
                {banners.map((banner, index) => (
                  <Draggable key={banner._id} draggableId={banner._id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="flex flex-col lg:flex-row items-center gap-4 border p-4 rounded-lg bg-white hover:shadow-sm transition"
                      >
                        {/* Previews */}
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Desktop Preview */}
                          <div className="flex flex-col items-center">
                            <img
                              src={
                                editingStates[banner._id]?.banner_image instanceof File
                                  ? URL.createObjectURL(editingStates[banner._id].banner_image)
                                  : banner.banner_image
                              }
                              alt="desktop banner"
                              className="w-36 h-16 object-cover rounded border"
                            />
                            <span className="text-[10px] text-gray-500 mt-1">Desktop (2000×667)</span>
                          </div>

                          {/* Mobile Preview */}
                          <div className="flex flex-col items-center">
                            {editingStates[banner._id]?.mobile_banner_image instanceof File ? (
                              <div className="relative group">
                                <img
                                  src={URL.createObjectURL(editingStates[banner._id].mobile_banner_image)}
                                  alt="mobile banner preview"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  title="Cancel new mobile image"
                                  onClick={() => handleInputChange(banner._id, "mobile_banner_image", null)}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600 shadow"
                                >
                                  ×
                                </button>
                              </div>
                            ) : banner.mobile_banner_image && !editingStates[banner._id]?.remove_mobile_banner ? (
                              <div className="relative group">
                                <img
                                  src={banner.mobile_banner_image}
                                  alt="mobile banner"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  title="Remove mobile banner (click Save to apply)"
                                  onClick={() => {
                                    handleInputChange(banner._id, "remove_mobile_banner", true);
                                    handleInputChange(banner._id, "mobile_banner_image", null);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600 shadow"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center bg-gray-50 text-[10px] text-gray-400 text-center px-1 leading-tight">
                                <span>📱 Uses</span>
                                <span>Desktop</span>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 mt-1">Mobile (800×800)</span>
                          </div>
                        </div>

                        {/* URL */}
                        <div className="flex flex-col gap-1 flex-grow w-full lg:w-auto">
                          <label className="text-[10px] text-gray-500 font-medium">Redirect URL</label>
                          <input
                            type="text"
                            value={editingStates[banner._id]?.redirect_url || ""}
                            onChange={(e) =>
                              handleInputChange(banner._id, "redirect_url", e.target.value)
                            }
                            className="border px-2 py-1.5 rounded text-sm w-full"
                            placeholder="Redirect URL"
                          />
                        </div>

                        {/* Status */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-[10px] text-gray-500 font-medium">Status</label>
                          <select
                            value={editingStates[banner._id]?.status || "Active"}
                            onChange={(e) =>
                              handleInputChange(banner._id, "status", e.target.value)
                            }
                            className="border px-2 py-1.5 rounded text-sm"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>

                        {/* Update Desktop Image */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-[10px] text-gray-500 font-medium">Change Desktop (2000×667 • WebP/AVIF)</label>
                          <input
                            type="file"
                            accept=".webp,.avif,image/webp,image/avif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!isWebpOrAvif(file)) {
                                  setEditingStates((prev) => ({
                                    ...prev,
                                    [banner._id]: {
                                      ...prev[banner._id],
                                      error: "Desktop: Only WebP and AVIF formats are allowed.",
                                    },
                                  }));
                                  e.target.value = "";
                                  return;
                                }
                                handleInputChange(
                                  banner._id,
                                  "banner_image",
                                  file
                                );
                              }
                            }}
                            className="border rounded w-44 text-xs px-1 py-1"
                          />
                          {editingStates[banner._id]?.error && (
                            <p className="text-red-500 text-xs mt-0.5 max-w-[180px]">
                              {editingStates[banner._id].error}
                            </p>
                          )}
                        </div>

                        {/* Update Mobile Image */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-[10px] text-gray-500 font-medium">Change Mobile (800×800 • WebP/AVIF)</label>
                          <input
                            type="file"
                            accept=".webp,.avif,image/webp,image/avif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!isWebpOrAvif(file)) {
                                  setEditingStates((prev) => ({
                                    ...prev,
                                    [banner._id]: {
                                      ...prev[banner._id],
                                      error: "Mobile: Only WebP and AVIF formats are allowed.",
                                    },
                                  }));
                                  e.target.value = "";
                                  return;
                                }
                                handleInputChange(
                                  banner._id,
                                  "mobile_banner_image",
                                  file
                                );
                                handleInputChange(banner._id, "remove_mobile_banner", false);
                              }
                            }}
                            className="border rounded w-44 text-xs px-1 py-1"
                          />
                        </div>

                        {/* Action Buttons: Single Save & Delete */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          <button
                            type="button"
                            onClick={() => handleSaveBanner(banner._id)}
                            disabled={!editingStates[banner._id]?.hasChanges || editingStates[banner._id]?.saving}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition flex items-center gap-1.5 ${
                              editingStates[banner._id]?.hasChanges
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                            title="Save all changes for this banner"
                          >
                            {editingStates[banner._id]?.saving ? (
                              <span>Saving...</span>
                            ) : (
                              <>
                                <span>✔</span>
                                <span>Save</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(banner)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded text-sm transition shrink-0"
                            title="Delete Banner"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this banner?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
