"use client";

import { useEffect, useId, useRef, useState } from "react";

const DESIGN_WIDTH = 860;
const DESIGN_HEIGHT = 480;
const CATEGORY_WIDTH = 680;

function fitScale(width = DESIGN_WIDTH, height = DESIGN_HEIGHT) {
  if (typeof window === "undefined") return 1;
  const pad = 16;
  return Math.max(
    0.32,
    Math.min(
      1,
      (window.innerWidth - pad) / width,
      (window.innerHeight - pad) / height
    )
  );
}

/**
 * Shared Smart Lead dialog shell — BEA-aligned, responsive, accessible.
 * UI only; close handlers still invoke Part 3 suppression via parent.
 */
export default function PopupShell({
  open,
  onClose,
  title,
  children,
  accent = "blue",
  template = "default",
  /** "default" | "category" | "comparison" | "model" | "support" */
  variant = "default",
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  // Keep latest onClose without re-running mount/focus effect (host recreates
  // handlers when visitor snapshot heartbeats — that was stealing input focus).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [scale, setScale] = useState(1);
  const [hugHeight, setHugHeight] = useState(DESIGN_HEIGHT);
  const isCategory = variant === "category";
  const designWidth = isCategory ? CATEGORY_WIDTH : DESIGN_WIDTH;

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current =
      typeof document !== "undefined" ? document.activeElement : null;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current?.({ action: "escape" });
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Autofocus close ONLY when the dialog first opens — never on parent re-renders.
    // Skip if focus is already inside the panel (user started typing).
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const active = document.activeElement;
      if (active && panel.contains(active) && active !== panel) return;
      const closeBtn = panel.querySelector('[data-smart-lead-close="1"]');
      closeBtn?.focus?.();
    }, 30);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (
        previouslyFocused.current &&
        typeof previouslyFocused.current.focus === "function"
      ) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || variant === "support") return undefined;
    const apply = () => setScale(fitScale(designWidth, DESIGN_HEIGHT));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [open, variant, designWidth]);

  useEffect(() => {
    if (!open || !isCategory) return undefined;
    const el = panelRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const update = () => {
      const h = el.offsetHeight;
      if (h > 0) setHugHeight(h);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [open, isCategory]);

  if (!open) return null;

  const isWide =
    variant === "category" ||
    variant === "comparison" ||
    variant === "model" ||
    variant === "premium";
  const isDark = variant === "model" || variant === "premium";
  const isPremium = variant === "premium";
  const isSupport = variant === "support";

  const accentBar =
    accent === "premium"
      ? "from-amber-800 via-amber-600 to-yellow-500"
      : accent === "green"
        ? "from-emerald-700 to-teal-500"
        : "from-[#015aaa] to-[#2453D3]";

  const widthCls = isSupport
    ? "w-[min(100%,340px)] sm:w-[min(100%,360px)]"
    : isCategory
      ? "w-[680px]"
      : "w-[860px]";

  const panelHeight = isSupport
    ? "max-h-[min(90dvh,420px)]"
    : isCategory
      ? "h-auto"
      : "h-[480px]";

  return (
    <div
      className={`smart-lead-overlay fixed inset-0 z-[10050] flex items-center justify-center p-2`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 motion-safe:transition-opacity"
        aria-label="Close popup overlay"
        onClick={() => onClose?.({ action: "backdrop" })}
      />

      <div
        className="relative z-10"
        style={
          isSupport
            ? undefined
            : {
                width: designWidth * scale,
                height: (isCategory ? hugHeight : DESIGN_HEIGHT) * scale,
              }
        }
      >
      <div
        ref={panelRef}
        className={`smart-lead-panel relative ${widthCls} ${panelHeight} ${
          isPremium
            ? "bg-[#07090C] text-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] border border-[#D4A04C]/25"
            : isDark
            ? "bg-[#071422] text-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] border border-white/10"
            : isWide || isSupport
              ? "bg-white rounded-2xl shadow-[0_16px_48px_rgba(8,16,40,0.18)] border border-gray-100/80"
              : "bg-white rounded-2xl shadow-[0_12px_40px_rgba(1,90,170,0.18)] border border-gray-100"
        } overflow-hidden flex flex-col motion-safe:animate-smartLeadIn`}
        style={
          isSupport
            ? undefined
            : {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }
        }
      >
        {!isWide && !isSupport ? (
          <div
            className={`h-1.5 w-full flex-shrink-0 bg-gradient-to-r ${accentBar}`}
            aria-hidden="true"
          />
        ) : null}

        {isWide || isSupport || variant === "premium" ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            <button
              type="button"
              data-smart-lead-close="1"
              onClick={() => onClose?.({ action: "close" })}
              className={`absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full text-2xl leading-none flex items-center justify-center focus:outline-none focus-visible:ring-2 ${
                isDark
                  ? "text-white/90 hover:bg-white/10 focus-visible:ring-white/70"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-customBlue"
              }`}
              aria-label="Close popup"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div
              className={
                isCategory
                  ? "h-auto"
                  : "overflow-y-auto overscroll-contain flex-1 min-h-0 h-full"
              }
            >
              {children}
            </div>
          </>
        ) : (
          <>
            {/* Sticky header: title + close always reachable */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-4 sm:px-5 pt-3.5 pb-2 bg-white/95 backdrop-blur-sm border-b border-gray-50">
              <h2
                id={titleId}
                className="text-[15px] sm:text-lg font-bold text-gray-900 leading-snug pr-1 tracking-tight"
              >
                {title}
              </h2>
              <button
                type="button"
                data-smart-lead-close="1"
                onClick={() => onClose?.({ action: "close" })}
                className="flex-shrink-0 w-10 h-10 -mr-1 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 text-xl leading-none flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue focus-visible:ring-offset-2"
                aria-label="Close popup"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {/* Scrollable body — keeps CTA reachable via scroll on small screens / keyboard */}
            <div className="px-4 sm:px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 overflow-y-auto overscroll-contain flex-1 min-h-0">
              {children}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export function BenefitList({ benefits = [] }) {
  if (!benefits?.length) return null;
  return (
    <ul className="mt-3 space-y-1.5" aria-label="Benefits">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-0.5 text-customBlue font-bold flex-shrink-0" aria-hidden="true">
            ✓
          </span>
          <span className="leading-snug">{b}</span>
        </li>
      ))}
    </ul>
  );
}

export function WhatsAppButton({
  text,
  label = "Chat with us on WhatsApp",
  onClick,
  href,
}) {
  const resolved =
    href ||
    `https://wa.me/919842344323?text=${encodeURIComponent(
      text || "Hi, I need help from BEA."
    )}`;
  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366] text-[#128C7E] hover:bg-emerald-50 active:bg-emerald-100 font-semibold text-sm min-h-[44px] py-2.5 px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <span aria-hidden="true" className="text-base">
        ✆
      </span>
      {label}
    </a>
  );
}

/** Product / category thumbnail — aspect preserved, not distorted */
export function ProductThumb({ src, alt, size = "md", className = "" }) {
  const box =
    size === "lg"
      ? "w-full max-w-[140px] h-28 sm:h-32"
      : size === "sm"
        ? "w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]"
        : "w-[5.5rem] h-[5.5rem] sm:w-24 sm:h-24";

  return (
    <div
      className={`${box} mx-auto rounded-xl bg-[#f7f8fa] border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/no-image.jpg"}
        alt={alt || "Product"}
        className="max-w-full max-h-full object-contain p-1.5"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function CategoryHero({ src, alt }) {
  if (!src) return null;
  return (
    <div className="mb-3 rounded-xl overflow-hidden bg-[#f7f8fa] border border-gray-100 h-32 xs:h-36 sm:h-40 md:h-44 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "Category"}
        className="max-h-full max-w-full object-contain p-2"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/** Desktop: image left + meta; Mobile: stacked image then text */
export function ProductSpotlight({
  image,
  brand,
  name,
  modelNumber,
  itemCode,
  expertType,
  brandClassName = "text-customBlue",
}) {
  return (
    <div className="flex flex-row gap-4 items-start text-left">
      <ProductThumb src={image} alt={name || brand || "Product"} size="md" />
      <div className="min-w-0 w-full">
        {brand ? (
          <p
            className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wide ${brandClassName}`}
          >
            {brand}
          </p>
        ) : null}
        {name ? (
          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug mt-0.5">
            {name}
          </p>
        ) : null}
        {modelNumber ? (
          <p className="text-xs text-gray-500 mt-0.5">Model: {modelNumber}</p>
        ) : null}
        {itemCode ? <p className="text-xs text-gray-400">SKU: {itemCode}</p> : null}
        {expertType ? (
          <p className="text-xs text-gray-500 mt-1">{expertType}</p>
        ) : null}
      </div>
    </div>
  );
}

export function Subcopy({ children }) {
  if (!children) return null;
  return (
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{children}</p>
  );
}

/** Resolve shell accent from Part 5 template + popup type */
export function resolvePopupAccent(type, template) {
  if (template === "premium" || type === "PREMIUM") return "premium";
  return "blue";
}
