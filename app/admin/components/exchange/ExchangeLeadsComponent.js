"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DateRangePicker from "@/components/DateRangePicker";
import * as XLSX from "xlsx";

export default function ExchangeLeadsComponent() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({ total: 0, new: 0, contacted: 0, quoted: 0, converted: 0 });
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
  const [adminNotes, setAdminNotes] = useState("");

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

      const res = await fetch(`/api/exchange-lead?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.data || []);
        if (data.counts) setCounts(data.counts);
      } else {
        showAlert(data.message || "Failed to fetch exchange leads", "error");
      }
    } catch (err) {
      console.error("Error loading exchange leads:", err);
      showAlert("Error loading exchange leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, notesToSave = null) => {
    setUpdatingId(id);
    try {
      const payload = { id, status: newStatus };
      if (notesToSave !== null) payload.admin_notes = notesToSave;

      const res = await fetch(`/api/exchange-lead`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead._id === id
              ? { ...lead, status: newStatus, ...(notesToSave !== null ? { admin_notes: notesToSave } : {}) }
              : lead
          )
        );
        if (selectedLead && selectedLead._id === id) {
          setSelectedLead((prev) => ({
            ...prev,
            status: newStatus,
            ...(notesToSave !== null ? { admin_notes: notesToSave } : {}),
          }));
        }
        showAlert(`Status updated to "${newStatus}"`, "success");
        fetchLeads();
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

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      const res = await fetch(`/api/exchange-lead`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadToDelete }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.filter((lead) => lead._id !== leadToDelete));
        showAlert("Exchange lead deleted successfully", "success");
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

  // Client-side search filtering
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (lead.name && lead.name.toLowerCase().includes(q)) ||
      (lead.mobile_number && lead.mobile_number.toLowerCase().includes(q)) ||
      (lead.location && lead.location.toLowerCase().includes(q)) ||
      (lead.old_brand_model && lead.old_brand_model.toLowerCase().includes(q)) ||
      (lead.product_name && lead.product_name.toLowerCase().includes(q)) ||
      (lead.product_sku && lead.product_sku.toLowerCase().includes(q))
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
      Date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
      Time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : "",
      "Customer Name": item.name || "",
      "Mobile Number": item.mobile_number || "",
      Location: item.location || "",
      "Old Brand & Model": item.old_brand_model || "-",
      "Appliance Age": item.appliance_age || "-",
      Condition: item.working_condition || "-",
      "Target New Product": item.product_name || "",
      "New Product SKU": item.product_sku || "",
      "New Product Price": item.product_price ? `₹${item.product_price}` : "-",
      Status: (item.status || "new").toUpperCase(),
      "Customer Notes": item.remarks || "",
      "Admin Notes": item.admin_notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exchange Leads");
    XLSX.writeFile(
      workbook,
      `Exchange_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || "new").toLowerCase();
    switch (s) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "contacted":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "quoted":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "converted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case "working":
        return { label: "Working", icon: "🟢", color: "text-green-700 bg-green-50 border-green-200" };
      case "working_minor_issues":
        return { label: "Minor Issues", icon: "🟡", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "not_working":
        return { label: "Not Working", icon: "🔴", color: "text-red-700 bg-red-50 border-red-200" };
      default:
        return { label: "Unspecified", icon: "⚪", color: "text-gray-600 bg-gray-50 border-gray-200" };
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Icon icon="mdi:swap-horizontal-bold" className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Exchange Leads</h1>
              <p className="text-sm text-gray-500">
                Customer inquiries for old appliance exchange against new products
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
            <Icon icon="mdi:refresh" className={`text-lg ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between text-white shadow-md ${
            alertType === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon={alertType === "success" ? "mdi:check-circle" : "mdi:alert-circle"}
              className="text-xl"
            />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage("")} className="hover:opacity-80">
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Icon icon="mdi:account-group" className="text-2xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Inquiries</p>
            <h3 className="text-2xl font-bold text-gray-800">{counts.total}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Icon icon="mdi:bell-ring-outline" className="text-2xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">New Leads</p>
            <h3 className="text-2xl font-bold text-amber-600">{counts.new}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Icon icon="mdi:calculator-variant-outline" className="text-2xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Quoted / Contacted</p>
            <h3 className="text-2xl font-bold text-purple-600">
              {counts.quoted + counts.contacted}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Icon icon="mdi:check-decagram-outline" className="text-2xl" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Converted</p>
            <h3 className="text-2xl font-bold text-green-600">{counts.converted}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-5 mb-6">
        
        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-5">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Search Leads
            </label>
            <div className="relative">
              <Icon
                icon="mdi:magnify"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              />
              <input
                type="text"
                placeholder="Name, mobile, city, product..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Statuses ({leads.length})</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Date Range
            </label>
            <DateRangePicker
              onDateChange={({ startDate, endDate }) => {
                setDateFilter({ startDate, endDate });
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Export to Excel */}
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={filteredLeads.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Icon icon="mdi:microsoft-excel" className="text-lg" />
              <span>Export ({filteredLeads.length})</span>
            </button>
          </div>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <Icon icon="mdi:loading" className="text-3xl animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-sm">Loading exchange leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <Icon icon="mdi:swap-horizontal" className="text-4xl text-gray-400 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-gray-700">No exchange leads found</h4>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm || statusFilter !== "All"
                ? "Try adjusting your search query or filters"
                : "Customer exchange requests from product pages will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4 whitespace-nowrap">Date & Time</th>
                    <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                    <th className="py-3 px-4 whitespace-nowrap">Location</th>
                    <th className="py-3 px-4 min-w-[280px] w-[320px]">Old Appliance Details</th>
                    <th className="py-3 px-4 min-w-[260px] w-[300px]">Target New Product</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentLeads.map((lead) => {
                    const leadDate = lead.createdAt ? new Date(lead.createdAt) : null;
                    const conditionInfo = getConditionLabel(lead.working_condition);
                    const prodImage = lead.product_image?.startsWith("http")
                      ? lead.product_image
                      : lead.product_image
                      ? `/uploads/products/${lead.product_image}`
                      : "/no-image.jpg";

                    return (
                      <tr key={lead._id} className="hover:bg-gray-50 transition">
                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500">
                          {leadDate ? (
                            <>
                              <div className="font-medium text-gray-700">
                                {leadDate.toLocaleDateString()}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {leadDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{lead.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`tel:${lead.mobile_number}`}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              title="Click to call"
                            >
                              <Icon icon="mdi:phone" className="text-gray-400" />
                              {lead.mobile_number}
                            </a>
                            <a
                              href={`https://wa.me/91${lead.mobile_number.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                                `Hello ${lead.name}, regarding your exchange request on Bharath Electronics for ${lead.product_name}...`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600 hover:text-green-700 p-0.5 hover:bg-green-50 rounded"
                              title="Chat on WhatsApp"
                            >
                              <Icon icon="mdi:whatsapp" className="text-sm" />
                            </a>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            <Icon icon="mdi:map-marker-outline" className="text-red-500" />
                            {lead.location}
                          </span>
                        </td>

                        {/* Old Appliance Details - Expanded width */}
                        <td className="py-3 px-4 text-xs min-w-[280px] w-[320px]">
                          <div className="font-semibold text-gray-900 text-sm break-words leading-snug">
                            {lead.old_brand_model || "Not specified"}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-medium">
                              Age: {lead.appliance_age || "-"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${conditionInfo.color}`}>
                              <span>{conditionInfo.icon}</span>
                              <span>{conditionInfo.label}</span>
                            </span>
                          </div>
                        </td>

                        {/* Target New Product - Expanded width */}
                        <td className="py-3 px-4 text-xs min-w-[260px] w-[300px]">
                          <div className="flex items-start gap-2.5">
                            <img
                              src={prodImage}
                              alt={lead.product_name}
                              className="w-11 h-11 object-contain rounded border bg-white shrink-0 p-0.5 mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 line-clamp-2 leading-snug" title={lead.product_name}>
                                {lead.product_name}
                              </p>
                              {lead.product_price > 0 && (
                                <p className="text-[11px] font-bold text-red-600 mt-0.5">
                                  ₹{Number(lead.product_price).toLocaleString("en-IN")}
                                </p>
                              )}
                              {lead.product_slug && (
                                <a
                                  href={`/product/${lead.product_slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                >
                                  <span>View Product</span>
                                  <Icon icon="mdi:open-in-new" className="text-[10px]" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={lead.status || "new"}
                            disabled={updatingId === lead._id}
                            onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer capitalize focus:outline-none focus:ring-1 ${getStatusBadge(
                              lead.status
                            )}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="quoted">Quoted</option>
                            <option value="converted">Converted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setAdminNotes(lead.admin_notes || "");
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Full Details"
                            >
                              <Icon icon="mdi:eye-outline" className="text-lg" />
                            </button>
                            <button
                              onClick={() => {
                                setLeadToDelete(lead._id);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Lead"
                            >
                              <Icon icon="mdi:delete-outline" className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-5 pt-4 border-t border-gray-100 gap-3">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold">{indexOfFirst + 1}</span> to{" "}
                <span className="font-semibold">
                  {Math.min(indexOfLast, filteredLeads.length)}
                </span>{" "}
                of <span className="font-semibold">{filteredLeads.length}</span> entries
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs border rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 text-gray-400 text-xs">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 text-xs font-medium rounded-lg transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs border rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:swap-horizontal-bold" className="text-xl" />
                <h3 className="font-bold text-lg">Exchange Lead Details</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white"
              >
                <Icon icon="mdi:close" className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              
              {/* Customer Contact Strip */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Customer</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedLead.name}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Mobile</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a href={`tel:${selectedLead.mobile_number}`} className="font-bold text-blue-600 hover:underline">
                      {selectedLead.mobile_number}
                    </a>
                    <a
                      href={`https://wa.me/91${selectedLead.mobile_number.replace(/\D/g, "").slice(-10)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 text-lg hover:scale-110 transition"
                      title="WhatsApp"
                    >
                      <Icon icon="mdi:whatsapp" />
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Location / City</span>
                  <p className="font-semibold text-gray-800 mt-0.5">{selectedLead.location}</p>
                </div>
              </div>

              {/* Old Appliance vs Target New Product Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Old Appliance Card */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <Icon icon="mdi:archive-arrow-up-outline" className="text-base" />
                    <span>Old Appliance to Exchange</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Brand & Model</span>
                    <p className="font-semibold text-gray-900">{selectedLead.old_brand_model || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Age of Appliance</span>
                    <p className="font-semibold text-gray-800">{selectedLead.appliance_age || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Condition</span>
                    {(() => {
                      const c = getConditionLabel(selectedLead.working_condition);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${c.color}`}>
                          <span>{c.icon}</span>
                          <span>{c.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Target New Product Card */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs uppercase tracking-wider">
                    <Icon icon="mdi:cart-arrow-down" className="text-base" />
                    <span>Target New Product</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={
                        selectedLead.product_image?.startsWith("http")
                          ? selectedLead.product_image
                          : selectedLead.product_image
                          ? `/uploads/products/${selectedLead.product_image}`
                          : "/no-image.jpg"
                      }
                      alt={selectedLead.product_name}
                      className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-gray-900 line-clamp-2">
                        {selectedLead.product_name}
                      </p>
                      {selectedLead.product_price > 0 && (
                        <p className="text-xs font-bold text-red-600 mt-0.5">
                          ₹{Number(selectedLead.product_price).toLocaleString("en-IN")}
                        </p>
                      )}
                      {selectedLead.product_slug && (
                        <a
                          href={`/product/${selectedLead.product_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <span>Open Product Page</span>
                          <Icon icon="mdi:open-in-new" className="text-xs" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Customer Notes */}
              {selectedLead.remarks && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Customer Message / Remarks
                  </span>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedLead.remarks}
                  </div>
                </div>
              )}

              {/* Admin Notes & Status Updater */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase">
                    Update Lead Status
                  </span>
                  <select
                    value={selectedLead.status || "new"}
                    onChange={(e) => handleStatusChange(selectedLead._id, e.target.value, adminNotes)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border capitalize focus:outline-none ${getStatusBadge(
                      selectedLead.status
                    )}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Internal Follow-Up / Quotation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Quoted ₹4,500 for old LG washing machine. Customer agreed for weekend delivery..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <div className="flex justify-end mt-1.5">
                    <button
                      onClick={() => handleStatusChange(selectedLead._id, selectedLead.status, adminNotes)}
                      className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t shrink-0">
              <button
                onClick={() => {
                  setLeadToDelete(selectedLead._id);
                  setShowDeleteModal(true);
                }}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Delete Lead
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:trash-can-outline" className="text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Exchange Lead?</h3>
            <p className="text-xs text-gray-500 mb-5">
              This action cannot be undone. Are you sure you want to permanently remove this lead?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLeadToDelete(null);
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
