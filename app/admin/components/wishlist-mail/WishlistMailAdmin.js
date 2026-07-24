"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function WishlistMailAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState({
    enabled: true,
    maxMailsPerUser: 2,
    mailCooldownDays: 15,
    cronTime: "12:00",
    cronDays: [0, 1, 2, 3, 4, 5, 6],
    lastRunAt: null,
    lastRunStats: {},
    adminDigestEmail: "",
  });
  const [stats, setStats] = useState({
    totalMails: 0,
    uniqueUsers: 0,
    uniqueProducts: 0,
    flaggedProducts: 0,
  });
  const [logs, setLogs] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wishlist-mail");
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({ ...prev, ...data.config }));
        setStats(data.stats || {});
        setLogs(data.logs || []);
      } else {
        setMessage(data.error || "Failed to load");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDay = (day) => {
    setConfig((prev) => {
      const days = prev.cronDays.includes(day)
        ? prev.cronDays.filter((d) => d !== day)
        : [...prev.cronDays, day].sort();
      return { ...prev, cronDays: days };
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/wishlist-mail", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settings saved successfully");
        await loadData();
      } else {
        setMessage(data.error || "Save failed");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    const ok = window.confirm(
      "Run now will send wishlist reminder mails to up to 10 users (from the database).\n\nContinue?",
    );
    if (!ok) return;

    setRunning(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/wishlist-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          force: true,
          ignoreLimits: true,
          maxForceSends: 10,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const r = data.result || {};
        const failed = (r.details || []).filter((d) => d.error);
        const s = r.stats || {};
        setMessage(
          r.skipped
            ? `Skipped: ${r.reason}`
            : `Run complete — sent ${r.sent || 0} mail(s) (max 10 per click).` +
                (failed.length
                  ? ` Failed: ${failed
                      .slice(0, 3)
                      .map((f) => `${f.userEmail}: ${f.error}`)
                      .join("; ")}`
                  : "")
        );
        await loadData();
      } else {
        setMessage(data.error || "Run failed");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setRunning(false);
    }
  };

  const sendTestMail = async () => {
    const email = String(testEmail || "").trim();
    if (!email) {
      setMessage("Enter an email for the test send");
      return;
    }
    setTesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/wishlist-mail/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: "Test Customer",
          productName: "Sample Wishlist Product",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Test mail sent to ${email}. Params: ${JSON.stringify(
            data.customerParams || data.params || [],
          )}`
        );
      } else {
        setMessage(
          data.error ||
            `Test failed: ${JSON.stringify(data.customerResult?.data || data)}`
        );
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading wishlist mail settings…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Wishlist Mail Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            When a user adds a product to wishlist, reminder emails are sent to
            that user using the max mail count, send time, and days-between
            settings below. When every user for a product has hit the limit,
            mail sending stops for that product.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@email.com"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56"
          />
          <button
            type="button"
            onClick={sendTestMail}
            disabled={testing}
            className="inline-flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 disabled:opacity-60"
          >
            <Icon icon="mdi:email-fast-outline" width={18} />
            {testing ? "Sending…" : "Send test"}
          </button>
          <button
            type="button"
            onClick={runNow}
            disabled={running}
            className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-60"
          >
            <Icon icon="mdi:play" width={18} />
            {running ? "Running…" : "Run now"}
          </button>
          <span className="text-xs text-gray-500 max-w-[140px] leading-snug">
            Sends up to 10 users per click
          </span>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Mails sent", value: stats.totalMails, icon: "mdi:email-outline" },
          { label: "Users notified", value: stats.uniqueUsers, icon: "mdi:account-group-outline" },
          { label: "Products in logs", value: stats.uniqueProducts, icon: "mdi:package-variant" },
          { label: "Currently sending", value: stats.flaggedProducts, icon: "mdi:email-fast-outline" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Icon icon={card.icon} width={18} />
              {card.label}
            </div>
            <div className="text-2xl font-semibold mt-2 text-gray-900">
              {card.value ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={!!config.enabled}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, enabled: e.target.checked }))
            }
          />
          Enable scheduled cron
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Max mails per user / product
            </label>
            <input
              type="number"
              min={1}
              value={config.maxMailsPerUser}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  maxMailsPerUser: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Days between mails
            </label>
            <input
              type="number"
              min={0}
              value={config.mailCooldownDays}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  mailCooldownDays: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Cron time (HH:mm)
            </label>
            <input
              type="time"
              value={config.cronTime || "12:00"}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, cronTime: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Cron days</label>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => {
              const active = (config.cronDays || []).includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${
                    active
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Last run: <strong>{formatDate(config.lastRunAt)}</strong>
          {config.lastRunStats?.sent != null && (
            <> — sent {config.lastRunStats.sent} mail(s)</>
          )}
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent wishlist mails
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Mail #</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No mails sent yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="py-2 pr-3">{log.userName || "—"}</td>
                    <td className="py-2 pr-3">{log.userEmail}</td>
                    <td className="py-2 pr-3">{log.productName}</td>
                    <td className="py-2 pr-3">{log.mailNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
