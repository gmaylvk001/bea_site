"use client";

import { useState } from "react";

export default function SonyCenterPage() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    category: "",
    city: "",
    requirement: "",
    agree: true,
    _hp: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (formData._hp) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.city.trim()) {
      setStatusMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    if (formData.mobile.length !== 10) {
      setStatusMessage({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setLoading(true);

    try {
      const userMessageContent = formData.requirement.trim();
      const finalMessage = userMessageContent
        ? `from sony: ${userMessageContent}`
        : (formData.category ? `from sony: Interested in ${formData.category}` : "from sony: lead from sony");

      const response = await fetch("/api/contact/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email_address: formData.email.trim(),
          mobile_number: formData.mobile.trim(),
          city: formData.city.trim(),
          category: formData.category || "",
          message: finalMessage,
          status: "active",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: "Thank you! Your details have been submitted successfully.",
        });
        setFormData({
          name: "",
          mobile: "",
          email: "",
          category: "",
          city: "",
          requirement: "",
          agree: true,
          _hp: "",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Failed to submit. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setStatusMessage({
        type: "error",
        text: "Something went wrong. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      {/* ══════════════════════════════════════════════════
          1. TOP BANNER
      ══════════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="w-full relative overflow-hidden bg-gray-900 border-b border-gray-200">
          <img
            src="/uploads/sony-center/sonyBannerImage.webp"
            alt="Sony Center Top Banner"
            className="w-full h-auto object-cover block"
          />
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12 space-y-8 md:space-y-12">
        {/* ══════════════════════════════════════════════════
            INTRO / WELCOME SECTION
        ══════════════════════════════════════════════════ */}
        <section className="text-center max-w-4xl mx-auto px-2">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 uppercase mb-2">
            SONY CENTER TIRUPPUR
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mt-1 mb-3">
            Your Destination for World-Class Sony Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl mx-auto">
            We are excited to bring the complete Sony experience closer to you! Sony Center Tiruppur offers the latest Sony products, exclusive launch offers, expert guidance and a premium in-store experience – all under one roof..
          </p>
        </section>

        {/* ══════════════════════════════════════════════════
            2. 1ST ROW — 4 CARD IMAGES (1:1 RATIO)
        ══════════════════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {[
              {
                src: "/uploads/sony-center/clfy1xgknclwglw3hsas.webp",
                alt: "Sony Center 1",
              },
              {
                src: "/uploads/sony-center/DERF.webp",
                alt: "Sony Center 2",
              },
              {
                src: "/uploads/sony-center/DFSF%20-%20Copy.webp",
                alt: "Sony Center 3",
              },
              {
                src: "/uploads/sony-center/Game%20On%20Tiruppur_%20Grand%20Opening.webp",
                alt: "Sony Center 4",
              },
            ].map((img, index) => (
              <div
                key={`row1-card-${index}`}
                className="relative w-full aspect-square rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ aspectRatio: "1 / 1" }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover block transition-transform duration-300 hover:scale-105"
                  style={{ aspectRatio: "1 / 1", width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            3. 2ND ROW — 4 CARD IMAGES (1:1 RATIO)
        ══════════════════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {[
              {
                src: "/uploads/sony-center/QEWQE.webp",
                alt: "Sony Center 5",
              },
              {
                src: "/uploads/sony-center/quqh4nvtcdwgfqsf1lxy.webp",
                alt: "Sony Center 6",
              },
              {
                src: "/uploads/sony-center/SDEASR.webp",
                alt: "Sony Center 7",
              },
              {
                src: "/uploads/sony-center/yvt2bkulx3toyviqkzsz.webp",
                alt: "Sony Center 8",
              },
            ].map((img, index) => (
              <div
                key={`row2-card-${index}`}
                className="relative w-full aspect-square rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ aspectRatio: "1 / 1" }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover block transition-transform duration-300 hover:scale-105"
                  style={{ aspectRatio: "1 / 1", width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════
          4. FORM SECTION
      ══════════════════════════════════════════════════ */}
      <section className="w-full max-w-[1672px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-transparent lg:bg-[#020b24] lg:shadow-2xl lg:border lg:border-blue-950/40 h-auto min-h-0 lg:h-[550px] xl:h-[700px] min-[1440px]:h-[740px] min-[2000px]:h-[941px] min-[2000px]:aspect-[1672/941]">
          {/* Desktop background layer — hidden on mobile & tab */}
          <div
            className="hidden lg:block absolute inset-0 bg-cover bg-no-repeat lg:bg-left xl:bg-center min-[2000px]:bg-contain min-[2000px]:bg-center pointer-events-none"
            style={{
              backgroundImage: "url('/uploads/sony-center/For%20Forms%20Section.webp')",
            }}
          />

          {/* Form container */}
          <div className="relative z-10 w-full h-full p-0 sm:p-2 lg:p-4 xl:p-6 lg:pr-5 xl:pr-16 min-[1440px]:pr-14 min-[2000px]:pr-24 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[390px] lg:max-w-[370px] xl:max-w-[400px] min-[1440px]:max-w-[460px] min-[2000px]:max-w-[480px] bg-white rounded-2xl shadow-md sm:shadow-lg lg:shadow-2xl p-4 sm:p-5 min-[1440px]:p-7 min-[2000px]:p-8 border border-gray-200 lg:border-gray-100 my-auto">
                {/* Mobile view only: Top header */}
                <div className="block lg:hidden mb-3 text-left">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider text-blue-700 bg-blue-100 uppercase mb-1">
                    BE THE FIRST TO KNOW
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                    Stay Updated with Sony Center
                  </h2>
                </div>

                {statusMessage.text && (
                  <div
                    className={`mb-2.5 p-2 rounded-md text-xs font-medium ${
                      statusMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5 min-[1440px]:space-y-3.5 min-[2000px]:space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full px-3 py-1.5 sm:py-2 min-[1440px]:px-3.5 min-[1440px]:py-2.5 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      maxLength={10}
                      placeholder="Enter your mobile number"
                      className="w-full px-3 py-1.5 sm:py-2 min-[1440px]:px-3.5 min-[1440px]:py-2.5 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition"
                    />
                  </div>

                  {/* Email ID */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email ID"
                      className="w-full px-3 py-1.5 sm:py-2 min-[1440px]:px-3.5 min-[1440px]:py-2.5 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition"
                    />
                  </div>

                  {/* Product Category of Interest */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      Product Category of Interest
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full appearance-none px-3 py-1.5 sm:py-2 min-[1440px]:px-3.5 min-[1440px]:py-2.5 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white pr-8 min-[1440px]:pr-9 cursor-pointer transition"
                      >
                        <option value="">Select a product category</option>
                        <option value="Televisions & Home Theater">Televisions & Home Theater</option>
                        <option value="Audio & Headphones">Audio & Headphones</option>
                        <option value="Cameras & Lenses">Cameras & Lenses</option>
                        <option value="PlayStation & Gaming">PlayStation & Gaming</option>
                        <option value="Soundbars & Home Audio">Soundbars & Home Audio</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 min-[1440px]:px-3 text-gray-400">
                        <svg className="w-3.5 h-3.5 min-[1440px]:w-4 min-[1440px]:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* City / Location */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      City / Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="Enter your city or location"
                      className="w-full px-3 py-1.5 sm:py-2 min-[1440px]:px-3.5 min-[1440px]:py-2.5 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition"
                    />
                  </div>

                  {/* Any Specific Requirement (Optional) */}
                  <div>
                    <label className="block text-[11px] min-[1440px]:text-xs font-semibold text-gray-800 mb-0.5 min-[1440px]:mb-1">
                      Any Specific Requirement (Optional)
                    </label>
                    <textarea
                      name="requirement"
                      rows={1}
                      value={formData.requirement}
                      onChange={handleChange}
                      placeholder="Let us know if you have any specific requirement"
                      className="w-full px-3 py-1 min-[1440px]:px-3.5 min-[1440px]:py-2 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white resize-none h-9 min-[1440px]:h-16 transition"
                    />
                  </div>

                  {/* Honeypot field for bot protection */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      opacity: 0,
                      height: 0,
                      overflow: "hidden",
                    }}
                    aria-hidden="true"
                  >
                    <input
                      type="text"
                      name="_hp"
                      value={formData._hp}
                      onChange={handleChange}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  {/* Agreement Checkbox */}
                  <div>
                    <label className="flex items-center gap-2 min-[1440px]:gap-2.5 cursor-pointer text-[11px] min-[1440px]:text-xs text-gray-700 select-none">
                      <input
                        type="checkbox"
                        name="agree"
                        checked={formData.agree}
                        onChange={handleChange}
                        className="w-3.5 h-3.5 min-[1440px]:w-4 min-[1440px]:h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>I agree to receive updates and offers</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-5 min-[1440px]:py-3.5 min-[1440px]:px-6 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm min-[1440px]:text-base text-white bg-gradient-to-r from-[#0038b8] via-[#0050db] to-[#007fff] hover:opacity-95 shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <>
                          <span>Submit &amp; Get Updates</span>
                          <span className="text-base leading-none">&rarr;</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Mobile view only: Bottom text */}
                <p className="block lg:hidden mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500 text-left leading-relaxed">
                  Share your details to receive exclusive offers, exciting product launches, new arrivals, and updates on upcoming events from Sony Center.
                </p>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
