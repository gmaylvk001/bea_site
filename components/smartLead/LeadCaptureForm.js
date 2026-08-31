"use client";

import { useState } from "react";
import { HELP_OPTIONS } from "@/lib/smartLead";

const WHATSAPP_BASE = "https://wa.me/919842344323";

const fieldWrap =
  "flex rounded-xl border border-gray-300 overflow-hidden bg-white focus-within:border-customBlue focus-within:shadow-[0_0_0_2px_rgba(1,90,170,0.18)]";
const inputCls =
  "flex-1 min-w-0 px-3 py-2.5 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-400";
const labelCls = "block text-xs font-semibold text-gray-700 mb-1";

/** Capture form: mobile (required) + name (optional). */
export function LeadCaptureFields({
  mobile,
  setMobile,
  name,
  setName,
  error,
  idPrefix = "smart-lead",
}) {
  const mobileId = `${idPrefix}-mobile`;
  const nameId = `${idPrefix}-name`;
  const errorId = `${idPrefix}-error`;

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label htmlFor={mobileId} className={labelCls}>
          Mobile Number <span className="text-red-500" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <div className={fieldWrap}>
          <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-600 border-r border-gray-200 select-none">
            +91
          </span>
          <input
            id={mobileId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onFocus={(e) => {
              // Keep field visible above mobile keyboard
              try {
                e.target.scrollIntoView({ block: "center", behavior: "smooth" });
              } catch {
                // ignore
              }
            }}
            className={inputCls}
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
      </div>
      <div>
        <label htmlFor={nameId} className={labelCls}>
          Name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-customBlue focus:shadow-[0_0_0_2px_rgba(1,90,170,0.18)] ${inputCls}`}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryCtaButton({
  children,
  disabled,
  onClick,
  className = "",
  busy = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      aria-busy={busy ? "true" : "false"}
      className={`mt-4 w-full rounded-xl bg-customBlue hover:bg-[#014a8f] active:bg-[#013d78] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm min-h-[46px] py-3 px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue focus-visible:ring-offset-2 ${className}`}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
            aria-hidden="true"
          />
          Saving…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function SupportCtaBlock({
  whatsappText,
  whatsappHref,
  onChat,
  onWhatsAppClick,
  whatsappEnabled = true,
  showLogo = true,
}) {
  const logo = showLogo ? (
    <div className="mb-3 flex justify-start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/user/bea-new.png"
        alt="BEA — Bharath Electronics & Appliances"
        className="h-8 sm:h-9 w-auto object-contain"
        width={110}
        height={36}
      />
    </div>
  ) : null;

  if (!whatsappEnabled) {
    return (
      <div>
        {logo}
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3.5">
          <p className="text-sm font-semibold text-gray-900">Need help with this product?</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            We already have your number — our team will assist you.
          </p>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={onChat}
              className="inline-flex w-auto min-w-[160px] max-w-[220px] items-center justify-center rounded-xl bg-customBlue hover:bg-[#014a8f] text-white font-semibold text-sm min-h-[44px] px-5 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue focus-visible:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  const href =
    whatsappHref ||
    `${WHATSAPP_BASE}?text=${encodeURIComponent(whatsappText || "Hi, I need help from BEA.")}`;
  return (
    <div>
      {logo}
      <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-3.5">
        <p className="text-sm font-semibold text-gray-900">Need help with this product?</p>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
          We already have your number — chat with BEA anytime.
        </p>
        <div className="mt-3 flex justify-center">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onWhatsAppClick?.();
              onChat?.();
            }}
            className="inline-flex w-auto min-w-[200px] max-w-[250px] items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold text-sm min-h-[44px] px-5 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          >
            Chat with BEA
          </a>
        </div>
      </div>
    </div>
  );
}

export function HelpSelectionScreen({
  onSubmit,
  onSkip,
  submitting,
  whatsappText,
  whatsappHref,
  onWhatsAppClick,
  whatsappEnabled = true,
}) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const options = whatsappEnabled
    ? HELP_OPTIONS
    : HELP_OPTIONS.filter((o) => o.id !== "whatsapp_me");
  const wantsWhatsApp = whatsappEnabled && selected.includes("whatsapp_me");

  return (
    <div className="pt-1">
      <h3 className="text-base font-bold text-gray-900">How can we help you?</h3>
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Optional — pick any that apply, or skip.
      </p>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Help options">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt.id)}
              className={`text-left text-xs sm:text-sm rounded-xl border px-3 py-2.5 min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-customBlue ${
                active
                  ? "border-customBlue bg-blue-50 text-[#014a8f] font-semibold"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <PrimaryCtaButton
        busy={submitting}
        onClick={() =>
          onSubmit?.({ helpOptions: selected, whatsappRequested: wantsWhatsApp })
        }
      >
        Continue
      </PrimaryCtaButton>
      {wantsWhatsApp ? (
        <a
          href={
            whatsappHref ||
            `${WHATSAPP_BASE}?text=${encodeURIComponent(
              whatsappText || "Hi, please help me on WhatsApp."
            )}`
          }
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onWhatsAppClick?.()}
          className="mt-2 w-full inline-flex items-center justify-center rounded-xl border border-[#25D366] text-[#128C7E] font-semibold text-sm min-h-[44px] py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
        >
          Get Offer on WhatsApp
        </a>
      ) : null}
      <button
        type="button"
        onClick={onSkip}
        className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700 py-2.5 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-lg"
      >
        Skip for now
      </button>
    </div>
  );
}
