"use client";

import { useEffect, useState } from "react";
import PopupShell from "./PopupShell";
import {
  HelpSelectionScreen,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

const BEA_LOGO = "/user/bea-new.png";
const ICON_BLUE = "#7EB6FF";
const BTN_BLUE = "#2563EB";

const FEATURE_ICONS = [
  {
    label: "Best Price Guaranteed",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
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
    label: "Bank Offers & EMI",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Exchange Benefit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
        <path
          d="M16 3h5v5M8 21H3v-5M21 8A9 9 0 0 0 7.5 4.5L3 8M3 16a9 9 0 0 0 13.5 3.5L21 16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Genuine Product",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
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
  {
    label: "Expert Support",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
        <path
          d="M4.5 15.5v-2a7.5 7.5 0 0 1 15 0v2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M4.5 15.5A2.2 2.2 0 0 0 6.7 17.7h.6V14H4.5v1.5ZM19.5 15.5V14h-2.8v3.7h.6a2.2 2.2 0 0 0 2.2-2.2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 21v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

function Stars({ value = 0 }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="w-3.5 h-3.5">
          <path
            d="M10 1.8 12.5 7l5.9.5-4.5 3.9 1.4 5.7L10 14.6 4.7 17.1l1.4-5.7L1.6 7.5 7.5 7 10 1.8Z"
            fill={i < n ? "#F5C518" : "rgba(255,255,255,0.25)"}
          />
        </svg>
      ))}
    </span>
  );
}

function FeatureRow({ benefits }) {
  const items =
    Array.isArray(benefits) && benefits.length >= 5
      ? FEATURE_ICONS.map((f, i) => ({ ...f, label: benefits[i] || f.label }))
      : FEATURE_ICONS;

  return (
    <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Benefits">
      {items.slice(0, 5).map((item) => (
        <li key={item.label} className="flex flex-col items-center text-center gap-1.5">
          <span className="flex items-center justify-center" style={{ color: ICON_BLUE }}>
            {item.icon}
          </span>
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-white/90 leading-tight px-0.5">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function LeafPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
      viewBox="0 0 400 500"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="#9CC7FF" strokeWidth="1.2">
        <path d="M320 40c40 30 55 80 30 120-28 8-70-10-90-50 18-40 40-70 60-70Z" />
        <path d="M280 180c50 20 70 70 40 115-32 6-78-18-95-58 12-38 32-62 55-57Z" />
        <path d="M340 300c38 28 48 78 18 112-30 10-72-8-88-48 16-38 40-68 70-64Z" />
        <path d="M250 90c-8 40 6 70 40 78" />
        <path d="M220 230c-6 36 10 68 42 74" />
      </g>
    </svg>
  );
}

export default function ModelIntentPopup({
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

  const p = content.product || {};
  const productName =
    content.productName ||
    [p.brandName, p.name].filter(Boolean).join(" ") ||
    p.name ||
    "this product";
  const subcopy =
    content.subcopy || "Unlock today's best price & exclusive offers for this model.";
  const primaryCta = content.primaryCta || "GET MY BEST PRICE";
  const whatsappEnabled = content.whatsappEnabled !== false;
  const badge =
    [p.modelNumber, p.categoryName].filter(Boolean).join(" · ") ||
    p.name ||
    "";
  const rating = Number(p.rating) || 0;
  const reviewCount = Number(p.reviewCount) || 0;

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

  const productCol = (
    <div className="relative min-h-full flex flex-col items-center justify-end pt-2 pb-4 px-4">
      <LeafPattern />
      {badge ? (
        <div className="absolute top-3 right-3 z-10 max-w-[160px] rounded-md border border-white/70 bg-black/35 backdrop-blur-[2px] px-2 py-1.5 text-[11px] leading-snug text-white text-center">
          {badge}
        </div>
      ) : null}
      <div className="relative z-[1] w-full h-[240px] flex items-end justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image || "/no-image.jpg"}
          alt={productName}
          className="max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="relative z-[1] mt-2 text-center">
        {rating > 0 ? (
          <div className="flex items-center justify-center gap-1.5 text-[12px] text-white">
            <Stars value={rating} />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            {reviewCount > 0 ? (
              <span className="text-white/70">({reviewCount})</span>
            ) : null}
          </div>
        ) : null}
        {p.brandName ? (
          <p className="mt-0.5 text-[11px] sm:text-xs text-white/85">
            {p.brandName} Official Product
          </p>
        ) : null}
      </div>
    </div>
  );

  const body =
    mode === "support" ? (
      <div className="px-5 py-6">
        <div className="rounded-xl bg-white text-gray-900 p-4">
          <SupportCtaBlock
            whatsappText={content.whatsappText}
            whatsappHref={whatsappHref}
            onChat={onSupportChat}
            onWhatsAppClick={onWhatsAppClick}
            whatsappEnabled={whatsappEnabled}
          />
        </div>
      </div>
    ) : step === "help" ? (
      <div className="px-5 sm:px-7 py-5">
        <div className="rounded-xl bg-white text-gray-900 p-4">
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
      </div>
    ) : (
      <div className="grid grid-cols-[1.15fr_0.85fr] min-h-full h-full">
        <div className="px-7 pt-4 pb-4 flex flex-col">
          <img
            src={BEA_LOGO}
            alt="BEA — Bharath Electronics & Appliances"
            className="h-9 w-auto object-contain self-start bg-white rounded-md px-1.5 py-0.5"
            width={120}
            height={36}
          />

          <h3 className="mt-3 text-[24px] font-bold text-white leading-tight tracking-tight">
            Interested in this{" "}
            <span className="text-[#7EB6FF]">{productName}?</span>
          </h3>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">
            {subcopy}
          </p>

          <FeatureRow benefits={content.benefits} />

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handlePrimary();
            }}
          >
            <div className="flex rounded-lg border border-white/20 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#7EB6FF]">
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
              className="mt-3 w-full rounded-lg text-white font-bold text-[13px] sm:text-sm tracking-wide uppercase min-h-[46px] px-4 transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071422] focus-visible:ring-[#7EB6FF]"
              style={{ backgroundColor: BTN_BLUE }}
            >
              {submitting
                ? "Saving…"
                : /→$/.test(primaryCta)
                  ? primaryCta
                  : `${primaryCta} →`}
            </button>

            {error ? (
              <p role="alert" className="mt-2 text-xs text-red-300 font-medium">
                {error}
              </p>
            ) : null}
          </form>

          <p className="mt-auto pt-4 flex items-center gap-1.5 text-[11px] sm:text-xs text-white/70">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#F5C518] flex-shrink-0" fill="currentColor" aria-hidden="true">
              <path d="M12 2 4.5 5.2v6.3c0 4.9 3.3 9.4 7.5 10.5 4.2-1.1 7.5-5.6 7.5-10.5V5.2L12 2Z" />
              <path d="m9.2 12.1 1.8 1.8 3.8-3.9" fill="none" stroke="#071422" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            No spam. Our expert will contact you only regarding your enquiry.
          </p>
        </div>

        {productCol}
      </div>
    );

  return (
    <PopupShell
      open={open}
      onClose={onClose}
      title={content.headline || `Interested in this ${productName}?`}
      variant={mode === "support" ? "support" : "model"}
      template={content.template || "default"}
    >
      {body}
    </PopupShell>
  );
}
