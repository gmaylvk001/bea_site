"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  X,
  Headphones,
  ShieldCheck,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

export default function OutOfStockModal({ isOpen, onClose, product, action = "add_to_cart" }) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    requirement: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = "Please enter your name";
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      errs.phone = "Please enter your mobile number";
    } else if (cleanPhone.length < 10) {
      errs.phone = "Please enter a valid 10-digit mobile number";
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = "Please enter a valid email address";
      }
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
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        city: formData.city.trim(),
        requirement: formData.requirement.trim(),
        productId: product?._id || null,
        productName: product?.name || "",
        productSlug: product?.slug || "",
        itemCode: product?.item_code || "",
        price: product?.price || 0,
        specialPrice: product?.special_price || 0,
        productImage: product?.images?.[0] || "",
        brand:
          product?.brand_name ||
          (typeof product?.brand === "string" ? product?.brand : product?.brand?.brand_name) ||
          "",
        action: action || "add_to_cart",
      };

      const response = await fetch("/api/product/out-of-stock-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Thank you! Our sales team will contact you shortly.");
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          city: "",
          requirement: "",
        });
        onClose();
      } else {
        toast.error(data.message || "Failed to submit enquiry. Please try again.");
      }
    } catch (err) {
      console.error("Out of stock enquiry error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <style>{`
        .oos-heading {
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-weight: 800 !important;
          color: #0B1528 !important;
          font-size: 19px;
          line-height: 1.25;
        }
        .oos-subtitle {
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-weight: 700 !important;
          color: #374151 !important;
          font-size: 15.5px;
          line-height: 1.3;
        }
        .oos-desc {
          font-size: 12px;
          max-width: 300px;
        }
        @media (min-width: 640px) {
          .oos-heading {
            font-size: 21px;
          }
          .oos-subtitle {
            font-size: 16px;
          }
          .oos-desc {
            font-size: 12.5px;
            max-width: 310px;
          }
        }
      `}</style>

      <div className="relative w-full max-w-[390px] bg-white rounded-2xl shadow-2xl px-5 pt-3.5 pb-4 sm:px-6 sm:pt-4 sm:pb-4.5 my-auto max-h-[94vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Illustration & Header */}
        <div className="flex flex-col items-center text-center">
          {/* Shopping Cart with Out-of-Stock Illustration */}
          <div className="relative -mt-0.5 mb-1 sm:mb-1.5 flex items-center justify-center">
            <div className="w-28 h-20 sm:w-32 sm:h-22 bg-blue-50/80 rounded-full blur-md absolute -z-10" />

            <svg
              className="w-[105px] h-[78px] sm:w-[116px] sm:h-[86px]"
              viewBox="14 10 92 68"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="60" cy="52" rx="44" ry="26" fill="#EEF4FF" />

              {/* Shopping Cart Body */}
              <path
                d="M26 28H34L43 62H85L94 36H39"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 45H89"
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M42 54H86"
                stroke="#60A5FA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Cart Wheels */}
              <circle cx="48" cy="71" r="5" fill="#2563EB" />
              <circle cx="80" cy="71" r="5" fill="#2563EB" />
              <circle cx="48" cy="71" r="2" fill="white" />
              <circle cx="80" cy="71" r="2" fill="white" />

              {/* Red Badge with White 'X' */}
              <g transform="translate(68, 15)">
                <circle cx="15" cy="15" r="13" fill="#EF4444" />
                <circle cx="15" cy="15" r="15" stroke="#FEE2E2" strokeWidth="2.5" />
                <path
                  d="M10 10L20 20M20 10L10 20"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </g>

              {/* Sparkle accents */}
              <line x1="88" y1="15" x2="92" y2="12" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
              <line x1="93" y1="32" x2="97" y2="34" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* Heading */}
          <h2
            className="oos-heading text-xl sm:text-[21px] font-extrabold text-[#0B1528] leading-[1.25] text-center tracking-tight"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 800,
            }}
          >
            This Product is Currently
            <br />
            Out of Stock
          </h2>

          {/* Subtitle */}
          <h3
            className="oos-subtitle font-bold text-gray-700 mt-2 leading-snug text-center tracking-tight"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Need this product now?
          </h3>
          <p className="oos-desc text-gray-500 mt-1 leading-normal mx-auto text-center text-xs sm:text-[13px] max-w-[290px]">
            Fill out the details below. Our salesperson will contact you about the product.
          </p>
        </div>

        {/* Form - Compact fields one by one */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {/* Your Name */}
          <div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg border transition-colors ${
                errors.fullName
                  ? "border-red-400 bg-red-50/20"
                  : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your Name *"
                className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {errors.fullName && (
              <p className="text-[10.5px] text-red-500 mt-0.5 ml-1">{errors.fullName}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg border transition-colors ${
                errors.phone
                  ? "border-red-400 bg-red-50/20"
                  : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Mobile Number *"
                maxLength={10}
                className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {errors.phone && (
              <p className="text-[10.5px] text-red-500 mt-0.5 ml-1">{errors.phone}</p>
            )}
          </div>

          {/* Email ID */}
          <div>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg border transition-colors ${
                errors.email
                  ? "border-red-400 bg-red-50/20"
                  : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email ID"
                className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
            {errors.email && (
              <p className="text-[10.5px] text-red-500 mt-0.5 ml-1">{errors.email}</p>
            )}
          </div>

          {/* City */}
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>

          {/* Any specific requirement? (Optional) */}
          <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              name="requirement"
              value={formData.requirement}
              onChange={handleChange}
              placeholder="Any specific requirement? (Optional)"
              className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#1E50DE] hover:bg-[#1842BE] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Details</span>
              )}
            </button>
          </div>
        </form>

        {/* Trust Badges - 3 items with dividers - Compact */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
          {/* Badge 1 */}
          <div className="flex flex-col items-center px-1">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1E50DE] flex items-center justify-center mb-1 flex-shrink-0">
              <Headphones className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] text-gray-600 leading-tight">
              Our sales team will contact you
            </p>
          </div>

          {/* Badge 2 */}
          <div className="flex flex-col items-center px-1 border-x border-gray-100">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1E50DE] flex items-center justify-center mb-1 flex-shrink-0">
              <ShieldCheck className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] text-gray-600 leading-tight">
              Your information is safe with us
            </p>
          </div>

          {/* Badge 3 */}
          <div className="flex flex-col items-center px-1">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1E50DE] flex items-center justify-center mb-1 flex-shrink-0">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] text-gray-600 leading-tight">
              Get the best price &amp; offers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
