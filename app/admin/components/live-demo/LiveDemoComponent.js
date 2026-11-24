"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DateRangePicker from "@/components/DateRangePicker";
import * as XLSX from "xlsx";

export default function LiveDemoComponent() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState({ startDate: null, endDate: null });
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 15;

  // Alerts
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  // Modals & Active items
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Edit fields in modal
  const [modalStatus, setModalStatus] = useState("new");
  const [modalNotes, setModalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, dateFilter]);

  const showAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 4000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);
      if (dateFilter.startDate) params.append("startDate", dateFilter.startDate);
      if (dateFilter.endDate) params.append("endDate", dateFilter.endDate);

      const res = await fetch(`/api/live-demo/admin?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
        if (data.counts) setCounts(data.counts);
      } else {
        showAlert(data.message || "Failed to fetch live demo leads", "error");
      }
    } catch (err) {
      console.error("Error loading live demo leads:", err);
      showAlert("Error loading leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/live-demo/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) =>
          prev.map((lead) => (lead._id === id ? { ...lead, status: newStatus } : lead))
        );
        if (selectedLead && selectedLead._id === id) {
          setSelectedLead((prev) => ({ ...prev, status: newStatus }));
          setModalStatus(newStatus);
        }
        showAlert(`Status updated to "${newStatus}"`, "success");
        fetchLeads(); // refresh counts
      } else {
        showAlert(result.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      showAlert("Error updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveModalData = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/live-demo/admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedLead._id,
          status: modalStatus,
          notes: modalNotes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead._id === selectedLead._id
              ? { ...lead, status: modalStatus, notes: modalNotes }
              : lead
          )
        );
        setSelectedLead((prev) => ({
          ...prev,
          status: modalStatus,
          notes: modalNotes,
        }));
        showAlert("Lead updated successfully", "success");
        fetchLeads();
      } else {
        showAlert(result.message || "Failed to update lead", "error");
      }
    } catch (err) {
      console.error("Error saving lead details:", err);
      showAlert("Error saving lead details", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      const res = await fetch(`/api/live-demo/admin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadToDelete }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.filter((lead) => lead._id !== leadToDelete));
        showAlert("Lead deleted successfully", "success");
        if (selectedLead && selectedLead._id === leadToDelete) {
          setShowDetailModal(false);
          setSelectedLead(null);
        }
        fetchLeads();
      } else {
        showAlert(result.message || "Failed to delete lead", "error");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
      showAlert("Error deleting lead", "error");
    } finally {
      setShowDeleteModal(false);
      setLeadToDelete(null);
    }
  };

  const openDetailModal = (lead) => {
    setSelectedLead(lead);
    setModalStatus(lead.status || "new");
    setModalNotes(lead.notes || "");
    setShowDetailModal(true);
  };

  // Client-side search filtering
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (lead.fullName && lead.fullName.toLowerCase().includes(q)) ||
      (lead.mobile && lead.mobile.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.category && lead.category.toLowerCase().includes(q)) ||
      (lead.requirement && lead.requirement.toLowerCase().includes(q)) ||
      (lead.connectMethod && lead.connectMethod.toLowerCase().includes(q)) ||
      (lead.additionalInfo && lead.additionalInfo.toLowerCase().includes(q))
    );
  });

  // Pagination
  const indexOfLast = currentPage * leadsPerPage;
  const indexOfFirst = indexOfLast - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const exportToExcel = () => {
    const dataForExport = filteredLeads.map((item, index) => ({
      "S.No": index + 1,
      "Request Date": item.createdAt
        ? new Date(item.createdAt).toLocaleDateString()
        : "",
      "Request Time": item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString()
        : "",
      "Customer Name": item.fullName || "",
      "Mobile Number": item.mobile || "",
      "Email Address": item.email || "",
      Category: item.category || "",
      Requirement: item.requirement || "",
      "Preferred Date": item.preferredDate || "",
      "Preferred Time Slot": item.preferredTime || "",
      "Connect Method": item.connectMethod || "",
      "Additional Info": item.additionalInfo || "",
      Status: (item.status || "new").toUpperCase(),
      "Admin Notes": item.notes || "",
      "IP Address": item.ipAddress || "-",
      "Email Sent": item.emailSent ? "Yes" : "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Live Demo Requests");
    XLSX.writeFile(
      workbook,
      `Live_Demo_Requests_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || "new").toLowerCase();
    switch (s) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConnectBadge = (method) => {
    const m = (method || "").toLowerCase();
    if (m.includes("whatsapp")) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "mdi:whatsapp",
      };
    }
    if (m.includes("meet")) {
      return {
        bg: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "mdi:video",
      };
    }
    return {
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: "mdi:video-vintage",
    };
  };

  const getCleanMobile = (mobile) => String(mobile || "").replace(/\D/g, "");

  const getWhatsAppLink = (lead) => {
    const phone = getCleanMobile(lead.mobile);
    const text = `Hi ${lead.fullName || "there"}, regarding your BEA Live Video Demo request for ${
      lead.category || "products"
    } scheduled on ${lead.preferredDate} (${lead.preferredTime}). How can we assist you?`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="container mx-auto py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm">
              <Icon icon="mdi:video-outline" className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Live Video Call Demo Leads
              </h1>
              <p className="text-sm text-gray-500">
                Manage 1-on-1 customer video demo booking requests and schedules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            title="Refresh Leads"
          >
            <Icon
              icon="mdi:refresh"
              className={`text-lg ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToExcel}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Icon icon="mdi:file-excel-box" className="text-lg" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-4 mb-6 rounded-lg border text-sm flex items-center justify-between ${
            alertType === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={
                alertType === "success"
                  ? "mdi:check-circle-outline"
                  : "mdi:alert-circle-outline"
              }
              className="text-lg"
            />
            <span>{alertMessage}</span>
          </div>
          <button
            onClick={() => setAlertMessage("")}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Requests
            </p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{counts.total}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Icon icon="mdi:video-vintage" className="text-2xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              New Leads
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{counts.new}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Icon icon="mdi:bell-ring-outline" className="text-2xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">
              Scheduled
            </p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {(counts.scheduled || 0) + (counts.contacted || 0)}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Icon icon="mdi:calendar-clock" className="text-2xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {counts.completed}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Icon icon="mdi:check-circle-outline" className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {["All", "new", "contacted", "scheduled", "completed", "cancelled"].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st}
                  {st === "All" && ` (${counts.total})`}
                  {st === "new" && ` (${counts.new})`}
                  {st === "scheduled" && ` (${counts.scheduled})`}
                  {st === "completed" && ` (${counts.completed})`}
                </button>
              )
            )}
          </div>

          {/* Search & Date Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              />
              <input
                type="text"
                placeholder="Search name, phone, category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="mdi:close-circle" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto">
              <DateRangePicker
                onDateChange={(range) => {
                  setDateFilter(range);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Preferred Slot</th>
                <th className="py-3.5 px-4">Connect Via</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Requested On</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin text-3xl mx-auto mb-2 text-blue-500"
                    />
                    <p>Loading live demo leads...</p>
                  </td>
                </tr>
              ) : currentLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Icon
                      icon="mdi:video-off-outline"
                      className="text-4xl mx-auto mb-2 text-gray-300"
                    />
                    <p className="font-medium text-gray-600">No demo requests found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try resetting your filters or search keyword
                    </p>
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead, idx) => {
                  const connectBadge = getConnectBadge(lead.connectMethod);
                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-blue-50/40 transition duration-150"
                    >
                      {/* S.No */}
                      <td className="py-3 px-4 text-center text-xs font-medium text-gray-400">
                        {indexOfFirst + idx + 1}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">
                          {lead.fullName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${getCleanMobile(lead.mobile)}`}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Icon icon="mdi:phone" className="text-xs" />
                            {lead.mobile}
                          </a>
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Chat on WhatsApp"
                          >
                            <Icon icon="mdi:whatsapp" className="text-sm" />
                          </a>
                        </div>
                        {lead.email && (
                          <div className="text-xs text-gray-400 truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {lead.category || "General"}
                        </span>
                        {lead.requirement && (
                          <p
                            className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]"
                            title={lead.requirement}
                          >
                            {lead.requirement}
                          </p>
                        )}
                      </td>

                      {/* Preferred Schedule */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 text-xs flex items-center gap-1.5">
                          <Icon
                            icon="mdi:calendar-outline"
                            className="text-blue-500 text-sm"
                          />
                          <span>{lead.preferredDate}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <Icon
                            icon="mdi:clock-time-four-outline"
                            className="text-gray-400 text-xs"
                          />
                          <span>{lead.preferredTime}</span>
                        </div>
                      </td>

                      {/* Connect Via */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${connectBadge.bg}`}
                        >
                          <Icon icon={connectBadge.icon} />
                          <span>{lead.connectMethod || "Video"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={lead.status || "new"}
                            disabled={updatingId === lead._id}
                            onChange={(e) =>
                              handleStatusChange(lead._id, e.target.value)
                            }
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none appearance-none pr-6 ${getStatusBadge(
                              lead.status
                            )}`}
                          >
                            <option value="new">NEW</option>
                            <option value="contacted">CONTACTED</option>
                            <option value="scheduled">SCHEDULED</option>
                            <option value="completed">COMPLETED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                          <Icon
                            icon="mdi:chevron-down"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs opacity-60"
                          />
                        </div>
                      </td>

                      {/* Requested Date */}
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {lead.createdAt ? (
                          <>
                            <div>
                              {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-gray-400 text-[11px]">
                              {new Date(lead.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openDetailModal(lead)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="View Full Details"
                          >
                            <Icon icon="mdi:eye-outline" className="text-base" />
                          </button>
                          <a
                            href={getWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                            title="Message on WhatsApp"
                          >
                            <Icon icon="mdi:whatsapp" className="text-base" />
                          </a>
                          <a
                            href={`tel:${getCleanMobile(lead.mobile)}`}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                            title="Direct Call"
                          >
                            <Icon icon="mdi:phone-outgoing" className="text-base" />
                          </a>
                          <button
                            onClick={() => {
                              setLeadToDelete(lead._id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                            title="Delete Lead"
                          >
                            <Icon icon="mdi:trash-can-outline" className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-600">
            <div>
              Showing {indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, filteredLeads.length)} of {filteredLeads.length}{" "}
              leads
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2.5 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Icon icon="mdi:video-vintage" className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Live Demo Request Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID: {selectedLead._id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Box */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Customer Name
                  </p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {selectedLead.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Mobile Number
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-base font-bold text-blue-600">
                      {selectedLead.mobile}
                    </p>
                    <a
                      href={getWhatsAppLink(selectedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                      title="WhatsApp"
                    >
                      <Icon icon="mdi:whatsapp" className="text-lg" />
                    </a>
                    <a
                      href={`tel:${getCleanMobile(selectedLead.mobile)}`}
                      className="text-blue-600 hover:text-blue-700"
                      title="Call"
                    >
                      <Icon icon="mdi:phone" className="text-lg" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Email Address
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {selectedLead.email ? (
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selectedLead.email}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Submitted Date & Time
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">
                    {selectedLead.createdAt
                      ? new Date(selectedLead.createdAt).toLocaleString("en-IN")
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Demo Appointment Details */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:calendar-check" className="text-blue-600" />
                  <span>Demo Appointment Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                    <p className="text-[11px] font-semibold text-blue-600 uppercase">
                      Category
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {selectedLead.category || "General"}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                    <p className="text-[11px] font-semibold text-purple-600 uppercase">
                      Preferred Date
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {selectedLead.preferredDate}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                    <p className="text-[11px] font-semibold text-amber-600 uppercase">
                      Time Slot
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {selectedLead.preferredTime}
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    Preferred Connection Mode:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    <Icon icon="mdi:video" />
                    {selectedLead.connectMethod || "WhatsApp Video"}
                  </span>
                </div>
              </div>

              {/* Requirement & Additional Info */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                    Specific Requirement / Model:
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800">
                    {selectedLead.requirement || (
                      <span className="text-gray-400 italic">
                        No specific model mentioned
                      </span>
                    )}
                  </div>
                </div>

                {selectedLead.additionalInfo && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                      Additional Customer Notes:
                    </p>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800">
                      {selectedLead.additionalInfo}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Admin Notes */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Update Lead Status:
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">NEW</option>
                    <option value="contacted">CONTACTED</option>
                    <option value="scheduled">SCHEDULED</option>
                    <option value="completed">COMPLETED</option>
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase block mb-1">
                    Admin Remarks / Internal Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Add call notes, demo link, executive name, follow-up status..."
                    className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppLink(selectedLead)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Icon icon="mdi:whatsapp" className="text-base" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${getCleanMobile(selectedLead.mobile)}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Icon icon="mdi:phone" className="text-base" />
                  <span>Call</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveModalData}
                  disabled={savingNotes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  <Icon
                    icon={savingNotes ? "mdi:loading" : "mdi:content-save"}
                    className={savingNotes ? "animate-spin" : ""}
                  />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:alert-outline" className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Delete Demo Lead?
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              This action cannot be undone. Are you sure you want to permanently
              remove this demo lead record?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLeadToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
