"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from '@/context/CartContext';
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const features = [
  { icon: "🚗", title: "Free Shipping", description: "Free shipping all over the US" },
  { icon: "🔒", title: "100% Satisfaction", description: "Guaranteed satisfaction with every order" },
  { icon: "💼", title: "Secure Payments", description: "We ensure secure transactions" },
  { icon: "💬", title: "24/7 Support", description: "We're here to help anytime" },
];

const ConfirmModal = ({ show, onClose, onConfirm }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Remove item?</h3>
          <p className="text-gray-500 mb-4">Are you sure you want to delete this item from your cart?</p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={onConfirm}
            >
              Yes, Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SuccessModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-green-600 mb-2">Success!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ErrorModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-red-600 mb-2">Warning!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// NEW: deep-compare helpers (avoid re-renders/flicker)
const normalizeOffersList = (offers = []) =>
  offers
    .filter(o => o && o.code)
    .map(o => ({
      code: String(o.code),
      percentage: Number(o.percentage || 0) || 0,
      fixed_price: Number(o.fixed_price || 0) || 0,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

const isSameOffers = (a, b) => {
  try {
    const na = normalizeOffersList(a);
    const nb = normalizeOffersList(b);
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
};

export default function CartComponent() {
  const router = useRouter();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cartCount, updateCartCount } = useCart();
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(""); // inline success text

  // Coupon feature toggle state (shared)
  const [couponFeatureEnabled, setCouponFeatureEnabled] = useState(true);
  const [hasActiveOfferProduct, setHasActiveOfferProduct] = useState(false);

  // New: active offer codes now store objects: { code, percentage, fixed_price }
  const [activeOfferCodes, setActiveOfferCodes] = useState([]);
  // NEW: loading state for initial render (no flicker on background refresh)
  const [isOffersLoading, setIsOffersLoading] = useState(true);
  // NEW: track which coupon was just copied to show ✅ temporarily
  const [copiedCode, setCopiedCode] = useState(null);
  // NEW: refs for live updates and cleanup
  const offersAbortRef = useRef(null);
  const offersIntervalRef = useRef(null);
  const offersSSERef = useRef(null);

  // Copy coupon to clipboard and reflect UI
  const handleCopyCoupon = async (code) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch (_) {
      // no-op
    }
    // Update input and focus
    setCouponCode(code);
    setCouponError("");
    setCouponSuccess("");
    const inputEl = document.getElementById("coupon_input");
    if (inputEl) {
      inputEl.focus();
      try {
        const end = code.length;
        inputEl.setSelectionRange(end, end);
      } catch {}
    }
    // Show copied indicator briefly
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // NEW: helper to robustly check coupon validity using optional from/to dates
  const isCouponValid = (coupon) => {
    try {
      // Accept multiple possible field names
      const fromRaw = coupon?.from_date ?? coupon?.fromDate ?? coupon?.valid_from ?? null;
      const toRaw = coupon?.to_date ?? coupon?.toDate ?? coupon?.valid_to ?? null;

      // If neither date is provided, coupon is valid by date constraints
      if (!fromRaw && !toRaw) return true;

      // Helper to parse various inputs into a valid Date or null
      const parseDate = (raw) => {
        if (raw === null || raw === undefined || raw === "") return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
      };

      const from = parseDate(fromRaw);
      const to = parseDate(toRaw);

      // If both parsed dates are invalid, treat as no date constraints
      if (!from && !to) return true;

      // Compute UTC start-of-day (00:00 UTC) for robust date-only comparisons
      const utcStartOfDay = (d) =>
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

      const now = new Date();
      const todayUTC = utcStartOfDay(now);

      if (from) {
        const fromUTC = utcStartOfDay(from);
        // today must be same or after from date
        if (todayUTC < fromUTC) return false;
      }

      if (to) {
        const toUTC = utcStartOfDay(to);
        // today must be same or before to date
        if (todayUTC > toUTC) return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  // NEW: shared fetcher for active offer codes (used by SSE triggers, polling, focus/visibility)
  const fetchActiveCodes = useCallback(async (opts = { silent: false }) => {
    try {
      if (!opts.silent) setIsOffersLoading(true);
      // Abort previous in-flight fetch
      if (offersAbortRef.current) {
        try { offersAbortRef.current.abort(); } catch {}
      }
      const ac = new AbortController();
      offersAbortRef.current = ac;

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const resp = await fetch("/api/offers/offer-products?listActiveCodes=1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: ac.signal,
        cache: "no-store",
      });

      const json = await resp.json().catch(() => null);
      const offers = Array.isArray(json?.offers)
        ? json.offers.map(o => ({
            // preserve date fields for client-side validity checks
            code: o.code || o.offer_code || o.offerCode || "",
            percentage: Number(o.percentage || 0) || 0,
            fixed_price: Number(o.fixed_price || 0) || 0,
            from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
            to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
          })).filter(o => o.code)
        : Array.isArray(json?.codes)
          ? json.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }))
          : [];

      // Update state only if changed to avoid flicker
      if (!isSameOffers(activeOfferCodes, offers)) {
        setActiveOfferCodes(offers);
      }
    } catch {
      // keep current offers on error to avoid flicker
    } finally {
      setIsOffersLoading(false);
    }
  }, [activeOfferCodes]);

  // Sync helpers and storage listener
  const isSameCart = (a, b) => {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  };
  const saveCartState = (cart) => {
    try {
      localStorage.setItem('cartData', JSON.stringify(cart));
      if (typeof cart?.totalItems === 'number') {
        localStorage.setItem('cartCount', String(cart.totalItems));
      }
    } catch {}
  };
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cartData') {
        const next = e.newValue ? JSON.parse(e.newValue) : null;
        // Only update state; do not write back to localStorage here to avoid loops
        if (!isSameCart(next, cartData)) {
          setCartData(next);
          updateCartCount(next?.totalItems ?? 0);
        }
      }
      if (e.key === 'appliedCoupon') {
        const nextCoupon = e.newValue ? JSON.parse(e.newValue) : null;
        setAppliedCoupon(nextCoupon);
      }
      // Listen to coupon feature toggle
      if (e.key === 'couponFeatureEnabled') {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : true;
          setCouponFeatureEnabled(next);
        } catch {
          setCouponFeatureEnabled(true);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cartData, updateCartCount]);

  // Initialize coupon feature toggle and subscribe to BroadcastChannel
  useEffect(() => {
    try {
      const saved = localStorage.getItem('couponFeatureEnabled');
      setCouponFeatureEnabled(saved === null ? true : JSON.parse(saved));
    } catch {
      setCouponFeatureEnabled(true);
    }

    let bc;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('couponFeature');
      bc.onmessage = (ev) => setCouponFeatureEnabled(Boolean(ev.data));
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Fetch and set hasActiveOfferProduct from API (fallback to false on errors)
  const fetchOfferProductsActive = async (signal) => {
    try {
      const token = (typeof window !== "undefined") ? localStorage.getItem("token") : null;
      const resp = await fetch("/api/offers/offer-products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal,
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok || !json) {
        setHasActiveOfferProduct(false);
        return;
      }
      const bool =
        typeof json.hasActiveOfferProduct === "boolean"
          ? json.hasActiveOfferProduct
          : (Array.isArray(json?.data) ? json.data.length > 0 : false);
      setHasActiveOfferProduct(Boolean(bool));
    } catch (e) {
      if (e?.name !== "AbortError") setHasActiveOfferProduct(false);
    }
  };

  // Re-check on mount and when cart items length changes
  useEffect(() => {
    const controller = new AbortController();
    fetchOfferProductsActive(controller.signal);
    return () => controller.abort();
  }, [cartData?.items?.length]);

  // Re-check on window focus
  useEffect(() => {
    const onFocus = () => fetchOfferProductsActive();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const token = localStorage.getItem('token');
        let response = '';
        
        if(token)
        {
          response = await fetch('/api/cart', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            method: "GET"
          });
        }
        else
        {
          const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
          response = await fetch('/api/cart', {
            headers: {
              'guestCartId': guestCartId
            },
            method: "GET"
          });
        }

        if (!response.ok) {
          const datares = await response.json();
          if (
            datares.error === "Token has expired" ||
            datares.error === "Invalid token" ||
            datares.error === "Authorization token required"
          ) {
            localStorage.removeItem("token");
            window.location.reload();
            return;
          }
        }

        const data = await response.json();
        const itemsWithDiscount = data.cart.items.map(item => ({
          ...item,
          discount: 0
        }));

        // Persist and set state
        const nextCart = { ...data.cart, items: itemsWithDiscount };
        setCartData(nextCart);
        saveCartState(nextCart);

        // Apply saved coupon if present and persist
        const savedCoupon = localStorage.getItem('appliedCoupon');
        if (savedCoupon) {
          const coupon = JSON.parse(savedCoupon);
          setAppliedCoupon(coupon);
          const discountedItems = applyDiscountToItems(coupon, nextCart.items);
          const discountedCart = { ...nextCart, items: discountedItems };
          setCartData(discountedCart);
          saveCartState(discountedCart);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [router]);

  // Apply discount to specific items based on coupon
  const applyDiscountToItems = (coupon, items) => {
    if (!coupon || !items) return items;

    // Determine eligible items: if offer_product provided, restrict to those; else all items
    const eligibleItems = Array.isArray(coupon.offer_product) && coupon.offer_product.length
      ? items.filter(i => coupon.offer_product.includes(i.productId))
      : items;

    if (!eligibleItems.length) {
      // No eligible items; clear discounts
      return items.map(i => ({ ...i, discount: 0, coupondetails: [] }));
    }

    const lineTotal = (i) => (Number(i.price) || 0) * (Number(i.quantity) || 0);
    const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + lineTotal(i), 0);

    // Compute cart-level discount according to rules
    let totalDiscount = 0;
    if (coupon.offer_type === "percentage" && Number(coupon.percentage) > 0) {
      totalDiscount = eligibleSubtotal * (Number(coupon.percentage) / 100);
    } else if (coupon.offer_type === "fixed_price" && Number(coupon.fixed_price) > 0) {
      totalDiscount = Number(coupon.fixed_price);
    }

    // Cap discount so it never exceeds the eligible subtotal
    totalDiscount = Math.min(totalDiscount, eligibleSubtotal);
    totalDiscount = Number(totalDiscount.toFixed(2));

    // Distribute proportionally across eligible items
    const isEligible = (pid) => eligibleItems.some(e => e.productId === pid);
    let distributed = 0;
    const distributedItems = items.map((item, idx, arr) => {
      if (!isEligible(item.productId) || eligibleSubtotal === 0 || totalDiscount === 0) {
        return { ...item, discount: 0, coupondetails: [] };
      }
      const base = lineTotal(item);
      // Proportional share
      let share = (base / eligibleSubtotal) * totalDiscount;
      let discount = Number(share.toFixed(2));
      distributed += discount;
      return {
        ...item,
        discount,
        coupondetails: discount > 0 ? [coupon] : []
      };
    });

    // Fix rounding drift on the last eligible item to match totalDiscount exactly
    const eligibleIndexes = distributedItems
      .map((it, idx) => (isEligible(it.productId) ? idx : -1))
      .filter(idx => idx !== -1);
    const drift = Number((totalDiscount - distributed).toFixed(2));
    if (eligibleIndexes.length && Math.abs(drift) >= 0.01) {
      const lastIdx = eligibleIndexes[eligibleIndexes.length - 1];
      distributedItems[lastIdx] = {
        ...distributedItems[lastIdx],
        discount: Number((distributedItems[lastIdx].discount + drift).toFixed(2))
      };
    }

    return distributedItems;
  };

  // Normalize offer object to client coupon shape (decide type from non-zero values)
  const normalizeOfferToCoupon = (offer) => {
    const code =
      offer.offer_code || offer.code || offer.couponCode || offer.offerCode || "";

    const status =
      (offer.status ||
       offer.fest_offer_status || // include fest_offer_status
       offer.offer_status ||
       offer.state ||
       "").toLowerCase();

    const typeRaw =
      (offer.offer_type || offer.type || offer.discount_type || "").toLowerCase();

    const percentage =
      Number(offer.percentage ?? offer.percent ?? (typeRaw.includes("percent") ? offer.discountValue : 0) ?? 0) || 0;

    const fixed =
      Number(offer.fixed_price ?? offer.amount ?? (!typeRaw.includes("percent") ? offer.discountValue : 0) ?? 0) || 0;

    const products =
      offer.offer_product ||
      offer.products ||
      offer.productIds ||
      offer.product_ids ||
      [];

    // Decide type from values
    const offer_type = percentage > 0 ? "percentage" : (fixed > 0 ? "fixed_price" : "");

    return {
      offer_code: code,
      offer_type,
      percentage: percentage > 0 ? percentage : 0,
      fixed_price: fixed > 0 ? fixed : 0,
      offer_product: Array.isArray(products) ? products : [],
      status
    };
  };


  const updateQuantity = async (productId, newQuantity, original_quantity = null) => {
    try {
      if (original_quantity !== null && newQuantity > original_quantity) {
        setErrorMessage("Requested quantity exceeds available stock.");
        setShowErrorModal(true);
        return;
      }
      let response = '';
      const token = localStorage.getItem('token');
      if(token)
      {
        response = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, quantity: newQuantity })
        });
      }
      else
      {
        const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        response = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'guestCartId': guestCartId
          },
          body: JSON.stringify({ productId, quantity: newQuantity })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const updatedCart = await response.json();

      const itemsMerged = updatedCart.cart.items.map(item => {
        const existingItem = cartData.items.find(i => i.productId === item.productId);
        return {
          ...existingItem,
          ...item,
          discount: existingItem ? existingItem.discount : 0,
          original_quantity: existingItem?.original_quantity ?? item.original_quantity ?? Infinity
        };
      });

      let finalItems = itemsMerged;
      if (appliedCoupon) {
        finalItems = applyDiscountToItems(appliedCoupon, itemsMerged);
      }

      const finalCart = { ...updatedCart.cart, items: finalItems };
      setCartData(finalCart);
      updateCartCount(finalCart.totalItems);
      saveCartState(finalCart);

      setSuccessMessage("Quantity updated successfully");
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Update quantity error:', err);
      setError(err.message);
    }
  };


  const confirmRemoveItem = (productId) => {
    setProductToDelete(productId);
    setShowConfirmModal(true);
  };

  const removeItem = async () => {
    try {
      let response = '';
      const token = localStorage.getItem('token');
      if(token)
      {
        response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId: productToDelete })
        });
      }
      else
      {
        const guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'guestCartId': guestCartId
          },
          body: JSON.stringify({ productId: productToDelete })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const updatedCart = await response.json();

      // Merge existing details
      const itemsMerged = updatedCart.cart.items.map(item => {
        const existingItem = cartData.items.find(i => i.productId === item.productId);
        return {
          ...item,
          discount: existingItem ? existingItem.discount : 0
        };
      });

      // Reapply coupon if exists
      let finalItems = itemsMerged;
      if (appliedCoupon) {
        finalItems = applyDiscountToItems(appliedCoupon, itemsMerged);
      }

      let nextCartObj = { ...updatedCart.cart, items: finalItems };
      setCartData(nextCartObj);
      updateCartCount(nextCartObj.totalItems);
      saveCartState(nextCartObj);

      // If product-specific coupon no longer applicable, clear it and discounts
      if (appliedCoupon && appliedCoupon.offer_product && appliedCoupon.offer_product.includes(productToDelete)) {
        setAppliedCoupon(null);
        localStorage.removeItem('appliedCoupon');
        nextCartObj = {
          ...nextCartObj,
          items: nextCartObj.items.map(item => ({ ...item, discount: 0 }))
        };
        setCartData(nextCartObj);
        saveCartState(nextCartObj);
      }

      setSuccessMessage("Item removed from cart");
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Remove item error:', err);
      setError(err.message);
    } finally {
      setShowConfirmModal(false);
      setProductToDelete(null);
    }
  };
  const validateCoupon = async () => {
    if (!couponFeatureEnabled) {
      setCouponError("Coupons are currently disabled");
      setCouponSuccess("");
      return;
    }
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Please enter a coupon code");
      setCouponSuccess("");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ code });
   
      const resp = await fetch(`/api/offers/offer-products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await resp.json();
      
      if (!resp.ok) throw new Error("INVALID");

      // Must have a valid normalized coupon from API
      // if (!data.success || data.validOffer !== true || !data.coupon) {
       
      //   setCouponError("The coupon code entered is not valid.");
      //   setCouponSuccess("");
      //   return;
      // }

      const normalized = normalizeOfferToCoupon(data.coupon);
          
      // Only Active coupons
      if ((normalized.status || "").toLowerCase() !== "active") {
       
        setCouponError("The coupon code entered is not valid.");
        setCouponSuccess("");
        return;
      }

      // Reject if both percentage and fixed are zero/invalid
      if ((normalized.percentage ?? 0) <= 0 && (normalized.fixed_price ?? 0) <= 0) {
        
        setCouponError("The coupon code entered is not valid.");
        setCouponSuccess("");
        return;
      }

      // Check applicability to items in cart
      const cartProductIds = cartData?.items?.map((i) => i.productId) || [];
      if (
        Array.isArray(normalized.offer_product) &&
        normalized.offer_product.length > 0 &&
        !normalized.offer_product.some((id) => cartProductIds.includes(id))
      ) {
         console.log(normalized);
        setCouponError("The coupon code entered is not valid.");
        setCouponSuccess("");
        return;
      }

      // Apply discount and persist (same flow as existing)
      const itemsWithDiscount = applyDiscountToItems(normalized, cartData.items);
      const newCart = { ...cartData, items: itemsWithDiscount };

      setAppliedCoupon(normalized);
      localStorage.setItem("appliedCoupon", JSON.stringify(normalized));
      setCartData(newCart);
      saveCartState(newCart);

      setCouponSuccess(`${normalized.offer_code} is applied`);
      setCouponError("");
    } catch (_) {
      setCouponError("The coupon code entered is not valid.");
      setCouponSuccess("");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    const newCart = {
      ...cartData,
      items: cartData.items.map((item) => ({ ...item, discount: 0 })),
    };
    setCartData(newCart);
    saveCartState(newCart);

    setAppliedCoupon(null);
    localStorage.removeItem("appliedCoupon");
    setCouponSuccess(""); // clear inline success
    setSuccessMessage("Coupon removed successfully");
    setCouponCode("");
    setShowSuccessModal(true);
  };

  const calculateSubtotal = () => {
  if (!cartData) return 0;
  
  return cartData.items.reduce((sum, item) => {
    const itemPrice = item.price > 0 ? item.price : item.actual_price;
    return sum + (itemPrice * item.quantity) + (item.warranty || 0) + (item.extendedWarranty || 0);
  }, 0);
};

  const calculateDiscount = () => {
    if (!appliedCoupon || !cartData) return 0;
    
    return cartData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const proceedToCheckout = () => {

  if (!cartData) return;

  // Calculate totals

  const subtotal = calculateSubtotal();

  const discount = calculateDiscount();

  const total = calculateTotal();

  // Save cart and coupon data to localStorage for checkout page

  localStorage.setItem('checkoutData', JSON.stringify({

    cart: {

      ...cartData,

      items: cartData.items.map(item => ({

        ...item,

        // Ensure all relevant fields are included

        productId: item.productId,

        name: item.name,

        price: item.price,

        quantity: item.quantity,

        warranty: item.warranty || 0,

        extendedWarranty: item.extendedWarranty || 0,

        discount: item.discount || 0,

        image: item.image

      }))

    },

    coupon: appliedCoupon,

    discount,

    subtotal,

    total

  }));

  router.push('/checkout');

};
 

  useEffect(() => {
    // Fetch active offer codes from DB (fest_offer_status2 and fest_offer_status are "active")
    const fetchActiveCodes = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const resp = await fetch("/api/offers/offer-products?listActiveCodes=1", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await resp.json().catch(() => null);
        // Prefer detailed offers; fallback to codes-only
        const offers = Array.isArray(json?.offers)
          ? json.offers.map(o => ({
              code: o.code || o.offer_code || o.offerCode || "",
              percentage: Number(o.percentage || 0) || 0,
              fixed_price: Number(o.fixed_price || 0) || 0,
              from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
              to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
            })).filter(o => o.code)
          : Array.isArray(json?.codes)
            ? json.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }))
            : [];
        // console.log(offers);
        setActiveOfferCodes(offers);
      } catch {
        setActiveOfferCodes([]);
      }
    };
    fetchActiveCodes();
  }, []);

  // REPLACE old "fetch active codes" effect with live updates (SSE + polling + focus/visibility + BroadcastChannel)
  useEffect(() => {
    // initial fetch
    fetchActiveCodes({ silent: false });

    // SSE subscription (if backend supports SSE at this path)
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        const es = new EventSource("/api/offers/offer-products/stream", { withCredentials: false });
        offersSSERef.current = es;

        es.onmessage = (ev) => {
          // Try to parse payload; if it contains offers/codes, use them; else trigger a re-fetch
          try {
            const data = JSON.parse(ev.data);
            if (Array.isArray(data?.offers) || Array.isArray(data?.codes)) {
              const offers = Array.isArray(data?.offers)
                ? data.offers.map(o => ({
                    code: o.code || o.offer_code || o.offerCode || "",
                    percentage: Number(o.percentage || 0) || 0,
                    fixed_price: Number(o.fixed_price || 0) || 0,
                    from_date: o.from_date ?? o.fromDate ?? o.valid_from ?? null,
                    to_date: o.to_date ?? o.toDate ?? o.valid_to ?? null,
                  })).filter(o => o.code)
                : data.codes.map(c => ({ code: c, percentage: 0, fixed_price: 0, from_date: null, to_date: null }));
              if (!isSameOffers(activeOfferCodes, offers)) {
                setActiveOfferCodes(offers);
              }
            } else if (data?.type === "offersUpdated") {
              // generic update signal
              fetchActiveCodes({ silent: true });
            } else {
              // unknown payload -> refresh
              fetchActiveCodes({ silent: true });
            }
          } catch {
            // non-JSON payload -> refresh
            fetchActiveCodes({ silent: true });
          }
        };

        es.onerror = () => {
          // On SSE error, close and rely on polling
          try { es.close(); } catch {}
          if (offersSSERef.current === es) offersSSERef.current = null;
        };
      } catch {
        // ignore SSE failures
      }
    }

    // Polling (paused when tab hidden)
    const startPolling = () => {
      if (offersIntervalRef.current) return;
      offersIntervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          fetchActiveCodes({ silent: true });
        }
      }, 15000); // 15s
    };
    const stopPolling = () => {
      if (offersIntervalRef.current) {
        clearInterval(offersIntervalRef.current);
        offersIntervalRef.current = null;
      }
    };
    startPolling();

    // Refetch on visibility/focus
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchActiveCodes({ silent: true });
        startPolling();
      } else {
        stopPolling();
      }
    };
    const onFocus = () => fetchActiveCodes({ silent: true });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    // BroadcastChannel fallback (if admin notifies via channel)
    let bc;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel("offersUpdates");
      bc.onmessage = () => fetchActiveCodes({ silent: true });
    }

    return () => {
      // cleanup
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      stopPolling();
      if (offersSSERef.current) {
        try { offersSSERef.current.close(); } catch {}
        offersSSERef.current = null;
      }
      if (offersAbortRef.current) {
        try { offersAbortRef.current.abort(); } catch {}
        offersAbortRef.current = null;
      }
      if (bc) bc.close();
    };
  }, [fetchActiveCodes]);

  // Derived lists/flags used for rendering
  const validActiveOfferCodes = Array.isArray(activeOfferCodes) ? activeOfferCodes.filter(isCouponValid) : [];
  const expiredActiveOfferCodes = Array.isArray(activeOfferCodes) ? activeOfferCodes.filter((c) => !isCouponValid(c)) : [];
  const hasAnyValidActiveOffer = validActiveOfferCodes.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-blue-50 rounded-lg max-w-md mx-4">
          <p className="text-blue-500 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet</p>
          <button 
            onClick={() => router.push('/index')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white min-h-screen">
      {/* Modals */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setProductToDelete(null);
        }}
        onConfirm={removeItem}
      />
      <SuccessModal
        show={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
      <ErrorModal
        show={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

    {/* Header */}
      <div className=" sm:pl-[3rem] sm:pr-[2rem] flex flex-col sm:flex-row justify-between items-center gap-2 my-[35px]">
        <div style={{ "--heading-color": "#0069c6" }}>
          <h1 className="font-bold text-[1.75rem] text-[#0069c6]"> My Cart</h1>
        </div>
        
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-[35px] px-4 sm:pl-[3rem] sm:pr-[2rem] py-0">
        {/* Left Side - Cart Table (big width) */}
        <div className="lg:col-span-2">
          {/* Updated table for responsiveness */}
         {/* ✅ Desktop Table View */}
<div className="overflow-x-auto bg-white rounded-lg border hidden md:block">
  <table className="min-w-full border">
    <thead className="bg-white-50 border-b">
      <tr>
        <th className="py-3 px-4 text-left text-gray-500 text-sm font-semibold">Product</th>
        <th className="text-center text-gray-500 text-sm font-semibold">Quantity</th>
        <th className="text-center text-gray-500 text-sm font-semibold">Subtotal</th>
        <th className="text-center text-gray-500 text-sm font-semibold">&emsp;</th>
      </tr>
    </thead>
    <tbody>
      {cartData.items.map((item) => (
        <Fragment key={item.productId}>
          <tr className="border-b">
            <td className="flex items-center py-4 px-4 gap-3">
              <div className="w-20 h-20 flex items-center justify-center border rounded-md overflow-hidden">
                <Link href={`/product/${slugify(item.name)}`}>
                <Image
                  src={`/uploads/products/${item.image}`}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="object-contain w-full h-full"
                />
                </Link>

              </div>
              <div className="flex flex-col gap-1 text-sm md:text-base">
                <h3 className="text-xs text-gray-500 uppercase">{item.item_code}</h3>
                <Link href={`/product/${slugify(item.name)}`}>
                  <p className="text-xs sm:text-sm font-medium text-[#0069c6] hover:text-[#00badb] line-clamp-2 min-h-[40px]">
                    {item.name.length > 50 ? item.name.slice(0, 50) + "..." : item.name}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  {item.price > 0 ? (
                    <>
                      <h3 className="text-base font-semibold text-red-600">₹{(item.price ?? 0).toFixed(2)}</h3>
                      <h3 className="text-xs text-gray-500 line-through">
                        ₹{(item.actual_price ?? item.price ?? 0).toFixed(2)}
                      </h3>
                    </>
                  ) : (
                    <h3 className="text-base font-semibold text-red-600">
                      ₹{(item.actual_price ?? 0).toFixed(2)}
                    </h3>
                  )}
                </div>
              </div>
            </td>
            <td className="py-4 px-4 text-center">
              <div className="flex justify-center items-center gap-2 border border-gray-300 rounded p-1">
                <button
                  className="px-2 py-1 text-black hover:text-blue-600"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, null)}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  className="px-2 py-1 text-black hover:text-blue-600"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.original_quantity)}
                >
                  +
                </button>
              </div>
              <button
                className="text-gray-500 text-xs font-semibold hover:text-blue-600"
                onClick={() => confirmRemoveItem(item.productId)}
              >
                Remove
              </button>
            </td>
            <td className="py-4 px-4 text-center font-semibold text-gray-900">
              ₹{(((item.price > 0 ? item.price : item.actual_price) ?? 0) * (item.quantity ?? 1)).toFixed(2)}
            </td>
            <td className="py-4 px-4 text-center">&emsp;</td>
          </tr>
        </Fragment>
      ))}
    </tbody>
  </table>
</div>

{/* ✅ Mobile Simplified View */}
<div className="block md:hidden space-y-4">
  {cartData.items.map((item) => (
    <div key={item.productId} className="flex gap-3 border rounded-lg p-3">
      <div className="w-20 h-20 flex items-center justify-center border rounded-md overflow-hidden">
        <Link href={`/product/${slugify(item.name)}`}>
        <Image
          src={`/uploads/products/${item.image}`}
          alt={item.name}
          width={80}
          height={80}
          className="object-contain w-full h-full"
        />
        </Link>
      </div>
      <div className="flex flex-col justify-between w-full">
        <div>
           <Link href={`/product/${slugify(item.name)}`}>
          <p className="text-sm font-medium text-[#0069c6] hover:text-[#00badb]">
            {item.name.length > 40 ? item.name.slice(0, 40) + "..." : item.name}
          </p>
          </Link>
          <p className="text-xs text-gray-500 uppercase">{item.item_code}</p>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-2 border border-gray-300 rounded p-1">
            <button
              className="px-2 py-1 text-black hover:text-blue-600"
              onClick={() => updateQuantity(item.productId, item.quantity - 1, null)}
              disabled={item.quantity <= 1}
            >
              −
            </button>
            <span>{item.quantity}</span>
            <button
              className="px-2 py-1 text-black hover:text-blue-600"
              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.original_quantity)}
            >
              +
            </button>
          </div>
          <div className="text-base font-semibold text-red-600">
            ₹{(((item.price > 0 ? item.price : item.actual_price) ?? 0) * (item.quantity ?? 1)).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

            {/* Continue Shopping Button */}
          {/* <div className="flex justify-between items-center mt-6 flex-wrap gap-2">
            <button
              className="text-gray-500 hover:underline"
              onClick={() => router.push("/index")}
            >
              ← Continue Shopping
            </button>
          </div> */}
        </div>

        {/* Right Side - Cart Totals (small width) */}
        <div className="lg:col-span-1 bg-white p-3 rounded-lg border shadow-sm space-y-4">
          {/* Coupon Section */}
          <div className="mt-0">
            {appliedCoupon ? (
              <div className="bg-green-50 p-3 rounded-lg mb-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-700">
                    Coupon: {appliedCoupon.offer_code}
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {appliedCoupon.offer_type === "percentage"
                    ? `${appliedCoupon.percentage}% off`
                    : `₹${appliedCoupon.fixed_price} off`}
                </p>
              </div>
            ) : (
              <div className="bg-[#f2f2f2] shadow-lg rounded-xl p-3 mb-5 max-w-md mx-auto border border-gray-200">
                <h3 className="text-gray-700 font-semibold text-sm mb-1">
                  Apply Coupon
                </h3>
                <p className="text-gray-900 text-sm mb-1" style={{ fontSize: "10.96px", color: "red", fontWeight: "bold" }}>
                  Enter your coupon code below to get discounts on eligible products.
                </p>

                {/* Single-branch simplified rendering:
                    - show skeleton while loading and no offers yet
                    - else show valid offers if any
                    - else show "Coupons are expired." when all are expired */}
                { (isOffersLoading && activeOfferCodes.length === 0) ? (
                  <div className="mt-2 mb-3">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      🎉 Limited Time Offers!
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-1.5 rounded-md border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 animate-pulse h-10" />
                      <div className="p-1.5 rounded-md border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 animate-pulse h-10" />
                    </div>
                  </div>
                ) : (
                  hasAnyValidActiveOffer ? (
                    <div className="mt-2 mb-3">
                      <div className="text-sm font-semibold text-gray-800 mb-2">
                        🎉 Limited Time Offers!
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        {validActiveOfferCodes.map((display_coupon) => {
                          const isValid = isCouponValid(display_coupon);
                          if (!isValid) return null; // defensive
                          return (
                            <div
                              key={display_coupon.code}
                              className="p-1.5 rounded-md shadow-sm border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50"
                            >
                              <div className="flex flex-wrap items-center gap-2 text-gray-800 text-xs sm:text-sm leading-tight">
                                <span className="whitespace-nowrap">🔖 Apply</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCoupon(display_coupon.code)}
                                  className={`inline-flex items-center gap-2 px-4 py-1 rounded-md text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow cursor-pointer active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300
                                    ${copiedCode === display_coupon.code ? "bg-green-400 hover:bg-green-500 border-green-500" : "bg-[#999999c4] hover:bg-[#808080] border-[#999999c4]"}
                                  `}
                                >
                                  <span className="truncate">{display_coupon.code}</span>
                                </button>

                                {/* Copied Indicator */}
                                {copiedCode === display_coupon.code && (
                                  <span className="text-green-600 font-semibold ml-1">✅ Copied</span>
                                )}

                                {/* Discount Text */}
                                <span className="whitespace-nowrap">
                                  and get{" "}
                                  {Number(display_coupon.fixed_price) > 0
                                    ? `₹${Number(display_coupon.fixed_price).toFixed(0)} Off`
                                    : `${Number(display_coupon.percentage).toFixed(0)}% Discount`}
                                </span>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 mb-3">
                      {/* <div className="text-sm font-semibold text-gray-800 mb-2">
                        🎉 Limited Time Offers!
                      </div>
                      <p className="text-xs text-gray-500">Coupons are expired.</p> */}
                    </div>
                  )
                )}

                <div className="flex items-center space-x-0">
                  <input
                    id="coupon_input"
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError("");
                      setCouponSuccess("");
                    }}
                    placeholder="Enter coupon code"
                    disabled={!couponFeatureEnabled}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <button
                    onClick={validateCoupon}
                    disabled={isValidatingCoupon || !couponFeatureEnabled}
                    className="px-5 py-3 bg-blue-600 text-white text-sm rounded-r-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    {isValidatingCoupon ? "Applying..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-sm mt-2">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-green-600 text-sm mt-2">{couponSuccess}</p>
                )}
                {!couponFeatureEnabled && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Coupons are currently disabled
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cart Totals */}
          <h3 className="text-gray-700 text-sm font-semibold">Cart Total</h3>
          <div className="p-1 rounded-lg space-y-3 text-sm text-gray-700">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">
                ₹{calculateSubtotal().toFixed(2)}
              </span>
            </div>
            <hr className="border-gray-300" />

            {appliedCoupon && (
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <span className="font-semibold text-green-600">
                  -₹{calculateDiscount().toFixed(2)}
                </span>
              </div>
            )}
            {appliedCoupon && <hr className="border-gray-300" />}

            <div className="flex justify-between items-center">
              <span>Delivery</span>
              <span className="font-semibold text-gray-900">Free</span>
            </div>
            <hr className="border-gray-300" /> 

            {/* <div className="flex justify-between items-center">
              <span>Estimated Taxes</span>
              <span className="font-semibold text-gray-900">₹0.00</span>
            </div> */}
          </div>

          {/* Total Price */}
          <div className="bg-gray-200 p-4 mt-4 rounded-lg flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={proceedToCheckout}
            className="w-full py-3 rounded-md text-white font-semibold text-sm hover:brightness-110 transition-all"
            style={{ backgroundColor: "#2453D3" }}
          >
            Checkout
          </button>
        </div>
      </div>
  </div>
  );
}