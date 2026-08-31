"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow-up" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
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

export default function SmartLeadsList() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/smart-leads?${params}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
        setMeta(data.meta || { total: 0, page: 1, pages: 1 });
      } else {
        setLeads([]);
        setError(data.error || "Failed to load leads");
      }
    } catch (err) {
      console.error(err);
      setLeads([]);
      setError(err?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Website Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Smart Lead Capture — full visitor context for sales follow-up
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <Icon icon="mdi:refresh" className="text-lg" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="search"
          placeholder="Search mobile, name, brand, model…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-10 text-center">Loading leads…</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-10 text-center">{error}</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">No leads found.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const card = lead.salesCard || {};
            const hot = Number(card.leadScore) >= 70;
            return (
              <button
                key={lead._id}
                type="button"
                onClick={() => router.push(`/admin/smart-leads/${lead._id}`)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${
                        hot ? "text-orange-600" : "text-blue-700"
                      }`}
                    >
                      {hot ? "🔥 " : ""}
                      {card.headline || "WEBSITE LEAD"}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {lead.mobile || card.mobile || "—"}
                    </p>
                    {lead.name ? (
                      <p className="text-sm text-gray-600">{lead.name}</p>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{formatWhen(lead.createdAt)}</p>
                    <p className="mt-1 capitalize rounded-full bg-gray-100 px-2 py-0.5 inline-block">
                      {lead.status || "new"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600">
                  <p>
                    <span className="text-gray-400">Category:</span> {card.category}
                  </p>
                  <p>
                    <span className="text-gray-400">Model:</span> {card.currentModel}
                  </p>
                  <p>
                    <span className="text-gray-400">Viewed:</span>{" "}
                    {card.productsViewedCount} · {card.brandsViewed}
                  </p>
                  <p>
                    <span className="text-gray-400">Score:</span> {card.leadScore} ·{" "}
                    {card.classificationLabel}
                  </p>
                  <p>
                    <span className="text-gray-400">Source:</span> {card.source}
                  </p>
                  <p>
                    <span className="text-gray-400">Time:</span> {card.timeOnSite}
                  </p>
                  <p>
                    <span className="text-gray-400">Popup:</span> {lead.popupType}
                  </p>
                  <p>
                    <span className="text-gray-400">Intent:</span> {card.intent}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {meta.pages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-sm px-3 py-1.5 rounded border disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {meta.page} / {meta.pages} ({meta.total} leads)
          </span>
          <button
            type="button"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm px-3 py-1.5 rounded border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
