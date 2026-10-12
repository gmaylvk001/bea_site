"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // + dnd import

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
            hasChanges: false,
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

  // Update banner
  const handleUpdate = async (id, field, value) => {
    setError("");
    setImageError("");

    const formData = new FormData();
    formData.append("id", id);

    if (field === "banner_image") {
      formData.append("banner_image", value);
    } else if (field === "mobile_banner_image") {
      formData.append("mobile_banner_image", value);
    } else if (field === "remove_mobile_banner") {
      formData.append("remove_mobile_banner", "true");
    } else if (field === "redirect_url") {
      formData.append("redirect_url", value);
    } else if (field === "status") {
      formData.append("status", value);
    }

    try {
      const res = await fetch("/api/topbanner", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Reset editing state
        setEditingStates((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            [field]: field.includes("image") ? null : value,
            hasChanges: false,
            error: "", // ✅ clear error
          },
        }));
        fetchBanners();
      } else {
        if (data.message && data.message.includes("1920x550")) {
          // ✅ show per-banner error
          setEditingStates((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              error: data.message,
            },
          }));
        } else {
          setError(data.message || "Update failed.");
        }
      }
    } catch (err) {
      setError("Failed to update banner");
    }
  };

  // Handle input changes for existing banners
  const handleInputChange = (id, field, value) => {
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
              <h3 className="font-semibold text-lg text-gray-800">Add New Banner</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Banner Image */}
                <div className="border p-3 rounded-lg bg-white shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Desktop Banner Image *
                  </label>
                  <p className="text-gray-500 text-xs mb-2">
                    Suitable Size: <span className="font-semibold text-blue-600">2000 × 667 px</span>
                  </p>
                  <input
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, banner_image: e.target.files[0] })
                    }
                    className="border px-2 py-1.5 rounded w-full text-sm"
                  />
                  {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                </div>

                {/* Mobile Banner Image */}
                <div className="border p-3 rounded-lg bg-white shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mobile Banner Image <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <p className="text-gray-500 text-xs mb-2">
                    Suitable Size: <span className="font-semibold text-blue-600">800 × 800 px</span> (If empty, desktop banner will be used)
                  </p>
                  <input
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, mobile_banner_image: e.target.files[0] })
                    }
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
                              src={banner.banner_image}
                              alt="desktop banner"
                              className="w-36 h-16 object-cover rounded border"
                            />
                            <span className="text-[10px] text-gray-500 mt-1">Desktop (2000×667)</span>
                          </div>

                          {/* Mobile Preview */}
                          <div className="flex flex-col items-center">
                            {banner.mobile_banner_image ? (
                              <div className="relative group">
                                <img
                                  src={banner.mobile_banner_image}
                                  alt="mobile banner"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  title="Remove mobile banner"
                                  onClick={() => handleUpdate(banner._id, "remove_mobile_banner", true)}
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
                        <div className="flex flex-col sm:flex-row gap-2 items-center flex-grow w-full lg:w-auto">
                          <input
                            type="text"
                            value={editingStates[banner._id]?.redirect_url || ""}
                            onChange={(e) =>
                              handleInputChange(banner._id, "redirect_url", e.target.value)
                            }
                            className="border px-2 py-1 rounded flex-grow text-sm w-full"
                            placeholder="Redirect URL"
                          />
                          <button
                            onClick={() =>
                              handleUpdate(
                                banner._id,
                                "redirect_url",
                                editingStates[banner._id]?.redirect_url
                              )
                            }
                            disabled={!editingStates[banner._id]?.hasChanges}
                            className={`p-2 rounded text-sm ${
                              editingStates[banner._id]?.hasChanges
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-200 text-gray-400"
                            }`}
                            title="Save URL"
                          >
                            ✔
                          </button>
                        </div>

                        {/* Status */}
                        <div className="flex gap-2 items-center shrink-0">
                          <select
                            value={editingStates[banner._id]?.status || "Active"}
                            onChange={(e) =>
                              handleInputChange(banner._id, "status", e.target.value)
                            }
                            className="border px-2 py-1 rounded text-sm"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          <button
                            onClick={() =>
                              handleUpdate(
                                banner._id,
                                "status",
                                editingStates[banner._id]?.status
                              )
                            }
                            disabled={!editingStates[banner._id]?.hasChanges}
                            className={`p-2 rounded text-sm ${
                              editingStates[banner._id]?.hasChanges
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-200 text-gray-400"
                            }`}
                            title="Save Status"
                          >
                            ✔
                          </button>
                        </div>

                        {/* Update Desktop Image */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-[10px] text-gray-500 font-medium">Change Desktop (2000×667)</label>
                          <div className="flex gap-1 items-center">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleInputChange(
                                    banner._id,
                                    "banner_image",
                                    e.target.files[0]
                                  );
                                }
                              }}
                              className="border rounded w-36 text-xs px-1 py-1"
                            />
                            <button
                              onClick={() =>
                                handleUpdate(
                                  banner._id,
                                  "banner_image",
                                  editingStates[banner._id]?.banner_image
                                )
                              }
                              disabled={!editingStates[banner._id]?.banner_image}
                              className={`p-1.5 rounded text-sm ${
                                editingStates[banner._id]?.banner_image
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                              title="Save Desktop Image"
                            >
                              ✔
                            </button>
                          </div>
                          {editingStates[banner._id]?.error && (
                            <p className="text-red-500 text-xs">
                              {editingStates[banner._id].error}
                            </p>
                          )}
                        </div>

                        {/* Update Mobile Image */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <label className="text-[10px] text-gray-500 font-medium">Change Mobile (800×800)</label>
                          <div className="flex gap-1 items-center">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleInputChange(
                                    banner._id,
                                    "mobile_banner_image",
                                    e.target.files[0]
                                  );
                                }
                              }}
                              className="border rounded w-36 text-xs px-1 py-1"
                            />
                            <button
                              onClick={() =>
                                handleUpdate(
                                  banner._id,
                                  "mobile_banner_image",
                                  editingStates[banner._id]?.mobile_banner_image
                                )
                              }
                              disabled={!editingStates[banner._id]?.mobile_banner_image}
                              className={`p-1.5 rounded text-sm ${
                                editingStates[banner._id]?.mobile_banner_image
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : "bg-gray-200 text-gray-400"
                              }`}
                              title="Save Mobile Image"
                            >
                              ✔
                            </button>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => openDeleteModal(banner)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded text-sm transition shrink-0"
                          title="Delete Banner"
                        >
                          🗑
                        </button>
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
