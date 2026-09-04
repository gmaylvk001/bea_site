"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function AdminFestivalPage() {
  const [activeTab, setActiveTab] = useState("top_banners"); // 'top_banners' | 'heading_banner' | 'cards' | 'left_content' | 'form' | 'leads'
  const [pageData, setPageData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Top Banner Modal / Form State
  const [showTopBannerModal, setShowTopBannerModal] = useState(false);
  const [editingTopBanner, setEditingTopBanner] = useState(null);
  const [topBannerForm, setTopBannerForm] = useState({
    imageUrl: "",
    redirectUrl: "",
    status: "Active",
  });
  const [topBannerFile, setTopBannerFile] = useState(null);

  // Single Heading Banner Form State
  const [headingBannerForm, setHeadingBannerForm] = useState({
    imageUrl: "",
    redirectUrl: "",
    status: "Active",
  });
  const [headingBannerFile, setHeadingBannerFile] = useState(null);

  // Card Add/Edit Modal State (4-grid cards)
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState({
    imageUrl: "",
    content: "",
    redirectUrl: "",
    status: "Active",
  });
  const [cardImageFile, setCardImageFile] = useState(null);

  // Left Content Section Form State
  const [leftSectionForm, setLeftSectionForm] = useState({
    heading: "Celebrate Vinayagar Chaturthi with Joyful Shopping",
    paragraphsText:
      "Enjoy your purchases this Vinayagar Chaturthi at Bharath Electronics & Appliances and make the season even more special with the right products for your home.\n\nExplore a wide range of televisions, refrigerators, washing machines, air conditioners, kitchen appliances and more from trusted brands, all at festive prices.\n\nWhether you are upgrading your home or gifting your family something useful this season, BEA brings you exciting offers, easy EMI options, dependable service and a smooth shopping experience.\n\nCelebrate Vinayagar Chaturthi with comfort, value and happiness, only at Bharath Electronics & Appliances.",
  });

  // Form / Mini Banner Section State
  const [formSectionSettings, setFormSectionSettings] = useState({
    tagText: "FESTIVE EXCLUSIVE",
    titlePrefix: "Unlock Your",
    titleHighlight: "Vinayagar Specials!",
    subtitle:
      "Share your details to receive festive offers, product updates, and exclusive BEA celebrations.",
    miniBannerImage: "",
  });
  const [miniBannerFile, setMiniBannerFile] = useState(null);

  useEffect(() => {
    fetchPageData();
    fetchLeads();
  }, []);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/festival");
      const json = await res.json();
      if (json.success && json.data) {
        setPageData(json.data);

        if (json.data.headingBanner) {
          setHeadingBannerForm({
            imageUrl: json.data.headingBanner.imageUrl || "",
            redirectUrl: json.data.headingBanner.redirectUrl || "",
            status: json.data.headingBanner.status || "Active",
          });
        }

        if (json.data.leftSection) {
          setLeftSectionForm({
            heading:
              json.data.leftSection.heading ||
              "Celebrate Vinayagar Chaturthi with Joyful Shopping",
            paragraphsText: Array.isArray(json.data.leftSection.paragraphs)
              ? json.data.leftSection.paragraphs.join("\n\n")
              : "",
          });
        }

        if (json.data.rightFormSection) {
          setFormSectionSettings({
            tagText:
              json.data.rightFormSection.tagText ?? "FESTIVE EXCLUSIVE",
            titlePrefix:
              json.data.rightFormSection.titlePrefix ?? "",
            titleHighlight:
              json.data.rightFormSection.titleHighlight ?? "",
            subtitle:
              json.data.rightFormSection.subtitle ?? "",
            miniBannerImage: json.data.rightFormSection.miniBannerImage || "",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching festival page settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/festival/lead");
      const json = await res.json();
      if (json.success && json.leads) {
        setLeads(json.leads);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // ---------------------------------------------------------------------------
  // Top Banners Handlers (Unlimited Carousel)
  // ---------------------------------------------------------------------------
  const openAddTopBannerModal = () => {
    setEditingTopBanner(null);
    setTopBannerForm({ imageUrl: "", redirectUrl: "", status: "Active" });
    setTopBannerFile(null);
    setShowTopBannerModal(true);
  };

  const openEditTopBannerModal = (banner, index) => {
    setEditingTopBanner({ ...banner, index });
    setTopBannerForm({
      imageUrl: banner.imageUrl || "",
      redirectUrl: banner.redirectUrl || "",
      status: banner.status || "Active",
    });
    setTopBannerFile(null);
    setShowTopBannerModal(true);
  };

  const handleSaveTopBanner = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();

      if (editingTopBanner) {
        formData.append("action", "update_top_banner");
        if (editingTopBanner._id) formData.append("bannerId", editingTopBanner._id);
        formData.append("bannerIndex", editingTopBanner.index);
      } else {
        formData.append("action", "add_top_banner");
      }

      formData.append("imageUrl", topBannerForm.imageUrl);
      formData.append("redirectUrl", topBannerForm.redirectUrl);
      formData.append("status", topBannerForm.status);

      if (topBannerFile) {
        formData.append("bannerImageFile", topBannerFile);
      }

      const res = await fetch("/api/festival", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        setShowTopBannerModal(false);
        showNotification("success", "Top Banner saved successfully!");
      } else {
        showNotification("error", json.message || "Failed to save Top Banner.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopBanner = async (banner, index) => {
    if (!confirm("Are you sure you want to delete this Top Banner?")) return;
    try {
      setSaving(true);
      const url = banner._id
        ? `/api/festival?type=top_banner&id=${banner._id}`
        : `/api/festival?type=top_banner&index=${index}`;

      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        showNotification("success", "Top Banner deleted successfully!");
      } else {
        showNotification("error", json.message || "Failed to delete banner.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Single Heading Banner Handler (Strictly Single)
  // ---------------------------------------------------------------------------
  const handleSaveHeadingBanner = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("action", "update_heading_banner");
      formData.append("imageUrl", headingBannerForm.imageUrl);
      formData.append("redirectUrl", headingBannerForm.redirectUrl);
      formData.append("status", headingBannerForm.status);

      if (headingBannerFile) {
        formData.append("headingBannerFile", headingBannerFile);
      }

      const res = await fetch("/api/festival", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        showNotification("success", "Heading Banner saved successfully!");
      } else {
        showNotification("error", json.message || "Failed to save heading banner.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Offer Cards Submission (4-grid)
  // ---------------------------------------------------------------------------
  const openAddCardModal = () => {
    setEditingCard(null);
    setCardForm({ imageUrl: "", content: "", redirectUrl: "", status: "Active" });
    setCardImageFile(null);
    setShowCardModal(true);
  };

  const openEditCardModal = (card, index) => {
    setEditingCard({ ...card, index });
    setCardForm({
      imageUrl: card.imageUrl || "",
      content: card.content || "",
      redirectUrl: card.redirectUrl || "",
      status: card.status || "Active",
    });
    setCardImageFile(null);
    setShowCardModal(true);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();

      if (editingCard) {
        formData.append("action", "update_offer_card");
        if (editingCard._id) formData.append("cardId", editingCard._id);
        formData.append("cardIndex", editingCard.index);
      } else {
        formData.append("action", "add_offer_card");
      }

      formData.append("imageUrl", cardForm.imageUrl);
      formData.append("content", cardForm.content);
      formData.append("redirectUrl", cardForm.redirectUrl);
      formData.append("status", cardForm.status);

      if (cardImageFile) {
        formData.append("cardImageFile", cardImageFile);
      }

      const res = await fetch("/api/festival", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        setShowCardModal(false);
        showNotification("success", "Offer Card saved successfully!");
      } else {
        showNotification("error", json.message || "Failed to save card.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (card, index) => {
    if (!confirm("Are you sure you want to delete this offer card?")) return;
    try {
      setSaving(true);
      const url = card._id
        ? `/api/festival?type=card&cardId=${card._id}`
        : `/api/festival?type=card&cardIndex=${index}`;

      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        showNotification("success", "Offer Card deleted!");
      } else {
        showNotification("error", json.message || "Failed to delete card.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Left Section Submission
  // ---------------------------------------------------------------------------
  const handleSaveLeftSection = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const paragraphs = leftSectionForm.paragraphsText
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch("/api/festival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leftSection: {
            heading: leftSectionForm.heading,
            paragraphs,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        showNotification("success", "Left Content section saved!");
      } else {
        showNotification("error", json.message || "Failed to save content.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Right Section Submission (Form & Mini Banner)
  // ---------------------------------------------------------------------------
  const handleSaveRightSection = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("action", "update_right_form");
      formData.append("tagText", formSectionSettings.tagText);
      formData.append("titlePrefix", formSectionSettings.titlePrefix);
      formData.append("titleHighlight", formSectionSettings.titleHighlight);
      formData.append("subtitle", formSectionSettings.subtitle);

      if (miniBannerFile) {
        formData.append("miniBannerFile", miniBannerFile);
      }

      const res = await fetch("/api/festival", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setPageData(json.data);
        showNotification("success", "Right Form section saved!");
      } else {
        showNotification("error", json.message || "Failed to save settings.");
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[400px]">
        <Icon icon="line-md:loading-loop" className="w-8 h-8 text-amber-600 animate-spin mr-2" />
        Loading Festival Page Settings...
      </div>
    );
  }

  const topBannersList = pageData?.topBanners || [];
  const offerCardsList = pageData?.offerCards || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Icon icon="mdi:party-popper" className="text-amber-500 w-7 h-7" />
            Festival Sale Page Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage top banner carousel, single heading banner, 4-card offer grid, left content, and contact form settings.
          </p>
        </div>

        <a
          href="/festival"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-sm"
        >
          <Icon icon="mdi:eye" className="w-4 h-4" />
          Preview Live Festival Page
        </a>
      </div>

      {/* Toast Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })}>
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("top_banners")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "top_banners"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:view-carousel" className="w-4 h-4" />
          Top Banners Carousel ({topBannersList.length})
        </button>

        <button
          onClick={() => setActiveTab("heading_banner")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "heading_banner"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:image-filter-hdr" className="w-4 h-4" />
          Single Heading Banner
        </button>

        <button
          onClick={() => setActiveTab("cards")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "cards"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:view-grid" className="w-4 h-4" />
          4-Offer Cards Grid ({offerCardsList.length})
        </button>

        <button
          onClick={() => setActiveTab("left_content")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "left_content"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:text-box-edit" className="w-4 h-4" />
          Left Content Section
        </button>

        <button
          onClick={() => setActiveTab("form")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "form"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:form-select" className="w-4 h-4" />
          Right Form & Mini Banner
        </button>

        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === "leads"
              ? "bg-amber-500 text-slate-900 shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Icon icon="mdi:account-group" className="w-4 h-4" />
          Form Leads ({leads.length})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TOP BANNERS (UNLIMITED CAROUSEL)                               */}
      {/* ===================================================================== */}
      {activeTab === "top_banners" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Top Hero Banners (Unlimited)
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full">
                  {topBannersList.length > 1 ? "Carousel Mode Active" : "Single / Fallback Mode"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add unlimited top hero banners. If 2 or more banners are active, they will automatically display as a carousel slider on the festival page.
              </p>
            </div>

            <button
              onClick={openAddTopBannerModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Icon icon="mdi:plus-circle" className="w-4 h-4" />
              Add Top Banner
            </button>
          </div>

          {topBannersList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Icon icon="mdi:image-multiple" className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No custom top banners uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-1">The festival page will display default decorative top hero graphics.</p>
              <button
                onClick={openAddTopBannerModal}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Add Your First Top Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topBannersList.map((banner, index) => (
                <div
                  key={banner._id || index}
                  className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm group hover:border-amber-300 transition-all"
                >
                  <div className="relative aspect-video bg-slate-200 overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      alt={`Top Banner ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        banner.status === "Active"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-400 text-white"
                      }`}
                    >
                      {banner.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banner #{index + 1}</p>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        <span className="font-semibold text-slate-700">Link:</span> {banner.redirectUrl || "None"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/80">
                      <button
                        onClick={() => openEditTopBannerModal(banner, index)}
                        className="flex-1 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5 text-blue-600" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTopBanner(banner, index)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:trash-can" className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SINGLE HEADING BANNER (STRICTLY SINGLE)                         */}
      {/* ===================================================================== */}
      {activeTab === "heading_banner" && (
        <form onSubmit={handleSaveHeadingBanner} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Single Heading Banner
              <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-full">
                Strictly 1 Banner Only
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Upload a single designed Heading Banner image (e.g. "Upgrade Your Home This Festive Season" banner with decorative elements). Multiple heading banners are not permitted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Heading Banner Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeadingBannerFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Image URL (Or paste path)
                </label>
                <input
                  type="text"
                  value={headingBannerForm.imageUrl}
                  onChange={(e) => setHeadingBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="/uploads/festival/heading_banner.jpg"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Redirect URL (Optional)
                </label>
                <input
                  type="text"
                  value={headingBannerForm.redirectUrl}
                  onChange={(e) => setHeadingBannerForm((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                  placeholder="/category/television"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={headingBannerForm.status}
                  onChange={(e) => setHeadingBannerForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Preview Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Heading Banner Preview
              </label>
              <div className="w-full min-h-[200px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center p-4">
                {headingBannerForm.imageUrl || headingBannerFile ? (
                  <img
                    src={
                      headingBannerFile
                        ? URL.createObjectURL(headingBannerFile)
                        : headingBannerForm.imageUrl
                    }
                    alt="Heading Banner Preview"
                    className="w-full h-auto max-h-[300px] object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <Icon icon="mdi:image" className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                    No heading banner image set.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Icon icon="line-md:loading-loop" className="animate-spin w-4 h-4" /> : <Icon icon="mdi:content-save" className="w-4 h-4" />}
              Save Heading Banner
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: 4 OFFER CARDS GRID                                             */}
      {/* ===================================================================== */}
      {activeTab === "cards" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                4 Offer Images Grid (Left to Right)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Each offer card displays an image, a 1-sentence caption line below the image, and a click link.
              </p>
            </div>

            <button
              onClick={openAddCardModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Icon icon="mdi:plus-circle" className="w-4 h-4" />
              Add Offer Card
            </button>
          </div>

          {offerCardsList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Icon icon="mdi:view-grid-plus" className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No custom offer cards added.</p>
              <button
                onClick={openAddCardModal}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Add First Offer Card
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {offerCardsList.map((card, index) => (
                <div
                  key={card._id || index}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm group hover:border-amber-400 transition-all"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                    <img
                      src={card.imageUrl}
                      alt={card.content || "Card Image"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        card.status === "Active"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-400 text-white"
                      }`}
                    >
                      {card.status}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white border-t border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                        {card.content || "No sentence line set."}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        Link: {card.redirectUrl || "None"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openEditCardModal(card, index)}
                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:pencil" className="w-3.5 h-3.5 text-blue-600" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card, index)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Icon icon="mdi:trash-can" className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: LEFT CONTENT SECTION                                           */}
      {/* ===================================================================== */}
      {activeTab === "left_content" && (
        <form onSubmit={handleSaveLeftSection} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Left Side Heading & Content Paragraphs
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Edit the heading and content paragraphs displayed on the left column of the split festival section.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section Heading (Blue Accent)
              </label>
              <input
                type="text"
                value={leftSectionForm.heading}
                onChange={(e) => setLeftSectionForm((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="Celebrate Vinayagar Chaturthi with Joyful Shopping"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-semibold text-blue-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Content Paragraphs (Separate each paragraph with a blank line)
              </label>
              <textarea
                rows={8}
                value={leftSectionForm.paragraphsText}
                onChange={(e) => setLeftSectionForm((prev) => ({ ...prev, paragraphsText: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-sans"
              />
            </div>

            {/* Static Notice Box */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Icon icon="mdi:information-outline" className="w-4 h-4 text-amber-700" />
                Static Content Items (Standard Design):
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
                <li>4 Checkmark Bullet Points (Trusted Brands for Every Home, Festive Offers & Great Value, Easy EMI, Reliable Service)</li>
                <li>Delivery Badge: "DELIVERY ALL OVER TAMIL NADU"</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Icon icon="line-md:loading-loop" className="animate-spin w-4 h-4" /> : <Icon icon="mdi:content-save" className="w-4 h-4" />}
              Save Left Content
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: RIGHT FORM & MINI BANNER                                       */}
      {/* ===================================================================== */}
      {activeTab === "form" && (
        <form onSubmit={handleSaveRightSection} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Right Contact Form & Mini Banner Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure the right column contact form badge, mini banner image, title, and subtitle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Form Top Badge Text
                </label>
                <input
                  type="text"
                  value={formSectionSettings.tagText}
                  onChange={(e) => setFormSectionSettings((prev) => ({ ...prev, tagText: e.target.value }))}
                  placeholder="FESTIVE EXCLUSIVE"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title Prefix
                </label>
                <input
                  type="text"
                  value={formSectionSettings.titlePrefix}
                  onChange={(e) => setFormSectionSettings((prev) => ({ ...prev, titlePrefix: e.target.value }))}
                  placeholder="Unlock Your"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title Highlight
                </label>
                <input
                  type="text"
                  value={formSectionSettings.titleHighlight}
                  onChange={(e) => setFormSectionSettings((prev) => ({ ...prev, titleHighlight: e.target.value }))}
                  placeholder="Vinayagar Specials!"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formSectionSettings.subtitle}
                  onChange={(e) => setFormSectionSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Form Mini Banner Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMiniBannerFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
                />
              </div>

              <div className="w-full min-h-[160px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 gap-2">
                {miniBannerFile || formSectionSettings.miniBannerImage ? (
                  <>
                    <img
                      src={
                        miniBannerFile
                          ? URL.createObjectURL(miniBannerFile)
                          : formSectionSettings.miniBannerImage
                      }
                      alt="Mini Banner Preview"
                      className="w-full h-auto max-h-[180px] object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormSectionSettings((prev) => ({ ...prev, miniBannerImage: "" }));
                        setMiniBannerFile(null);
                      }}
                      className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Icon icon="mdi:trash-can" className="w-3.5 h-3.5" />
                      Remove Mini Banner Image
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    No mini banner uploaded. Text or form header will display.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-sm shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Icon icon="line-md:loading-loop" className="animate-spin w-4 h-4" /> : <Icon icon="mdi:content-save" className="w-4 h-4" />}
              Save Form Section Settings
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: FORM LEADS LIST                                                */}
      {/* ===================================================================== */}
      {activeTab === "leads" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Festival Lead Submissions ({leads.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Leads submitted via the festival form. All entries are also saved into the main Admin Contact database.
              </p>
            </div>
            <button
              onClick={fetchLeads}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
            >
              <Icon icon="mdi:refresh" className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {leads.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">No leads submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead, idx) => (
                    <tr key={lead._id || idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{lead.fullName}</td>
                      <td className="py-3 px-4 text-blue-600">{lead.email}</td>
                      <td className="py-3 px-4 font-mono text-xs">{lead.phone}</td>
                      <td className="py-3 px-4">{lead.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT TOP BANNER                                          */}
      {/* ===================================================================== */}
      {showTopBannerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveTopBanner}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingTopBanner ? "Edit Top Banner" : "Add New Top Banner"}
              </h3>
              <button
                type="button"
                onClick={() => setShowTopBannerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Upload Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTopBannerFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Image URL (Or paste path)
              </label>
              <input
                type="text"
                value={topBannerForm.imageUrl}
                onChange={(e) => setTopBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="/uploads/festival/top_banner1.jpg"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Redirect Link (Optional)
              </label>
              <input
                type="text"
                value={topBannerForm.redirectUrl}
                onChange={(e) => setTopBannerForm((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="/category/television"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={topBannerForm.status}
                onChange={(e) => setTopBannerForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTopBannerModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                {saving && <Icon icon="line-md:loading-loop" className="animate-spin w-3.5 h-3.5" />}
                Save Top Banner
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT OFFER CARD                                          */}
      {/* ===================================================================== */}
      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCard}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingCard ? "Edit Offer Card" : "Add Offer Card"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Upload Card Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCardImageFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Image URL (Or paste path)
              </label>
              <input
                type="text"
                value={cardForm.imageUrl}
                onChange={(e) => setCardForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="/uploads/festival/card1.jpg"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                1-Sentence Caption Line Below Image
              </label>
              <input
                type="text"
                value={cardForm.content}
                onChange={(e) => setCardForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Upgrade your refrigerator this Vinayagar Chaturthi"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Redirect Link
              </label>
              <input
                type="text"
                value={cardForm.redirectUrl}
                onChange={(e) => setCardForm((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="/category/refrigerators"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={cardForm.status}
                onChange={(e) => setCardForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                {saving && <Icon icon="line-md:loading-loop" className="animate-spin w-3.5 h-3.5" />}
                Save Offer Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
