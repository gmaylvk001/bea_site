"use client";

import { useEffect, useState } from "react";
import PopupShell from "./PopupShell";
import {
  HelpSelectionScreen,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

const BEA_LOGO = "/uploads/beaHqlogo.png";
const GOLD = "#D4A04C";
const GOLD_HOVER = "#C4923F";

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
        <path
          d="M6 8V7a4 4 0 0 1 8 0v1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 13.2v.2M9.5 15.2h.2M14.3 15.2h.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Exchange Bonus",
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
    label: "Expert Installation",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M3.6 19c.7-3 2.8-4.7 5.4-4.7 1.4 0 2.6.5 3.6 1.3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="17.2" cy="15.2" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M17.2 13.8v2.8M15.8 15.2h2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Priority Support",
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

function specTags(product = {}, name = "") {
  const hay = `${name} ${product.modelNumber || ""} ${product.categoryName || ""}`.toUpperCase();
  const tags = [];
  const push = (t) => {
    if (t && !tags.includes(t) && tags.length < 3) tags.push(t);
  };
  if (/\bOLED\b/.test(hay)) push("OLED");
  if (/\bQLED\b/.test(hay)) push("QLED");
  if (/\b4K\b|\bUHD\b/.test(hay)) push("4K");
  if (/\bXR\b/.test(hay)) push("XR");
  if (/\bFHD\b|FULL HD/.test(hay)) push("FHD");
  if (/\bINVERTER\b/.test(hay)) push("INVERTER");
  const litres = hay.match(/\b(\d{2,4})\s?L\b/);
  if (litres) push(`${litres[1]}L`);
  const inches = hay.match(/\b(\d{2,3})\s?(?:INCH|")\b/);
  if (inches) push(`${inches[1]}"`);
  return tags;
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
          <span className="flex items-center justify-center" style={{ color: GOLD }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-medium text-white/90 leading-tight px-0.5">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PremiumIntentPopup({
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
    p.name ||
    "this premium product";
  const subcopy =
    content.subcopy ||
    "Get the best available price, exclusive bank offers, exchange bonus & expert installation.";
  const expertType = content.expertType || "Appliance Expert";
  const expertShort = expertType.replace(/ Expert$/i, "") || "Appliance";
  const primaryCta =
    content.primaryCta || `TALK TO A ${expertShort.toUpperCase()} EXPERT`;
  const talkLabel = `Talk to our ${expertShort.toLowerCase()} expert now.`;
  const whatsappEnabled = content.whatsappEnabled !== false;
  const tags = specTags(p, productName);

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
      <div className="px-7 py-5">
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
      <div className="relative grid grid-cols-[1.15fr_0.85fr] min-h-full">
        <div
          className="absolute top-3 right-12 z-10 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor" aria-hidden="true">
            <path d="M10 1.8 12.5 7l5.9.5-4.5 3.9 1.4 5.7L10 14.6 4.7 17.1l1.4-5.7L1.6 7.5 7.5 7 10 1.8Z" />
          </svg>
          Premium Expert Help
        </div>

        <div className="px-7 pt-4 pb-4 flex flex-col">
          <img
            src={BEA_LOGO}
            alt="BEA — Bharath Electronics & Appliances"
            className="h-14 w-auto object-contain self-start"
            width={200}
            height={56}
          />

          <h3 className="mt-3 text-[22px] font-semibold text-white leading-tight tracking-tight">
            Experience Every Detail with
          </h3>
          <p
            className="mt-1 text-[24px] font-bold leading-tight tracking-tight"
            style={{ color: GOLD }}
          >
            {productName}
          </p>
          <p className="mt-2 text-[13px] text-white/80 leading-relaxed">{subcopy}</p>

          <FeatureRow benefits={content.benefits} />

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handlePrimary();
            }}
          >
            <p className="text-sm font-semibold text-white mb-2">{talkLabel}</p>
            <div className="flex rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#D4A04C]">
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
              className="mt-2.5 w-full rounded-lg text-white font-bold text-[13px] tracking-wide uppercase min-h-[44px] px-4 transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A04C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090C]"
              style={{ backgroundColor: GOLD }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = GOLD_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = GOLD;
              }}
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

          <p className="mt-auto pt-3 flex items-center gap-1.5 text-[11px] text-white/75">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill={GOLD} aria-hidden="true">
              <path d="M12 2 4.5 5.2v6.3c0 4.9 3.3 9.4 7.5 10.5 4.2-1.1 7.5-5.6 7.5-10.5V5.2L12 2Z" />
              <path
                d="m9.2 12.1 1.8 1.8 3.8-3.9"
                fill="none"
                stroke="#07090C"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            No spam. Our expert will contact you only regarding your enquiry.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-4 pr-6">
          <div className="w-full h-[240px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image || "/no-image.jpg"}
              alt={productName}
              className="max-h-full max-w-full object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              loading="lazy"
              decoding="async"
            />
          </div>
          {tags.length ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide"
                  style={{ borderColor: GOLD, color: GOLD }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );

  return (
    <PopupShell
      open={open}
      onClose={onClose}
      title={content.headline || `Experience Every Detail with ${productName}`}
      variant={mode === "support" ? "support" : "premium"}
      template={content.template || "premium"}
    >
      {body}
    </PopupShell>
  );
}
