"use client";


import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Dynamically import react-select to avoid SSR issues
const Select = dynamic(() => import('react-select'), { ssr: false });

// This component now accepts an optional 'storeId' prop
export default function CreateStoreForm({ storeId = null }) {
  const router = useRouter();

  const [newStore, setNewStore] = useState({
    organisation_name: "",
    category: "",
    description: "",
    logo: null,
    store_images: [null, null, null], // Up to 3 store images
    location: "",
    zipcode: "",
    address: "",
    service_area: "",
    city: "",
    images: [], // General images
    tags: [],
    phone: "",
    phone_after_hours: "",
    website: "",
    email: "",
    twitter: "",
    facebook: "",
    meta_title: "",
    meta_description: "",
    verified: "No",
    approved: "No",
    user: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [storeImagePreviews, setStoreImagePreviews] = useState([null, null, null]);
  const [generalImagePreviews, setGeneralImagePreviews] = useState([]);

  // State for category tree
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");

  // Multi-form section
  const [currentStep, setCurrentStep] = useState(1);

  // State for users dropdown
  const [users, setUsers] = useState([]);

  // --- Fetch Data for Edit Mode ---
  useEffect(() => {
    fetchCategories();
    fetchUsers();

    if (storeId) {
      // If storeId is provided, fetch existing store data
      fetchStoreData(storeId);
    }
  }, [storeId]); // Dependency array includes storeId to re-run when it changes

  const fetchStoreData = async (id) => {
    try {
      const response = await fetch(`/api/store/${id}`); // Use the GET method on your dynamic API route
      const result = await response.json();

      if (response.ok) {
        // Populate the form fields with fetched data
        setNewStore({
          organisation_name: result.organisation_name || "",
          category: result.category || "",
          description: result.description || "",
          // For files (logo, images), you might need to handle URLs vs. File objects
          // For existing images, you'd load their URLs into previews
          logo: result.logo || null, // This will likely be a URL, not a File object
          store_images: result.store_images || [null, null, null], // Array of URLs
          location: result.location || "",
          zipcode: result.zipcode || "",
          address: result.address || "",
          service_area: result.service_area || "",
          city: result.city || "",
          images: result.images || [], // Array of URLs
          tags: result.tags || [],
          phone: result.phone || "",
          phone_after_hours: result.phone_after_hours || "",
          website: result.website || "",
          email: result.email || "",
          twitter: result.twitter || "",
          facebook: result.facebook || "",
          meta_title: result.meta_title || "",
          meta_description: result.meta_description || "",
          verified: result.verified || "No",
          approved: result.approved || "No",
          user: result.user || "",
          status: result.status || "Active",
        });

        // Set previews for existing images (assuming they are URLs)
        setLogoPreview(result.logo || null);
        setStoreImagePreviews(result.store_images || [null, null, null]);
        setGeneralImagePreviews(result.images || []);

        // Set selected category for dropdown
        setSelectedCategory(result.category || "");

      } else {
        toast.error(result.error || "Failed to fetch store data for editing.");
        router.push("/admin/store"); // Redirect if store not found or error
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("Failed to fetch store data: " + error.message);
      router.push("/admin/store");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories/get");
      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        setCategories(buildCategoryTree(result));
      }
    } catch (error) {
      toast.error("Failed to fetch categories: " + error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/get"); // Assuming this API exists
      const result = await response.json();
      if (result.error) {
        toast.error(result.error);
      } else {
        const userOptions = result.map((user) => ({
          value: user._id,
          label: user.name, // Assuming user object has a 'name' field
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      toast.error("Failed to fetch users: " + error.message);
    }
  };

  const buildCategoryTree = (categories, parentId = "none") => {
    return categories
      .filter((category) => category.parentid === parentId)
      .map((category) => ({
        ...category,
        children: buildCategoryTree(categories, category._id),
      }));
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category._id);
    setNewStore((prev) => ({
      ...prev,
      category: category._id,
    }));
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category._id} style={{ paddingLeft: `${level * 20}px` }}>
        <div className="flex items-center cursor-pointer p-2 text-sm font-medium text-gray-700">
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
          {category.children.length === 0 && (
            <input
              type="checkbox"
              name="category"
              value={category._id}
              checked={selectedCategory === category._id}
              onChange={() => handleCategoryChange(category)}
              className="mr-2"
            />
          )}
          <span
            className={`font-medium ${
              selectedCategory === category._id ? "text-red-500" : "text-gray-700"
            }`}
          >
            {category.category_name}
          </span>
        </div>
        {expandedCategories[category._id] &&
          renderCategoryTree(category.children, level + 1)}
      </div>
    ));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewStore((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e, fieldName, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fieldName === "logo") {
      setNewStore((prev) => ({ ...prev, logo: file })); // Store the File object
      setLogoPreview(URL.createObjectURL(file)); // For immediate preview
    } else if (fieldName === "store_images") {
      const newStoreImages = [...newStore.store_images];
      const newStoreImagePreviews = [...storeImagePreviews];
      newStoreImages[index] = file; // Store the File object
      newStoreImagePreviews[index] = URL.createObjectURL(file);
      setNewStore((prev) => ({ ...prev, store_images: newStoreImages }));
      setStoreImagePreviews(newStoreImagePreviews);
    } else if (fieldName === "images") {
      setNewStore((prev) => ({
        ...prev,
        images: [...prev.images, file], // Store the File object
      }));
      setGeneralImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
    }
  };

  const handleRemoveImage = (fieldName, index) => {
    if (fieldName === "store_images") {
      const newStoreImages = [...newStore.store_images];
      const newStoreImagePreviews = [...storeImagePreviews];
      newStoreImages[index] = null; // Set to null or remove based on your backend's expectation
      newStoreImagePreviews[index] = null;
      setNewStore((prev) => ({ ...prev, store_images: newStoreImages }));
      setStoreImagePreviews(newStoreImagePreviews);
    } else if (fieldName === "images") {
      const newGeneralImages = newStore.images.filter((_, i) => i !== index);
      const newGeneralImagePreviews = generalImagePreviews.filter((_, i) => i !== index);
      setNewStore((prev) => ({ ...prev, images: newGeneralImages }));
      setGeneralImagePreviews(newGeneralImagePreviews);
    }
  };

  const handleUserChange = (selectedOption) => {
    setNewStore((prev) => ({
      ...prev,
      user: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleNext = () => {
    // Basic validation for the current step before moving next
    const currentStepErrors = {};
    if (currentStep === 1) {
      if (!newStore.organisation_name.trim()) currentStepErrors.organisation_name = "Organisation Name is required";
      // if (!newStore.category) currentStepErrors.category = "Category is required";
      // if (!newStore.description.trim()) currentStepErrors.description = "Description is required";
      // if (!newStore.logo && !storeId) currentStepErrors.logo = "Logo is required"; // Logo required only on create
    } else if (currentStep === 2) {
      if (!newStore.address.trim()) currentStepErrors.address = "Address is required";
      if (!newStore.city.trim()) currentStepErrors.city = "City is required";
      if (!newStore.phone.trim()) currentStepErrors.phone = "Phone is required";
    } else if (currentStep === 3) {
      if (!newStore.email.trim()) currentStepErrors.email = "Email is required";
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // if (newStore.email && !emailRegex.test(newStore.email)) {
      //   currentStepErrors.email = "Invalid email format";
      // }
      if (!newStore.user) currentStepErrors.user = "Assigned User is required";
    }

    setErrors(currentStepErrors);
    if (Object.keys(currentStepErrors).length > 0) {
      toast.error("Please fill in all required fields for the current step.");
      return; // Prevent moving to next step if there are errors
    }
    setCurrentStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(prevStep => prevStep - 1);
    setErrors({}); // Clear errors when going back
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation for the last step before submission
    const finalErrors = {};
    if (!newStore.email.trim()) finalErrors.email = "Email is required";
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (newStore.email && !emailRegex.test(newStore.email)) {
    //   finalErrors.email = "Invalid email format";
    // }
    const phoneRegex = /^[0-9\-\+\s()]+$/;
    if (newStore.phone && !phoneRegex.test(newStore.phone)) {
      finalErrors.phone = "Phone format is invalid";
    }
    if (!newStore.user) finalErrors.user = "Assigned User is required";

    setErrors(finalErrors);
    if (Object.keys(finalErrors).length > 0) {
      toast.error("Please correct the errors before submitting.");
      return;
    }

    const formData = new FormData();
    Object.entries(newStore).forEach(([key, value]) => {
      // Only append if it's not a file or tags array
      if (key !== "logo" && key !== "store_images" && key !== "images" && key !== "tags") {
        formData.append(key, value);
      }
    });

    // Append File objects only if they are actual File objects (newly selected)
    if (newStore.logo instanceof File) {
      formData.append("logo", newStore.logo);
    }
    newStore.store_images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append(`store_image_${index}`, image);
      } else if (typeof image === 'string' && image) {
        // If it's a string, it's an existing URL, send it as a string
        formData.append(`existing_store_image_${index}`, image);
      }
    });
    newStore.images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append(`images`, image);
      } else if (typeof image === 'string' && image) {
        // If it's a string, it's an existing URL, send it as a string
        formData.append(`existing_image_${index}`, image);
      }
    });

    formData.append("tags", JSON.stringify(newStore.tags));

    let res;
    let url;
    let method;

    if (storeId) {
      // Edit mode
      url = `/api/store/${storeId}`; // Target the dynamic route for update
      method = "PUT"; // Or PATCH, depending on your API design for updates
      // For PUT, you might send the whole object. For PATCH, only changed fields.
      // Given FormData, PUT is often easier as it sends everything.
    } else {
      // Create mode
      url = "/api/store/add";
      method = "POST";
    }

    try {
      res = await fetch(url, {
        method: method,
        body: formData,
        // No Content-Type header needed for FormData; browser sets it automatically
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(storeId ? "Store updated successfully!" : "Store created successfully!");
        router.push("/admin/store"); // Redirect to store listing
      } else {
        toast.error(result.error || (storeId ? "Failed to update store" : "Failed to create store"));
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred: " + error.message);
    }
  };

  const formTitle = storeId ? "Edit Store" : "Create New Store";
  const submitButtonText = storeId ? "Update Store" : "Create Store";

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg mt-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-6 ">{formTitle}</h2>
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Organisation Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
              <input
                type="text"
                name="organisation_name"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.organisation_name}
              />
              {errors.organisation_name && (
                <span className="text-red-500 text-sm">{errors.organisation_name}</span>
              )}
            </div>

            {/* Category */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="border rounded p-2 max-h-48 overflow-y-auto">
                {renderCategoryTree(categories)}
              </div>
              {errors.category && (
                <span className="text-red-500 text-sm">{errors.category}</span>
              )}
            </div> */}

            {/* Description (full width) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.description}
              ></textarea>
              {errors.description && (
                <span className="text-red-500 text-sm">{errors.description}</span>
              )}
            </div>

            {/* Upload Logo */}
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">Upload Logo</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "logo")}
                className="block w-full text-sm text-gray-600
                  file:mr-3 file:py-1 file:px-3
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-red-50 file:text-red-700
                  hover:file:bg-red-100"
                accept="image/*"
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  className="h-20 mt-2 rounded-md object-contain"
                  alt="Logo Preview"
                />
              )}
              {errors.logo && (
                <span className="text-red-500 text-sm">{errors.logo}</span>
              )}
            </div>

            {/* Store Images (600x450, Max 3) */}
            {/* <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">Store Images (600x450, Max 3)</label>
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, "store_images", index)}
                    className="block w-full text-sm text-gray-600
                      file:mr-3 file:py-1 file:px-3
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-red-50 file:text-red-700
                      hover:file:bg-red-100"
                    accept="image/*"
                  />
                  {storeImagePreviews[index] && (
                    <div className="relative">
                      <img
                        src={storeImagePreviews[index]}
                        className="h-20 w-20 object-cover rounded-md"
                        alt={`Store Image ${index + 1} Preview`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage("store_images", index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div> */}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.location}
              />
              {errors.location && (
                <span className="text-red-500 text-sm">{errors.location}</span>
              )}
            </div>

            {/* Zipcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zipcode</label>
              <input
                type="text"
                name="zipcode"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.zipcode}
              />
              {errors.zipcode && (
                <span className="text-red-500 text-sm">{errors.zipcode}</span>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Row 1: Address + Service Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.address}
              />
              {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
              <input
                type="text"
                name="service_area"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.service_area}
              />
              {errors.service_area && <span className="text-red-500 text-sm">{errors.service_area}</span>}
            </div>

            {/* Row 2: City + Additional Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.city}
              />
              {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700">Additional Images</label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "images")}
                className="block w-full text-sm text-gray-600
                  file:mr-3 file:py-1 file:px-3
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-red-50 file:text-red-700
                  hover:file:bg-red-100"
                accept="image/*"
                multiple
              />
              {/* Previews */}
              <div className="flex flex-wrap gap-2 mt-3">
                {generalImagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      className="h-20 w-20 object-cover rounded-md"
                      alt={`Image ${index + 1} Preview`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage("images", index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 3: Tags + Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                name="tags"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.tags}
              />
              {errors.tags && <span className="text-red-500 text-sm">{errors.tags}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.phone}
              />
              {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
            </div>

            {/* Row 4: Phone After Hours + Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone After Hours</label>
              <input
                type="text"
                name="phone_after_hours"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.phone_after_hours}
              />
              {errors.phone_after_hours && (
                <span className="text-red-500 text-sm">{errors.phone_after_hours}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                name="website"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.website}
              />
              {errors.website && <span className="text-red-500 text-sm">{errors.website}</span>}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Row 1: Email + Twitter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                name="email"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.email}
              />
              {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
              <input
                type="text"
                name="twitter"
                placeholder="Twitter"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.twitter}
              />
            </div>

            {/* Row 2: Facebook + Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input
                type="text"
                name="facebook"
                placeholder="Facebook"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.facebook}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input
                type="text"
                name="meta_title"
                placeholder="Meta Title"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.meta_title}
              />
            </div>

            {/* Row 3: Meta Description (Full Width) */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                name="meta_description"
                placeholder="Meta Description"
                className="p-2 border rounded w-full h-24"
                onChange={handleInputChange}
                value={newStore.meta_description}
              />
            </div>

            {/* Row 4: Verified + Approved */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
              <select
                name="verified"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.verified}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved</label>
              <select
                name="approved"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.approved}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Row 5: Assigned User + Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned User</label>
              <Select
                name="user"
                options={users}
                className="basic-single"
                classNamePrefix="select"
                onChange={handleUserChange}
                value={users.find(user => user.value === newStore.user)}
                placeholder="Select user..."
              />
              {errors.user && <span className="text-red-500 text-sm">{errors.user}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                className="p-2 border rounded w-full"
                onChange={handleInputChange}
                value={newStore.status}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Previous
            </button>
          )}

          {currentStep < 3 && ( // Assuming 3 steps, adjust as needed
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Next
            </button>
          )}

          {currentStep === 3 && ( // Only show "Create" or "Update" on the last step
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {submitButtonText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
