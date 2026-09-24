"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";

export default function JobApplicationsComponent() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [postFilter, setPostFilter] = useState("All");
  const [distinctPosts, setDistinctPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
        status: statusFilter,
        job_post: postFilter,
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/job-applications?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.distinctPosts?.length) {
          setDistinctPosts(data.distinctPosts);
        }
      } else {
        showToast(data.message || "Failed to load applications", "error");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, postFilter, searchTerm]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch("/api/admin/job-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
        );
        showToast(`Status updated to ${newStatus}`);
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/job-applications?id=${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Application deleted successfully");
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchApplications();
      } else {
        showToast(data.message || "Failed to delete", "error");
      }
    } catch (err) {
      showToast("Failed to delete application", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (!applications.length) {
      showToast("No data to export", "error");
      return;
    }

    const exportData = applications.map((app, index) => ({
      "#": index + 1,
      Name: app.name,
      Mobile: app.mobile_number,
      Email: app.email,
      City: app.city,
      "Job Position": app.job_post,
      Status: app.status,
      "Applied Date": new Date(app.createdAt).toLocaleString("en-IN"),
      "Resume Link": app.resume_path
        ? `${window.location.origin}${app.resume_path}`
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Job Applications");
    XLSX.writeFile(workbook, `Job_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("Exported to Excel successfully!");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Reviewed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Shortlisted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 ${
            toastType === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          <Icon
            icon={toastType === "error" ? "mdi:alert-circle" : "mdi:check-circle"}
            className="w-5 h-5"
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Career Management
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {totalCount} Total Applications
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage job applications submitted through the careers page
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <Link
            href="/admin/careers"
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            Job Positions
          </Link>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-white text-blue-600 shadow-sm"
          >
            Job Applications
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
          />
          <input
            type="text"
            placeholder="Search by name, phone, email, city or position..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Position Filter */}
          {distinctPosts.length > 0 && (
            <select
              value={postFilter}
              onChange={(e) => {
                setPostFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
            >
              <option value="All">All Positions</option>
              {distinctPosts.map((post) => (
                <option key={post} value={post}>
                  {post}
                </option>
              ))}
            </select>
          )}

          {/* Export to Excel */}
          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            title="Export to Excel"
          >
            <Icon icon="mdi:file-excel" className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchApplications}
            className="p-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            title="Refresh list"
          >
            <Icon icon="mdi:refresh" className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Applied Position</th>
                <th className="py-3 px-4">Resume</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <Icon icon="mdi:loading" className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading applications...</span>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <Icon icon="mdi:account-search-outline" className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold text-gray-700">No applications found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm || statusFilter !== "All" || postFilter !== "All"
                        ? "Try clearing your filters or search query"
                        : "Applications submitted on the career page will appear here"}
                    </p>
                  </td>
                </tr>
              ) : (
                applications.map((app, idx) => (
                  <tr key={app._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 text-gray-400 text-xs">
                      {(currentPage - 1) * 15 + idx + 1}
                    </td>

                    {/* Applicant Name & Date */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{app.name}</p>
                      <p className="text-[11.5px] text-gray-400 mt-0.5">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <a
                        href={`tel:${app.mobile_number}`}
                        className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <Icon icon="mdi:phone" className="w-3.5 h-3.5 text-gray-400" />
                        {app.mobile_number}
                      </a>
                      <a
                        href={`mailto:${app.email}`}
                        className="text-xs text-gray-500 hover:text-gray-800 hover:underline flex items-center gap-1.5 mt-0.5 truncate max-w-[200px]"
                      >
                        <Icon icon="mdi:email" className="w-3.5 h-3.5 text-gray-400" />
                        {app.email}
                      </a>
                    </td>

                    {/* City */}
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {app.city || "—"}
                    </td>

                    {/* Position */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {app.job_post}
                      </span>
                    </td>

                    {/* Resume Download/View */}
                    <td className="py-3.5 px-4">
                      {app.resume_path ? (
                        <a
                          href={app.resume_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors"
                          title="Open Resume PDF in new tab"
                        >
                          <Icon icon="mdi:file-pdf-box" className="w-4 h-4 text-red-600" />
                          <span>View PDF</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={app.status || "New"}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${getStatusBadge(
                          app.status || "New"
                        )}`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(app);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete application"
                      >
                        <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
            <span className="text-gray-500 text-xs">
              Page {currentPage} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Icon icon="mdi:alert-outline" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Application?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete the application for{" "}
                <span className="font-semibold text-gray-800">{deleteTarget.name}</span>? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
