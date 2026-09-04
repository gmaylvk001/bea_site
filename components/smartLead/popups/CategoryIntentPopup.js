"use client";

import { useEffect, useState } from "react";
import PopupShell from "./PopupShell";
import {
  HelpSelectionScreen,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

const BEA_LOGO = "/uploads/beaHqlogo.png";

const FEATURE_ICONS = [
  {
    label: "Best Price",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
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
    label: "Bank Offers",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.7" />
        <path d="M7 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Exchange Benefit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
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
    label: "EMI Options",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 7.5v9M15.2 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.8 0-3 1.1-3 2.5s1.2 2.4 3.2 2.8c1.8.4 2.8 1.1 2.8 2.4s-1.1 2.4-3 2.4c-1.1 0-2.1-.4-2.7-1.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const TRUST_BADGES = [
  {
    label: "100% Genuine Products",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
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
    label: "Secure & Trusted",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
        <path
          d="M12 3 4.5 6v5.5c0 4.6 3.1 8.7 7.5 9.5 4.4-.8 7.5-4.9 7.5-9.5V6L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <rect x="9.2" y="10.2" width="5.6" height="4.6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.4 10.2V9a1.6 1.6 0 0 1 3.2 0v1.2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Expert Guidance",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
        <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M4.5 19c.7-3 2.8-4.7 5.5-4.7 1.4 0 2.7.5 3.7 1.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="17.2" cy="16.2" r="3.1" stroke="currentColor" strokeWidth="1.6" />
        <path d="m19.4 18.6 1.8 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function FeatureRow({ benefits }) {
  // Prefer mockup order; fall back to content benefits labels if admin customized length
  const items =
    Array.isArray(benefits) && benefits.length >= 4
      ? FEATURE_ICONS.map((f, i) => ({ ...f, label: benefits[i] || f.label }))
      : FEATURE_ICONS;

  return (
    <ul className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Benefits">
      {items.slice(0, 4).map((item) => (
        <li key={item.label} className="flex flex-col items-center text-center gap-1">
          <span className="w-8 h-8 rounded-full bg-[#E8F1FB] text-[#0B3A6E] flex items-center justify-center">
            {item.icon}
          </span>
          <span className="text-[11px] font-semibold text-[#1A1A1A] leading-tight px-0.5">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TrustFooter() {
  return (
    <div className="bg-[#F3F5F7] border-t border-gray-100 px-6 py-[9px]">
      <ul className="flex items-center justify-between gap-3">
        {TRUST_BADGES.map((b) => (
          <li
            key={b.label}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 whitespace-nowrap"
          >
            <span className="text-[#0D9488] flex-shrink-0">{b.icon}</span>
            {b.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CategoryIntentPopup({
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
    "Get the best price, exciting bank offers, exchange & EMI options.";
  const primaryCta = content.primaryCta || "GET TODAY'S BEST DEAL";
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
        <div className="mt-1">
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
      <>
        <div className="px-6 pt-3.5">
          <img
            src={BEA_LOGO}
            alt="BEA — Bharath Electronics & Appliances"
            className="h-11 w-auto object-contain self-start"
            width={176}
            height={44}
          />

          <div className="mt-2.5 grid grid-cols-[1fr_1fr] gap-3 items-start">
            <div className="min-w-0">
              <h3 className="font-bold leading-[1.15] tracking-tight">
                <span className="block text-[22px] font-semibold text-[#111827]">Looking for a</span>
                <span className="block text-[34px] font-extrabold text-[#1A4BA0]">{categoryName}?</span>
              </h3>

              <p className="mt-1.5 text-[15px] font-medium text-gray-700 leading-snug max-w-[340px]">
                {subcopy}
              </p>

              <FeatureRow benefits={content.benefits} />
            </div>

            <div className="h-[220px] flex items-end justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.image || "/no-image.jpg"}
                alt={categoryName}
                className="max-h-[220px] w-full object-contain object-bottom"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <form
          className="px-6 pt-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            handlePrimary();
          }}
        >
          <p className="text-left text-[13px] text-gray-600 mb-2.5">
            Enter your mobile number to know today&apos;s best offers from BEA.
          </p>

          <div className="flex flex-row gap-2.5 items-stretch">
            <div className="flex flex-1 min-w-0 rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:border-[#1A4BA0] focus-within:shadow-[0_0_0_2px_rgba(26,75,160,0.15)]">
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
                className="flex-1 min-w-0 px-3 py-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
                aria-label="Mobile number"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
              className="w-[228px] flex-shrink-0 rounded-lg bg-[#001A57] hover:bg-[#00133f] active:bg-[#000d2e] disabled:opacity-60 text-white font-bold text-[12px] tracking-[0.04em] uppercase min-h-[44px] px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001A57] focus-visible:ring-offset-2"
            >
              {submitting ? "Saving…" : primaryCta}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-2 text-center text-xs text-red-600 font-medium">
              {error}
            </p>
          ) : null}
        </form>

        <TrustFooter />
      </>
    );

  return (
    <PopupShell
      open={open}
      onClose={onClose}
      title={content.headline || `Looking for a ${categoryName}?`}
      variant={mode === "support" ? "support" : "category"}
      template={content.template || "default"}
    >
      {body}
    </PopupShell>
  );
}
