"use client";

import { useState } from "react";
import {
  HelpSelectionScreen,
  LeadCaptureFields,
  PrimaryCtaButton,
  SupportCtaBlock,
} from "@/components/smartLead/LeadCaptureForm";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/smartLead";

/**
 * Shared lead-capture / support / help steps for all four popup types.
 * mode: 'capture' | 'support'
 * UI only — submission still uses existing Part 3 handlers.
 */
export default function IntentPopupBody({
  mode = "capture",
  content,
  primaryCta,
  primaryClassName = "",
  onSubmitLead,
  onHelpSubmit,
  onHelpSkip,
  onSupportChat,
  onWhatsAppClick,
  secondarySlot = null,
  whatsappHref,
}) {
  const [step, setStep] = useState("form");
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState(null);

  const handlePrimary = async () => {
    if (mode === "support") {
      onSupportChat?.();
      return;
    }
    const normalized = normalizeIndianMobile(mobile);
    if (!isValidIndianMobile(normalized)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await onSubmitLead?.({
        mobile: normalized,
        name: name.trim(),
      });
      if (result?.ok === false) {
        setError(result.error || "Could not save. Please try again.");
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

  if (mode === "support") {
    return (
      <SupportCtaBlock
        whatsappText={content?.whatsappText}
        whatsappHref={whatsappHref}
        onChat={onSupportChat}
        onWhatsAppClick={onWhatsAppClick}
        whatsappEnabled={content?.whatsappEnabled !== false}
      />
    );
  }

  if (step === "help") {
    return (
      <HelpSelectionScreen
        submitting={submitting}
        whatsappText={content?.whatsappText}
        whatsappHref={whatsappHref}
        onWhatsAppClick={onWhatsAppClick}
        whatsappEnabled={content?.whatsappEnabled !== false}
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
    );
  }

  return (
    <div className="smart-lead-capture">
      <LeadCaptureFields
        mobile={mobile}
        setMobile={setMobile}
        name={name}
        setName={setName}
        error={error}
      />
      <PrimaryCtaButton
        busy={submitting}
        onClick={handlePrimary}
        className={primaryClassName}
      >
        {primaryCta}
      </PrimaryCtaButton>
      {secondarySlot}
    </div>
  );
}
