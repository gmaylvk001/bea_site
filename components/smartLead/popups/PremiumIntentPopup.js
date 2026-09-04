"use client";

import { useEffect, useState } from "react";
import PopupShell from "./PopupShell";
import {
  HelpSelectionScreen,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

const BEA_LOGO = "/uploads/beaHqlogo.png";
const GOLD = "#D4AF37";
const GOLD_SOFT = "#E8C56A";
const GOLD_HOVER = "#C49A2E";

const FEATURE_ICONS = [
  {
    label: "Best Price Guaranteed",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M20.59 13.41 13.42 6.24A2 2 0 0 0 12 5.66H5a1 1 0 0 0-1 1v7c0 .53.21 1.04.59 1.41l7.17 7.17a2 2 0 0 0 2.83 0l6-6a2 2 0 0 0 0-2.83Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="9.5" r="1.25" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Bank Offers & EMI",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Exchange Bonus",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M16 3h5v5M8 21H3v-5M21 8A9 9 0 0 0 7.5 4.5L3 8M3 16a9 9 0 0 0 13.5 3.5L21 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Expert Installation",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path
          d="M4.5 15.2v-2.2a7.5 7.5 0 0 1 15 0v2.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <rect x="3.2" y="13.2" width="3.8" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
        <rect x="17" y="13.2" width="3.8" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 21.2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function FeatureRow() {
  return (
    <ul className="mt-3.5 grid grid-cols-4 gap-2" aria-label="Benefits">
      {FEATURE_ICONS.map((item) => (
        <li
          key={item.label}
          className="flex flex-col items-center text-center gap-1.5 rounded-lg px-1 py-2.5"
          style={{ border: `1px solid ${GOLD}` }}
        >
          <span className="flex items-center justify-center" style={{ color: GOLD }}>
            {item.icon}
          </span>
          <span className="text-[11px] font-semibold leading-tight px-0.5" style={{ color: GOLD }}>
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
      <div className="relative grid grid-cols-[1.2fr_0.8fr] items-stretch">
        <div
          className="absolute top-3 right-11 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{ border: `1px solid ${GOLD}`, color: GOLD }}
        >
          <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor" aria-hidden="true">
            <path d="M2.2 7.2 6.1 9.4 10 3.2l3.9 6.2 3.9-2.2-.9 8.4H3.1L2.2 7.2Z" />
          </svg>
          Premium Expert Help
        </div>

        <div className="px-5 pt-3.5 pb-3.5 flex flex-col min-w-0">
          <img
            src={BEA_LOGO}
            alt="BEA — Bharath Electronics & Appliances"
            className="h-11 w-auto object-contain self-start"
            width={176}
            height={44}
          />

          <h3
            className="mt-3 text-[22px] font-bold leading-[1.2] tracking-tight"
            style={{
              backgroundImage: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_SOFT} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Experience Perfection.
            <br />
            Bring Home the Best.
          </h3>
          <p className="mt-2.5 text-[15px] text-white/95 leading-snug">
            Considering the <span className="text-[18px] font-bold text-white">{productName}</span>?
          </p>
          <p className="mt-1.5 text-[15px] font-medium text-white/90 leading-snug">{subcopy}</p>

          <FeatureRow />

          <form
            className="mt-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              handlePrimary();
            }}
          >
            <p className="text-[13px] font-medium text-white mb-2">{talkLabel}</p>
            <div className="flex gap-2 items-stretch">
              <div className="flex flex-1 min-w-0 rounded-lg bg-white overflow-hidden">
                <span className="px-2.5 py-2.5 bg-white text-[13px] text-gray-700 border-r border-gray-200 select-none flex items-center gap-1 flex-shrink-0">
                  +91
                  <span className="text-[9px] text-gray-400" aria-hidden="true">
                    ▾
                  </span>
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="Enter Mobile Number"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                    if (error) setError("");
                  }}
                  className="flex-1 min-w-0 px-2.5 py-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
                  aria-label="Mobile number"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting ? "true" : "false"}
                className="w-[168px] flex-shrink-0 rounded-lg text-white font-bold text-[11px] tracking-[0.04em] uppercase min-h-[42px] px-2 transition-opacity disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_SOFT} 55%, ${GOLD_HOVER} 100%)`,
                }}
              >
                {submitting ? "Saving…" : String(primaryCta).replace(/\s*→\s*$/, "")}
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-2 text-xs text-red-300 font-medium">
                {error}
              </p>
            ) : null}
          </form>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/80">
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

        <div className="flex items-center justify-center pr-4 py-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image || "/no-image.jpg"}
            alt={productName}
            className="max-h-[280px] w-full object-contain object-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
            loading="lazy"
            decoding="async"
          />
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
