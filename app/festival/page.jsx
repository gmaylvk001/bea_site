"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTruck,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function FestivalPage() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Top Banner Carousel State
  const [topBannerIndex, setTopBannerIndex] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchFestivalData();
  }, []);

  const fetchFestivalData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/festival");
      const json = await res.json();
      if (json.success && json.data) {
        setPageData(json.data);
      }
    } catch (err) {
      console.error("Error loading festival page data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Top Banners Carousel auto-play
  const activeTopBanners =
    pageData?.topBanners?.filter((banner) => banner.status !== "Inactive") || [];

  useEffect(() => {
    if (activeTopBanners.length <= 1) return;
    const interval = setInterval(() => {
      setTopBannerIndex((prev) => (prev + 1) % activeTopBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTopBanners.length]);

  const prevTopBanner = () => {
    setTopBannerIndex((prev) =>
      prev === 0 ? activeTopBanners.length - 1 : prev - 1
    );
  };

  const nextTopBanner = () => {
    setTopBannerIndex((prev) => (prev + 1) % activeTopBanners.length);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submission handler -> posts directly to existing /api/contact/add and /api/festival/lead
  const handleSubmitLead = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.city.trim()
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.fullName.trim(),
        email_address: formData.email.trim(),
        mobile_number: formData.phone.trim(),
        city: formData.city.trim(),
        message: "Submitted via Vinayagar Festival Specials Lead Form",
        status: "active",
      };

      const res = await fetch("/api/contact/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      // Also record in festival leads collection (non-blocking)
      fetch("/api/festival/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
        }),
      }).catch(() => {});

      if (res.ok && json.success) {
        setFormSuccess(true);
        setFormData({ fullName: "", email: "", phone: "", city: "" });
      } else {
        setFormError(json.message || "Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setFormError("An error occurred while submitting your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4 Offer Cards List
  const activeOfferCards =
    pageData?.offerCards?.filter((card) => card.status !== "Inactive") || [];

  // 4 Static Checkmark Bullet Points (as requested by user)
  const staticBulletPoints = [
    "Trusted Brands for Every Home",
    "Festive Offers & Great Value",
    "Easy EMI & Hassle-Free Shopping",
    "Reliable Service & Support",
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 font-sans pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER SECTION (UNLIMITED CAROUSEL SUPPORT)                  */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-4">
        <div>
          {/* Top Banner Display (Carousel if > 1 banner, Single if 1, Fallback if 0) */}
          {activeTopBanners.length > 0 ? (
            <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group">
              {/* Carousel Container */}
              <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-[500px] overflow-hidden flex items-center justify-center">
                {activeTopBanners.map((banner, idx) => {
                  const isCurrent = idx === topBannerIndex;
                  const BannerContent = banner.redirectUrl ? Link : "div";
                  const props = banner.redirectUrl ? { href: banner.redirectUrl } : {};

                  return (
                    <BannerContent
                      key={banner._id || idx}
                      {...props}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                        isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={banner.imageUrl}
                        alt={`Festival Banner ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </BannerContent>
                  );
                })}
              </div>

              {/* Navigation Arrows if > 1 Banner */}
              {activeTopBanners.length > 1 && (
                <>
                  <button
                    onClick={prevTopBanner}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100"
                    aria-label="Previous Banner"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextTopBanner}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100"
                    aria-label="Next Banner"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>

                  {/* Indicator Dots */}
                  <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center space-x-2">
                    {activeTopBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTopBannerIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === topBannerIndex
                            ? "w-8 bg-amber-400"
                            : "w-2 bg-white/70 hover:bg-white"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Fallback Hero Banner Graphic matching Vinayagar Festive theme */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Ganesha Line Art + Headlines */}
              <div className="lg:col-span-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="relative flex-shrink-0">
                  <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-amber-400/50 p-2 flex items-center justify-center bg-gradient-to-tr from-amber-50 to-orange-50 shadow-inner">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full text-red-700 stroke-current fill-none stroke-[2.5]"
                    >
                      <circle cx="100" cy="100" r="92" strokeDasharray="4 4" />
                      <path d="M100 25 C115 25, 125 35, 125 50 C125 65, 115 75, 100 25 Z" />
                      <path d="M100 75 Q100 130 120 140 Q130 145 140 135" />
                      <path d="M85 55 Q65 65 60 90 Q55 115 80 125 Q95 130 100 130" />
                      <path d="M115 55 Q135 65 140 90 Q145 115 120 125 Q105 130 100 130" />
                      <path d="M90 40 L110 40 M100 30 L100 45" />
                      <circle cx="100" cy="50" r="3" fill="#b91c1c" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="text-[#c5221f] block leading-tight">
                      {pageData?.topBanner?.heading1 || "CELEBRATE."}
                    </span>
                    <span className="text-[#c25e00] block leading-tight">
                      {pageData?.topBanner?.heading2 || "UPGRADE."}
                    </span>
                    <span className="text-[#15803d] block leading-tight">
                      {pageData?.topBanner?.heading3 || "SAVE BIG."}
                    </span>
                  </h1>

                  <div className="mt-4 pt-3 border-t border-amber-200/80">
                    <p className="text-base sm:text-lg text-slate-700 font-medium">
                      {pageData?.topBanner?.subTitleTag || "Upgrade Your Home This"}{" "}
                      <span className="font-bold text-[#b91c1c] text-lg sm:text-xl font-serif">
                        {pageData?.topBanner?.subTitleHighlight || "Vinayagar Chaturthi"}
                      </span>
                    </p>
                    <p className="text-base sm:text-lg text-slate-800 font-semibold mt-0.5">
                      {pageData?.topBanner?.subTitleSuffix || "Special Deals Await!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Home Appliances Stage Graphic */}
              <div className="lg:col-span-6 relative">
                <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl bg-gradient-to-b from-white/90 to-amber-50/50 p-4 border border-amber-100/80 shadow-md flex items-end justify-center overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl"></div>
                  <div className="relative z-10 w-full h-full flex items-end justify-center gap-2 sm:gap-3 pb-4">
                    <div className="w-20 sm:w-28 h-40 sm:h-52 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-lg flex flex-col p-1.5 text-white">
                      <span className="text-[9px] text-center font-bold text-amber-300 mt-auto">
                        FRIDGE
                      </span>
                    </div>
                    <div className="w-32 sm:w-44 h-24 sm:h-32 bg-slate-900 border-2 border-slate-800 rounded-lg shadow-xl relative flex flex-col items-center justify-center text-white">
                      <div className="text-[10px] font-bold text-amber-300">SONY BRAVIA XR</div>
                      <div className="text-[8px] text-cyan-200">SPECIAL DEALS</div>
                    </div>
                    <div className="w-16 sm:w-20 h-28 sm:h-36 bg-slate-100 border border-slate-300 rounded-lg shadow-md flex flex-col items-center p-1.5">
                      <span className="text-[9px] font-bold text-slate-600 mt-auto">WASHER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SINGLE HEADING BANNER SECTION                                          */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        {pageData?.headingBanner?.imageUrl && pageData.headingBanner.status !== "Inactive" ? (
          <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-amber-200">
            {pageData.headingBanner.redirectUrl ? (
              <Link href={pageData.headingBanner.redirectUrl}>
                <img
                  src={pageData.headingBanner.imageUrl}
                  alt="Festive Heading Banner"
                  className="w-full h-auto object-cover max-h-[300px]"
                />
              </Link>
            ) : (
              <img
                src={pageData.headingBanner.imageUrl}
                alt="Festive Heading Banner"
                className="w-full h-auto object-cover max-h-[300px]"
              />
            )}
          </div>
        ) : (
          /* Ornamental Heading Banner Graphic matching design screenshot */
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-center my-4">
            <div className="flex-1 flex items-center justify-end max-w-xs sm:max-w-sm">
              <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-amber-400 to-amber-600"></div>
              <div className="w-2.5 h-2.5 rotate-45 border-2 border-amber-600 bg-amber-400 mx-1 flex-shrink-0"></div>
              <div className="h-[1.5px] w-8 bg-amber-600"></div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-800 px-2">
              {pageData?.festiveSectionHeader?.titlePrefix || "Upgrade Your Home This"}{" "}
              <span className="text-[#c25e00]">
                {pageData?.festiveSectionHeader?.titleHighlight || "Festive Season"}
              </span>
            </h2>

            <div className="flex-1 flex items-center justify-start max-w-xs sm:max-w-sm">
              <div className="h-[1.5px] w-8 bg-amber-600"></div>
              <div className="w-2.5 h-2.5 rotate-45 border-2 border-amber-600 bg-amber-400 mx-1 flex-shrink-0"></div>
              <div className="h-[1.5px] w-full bg-gradient-to-l from-transparent via-amber-400 to-amber-600"></div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. 4 OFFER IMAGES GRID (LEFT TO RIGHT WITH SENTENCE LINE & LINK)          */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeOfferCards.length > 0 ? (
            activeOfferCards.map((card, index) => {
              const CardContainer = card.redirectUrl ? Link : "div";
              const containerProps = card.redirectUrl ? { href: card.redirectUrl } : {};

              return (
                <CardContainer
                  key={card._id || index}
                  {...containerProps}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Card Image Area */}
                  <div className="relative w-full aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                    <img
                      src={card.imageUrl}
                      alt={card.content || `Offer ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* 1-Sentence Line Text at Bottom of Image */}
                  <div className="p-4 bg-white border-t border-slate-100 flex-1 flex items-center justify-center text-center">
                    <p className="text-sm md:text-base font-medium text-slate-800 leading-snug group-hover:text-amber-700 transition-colors">
                      {card.content}
                    </p>
                  </div>
                </CardContainer>
              );
            })
          ) : (
            /* Fallback 4 Cards matching screenshot */
            [
              {
                title: "Upgrade your refrigerator this Vinayagar Chaturthi",
                img: "/uploads/festival/fridge.png",
                bg: "bg-cyan-50",
              },
              {
                title: "Enjoy smarter entertainment with festive TV deals",
                img: "/uploads/festival/tv.png",
                bg: "bg-amber-50",
              },
              {
                title: "Celebrate the season with exciting television offers",
                img: "/uploads/festival/sony.png",
                bg: "bg-orange-50",
              },
              {
                title: "Bring home premium TV upgrades this Vinayagar Chaturthi",
                img: "/uploads/festival/premium.png",
                bg: "bg-rose-50",
              },
            ].map((fallback, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col"
              >
                <div
                  className={`relative w-full aspect-square ${fallback.bg} p-6 flex flex-col items-center justify-center border-b border-slate-100`}
                >
                  <span className="font-bold text-base text-slate-700 text-center">
                    FESTIVE OFFER #{idx + 1}
                  </span>
                </div>
                <div className="p-4 bg-white text-center">
                  <p className="text-sm font-medium text-slate-800">{fallback.title}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SPLIT SECTION (Left Content + Right Contact Form)                       */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ------------------------------------------------------------------- */}
          {/* LEFT COLUMN: ADMIN HEADING + CONTENT + 4 STATIC POINTS + BADGE     */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
            {/* Heading in Blue Color */}
            <h3 className="text-2xl md:text-3xl font-bold text-[#1b49b6] tracking-tight">
              {pageData?.leftSection?.heading ||
                "Celebrate Vinayagar Chaturthi with Joyful Shopping"}
            </h3>

            {/* Blue Decorative Underline Design matching Screenshot */}
            <div className="my-4 flex items-center gap-2">
              <div className="h-[2px] w-12 bg-[#1b49b6]"></div>
              <div className="w-2.5 h-2.5 rotate-45 border border-[#1b49b6] bg-blue-100"></div>
              <div className="h-[2px] w-24 bg-gradient-to-r from-[#1b49b6] to-transparent"></div>
            </div>

            {/* Admin Content Paragraphs */}
            <div className="space-y-4 text-slate-600 text-sm md:text-base leading-relaxed">
              {(
                pageData?.leftSection?.paragraphs || [
                  "Enjoy your purchases this Vinayagar Chaturthi at Bharath Electronics & Appliances and make the season even more special with the right products for your home.",
                  "Explore a wide range of televisions, refrigerators, washing machines, air conditioners, kitchen appliances and more from trusted brands, all at festive prices.",
                  "Whether you are upgrading your home or gifting your family something useful this season, BEA brings you exciting offers, easy EMI options, dependable service and a smooth shopping experience.",
                  "Celebrate Vinayagar Chaturthi with comfort, value and happiness, only at Bharath Electronics & Appliances.",
                ]
              ).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* 4 STATIC Points (Trusted Brands, Festive Offers, Easy EMI, Reliable Service) */}
            <div className="mt-8 space-y-3.5">
              {staticBulletPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1b49b6] flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="w-4 h-4 text-[#1b49b6]" />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-slate-800">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* STATIC Delivery Badge at Bottom Left */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-blue-600/40 bg-blue-50/50 text-[#1b49b6] font-bold text-xs md:text-sm tracking-wide">
                <FaTruck className="w-4 h-4 text-[#1b49b6]" />
                <span>DELIVERY ALL OVER TAMIL NADU</span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: CONTACT FORM (POSTS TO EXISTING /api/contact/add API) */}
          {/* ------------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm relative">
            {/* Top Badge: FESTIVE EXCLUSIVE */}
            {((pageData?.rightFormSection?.tagText !== "") && (pageData?.rightFormSection?.tagText !== null)) && (
              <div className="flex justify-center -mt-10 mb-4">
                <span className="bg-[#0b3b95] text-white px-5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow">
                  {pageData?.rightFormSection?.tagText ?? "FESTIVE EXCLUSIVE"}
                </span>
              </div>
            )}

            {/* Optional Mini Banner Image */}
            {pageData?.rightFormSection?.miniBannerImage ? (
              <div className="w-full mb-4 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={pageData.rightFormSection.miniBannerImage}
                  alt="Mini Banner"
                  className="w-full h-auto max-h-[160px] object-cover"
                />
              </div>
            ) : null}

            {/* Header Text (ONLY render if titlePrefix, titleHighlight, or subtitle is set by admin) */}
            {(() => {
              const rfs = pageData?.rightFormSection;
              const prefix = rfs ? (rfs.titlePrefix ?? "") : "Unlock Your";
              const highlight = rfs ? (rfs.titleHighlight ?? "") : "Vinayagar Specials!";
              const sub = rfs ? (rfs.subtitle ?? "") : "Share your details to receive festive offers, product updates, and exclusive BEA celebrations.";

              const hasTitle = prefix.trim() !== "" || highlight.trim() !== "";
              const hasSub = sub.trim() !== "";

              if (!hasTitle && !hasSub) return null;

              return (
                <div className="text-center mb-6">
                  {hasTitle && (
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#c25e00]">
                        {prefix}{" "}
                        {highlight && <span className="text-[#0b3b95]">{highlight}</span>}
                      </h3>
                    </div>
                  )}
                  {hasSub && (
                    <p className="text-xs md:text-sm text-slate-500 mt-2 px-2">
                      {sub}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Lead / Contact Form */}
            {formSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center my-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <FaCheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-emerald-800">Thank You!</h4>
                <p className="text-xs md:text-sm text-emerald-700 mt-1">
                  Your details have been registered. Our festive deals expert will contact you shortly!
                </p>
                <button
                  onClick={() => setFormSuccess(false)}
                  className="mt-4 text-xs font-semibold text-emerald-800 underline hover:text-emerald-900"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                {formError && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                    {formError}
                  </div>
                )}

                {/* Input 1: Full Name */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FaUser className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Input 2: Email Address */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FaEnvelope className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Input 3: Phone Number */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FaPhoneAlt className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Input 4: City */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <FaMapMarkerAlt className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 bg-[#0b3b95] hover:bg-[#082a6d] active:bg-[#051c4a] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-base disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
