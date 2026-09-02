"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

const STATUS_OPTIONS = [
  "new",
  "open",
  "contacted",
  "follow_up",
  "converted",
  "closed",
  "lost",
];

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const PRODUCT_SITE = "https://bharathelectronics.in";

function productPublicUrl(current = {}, lead = {}) {
  const slug = String(current.slug || lead.productSlug || "").trim();
  const raw = String(current.url || "").trim();
  let path = "";
  if (slug) {
    path = `/product/${slug.replace(/^\/+/, "")}`;
  } else if (raw) {
    try {
      const u = new URL(raw, PRODUCT_SITE);
      if (u.pathname.startsWith("/product/")) path = u.pathname;
    } catch {
      if (raw.startsWith("/product/")) path = raw;
    }
  }
  if (!path || path === "/product/") return "";
  return `${PRODUCT_SITE}${path}`;
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="w-36 flex-shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium break-words">{value ?? "—"}</span>
    </div>
  );
}

export default function SmartLeadDetail({ leadId }) {
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    status: "new",
    contacted: false,
    conversion: false,
    followUpDate: "",
    assignedStaff: "",
    invoiceRef: "",
    saleValue: "",
    salesNotes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, usersRes] = await Promise.all([
        fetch(`/api/admin/smart-leads/${leadId}`),
        fetch("/api/users/get"),
      ]);
      const leadData = await leadRes.json();
      const users = await usersRes.json();
      if (leadData.success) {
        const L = leadData.data;
        setLead(L);
        setForm({
          status: L.status || "new",
          contacted: Boolean(L.contacted),
          conversion: Boolean(L.conversion),
          followUpDate: L.followUpDate
            ? new Date(L.followUpDate).toISOString().slice(0, 10)
            : "",
          assignedStaff: L.assignedStaff?._id || "",
          invoiceRef: L.invoiceRef || "",
          saleValue: L.saleValue != null ? String(L.saleValue) : "",
          salesNotes: L.salesNotes || "",
        });
      }
      if (Array.isArray(users)) {
        setStaff(users.filter((u) => u.status !== "inactive"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSales = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/smart-leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          contacted: form.contacted,
          conversion: form.conversion,
          followUpDate: form.followUpDate || null,
          assignedStaff: form.assignedStaff || null,
          invoiceRef: form.invoiceRef,
          saleValue: form.saleValue === "" ? null : Number(form.saleValue),
          salesNotes: form.salesNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
        setMessage("Saved");
      } else {
        setMessage(data.error || "Save failed");
      }
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading lead…</p>;
  }
  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Lead not found.</p>
        <button
          type="button"
          className="mt-3 text-sm text-blue-600"
          onClick={() => router.push("/admin/smart-leads")}
        >
          Back to list
        </button>
      </div>
    );
  }

  const card = lead.salesCard || {};
  const hot = Number(card.leadScore) >= 70;
  const current = lead.currentProduct || {};
  const journey = Array.isArray(lead.visitorJourney) ? lead.visitorJourney : [];
  const productUrl = productPublicUrl(current, lead);
  const productUrlLabel = productUrl.replace(/^https?:\/\//, "");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => router.push("/admin/smart-leads")}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
      >
        <Icon icon="mdi:arrow-left" /> Website Leads
      </button>

      {/* Sales card summary */}
      <div
        className={`rounded-xl border p-5 ${
          hot ? "border-orange-200 bg-orange-50/40" : "border-blue-200 bg-blue-50/40"
        }`}
      >
        <p
          className={`text-xs font-bold uppercase tracking-wide ${
            hot ? "text-orange-700" : "text-blue-700"
          }`}
        >
          {hot ? "🔥 " : ""}
          {card.headline}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          Mobile: {lead.mobile}
        </p>
        {lead.name ? <p className="text-sm text-gray-700">Name: {lead.name}</p> : null}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-700">
          <p>Category: {card.category}</p>
          <p>Current Model: {card.currentModel}</p>
          <p>Products Viewed: {card.productsViewedCount}</p>
          <p>Brands Viewed: {card.brandsViewed}</p>
          <p>Time on Site: {card.timeOnSite}</p>
          <p>Source: {card.source}</p>
          <p>Intent: {card.intent}</p>
          <p>
            Lead Score: {card.leadScore} · {card.classificationLabel}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Lead Summary">
          <Row label="Mobile" value={lead.mobile} />
          <Row label="Name" value={lead.name || "—"} />
          <Row label="Classification" value={lead.classificationLabel} />
          <Row label="Intent Score" value={lead.intentScore} />
          <Row label="Popup Type" value={lead.popupType} />
          <Row label="CTA" value={lead.ctaClicked || "—"} />
          <Row label="WhatsApp" value={lead.whatsappClicked ? "Yes" : "No"} />
          <Row
            label="Help"
            value={(lead.helpOptions || []).join(", ") || "—"}
          />
          <Row label="Date / Time" value={formatWhen(lead.createdAt)} />
          <Row
            label="Visitor"
            value={
              lead.visitorType === "returning"
                ? "Returning"
                : lead.visitorType === "new"
                  ? "New"
                  : "—"
            }
          />
          <Row label="Visitor ID" value={lead.visitorId || "—"} />
          <Row label="TalkTo ID" value={lead.talkToId || "—"} />
          <Row label="Session ID" value={lead.sessionId || "—"} />
        </Section>

        <Section title="Current Interest">
          <Row label="Product" value={current.name || lead.productId || "—"} />
          <Row label="Model" value={current.modelNumber || lead.modelNumber || "—"} />
          <Row label="SKU / Item" value={current.itemCode || lead.itemCode || "—"} />
          <Row label="Brand" value={current.brandName || lead.brandName || "—"} />
          <Row label="Category" value={current.categoryName || lead.categoryName || "—"} />
          <Row
            label="Subcategory"
            value={lead.subcategoryName || current.subcategoryId || "—"}
          />
          <Row
            label="Product URL"
            value={
              productUrl ? (
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {productUrlLabel}
                </a>
              ) : (
                "—"
              )
            }
          />
        </Section>

        <Section title="Behaviour">
          <Row
            label="Products viewed"
            value={
              (lead.productViewSequence || [])
                .map((p) => p.name || p.modelNumber || p.itemCode)
                .filter(Boolean)
                .join(" → ") || "—"
            }
          />
          <Row label="Count" value={lead.productPageViewCount} />
          <Row label="Brands" value={(lead.brandsViewed || []).join(" / ") || "—"} />
          <Row label="Time on site" value={lead.timeOnSiteLabel} />
          <Row label="Time on product" value={lead.timeOnProductLabel} />
          <Row
            label="Visitor type"
            value={lead.visitorType === "returning" ? "Returning" : "New"}
          />
        </Section>

        <Section title="Traffic">
          <Row label="Source" value={lead.trafficSource || "—"} />
          <Row label="Referrer" value={lead.referrer || "—"} />
          <Row label="Campaign" value={lead.campaign || "—"} />
          <Row label="utm_source" value={lead.utm?.source || "—"} />
          <Row label="utm_medium" value={lead.utm?.medium || "—"} />
          <Row label="utm_campaign" value={lead.utm?.campaign || "—"} />
          <Row label="Device" value={lead.device || "—"} />
          <Row label="Browser" value={lead.browser || "—"} />
        </Section>
      </div>

      <Section title="Sales">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Lead Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Assigned Staff</span>
            <select
              value={form.assignedStaff}
              onChange={(e) =>
                setForm((f) => ({ ...f, assignedStaff: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Unassigned</option>
              {staff.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || u.email || u.mobile}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.contacted}
              onChange={(e) =>
                setForm((f) => ({ ...f, contacted: e.target.checked }))
              }
            />
            Contacted
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.conversion}
              onChange={(e) =>
                setForm((f) => ({ ...f, conversion: e.target.checked }))
              }
            />
            Conversion
          </label>
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Follow-up Date</span>
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, followUpDate: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Invoice Ref</span>
            <input
              type="text"
              value={form.invoiceRef}
              onChange={(e) =>
                setForm((f) => ({ ...f, invoiceRef: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 block mb-1">Sale Value</span>
            <input
              type="number"
              value={form.saleValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, saleValue: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-gray-500 block mb-1">Notes</span>
            <textarea
              rows={2}
              value={form.salesNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, salesNotes: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={saveSales}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
          >
            {saving ? "Saving…" : "Save sales fields"}
          </button>
          {message ? <span className="text-sm text-gray-600">{message}</span> : null}
        </div>
      </Section>

      <Section title="Visitor Journey">
        {journey.length === 0 ? (
          <p className="text-sm text-gray-500">No journey events recorded.</p>
        ) : (
          <ol className="space-y-2">
            {journey.map((ev) => (
              <li key={`${ev.order}-${ev.type}-${ev.label}`} className="flex gap-3 text-sm">
                <span className="w-6 h-6 flex-shrink-0 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                  {ev.order}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{ev.label}</p>
                  <p className="text-xs text-gray-400">
                    {ev.type}
                    {ev.at ? ` · ${formatWhen(ev.at)}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
