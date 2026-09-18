"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function BlogLeadPopup({ blogTitle = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  // Open the popup when a user opens the blog page
  useEffect(() => {
    // Check if the user already submitted a lead in this session
    const hasSubmitted = sessionStorage.getItem("blog_lead_submitted");
    if (hasSubmitted) return;

    // Small delay for smooth entry after initial render
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // Handle ESC key press to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  const handleMobileChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
    if (errors.mobileNumber) {
      setErrors((prev) => ({ ...prev, mobileNumber: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Please enter your name";
    }

    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    const digits = mobileNumber.replace(/\D/g, "");
    if (!digits) {
      newErrors.mobileNumber = "Please enter your mobile number";
    } else if (digits.length < 10) {
      newErrors.mobileNumber = "Please enter a valid 10-digit mobile number";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanTitle = (blogTitle || "").trim();
      const dynamicMessage = cleanTitle
        ? `From the blog: ${cleanTitle}`
        : "From the blog";

      const payload = {
        name: name.trim(),
        email_address: email.trim(),
        mobile_number: mobileNumber.replace(/\D/g, ""),
        city: "Blog Lead",
        message: dynamicMessage,
      };

      const res = await fetch("/api/contact/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        sessionStorage.setItem("blog_lead_submitted", "true");

        // Send email notification to BEA care matching existing Contact Us workflow
        const contact = data.data;
        if (contact) {
          try {
            const fd = new FormData();
            fd.append("campaign_id", "04024860-c288-405b-9be7-9d111419093d");
            fd.append(
              "params",
              JSON.stringify([
                contact.name,
                contact.email_address,
                contact.mobile_number,
                contact.city,
                contact.message,
              ])
            );

            ["arunkarthik@bharathelectronics.in", "ecom@bharathelectronics.in", "Customercare@bharathelectronics.in"].forEach(
              async (recipient) => {
                try {
                  fd.set("email", recipient);
                  await fetch("https://bea.eygr.in/api/email/send-msg", {
                    method: "POST",
                    headers: {
                      Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
                    },
                    body: fd,
                  });
                } catch {
                  // Non-blocking
                }
              }
            );
          } catch {
            // Non-blocking
          }
        }

        // Auto close modal after showing success
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      } else {
        setApiError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Lead submission error:", err);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      {/* Pure White Clean Modal Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-popup-title"
      >
        {/* Minimal Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors focus:outline-none"
          aria-label="Close popup"
          disabled={isSubmitting}
        >
          <Icon icon="lucide:x" className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 bg-gray-100 text-gray-900 rounded-full mx-auto flex items-center justify-center">
              <Icon icon="lucide:check" className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900">Thank You!</h4>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Your details have been received. Our team will reach out to you shortly.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6 pr-6">
              <h3 id="lead-popup-title" className="text-xl font-bold text-gray-900 leading-snug">
                Enquire Now
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {blogTitle ? `Connect with our experts regarding ${blogTitle}` : "Leave your details and our team will get in touch with you."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="p-3 bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg flex items-center gap-2">
                  <Icon icon="lucide:alert-circle" className="w-4 h-4 flex-shrink-0 text-gray-500" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:user" className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="Enter your full name"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-white transition outline-none ${
                      errors.name
                        ? "border-gray-400 bg-gray-50/50"
                        : "border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-gray-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:mail" className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="Enter your email address"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-white transition outline-none ${
                      errors.email
                        ? "border-gray-400 bg-gray-50/50"
                        : "border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-gray-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Icon icon="lucide:phone" className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-white transition outline-none ${
                      errors.mobileNumber
                        ? "border-gray-400 bg-gray-50/50"
                        : "border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-[11px] text-gray-600 mt-1">{errors.mobileNumber}</p>
                )}
              </div>

              {/* Clean Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-black text-white py-2.5 px-4 rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Details</span>
                      <Icon icon="lucide:arrow-right" className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
