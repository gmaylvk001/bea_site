"use client";

import { useParams } from "next/navigation";
import SmartLeadDetail from "@/app/admin/components/smart-leads/SmartLeadDetail";

export default function SmartLeadDetailPage() {
  const params = useParams();
  return <SmartLeadDetail leadId={params?.id} />;
}
