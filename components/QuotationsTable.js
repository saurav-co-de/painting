"use client";

import { useEffect, useMemo, useState, startTransition, useDeferredValue } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/billing";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import { readJsonResponse } from "@/lib/api";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDownload,
  IconEye,
  IconQuotation
} from "@/components/Icons";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function QuotationsTable({ quotations, user }) {
  const router = useRouter();
  const [quotationList, setQuotationList] = useState(quotations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    const result = quotationList.filter((quotation) => {
      const matchesSearch =
        !normalized ||
        String(quotation.quotationNumber || "").toLowerCase().includes(normalized) ||
        String(quotation.customerName || "").toLowerCase().includes(normalized) ||
        String(quotation.projectName || "").toLowerCase().includes(normalized);

      const matchesStatus = statusFilter === "All" || quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.quotationDate || b.createdAt) - new Date(a.quotationDate || a.createdAt);
      }
      if (sortBy === "date-asc") {
        return new Date(a.quotationDate || a.createdAt) - new Date(b.quotationDate || b.createdAt);
      }
      if (sortBy === "amount-desc") {
        return Number(b.totals?.grandTotal || 0) - Number(a.totals?.grandTotal || 0);
      }
      if (sortBy === "amount-asc") {
        return Number(a.totals?.grandTotal || 0) - Number(b.totals?.grandTotal || 0);
      }
      if (sortBy === "validity-asc") {
        return new Date(a.validityDate || "9999-12-31") - new Date(b.validityDate || "9999-12-31");
      }
      if (sortBy === "number-asc") {
        return String(a.quotationNumber).localeCompare(String(b.quotationNumber));
      }
      return 0;
    });

    return result;
  }, [deferredSearch, quotationList, sortBy, statusFilter]);

  async function deleteQuotation(quotationId) {
    setBusyId(quotationId);

    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: "DELETE"
      });
      const payload = await readJsonResponse(response, "Could not delete quotation.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete quotation.");
      }

      startTransition(() => {
        setQuotationList((current) => current.filter((quotation) => quotation.id !== quotationId));
      });
      setDeleteTarget(null);
      router.refresh();
      setToast({ type: "success", message: "Quotation deleted successfully." });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Could not delete quotation." });
    } finally {
      setBusyId("");
    }
  }

  function getBadgeClass(status) {
    switch (status) {
      case "Accepted":
        return "badge-accepted";
      case "Sent":
        return "badge-sent";
      case "Rejected":
        return "badge-rejected";
      case "Expired":
        return "badge-expired";
      case "Draft":
      default:
        return "badge-draft";
    }
  }

  return (
    <div className="space-y-4">
      {/* Search, Filter, Sort Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="field pl-9 pr-3.5"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search quotation number, client, project..."
                type="text"
                value={search}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <select
                aria-label="Filter by quotation status"
                className="field"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-48">
              <select
                aria-label="Sort quotations by"
                className="field"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                <option value="date-desc">Newest Date First</option>
                <option value="date-asc">Oldest Date First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="validity-asc">Validity Ending Soon</option>
                <option value="number-asc">Quote Number (A-Z)</option>
              </select>
            </div>
          </div>

          <Link
            className="button-primary shrink-0"
            href="/quotations/new"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>

        {/* Filter Summary Pill Bar */}
        {(statusFilter !== "All" || search) && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtering:</span>
            {statusFilter !== "All" && (
              <span className="badge bg-slate-100 text-slate-700">
                Status: {statusFilter}
              </span>
            )}
            {search && (
              <span className="badge bg-slate-100 text-slate-700">
                Query: &quot;{search}&quot;
              </span>
            )}
            <button
              className="text-teal-700 font-semibold hover:underline ml-auto"
              onClick={() => {
                setStatusFilter("All");
                setSearch("");
              }}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop / Tablet Table */}
      <div className="card overflow-hidden hidden md:block">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Client & Project</th>
                <th>Dates</th>
                <th>Estimated Total</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quotation) => {
                const isBusy = busyId === quotation.id;
                const grandTotal = Number(quotation.totals?.grandTotal || 0);

                return (
                  <tr key={quotation.id}>
                    {/* Number */}
                    <td>
                      <Link
                        className="font-semibold text-slate-900 hover:text-teal-700 transition-colors"
                        href={`/quotations/${quotation.id}`}
                      >
                        {quotation.quotationNumber}
                      </Link>
                    </td>

                    {/* Client & Project */}
                    <td>
                      <p className="font-medium text-slate-900">{quotation.customerName || "-"}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{quotation.projectName || "-"}</p>
                    </td>

                    {/* Dates */}
                    <td>
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-700">
                          <span className="text-slate-400">Date: </span>
                          {formatDate(quotation.quotationDate)}
                        </p>
                        <p className="text-slate-500">
                          <span className="text-slate-400">Valid until: </span>
                          {formatDate(quotation.validityDate)}
                        </p>
                      </div>
                    </td>

                    {/* Total */}
                    <td>
                      <p className="font-semibold text-slate-900">{formatCurrency(grandTotal)}</p>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${getBadgeClass(quotation.status)}`}>
                        {quotation.status || "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          href={`/quotations/${quotation.id}`}
                          title="View Quotation"
                        >
                          <IconEye className="w-4 h-4" />
                        </Link>

                        <Link
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          href={`/quotations/${quotation.id}/edit`}
                          title="Edit Quotation"
                        >
                          <IconEdit className="w-4 h-4" />
                        </Link>

                        <a
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          download={`${quotation.quotationNumber || "quotation"}.pdf`}
                          href={`/api/quotations/${quotation.id}/pdf`}
                          title="Download PDF"
                        >
                          <IconDownload className="w-4 h-4" />
                        </a>

                        <button
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(quotation)}
                          title="Delete Quotation"
                          type="button"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="space-y-3 md:hidden">
        {filtered.map((quotation) => {
          const isBusy = busyId === quotation.id;
          const grandTotal = Number(quotation.totals?.grandTotal || 0);

          return (
            <div className="card p-4 space-y-3" key={quotation.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    className="font-bold text-slate-900 text-base hover:text-teal-700"
                    href={`/quotations/${quotation.id}`}
                  >
                    {quotation.quotationNumber}
                  </Link>
                  <p className="mt-0.5 font-medium text-slate-800 text-sm">{quotation.customerName || "-"}</p>
                  <p className="text-xs text-slate-500 truncate">{quotation.projectName || "-"}</p>
                </div>
                <span className={`badge shrink-0 ${getBadgeClass(quotation.status)}`}>
                  {quotation.status || "Draft"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Valid Until</span>
                  <p className="font-medium text-slate-800">
                    {formatDate(quotation.validityDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Estimated Total</span>
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(grandTotal)}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  className="button-secondary text-xs py-1.5 px-3"
                  href={`/quotations/${quotation.id}`}
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>
                <Link
                  className="button-secondary text-xs py-1.5 px-3"
                  href={`/quotations/${quotation.id}/edit`}
                >
                  <IconEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
                <a
                  className="button-secondary text-xs py-1.5 px-3"
                  download={`${quotation.quotationNumber || "quotation"}.pdf`}
                  href={`/api/quotations/${quotation.id}/pdf`}
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
                <button
                  className="button-danger text-xs py-1.5 px-2.5 ml-auto"
                  disabled={isBusy}
                  onClick={() => setDeleteTarget(quotation)}
                  type="button"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!filtered.length && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <IconQuotation className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No quotations found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== "All"
              ? "No quotations match your current search or filter criteria. Try resetting them."
              : "Create professional cost estimates and quotations for your prospective clients."}
          </p>
          <div className="mt-6">
            {search || statusFilter !== "All" ? (
              <button
                className="button-secondary text-sm"
                onClick={() => {
                  setStatusFilter("All");
                  setSearch("");
                }}
                type="button"
              >
                Reset Filters
              </button>
            ) : (
              <Link className="button-primary text-sm" href="/quotations/new">
                <IconPlus className="w-4 h-4" />
                <span>Create Quotation</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete Quotation"
        isDeleting={busyId === deleteTarget?.id}
        message={`Are you sure you want to permanently delete quotation ${deleteTarget?.quotationNumber || ""}? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteQuotation(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete Quotation"
      />

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}
