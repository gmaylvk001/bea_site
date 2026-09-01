"use client";

import { useEffect, useState } from "react";
import PopupShell from "./PopupShell";
import {
  HelpSelectionScreen,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

const BEA_LOGO = "/uploads/beaHqlogo.png";
const ACCENT = "#0B3A6E";

const FEATURE_ICONS = [
  {
    label: "Best Price Guaranteed",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M20.59 13.41 13.42 6.24A2 2 0 0 0 12 5.66H5a1 1 0 0 0-1 1v7c0 .53.21 1.04.59 1.41l7.17 7.17a2 2 0 0 0 2.83 0l6-6a2 2 0 0 0 0-2.83Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="9.5" r="1.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Expert Recommendation",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M3.5 19c.7-3.1 2.8-4.8 5.5-4.8S14.3 15.9 15 19"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M16.5 8.5h4M18.5 6.5v4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Bank Offers & EMI",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Warranty Support",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M12 3 4.5 6v5.5c0 4.6 3.1 8.7 7.5 9.5 4.4-.8 7.5-4.9 7.5-9.5V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function productCardLabel(p = {}) {
  const brand = String(p.brandName || "").trim();
  const model = String(p.modelNumber || "").trim();
  const name = String(p.name || "").trim();
  if (brand && model) return { line1: brand, line2: model };
  if (brand && name) return { line1: brand, line2: name };
  if (name) return { line1: name, line2: model };
  return { line1: model || p.itemCode || "Product", line2: "" };
}

function ProductCards({ products = [], moreLabel }) {
  const cols = Math.min(Math.max(products.length + (moreLabel ? 1 : 0), 1), 4);
  return (
    <div
      className="grid gap-2 sm:gap-2.5 w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="list"
      aria-label="Products you compared"
    >
      {products.map((p) => {
        const label = productCardLabel(p);
        return (
          <div
            key={p.productId || p.itemCode || p.name}
            className="min-w-0 rounded-xl border border-gray-200 bg-white px-1.5 pt-2 pb-2 text-center"
            role="listitem"
          >
            <div className="h-[68px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image || "/no-image.jpg"}
                alt={label.line1}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="mt-1.5 text-[11px] sm:text-xs font-semibold text-gray-900 leading-tight line-clamp-1 px-0.5">
              {label.line1}
            </p>
            {label.line2 ? (
              <p className="text-[10px] sm:text-[11px] text-gray-500 leading-tight line-clamp-1 px-0.5">
                {label.line2}
              </p>
            ) : null}
          </div>
        );
      })}
      {moreLabel ? (
        <div
          className="min-w-0 flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-[#F7F9FC] px-1 text-[12px] sm:text-sm font-bold text-[#0B3A6E]"
          role="listitem"
          aria-label={moreLabel}
        >
          {moreLabel}
        </div>
      ) : null}
    </div>
  );
}

function BenefitBar({ benefits }) {
  const items =
    Array.isArray(benefits) && benefits.length >= 4
      ? FEATURE_ICONS.map((f, i) => ({ ...f, label: benefits[i] || f.label }))
      : FEATURE_ICONS;

  return (
    <ul
      className="mt-3 grid grid-cols-4 gap-0 rounded-xl border border-gray-200 bg-white overflow-hidden"
      aria-label="Benefits"
    >
      {items.slice(0, 4).map((item, i) => (
        <li
          key={item.label}
          className={`flex items-center gap-2 px-3 py-3 ${
            i > 0 ? "border-l border-gray-100" : ""
          }`}
        >
          <span
            className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8F1FB] text-[#0B3A6E] flex items-center justify-center"
            style={{ color: ACCENT }}
          >
            {item.icon}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-800 leading-tight">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.5 3.5A11 11 0 0 0 2.1 17.4L1 22.5l5.2-1.1A11 11 0 0 0 20.5 3.5Zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.33-.2-3.1.66.66-3-.21-.34A9.1 9.1 0 1 1 12 20.5Zm5-6.8c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.13-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.13-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.47.07-.71.34-.25.27-.93.91-.93 2.22s.96 2.58 1.09 2.76c.14.18 1.89 2.89 4.57 4.05.64.28 1.14.44 1.53.56.64.21 1.23.18 1.69.11.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z" />
    </svg>
  );
}

export default function ComparisonIntentPopup({
  open,
  content,
  mode = "capture",
  onClose,
  onSubmitLead,
  onHelpSubmit,
  onHelpSkip,
  onSupportChat,
  onWhatsAppClick,
  whatsappHref,
}) {
  const [step, setStep] = useState("form");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setMobile("");
    setError("");
    setSubmitting(false);
    setLeadId(null);
  }, [open]);

  if (!content) return null;

  const categoryName = content.categoryName || "Appliances";
  const subcopy =
    content.subcopy ||
    "Let our appliance expert help you choose the right one & get the best deal!";
  const primaryCta = content.primaryCta || "HELP ME CHOOSE";
  const whatsappEnabled = content.whatsappEnabled !== false;
  const products = Array.isArray(content.products) ? content.products.slice(0, 3) : [];

  const handlePrimary = async () => {
    const normalized = normalizeIndianMobile(mobile);
    if (!isValidIndianMobile(normalized)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await onSubmitLead?.({ mobile: normalized, name: "" });
      if (!result?.ok || !result?.leadId) {
        setError(result?.error || "Could not save. Please try again.");
        return;
      }
      setLeadId(result?.leadId || null);
      setStep("help");
    } catch (err) {
      setError(err?.message || "Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const body =
    mode === "support" ? (
      <div className="px-5 py-6">
        <SupportCtaBlock
          whatsappText={content.whatsappText}
          whatsappHref={whatsappHref}
          onChat={onSupportChat}
          onWhatsAppClick={onWhatsAppClick}
          whatsappEnabled={whatsappEnabled}
        />
      </div>
    ) : step === "help" ? (
      <div className="px-5 sm:px-7 py-5">
        <HelpSelectionScreen
          submitting={submitting}
          whatsappText={content.whatsappText}
          whatsappHref={whatsappHref}
          onWhatsAppClick={onWhatsAppClick}
          whatsappEnabled={whatsappEnabled}
          onSkip={() => onHelpSkip?.({ leadId })}
          onSubmit={async (payload) => {
            setSubmitting(true);
            try {
              await onHelpSubmit?.({ ...payload, leadId });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    ) : (
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-70"
          aria-hidden="true"
        >
          <svg viewBox="0 0 900 90" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0 48 Q 180 8 360 42 T 720 40 T 900 52 V90 H0 Z"
              fill="#F3F6FA"
            />
          </svg>
        </div>

        <div className="relative px-7 pt-4 pb-2">
          <img
            src={BEA_LOGO}
            alt="BEA — Bharath Electronics & Appliances"
            className="h-14 w-auto object-contain self-start"
            width={200}
            height={56}
          />

          <div className="mt-3 grid grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] gap-4 items-start">
            <div className="min-w-0">
              <h3 className="text-[28px] font-bold text-[#081028] leading-tight tracking-tight">
                Comparing{" "}
                <span className="text-[#0B3A6E]">{categoryName}?</span>
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-md">
                {subcopy}
              </p>
            </div>
            <ProductCards products={products} moreLabel={content.moreLabel} />
          </div>

          <BenefitBar benefits={content.benefits} />
        </div>

        <form
          className="relative px-7 pt-2 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            handlePrimary();
          }}
        >
          <div className="flex flex-row gap-3 items-stretch max-w-2xl mx-auto">
            <div className="flex flex-1 min-w-0 rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-[#0B3A6E] focus-within:shadow-[0_0_0_2px_rgba(11,58,110,0.15)]">
              <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-700 border-r border-gray-200 select-none flex items-center gap-1 flex-shrink-0">
                +91
                <span className="text-[10px] text-gray-400" aria-hidden="true">
                  ▾
                </span>
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                  if (error) setError("");
                }}
                className="flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                aria-label="Mobile number"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
              className="w-[240px] flex-shrink-0 rounded-lg bg-[#0B3A6E] hover:bg-[#092f59] active:bg-[#071f3d] disabled:opacity-60 text-white font-bold text-[13px] tracking-wide uppercase min-h-[44px] px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3A6E] focus-visible:ring-offset-2"
            >
              {submitting ? "Saving…" : /→$/.test(primaryCta) ? primaryCta : `${primaryCta} →`}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-center text-xs text-red-600 font-medium">
              {error}
            </p>
          ) : null}

          {whatsappEnabled ? (
            <div className="mt-3 text-center">
              <a
                href={
                  whatsappHref ||
                  `https://wa.me/919842344323?text=${encodeURIComponent(
                    content.whatsappText || "Hi, I need help from BEA."
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onWhatsAppClick?.()}
                className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#128C7E] hover:underline"
              >
                Or <WhatsAppIcon /> {content.secondaryCta || "Chat with us on WhatsApp"}
              </a>
            </div>
          ) : null}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-gray-500">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" aria-hidden="true">
              <path
                d="M12 3 4.5 6v5.5c0 4.6 3.1 8.7 7.5 9.5 4.4-.8 7.5-4.9 7.5-9.5V6L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            No spam. Our expert will contact you only regarding your enquiry.
          </p>
        </form>
      </div>
    );

  return (
    <PopupShell
      open={open}
      onClose={onClose}
      title={content.headline || `Comparing ${categoryName}?`}
      variant={mode === "support" ? "support" : "comparison"}
      template={content.template || "default"}
    >
      {body}
    </PopupShell>
  );
}
