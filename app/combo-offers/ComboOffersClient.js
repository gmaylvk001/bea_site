"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";

// Live Countdown Timer Component
function CountdownTimer({ targetDate, label = "Offer Ends In:" }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isOver) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
        <Icon icon="mdi:clock-alert-outline" className="text-base text-gray-500" />
        <span>Offer has ended</span>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 inline-block">
      <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-1.5">
        <Icon icon="mdi:fire" className="text-red-600 text-base animate-bounce" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-center">
        <div className="bg-red-600 text-white rounded-md px-2 py-1 min-w-[36px]">
          <span className="block text-sm font-extrabold leading-none">{timeLeft.days}</span>
          <span className="text-[9px] uppercase tracking-wider">Days</span>
        </div>
        <span className="text-red-600 font-bold">:</span>
        <div className="bg-red-600 text-white rounded-md px-2 py-1 min-w-[36px]">
          <span className="block text-sm font-extrabold leading-none">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="text-[9px] uppercase tracking-wider">Hrs</span>
        </div>
        <span className="text-red-600 font-bold">:</span>
        <div className="bg-red-600 text-white rounded-md px-2 py-1 min-w-[36px]">
          <span className="block text-sm font-extrabold leading-none">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="text-[9px] uppercase tracking-wider">Min</span>
        </div>
        <span className="text-red-600 font-bold">:</span>
        <div className="bg-red-600 text-white rounded-md px-2 py-1 min-w-[36px]">
          <span className="block text-sm font-extrabold leading-none">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="text-[9px] uppercase tracking-wider">Sec</span>
        </div>
      </div>
    </div>
  );
}

// Single Combo Card Component
function ComboCard({ combo }) {
  const router = useRouter();
  const { updateCartCount } = useCart();
  const [selectedImage, setSelectedImage] = useState(combo.images?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [showProductsModal, setShowProductsModal] = useState(false);

  const now = new Date();
  const start = new Date(combo.offer_start);
  const end = new Date(combo.offer_end);

  const isUpcoming = now < start;
  const isExpired = now > end;
  const isActive = !isUpcoming && !isExpired && combo.status === "Active";

  // Calculate savings
  const comboPrice = Number(combo.combo_price) || 0;
  const comboMrp = Number(combo.combo_mrp) || Number(combo.combined_mrp) || comboPrice;
  const youSave = Math.max(0, comboMrp - comboPrice);
  const discountPercent = comboMrp > 0 ? Math.round((youSave / comboMrp) * 100) : 0;
  const extraSavingsVsBuyingIndividual = Math.max(0, Number(combo.combined_selling_price || 0) - comboPrice);

  const maxAvailable = Number(combo.quantity);
  const maxQuantity = Number.isFinite(maxAvailable) && maxAvailable > 0 ? maxAvailable : 1;

  const allImages = [
    ...(combo.images || []),
    ...((combo.products || []).map((p) => (p.images?.[0] ? `/uploads/products/${p.images[0]}` : null)).filter(Boolean)),
  ];

  const handleAddToCart = async () => {
    if (!isActive) return;

    if (quantity > maxQuantity) {
      setActionMessage({
        type: "error",
        text: `Maximum available quantity is ${maxQuantity}.`,
      });
      setQuantity(maxQuantity);
      return;
    }

    try {
      setAddingToCart(true);
      setActionMessage({ type: "", text: "" });

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let guestCartId = null;
      if (!token && typeof window !== "undefined") {
        guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        localStorage.setItem("guestCartId", guestCartId);
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: combo._id,
          quantity: Math.min(maxQuantity, quantity),
          original_prod_quantity: maxQuantity,
          isCombo: true,
          guestCartId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: "success", text: "Combo added to cart!" });
        if (data?.cart?.totalItems && updateCartCount) {
          updateCartCount(data.cart.totalItems);
        }
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to add combo to cart." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Network error. Please try again." });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isActive) return;

    if (quantity > maxQuantity) {
      setActionMessage({
        type: "error",
        text: `Maximum available quantity is ${maxQuantity}.`,
      });
      return;
    }

    setAddingToCart(true);
    setActionMessage({ type: "", text: "" });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let guestCartId = null;
      if (!token && typeof window !== "undefined") {
        guestCartId = localStorage.getItem("guestCartId");
        if (!guestCartId) {
          guestCartId = "guest_" + Math.random().toString(36).substring(2, 9) + Date.now();
          localStorage.setItem("guestCartId", guestCartId);
        }
      }

      const selectedQty = Math.min(maxQuantity, quantity);

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: combo._id,
          quantity: selectedQty,
          original_prod_quantity: maxQuantity,
          isCombo: true,
          guestCartId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: data.error || "Failed to proceed to checkout." });
        setAddingToCart(false);
        return;
      }

      if (data?.cart?.totalItems && updateCartCount) {
        updateCartCount(data.cart.totalItems);
      }

      const comboImg = combo.images?.[0] || "";
      const buyItem = {
        productId: combo._id,
        item_code: combo.slug,
        name: combo.name,
        price: comboPrice,
        actual_price: comboMrp,
        quantity: selectedQty,
        image: comboImg,
        fullImage: comboImg,
        isCombo: true,
        warranty: 0,
        extendedWarranty: 0,
        warrantyData: null,
      };

      const total = comboPrice * selectedQty;

      localStorage.setItem(
        "buyNowData",
        JSON.stringify({
          cart: { items: [buyItem] },
          total,
        })
      );

      // Redirect directly to checkout
      router.push("/checkout");
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Network error. Please try again." });
      setAddingToCart(false);
    }
  };

  return (
    <div
      id={`combo-${combo._id}`}
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden mb-12 ${
        isExpired
          ? "border-gray-200 opacity-90"
          : isActive
          ? "border-blue-200 shadow-md hover:shadow-lg ring-1 ring-blue-100"
          : "border-amber-200"
      }`}
    >
      {/* Top Banner Image (if configured in Tab 2) */}
      {combo.banner_image && (
        <div className="w-full max-h-[380px] overflow-hidden bg-gray-900 flex items-center justify-center border-b">
          <img
            src={
              combo.banner_image.startsWith("http") || combo.banner_image.startsWith("/")
                ? combo.banner_image
                : `/uploads/combos/${combo.banner_image}`
            }
            alt={`${combo.name} Banner`}
            className="w-full h-auto max-h-[380px] object-cover"
            onError={(e) => {
              if (combo.banner_image && !e.currentTarget.src.includes("/uploads/combos/")) {
                e.currentTarget.src = `/uploads/combos/${combo.banner_image}`;
              }
            }}
          />
        </div>
      )}

      {/* Admin Editable Content (from Tab 2 TinyEditor) */}
      {combo.page_content && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-blue-50/70 p-5 md:p-6 border-b border-blue-100">
          <div
            className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: combo.page_content }}
          />
        </div>
      )}

      {/* Main Grid: Left Gallery + Right Combo Details */}
      <div className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Main Selected Image */}
          <div className="w-full h-[320px] sm:h-[380px] rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center p-4 overflow-hidden relative">
            <img
              src={selectedImage || combo.images?.[0] || "/no-image.jpg"}
              alt={combo.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.target.src = "/no-image.jpg";
              }}
            />

            {/* Status Floating Pill */}
            <div className="absolute top-3 left-3">
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white shadow">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Active Limited Offer
                </span>
              ) : isUpcoming ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow">
                  <Icon icon="mdi:clock-outline" />
                  Upcoming Offer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-600 text-white shadow">
                  <Icon icon="mdi:cancel" />
                  Offer Expired
                </span>
              )}
            </div>

            {/* Product count pill */}
            <div className="absolute bottom-3 right-3">
              <span className="px-3 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 text-blue-900 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                <Icon icon="mdi:layers-triple" className="text-blue-600" />
                {combo.products?.length || 0} Products Included
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex flex-wrap gap-2.5 mt-4 justify-center">
              {allImages.slice(0, 8).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-lg border-2 p-1 overflow-hidden transition bg-white ${
                    selectedImage === img ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Combo Information & Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Title & Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                Exclusive Mega Combo
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {combo.products?.length || 0} Items Package Deal
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
              {combo.name}
            </h2>

            {combo.description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{combo.description}</p>
            )}

            {/* Combined Totals vs Combo Price Comparison Box */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/40 rounded-xl p-4 sm:p-5 border border-gray-200 mb-5">
              {/* Main Selling Price */}
              <div className="flex flex-wrap items-baseline gap-3 mb-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-700">
                  ₹{comboPrice.toLocaleString()}
                </span>
                {comboMrp > comboPrice && (
                  <span className="text-base sm:text-lg text-gray-400 line-through">
                    ₹{comboMrp.toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-green-100 text-green-700">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Combined Read-Only Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200/80 text-xs">
                <div>
                  <span className="text-gray-500 block">Combined Individual MRP:</span>
                  <span className="font-semibold text-gray-700 text-sm">
                    ₹{(combo.combined_mrp || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Combined Individual Selling Price:</span>
                  <span className="font-semibold text-gray-700 text-sm">
                    ₹{(combo.combined_selling_price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Extra Combo Savings Banner */}
              {extraSavingsVsBuyingIndividual > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-green-300 flex items-center justify-between text-xs text-green-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Icon icon="mdi:tag-check" className="text-base" />
                    Extra Combo Package Discount:
                  </span>
                  <span className="text-sm font-extrabold bg-green-600 text-white px-2 py-0.5 rounded">
                    Save ₹{extraSavingsVsBuyingIndividual.toLocaleString()} Extra
                  </span>
                </div>
              )}
            </div>

            {/* Live Timer or Status */}
            <div className="mb-6">
              {isActive ? (
                <CountdownTimer targetDate={combo.offer_end} label="Limited Time Combo Ends In:" />
              ) : isUpcoming ? (
                <CountdownTimer targetDate={combo.offer_start} label="Offer Starts In:" />
              ) : (
                <div className="p-3 bg-gray-100 rounded-xl text-gray-600 text-xs flex items-center gap-2">
                  <Icon icon="mdi:information" className="text-base text-gray-500" />
                  <span>This combo offer ended on {new Date(combo.offer_end).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Action Feedback Message */}
            {actionMessage.text && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  actionMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <Icon icon={actionMessage.type === "success" ? "mdi:check-circle" : "mdi:alert-circle"} />
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            {isActive ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                        type="button"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-4 py-1.5 text-sm font-bold text-center min-w-[36px]">{quantity}</span>
                      <button
                        onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={quantity >= maxQuantity}
                        type="button"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({combo.quantity > 0 ? `${maxQuantity} In Stock` : "Out of stock"})
                    </span>
                  </div>
                  {quantity >= maxQuantity && maxQuantity > 0 && (
                    <p className="text-red-500 text-xs font-semibold">Max {maxQuantity} units only</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {addingToCart ? (
                      <Icon icon="mdi:loading" className="animate-spin text-lg" />
                    ) : (
                      <Icon icon="mdi:cart-plus" className="text-lg" />
                    )}
                    Add Combo to Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Icon icon="mdi:lightning-bolt" className="text-lg" />
                    Buy Combo Now
                  </button>
                </div>
              </div>
            ) : isUpcoming ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm font-bold text-amber-800">Coming Soon!</p>
                <p className="text-xs text-amber-600 mt-1">
                  This offer will be available for purchase starting on{" "}
                  {new Date(combo.offer_start).toLocaleString()}.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl text-center">
                <p className="text-sm font-bold text-gray-600">Promotion Expired</p>
                <p className="text-xs text-gray-400 mt-1">
                  This combo offer has expired and is no longer available for purchase.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Included Products Section (Collapsible / Grid) */}
      <div className="bg-gray-50 border-t border-gray-200 p-5 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:format-list-checks" className="text-blue-600 text-xl" />
              What's Included in this Combo ({combo.products?.length || 0} Products)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              All items listed below are included in this package at the single combo price.
            </p>
          </div>
        </div>

        {/* Included products responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(combo.products || []).map((product, pIdx) => (
            <div
              key={product._id || pIdx}
              className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition group"
            >
              <div>
                <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 mb-2">
                  <img
                    src={
                      product.images?.[0]
                        ? product.images[0].startsWith("http") || product.images[0].startsWith("/")
                          ? product.images[0]
                          : `/uploads/products/${product.images[0]}`
                        : "/no-image.jpg"
                    }
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-200"
                    onError={(e) => {
                      e.target.src = "/no-image.jpg";
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">
                  {product.name}
                </p>
                {product.model_number && (
                  <p className="text-[10px] text-gray-400 truncate mb-1">Model: {product.model_number}</p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-400 block text-[10px]">Regular Price:</span>
                <span className="font-bold text-gray-900">
                  ₹{(product.special_price > 0 ? product.special_price : product.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Client Component
export default function ComboOffersClient({ initialCombos = [] }) {
  const [combos, setCombos] = useState(initialCombos);
  const [loading, setLoading] = useState(!initialCombos.length);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await fetch(`/api/combos?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && Array.isArray(data.combos)) {
          setCombos(data.combos);
        }
      } catch (err) {
        console.error("Failed to load combos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // Separate active and expired for quick count/anchor navigation
  const activeCount = combos.filter((c) => c.offerStatus === "active").length;
  const expiredCount = combos.filter((c) => c.offerStatus === "expired").length;

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Icon icon="mdi:loading" className="animate-spin text-5xl text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading combo offers...</p>
          </div>
        ) : combos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <Icon icon="mdi:package-variant" className="text-6xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No Active Combo Deals Available</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              Check back soon! New festival packages and mega appliance combos are added regularly.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div>
            {/* Combo Cards (automatically sorted server-side: active first, then expired) */}
            {combos.map((combo) => (
              <ComboCard key={combo._id} combo={combo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
