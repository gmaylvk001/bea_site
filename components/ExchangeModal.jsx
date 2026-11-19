"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ExchangeModal({ isOpen, onClose, product }) {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    location: "",
    old_brand_model: "",
    appliance_age: "2 - 4 Years",
    working_condition: "working",
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const productImage = product?.images?.[0]?.startsWith("http")
    ? product.images[0]
    : product?.images?.[0]
    ? `/uploads/products/${product.images[0]}`
    : "/no-image.jpg";

  const productPrice = product?.special_price || product?.price || 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "Please enter your name";
    }

    const cleanPhone = formData.mobile_number.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      errs.mobile_number = "Please enter your mobile number";
    } else if (cleanPhone.length < 10) {
      errs.mobile_number = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.location.trim()) {
      errs.location = "Please enter your city or pincode";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile_number: formData.mobile_number.trim(),
        location: formData.location.trim(),
        old_brand_model: formData.old_brand_model.trim(),
        appliance_age: formData.appliance_age,
        working_condition: formData.working_condition,
        remarks: formData.remarks.trim(),
        product_id: product?._id || null,
        product_name: product?.name || "",
        product_slug: product?.slug || "",
        product_sku: product?.sku || product?.item_code || "",
        product_price: productPrice,
        product_image: product?.images?.[0] || "",
        product_url: typeof window !== "undefined" ? window.location.href : "",
      };

      const res = await fetch("/api/exchange-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        if (typeof toast !== "undefined" && toast.success) {
          toast.success("Exchange inquiry submitted successfully!");
        }
      } else {
        if (typeof toast !== "undefined" && toast.error) {
          toast.error(data.message || "Failed to submit. Please try again.");
        } else {
          alert(data.message || "Failed to submit. Please try again.");
        }
      }
    } catch (err) {
      console.error("Exchange inquiry submission error:", err);
      if (typeof toast !== "undefined" && toast.error) {
        toast.error("Something went wrong. Please check your connection.");
      } else {
        alert("Something went wrong. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setFormData({
      name: "",
      mobile_number: "",
      location: "",
      old_brand_model: "",
      appliance_age: "2 - 4 Years",
      working_condition: "working",
      remarks: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fadeIn">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Exchange Your Old Appliance
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Get the best exchange valuation & instant upgrade
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Exchange Request Received!</h4>
              <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-gray-800">{formData.name}</span>. Our exchange specialist will call you at{" "}
                <span className="font-semibold text-blue-600">{formData.mobile_number}</span> within 30 minutes with the best exchange value for your old appliance.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 w-full max-w-sm">
              <span className="font-semibold text-gray-700">Upgrading to:</span> {product?.name}
            </div>

            <button
              onClick={handleClose}
              className="w-full max-w-xs mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form Content (Scrollable on small screens) */
          <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm flex-1">
            
            {/* Target Product Strip */}
            {product?.name && (
              <div className="flex items-center gap-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-12 h-12 object-contain bg-white rounded-lg p-1 border shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Target New Product
                  </span>
                  <p className="text-xs font-semibold text-gray-800 truncate" title={product.name}>
                    {product.name}
                  </p>
                  {productPrice > 0 && (
                    <p className="text-xs font-bold text-red-600 mt-0.5">
                      ₹{Number(productPrice).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Mobile Number & City Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="10-digit number"
                      className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                        errors.mobile_number
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {errors.mobile_number && (
                    <p className="text-xs text-red-500 mt-1">{errors.mobile_number}</p>
                  )}
                </div>

                {/* City / Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City / Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Tiruppur, 641604"
                      className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                        errors.location
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {errors.location && (
                    <p className="text-xs text-red-500 mt-1">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* Old Appliance Brand & Model */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Old Appliance Brand & Type
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="old_brand_model"
                    value={formData.old_brand_model}
                    onChange={handleChange}
                    placeholder="e.g. LG 7kg Top Load / Samsung 43 LED TV"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Age of Old Appliance */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  How Old Is Your Appliance?
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    name="appliance_age"
                    value={formData.appliance_age}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                  >
                    <option value="Less than 2 Years">Less than 2 Years old</option>
                    <option value="2 - 4 Years">2 to 4 Years old</option>
                    <option value="5 - 7 Years">5 to 7 Years old</option>
                    <option value="More than 7 Years">More than 7 Years old</option>
                  </select>
                </div>
              </div>

              {/* Working Condition Radio Buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Working Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer text-center transition ${
                      formData.working_condition === "working"
                        ? "border-green-600 bg-green-50/80 text-green-900 font-semibold ring-1 ring-green-600"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="working_condition"
                      value="working"
                      checked={formData.working_condition === "working"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-base mb-0.5">🟢</span>
                    <span className="text-xs leading-tight">Working</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer text-center transition ${
                      formData.working_condition === "working_minor_issues"
                        ? "border-amber-600 bg-amber-50/80 text-amber-900 font-semibold ring-1 ring-amber-600"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="working_condition"
                      value="working_minor_issues"
                      checked={formData.working_condition === "working_minor_issues"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-base mb-0.5">🟡</span>
                    <span className="text-xs leading-tight">Minor Issues</span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer text-center transition ${
                      formData.working_condition === "not_working"
                        ? "border-red-600 bg-red-50/80 text-red-900 font-semibold ring-1 ring-red-600"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="working_condition"
                      value="not_working"
                      checked={formData.working_condition === "not_working"}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-base mb-0.5">🔴</span>
                    <span className="text-xs leading-tight">Not Working</span>
                  </label>
                </div>
              </div>

              {/* Remarks / Any comments */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any specific condition, bill availability, or pickup preference..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Instant Exchange Quote</span>
                      <ArrowRightLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  🔒 Your details are safe with Bharath Electronics. No spam.
                </p>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
