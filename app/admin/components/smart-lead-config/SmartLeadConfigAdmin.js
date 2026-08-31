"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const SCORE_LABELS = [
  ["PRODUCT_PAGE_OPENED", "Product Page Opened"],
  ["PRODUCT_PAGE_30S", "30 seconds on Product Page"],
  ["SECOND_PRODUCT_SAME_CATEGORY", "Second Product Same Category"],
  ["THIRD_PRODUCT_SAME_CATEGORY", "Third Product Same Category"],
  ["REVISITED_PRODUCT", "Returned to Previously Viewed Product"],
  ["PREMIUM_SKU", "Premium SKU"],
  ["TOTAL_TIME_2MIN", "2+ Minutes Total Website Time"],
  ["RETURNING_VISITOR", "Returning Website Visitor"],
];

const POPUP_TYPES = ["CATEGORY", "MODEL", "COMPARISON", "PREMIUM"];

function Section({ title, children, desc }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
        {desc ? <p className="text-xs text-gray-500 mt-1">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600 block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

export default function SmartLeadConfigAdmin() {
  const [config, setConfig] = useState(null);
  const [, setPlaceholders] = useState([]);
  const [templates, setTemplates] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [productDraft, setProductDraft] = useState({
    itemCode: "",
    productId: "",
    name: "",
    enabled: true,
    isPremium: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, catRes] = await Promise.all([
        fetch("/api/admin/smart-lead-config"),
        fetch("/api/categories/active").catch(() => null),
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData.success) {
        setConfig(cfgData.data);
        setPlaceholders(cfgData.placeholders || []);
        setTemplates(cfgData.templates || {});
      }
      if (catRes?.ok) {
        const cats = await catRes.json();
        const list = Array.isArray(cats)
          ? cats
          : cats?.categories || cats?.data || [];
        setCategories(list);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (path, value) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i += 1) {
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/smart-lead-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setMessage("Saved successfully");
      } else {
        setMessage(data.error || "Save failed");
      }
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!window.confirm("Reset all Smart Lead settings to document defaults?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/smart-lead-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setMessage("Reset to defaults");
      } else {
        setMessage(data.error || "Reset failed");
      }
    } catch {
      setMessage("Reset failed");
    } finally {
      setSaving(false);
    }
  };

  const upsertCategory = (cat) => {
    const id = String(cat._id || cat.id || "");
    const slug = String(cat.category_slug || cat.slug || "");
    const name = String(cat.category_name || cat.name || slug);
    setConfig((prev) => {
      const list = [...(prev.categories || [])];
      const idx = list.findIndex(
        (c) => (id && c.categoryId === id) || (slug && c.categorySlug === slug)
      );
      const row = {
        categoryId: id,
        categorySlug: slug,
        categoryName: name,
        enabled: idx >= 0 ? !list[idx].enabled : false,
      };
      if (idx >= 0) list[idx] = { ...list[idx], ...row };
      else list.push(row);
      return { ...prev, categories: list };
    });
  };

  const isCatEnabled = (cat) => {
    const id = String(cat._id || cat.id || "");
    const slug = String(cat.category_slug || cat.slug || "");
    const row = (config?.categories || []).find(
      (c) => (id && c.categoryId === id) || (slug && c.categorySlug === slug)
    );
    if (row) return row.enabled !== false;
    return config?.defaultCategoryEnabled !== false;
  };

  const addProductRule = () => {
    if (!productDraft.itemCode && !productDraft.productId) {
      setMessage("Enter item code or product ID");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      products: [
        ...(prev.products || []).filter(
          (p) =>
            !(
              (productDraft.productId && p.productId === productDraft.productId) ||
              (productDraft.itemCode &&
                p.itemCode?.toLowerCase() === productDraft.itemCode.toLowerCase())
            )
        ),
        { ...productDraft },
      ],
    }));
    setProductDraft({
      itemCode: "",
      productId: "",
      name: "",
      enabled: true,
      isPremium: false,
    });
  };

  if (loading || !config) {
    return <p className="p-6 text-sm text-gray-500">Loading Smart Lead configuration…</p>;
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Smart Lead Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Controls popup behaviour for Parts 1–4 without code changes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Reset defaults
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-blue-700">{message}</p> : null}

      <Section title="General" desc="Master popup system switch">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={config.global.popupEnabled}
            onChange={(e) => update("global.popupEnabled", e.target.checked)}
          />
          Popup System ON
        </label>
        <p className="text-xs text-gray-500">
          When OFF, no Smart Lead popup is shown. Visitor tracking and scoring continue.
        </p>
      </Section>

      <Section title="Trigger Rules">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Category trigger (seconds)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={Math.round((config.triggers.categoryMs || 0) / 1000)}
              onChange={(e) =>
                update("triggers.categoryMs", Math.max(0, Number(e.target.value) || 0) * 1000)
              }
            />
          </Field>
          <Field label="Product trigger (seconds)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={Math.round((config.triggers.productMs || 0) / 1000)}
              onChange={(e) =>
                update("triggers.productMs", Math.max(0, Number(e.target.value) || 0) * 1000)
              }
            />
          </Field>
          <Field label="Premium trigger (seconds)">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={Math.round((config.triggers.premiumMs || 0) / 1000)}
              onChange={(e) =>
                update("triggers.premiumMs", Math.max(0, Number(e.target.value) || 0) * 1000)
              }
            />
          </Field>
          <Field label="Comparison product count">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={config.triggers.comparisonProductCount}
              onChange={(e) =>
                update(
                  "triggers.comparisonProductCount",
                  Math.max(1, Number(e.target.value) || 1)
                )
              }
            />
          </Field>
          <Field label="Min intent score to show popup">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.triggers.minScoreToShow}
              onChange={(e) =>
                update("triggers.minScoreToShow", Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Intent Scoring" desc="Document defaults: +10 / +15 / +10 / +20 / +20 / +20 / +10 / +20">
        <div className="grid sm:grid-cols-2 gap-3">
          {SCORE_LABELS.map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={config.scorePoints[key]}
                onChange={(e) =>
                  update(`scorePoints.${key}`, Math.max(0, Number(e.target.value) || 0))
                }
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section
        title="Intent Thresholds"
        desc="Defaults: 0–29 Browsing · 30–49 Interested · 50–69 Comparison · 70+ Hot"
      >
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Interested min">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.thresholds.interestedMin}
              onChange={(e) =>
                update("thresholds.interestedMin", Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
          <Field label="Comparison min">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.thresholds.comparisonMin}
              onChange={(e) =>
                update("thresholds.comparisonMin", Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
          <Field label="Hot / Premium min">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.thresholds.hotMin}
              onChange={(e) =>
                update("thresholds.hotMin", Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Categories" desc="Toggle popups per category. Unlisted categories follow the default.">
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={config.defaultCategoryEnabled}
            onChange={(e) => update("defaultCategoryEnabled", e.target.checked)}
          />
          Default for unlisted categories: ON
        </label>
        <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y">
          {categories.length === 0 ? (
            <p className="p-3 text-xs text-gray-500">
              No categories loaded. Add rules manually via Products if needed, or ensure
              /api/categories/active works. Saved category overrides still apply.
            </p>
          ) : (
            categories.map((cat) => {
              const name = cat.category_name || cat.name || cat.category_slug;
              const on = isCatEnabled(cat);
              return (
                <button
                  key={cat._id || cat.category_slug}
                  type="button"
                  onClick={() => upsertCategory(cat)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span>{name}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      on ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {on ? "ON" : "OFF"}
                  </span>
                </button>
              );
            })
          )}
        </div>
        {(config.categories || []).length > 0 ? (
          <p className="text-xs text-gray-500">
            {config.categories.length} category override(s) saved.
          </p>
        ) : null}
      </Section>

      <Section
        title="Products / Premium"
        desc="SKU ON/OFF and Premium tagging. Admin premium tag is authoritative when set."
      >
        <div className="grid sm:grid-cols-2 gap-2">
          <Field label="Item / SKU code">
            <input
              className={inputCls}
              value={productDraft.itemCode}
              onChange={(e) =>
                setProductDraft((d) => ({ ...d, itemCode: e.target.value.trim() }))
              }
            />
          </Field>
          <Field label="Product ID (optional)">
            <input
              className={inputCls}
              value={productDraft.productId}
              onChange={(e) =>
                setProductDraft((d) => ({ ...d, productId: e.target.value.trim() }))
              }
            />
          </Field>
          <Field label="Label (optional)">
            <input
              className={inputCls}
              value={productDraft.name}
              onChange={(e) => setProductDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </Field>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productDraft.enabled}
                onChange={(e) =>
                  setProductDraft((d) => ({ ...d, enabled: e.target.checked }))
                }
              />
              Popup ON
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productDraft.isPremium}
                onChange={(e) =>
                  setProductDraft((d) => ({ ...d, isPremium: e.target.checked }))
                }
              />
              Premium
            </label>
            <button
              type="button"
              onClick={addProductRule}
              className="text-sm px-3 py-2 rounded-lg bg-gray-900 text-white"
            >
              Add / Update
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={config.premium.usePriceFallback}
            onChange={(e) => update("premium.usePriceFallback", e.target.checked)}
          />
          Use price fallback for untagged products
        </label>
        {config.premium.usePriceFallback ? (
          <Field label="Price fallback threshold (₹)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={config.premium.priceFallbackThreshold}
              onChange={(e) =>
                update(
                  "premium.priceFallbackThreshold",
                  Math.max(1, Number(e.target.value) || 1)
                )
              }
            />
          </Field>
        ) : null}
        <ul className="mt-2 divide-y border rounded-lg">
          {(config.products || []).map((p, i) => (
            <li
              key={`${p.itemCode}-${p.productId}-${i}`}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{p.name || p.itemCode || p.productId}</p>
                <p className="text-xs text-gray-500">
                  {p.itemCode ? `SKU ${p.itemCode}` : ""}{" "}
                  {p.productId ? `· ID ${p.productId}` : ""} ·{" "}
                  {p.enabled ? "Popup ON" : "Popup OFF"} ·{" "}
                  {p.isPremium ? "Premium" : "Normal"}
                </p>
              </div>
              <button
                type="button"
                className="text-red-600 text-xs"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    products: prev.products.filter((_, idx) => idx !== i),
                  }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {/* Popup Content — commented out of admin UI. Leave content blank to keep Part 2 defaults.
      <Section
        title="Popup Content"
        desc={`Placeholders: ${(placeholders || []).map((p) => p.token).join(" ")} — leave blank to keep Part 2 defaults.`}
      >
        {POPUP_TYPES.map((type) => (
          <div key={type} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700">{type}</p>
            <Field label="Headline">
              <input
                className={inputCls}
                value={config.content[type]?.headline || ""}
                onChange={(e) => update(`content.${type}.headline`, e.target.value)}
                placeholder="Leave empty for default"
              />
            </Field>
            <Field label="Subheading">
              <textarea
                rows={2}
                className={inputCls}
                value={config.content[type]?.subheading || ""}
                onChange={(e) => update(`content.${type}.subheading`, e.target.value)}
              />
            </Field>
            <Field label="CTA wording">
              <input
                className={inputCls}
                value={config.content[type]?.cta || ""}
                onChange={(e) => update(`content.${type}.cta`, e.target.value)}
              />
            </Field>
            <Field label="Benefits (one per line)">
              <textarea
                rows={3}
                className={inputCls}
                value={(config.content[type]?.benefits || []).join("\n")}
                onChange={(e) =>
                  update(
                    `content.${type}.benefits`,
                    e.target.value
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean)
                  )
                }
              />
            </Field>
          </div>
        ))}
      </Section>
      */}

      <Section title="WhatsApp">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={config.whatsapp.enabled}
            onChange={(e) => update("whatsapp.enabled", e.target.checked)}
          />
          WhatsApp ON
        </label>
        <Field label="WhatsApp number (E.164 digits, e.g. 919842344323)">
          <input
            className={inputCls}
            value={config.whatsapp.phone || ""}
            onChange={(e) =>
              update("whatsapp.phone", e.target.value.replace(/\D/g, "").slice(0, 15))
            }
            placeholder="919842344323"
          />
        </Field>
      </Section>

      <Section title="Design / Template">
        <div className="grid sm:grid-cols-2 gap-3">
          {POPUP_TYPES.map((type) => (
            <Field key={type} label={`${type} template`}>
              <select
                className={inputCls}
                value={config.design[type]}
                onChange={(e) => update(`design.${type}`, e.target.value)}
              >
                {Object.entries(templates).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </Section>

      <Section
        title="Frequency / Suppression"
        desc="Default: 1 lead popup/session. Close → suppress for session (no 30s re-show)."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Frequency cap (popups / session)">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={config.frequency.frequencyCap}
              onChange={(e) =>
                update("frequency.frequencyCap", Math.max(1, Number(e.target.value) || 1))
              }
            />
          </Field>
          <Field label="Suppression mode">
            <select
              className={inputCls}
              value={config.frequency.suppressionMode}
              onChange={(e) => update("frequency.suppressionMode", e.target.value)}
            >
              <option value="session">Session (document default)</option>
              <option value="duration">Duration (ms after close)</option>
            </select>
          </Field>
          {config.frequency.suppressionMode === "duration" ? (
            <Field label="Suppression time (minutes)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={Math.round((config.frequency.suppressionMs || 0) / 60000)}
                onChange={(e) =>
                  update(
                    "frequency.suppressionMs",
                    Math.max(0, Number(e.target.value) || 0) * 60000
                  )
                }
              />
            </Field>
          ) : null}
          <Field label="High-intent exception score">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={config.frequency.highIntentExceptionScore}
              onChange={(e) =>
                update(
                  "frequency.highIntentExceptionScore",
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pb-8">
        <button
          type="button"
          onClick={load}
          className="text-sm px-3 py-2 rounded-lg border inline-flex items-center gap-1"
        >
          <Icon icon="mdi:refresh" /> Reload
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save configuration"}
        </button>
      </div>
    </div>
  );
}
