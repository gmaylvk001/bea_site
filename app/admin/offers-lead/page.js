"use client";

import ContactComponent from "@/app/admin/components/contact/contact";

export default function OffersLeadPage() {
  return (
    <ContactComponent
      dataEndpoint="/api/offers-lead/get"
      pageTitle="Diwali Offers Leads"
      exportName="diwali_offers_leads"
    />
  );
}
