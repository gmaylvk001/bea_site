"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import * as XLSX from "xlsx";

const STATUS_OPTIONS = ["All", "New", "Contacted", "Closed"];

export default function OutOfStockEnquiriesComponent() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showAlert = (msg, type = "success") => {
    setAlertMessage(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 4000);
  };

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
      });
      if (statusFilter && statusFilter !== "All") {
        params.set("status", statusFilter);
      }
      if (searchTerm.trim()) {
        params.set("q", searchTerm.trim());
      }

      const res = await fetch(`/api/product/out-of-stock-enquiry?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error("Failed to fetch enquiries:", err);
      showAlert("Failed to load enquiries", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/product/out-of-stock-enquiry/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
        showAlert(`Status updated to ${newStatus}`);
      } else {
        showAlert(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showAlert("Error updating status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/product/out-of-stock-enquiry/${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) => prev.filter((item) => item._id !== deletingId));
        showAlert("Enquiry deleted successfully");
      } else {
        showAlert(data.message || "Failed to delete enquiry", "error");
      }
    } catch (err) {
      console.error("Failed to delete enquiry:", err);
      showAlert("Error deleting enquiry", "error");
    } finally {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const exportToExcel = () => {
    if (enquiries.length === 0) {
      showAlert("No data to export", "error");
      return;
    }

    const exportData = enquiries.map((item, idx) => ({
      "S.No": idx + 1,
      "Date": item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "-",
      "Customer Name": item.fullName,
      "Mobile Number": item.phone,
      "Email ID": item.email || "-",
      "City": item.city || "-",
      "Requirement": item.requirement || "-",
      "Product Name": item.productName || "-",
      "Item Code": item.itemCode || "-",
      "Price (₹)": item.specialPrice > 0 ? item.specialPrice : item.price || 0,
      "Trigger Action": item.action === "buy_now" ? "Buy Now" : "Add to Cart",
      "Status": item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Out_Of_Stock_Enquiries");
    XLSX.writeFile(workbook, `out_of_stock_enquiries_${Date.now()}.xlsx`);
  };

  const formatDate = (iso) => {
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
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center justify-between text-sm transition-all ${
            alertType === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage("")} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Icon icon="mdi:cart-alert" className="text-2xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Out of Stock Product Enquiries
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Leads captured from users attempting to buy or add out-of-stock products
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors"
          >
            <Icon icon="mdi:file-excel" className="text-lg" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => fetchEnquiries()}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Icon icon="mdi:refresh" className="text-lg" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
          />
          <input
            type="search"
            placeholder="Search by name, phone, product..."
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setStatusFilter(st);
                }}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === st
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2 font-medium">
            Total: <strong className="text-gray-800">{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            <Icon icon="mdi:loading" className="animate-spin text-3xl mx-auto mb-2 text-blue-600" />
            Loading out of stock enquiries...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center">
            <Icon icon="mdi:cart-off" className="text-4xl text-gray-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-gray-700">No enquiries found</p>
            <p className="text-xs text-gray-500 mt-1">
              New enquiries submitted from out-of-stock product pages will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Trigger Action</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {enquiries.map((item) => {
                  const effectivePrice =
                    item.specialPrice > 0 ? item.specialPrice : item.price;
                  return (
                    <tr key={item._id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-sm">{item.fullName}</div>
                        <div className="flex items-center gap-1.5 text-blue-700 mt-0.5">
                          <Icon icon="mdi:phone" className="text-xs" />
                          <a href={`tel:${item.phone}`} className="hover:underline font-mono">
                            {item.phone}
                          </a>
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                            <Icon icon="mdi:email-outline" className="text-xs" />
                            <a href={`mailto:${item.email}`} className="hover:underline">
                              {item.email}
                            </a>
                          </div>
                        )}
                        {item.city && (
                          <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                            <Icon icon="mdi:map-marker-outline" className="text-xs" />
                            <span>{item.city}</span>
                          </div>
                        )}
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4 min-w-[220px] max-w-[280px]">
                        <div className="flex items-start gap-2.5">
                          {item.productImage ? (
                            <img
                              src={`/uploads/products/${item.productImage}`}
                              alt={item.productName || "Product"}
                              className="w-11 h-11 object-contain border border-gray-200 rounded p-1 bg-white flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-400 flex-shrink-0">
                              <Icon icon="mdi:image-off-outline" className="text-lg" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {item.productSlug ? (
                              <Link
                                href={`/product/${item.productSlug}`}
                                target="_blank"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2 leading-tight"
                              >
                                {item.productName || "View Product"}
                              </Link>
                            ) : (
                              <p className="font-medium text-gray-800 line-clamp-2 leading-tight">
                                {item.productName || "—"}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                              {item.itemCode && (
                                <span className="font-mono bg-gray-100 px-1 rounded">
                                  #{item.itemCode}
                                </span>
                              )}
                              {effectivePrice > 0 && (
                                <span className="font-semibold text-gray-800">
                                  ₹{Number(effectivePrice).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trigger Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.action === "buy_now" ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                            <Icon icon="mdi:store" className="text-xs" />
                            Buy Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                            <Icon icon="mdi:cart-plus" className="text-xs" />
                            Add to Cart
                          </span>
                        )}
                      </td>

                      {/* Requirement */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {item.requirement ? (
                          <p className="text-gray-700 bg-gray-50 p-2 rounded border border-gray-100 text-xs line-clamp-3">
                            {item.requirement}
                          </p>
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={item.status || "New"}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            item.status === "Closed"
                              ? "bg-gray-100 text-gray-700 border-gray-300"
                              : item.status === "Contacted"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-green-100 text-green-800 border-green-300"
                          }`}
                        >
                          <option value="New">🟢 New</option>
                          <option value="Contacted">🟡 Contacted</option>
                          <option value="Closed">⚪ Closed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(item._id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete enquiry"
                        >
                          <Icon icon="mdi:trash-can-outline" className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Icon icon="mdi:alert-outline" className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Delete Enquiry?</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure you want to permanently delete this out-of-stock enquiry? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
