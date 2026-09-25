"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { readJsonResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/billing";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDownload,
  IconEye,
  IconCheck,
  IconArrowUpDown,
  IconInvoice,
  IconCalendar
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

export default function InvoicesTable({ initialInvoices }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const deferredQuery = useDeferredValue(query);

  function invoiceClientName(invoice) {
    return invoice.customerDetails?.clientName || "-";
  }

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    const result = invoices.filter((invoice) => {
      const matchesFilter = filter === "All" || invoice.paymentStatus === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          invoice.invoiceNumber,
          invoice.projectName,
          invoiceClientName(invoice)
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt);
      }
      if (sortBy === "date-asc") {
        return new Date(a.invoiceDate || a.createdAt) - new Date(b.invoiceDate || b.createdAt);
      }
      if (sortBy === "amount-desc") {
        return Number(b.totals?.grandTotal || 0) - Number(a.totals?.grandTotal || 0);
      }
      if (sortBy === "amount-asc") {
        return Number(a.totals?.grandTotal || 0) - Number(b.totals?.grandTotal || 0);
      }
      if (sortBy === "due-asc") {
        return new Date(a.dueDate || "9999-12-31") - new Date(b.dueDate || "9999-12-31");
      }
      if (sortBy === "number-asc") {
        return String(a.invoiceNumber).localeCompare(String(b.invoiceNumber));
      }
      return 0;
    });

    return result;
  }, [deferredQuery, filter, invoices, sortBy]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function updateStatus(invoiceId, paymentStatus) {
    setBusyId(invoiceId);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paymentStatus })
      });
      const payload = await readJsonResponse(response, "Could not update invoice.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not update invoice.");
      }

      startTransition(() => {
        setInvoices((current) =>
          current.map((invoice) => (invoice.id === invoiceId ? payload.invoice : invoice))
        );
      });
      router.refresh();
      setToast({ type: "success", message: `Invoice marked as ${paymentStatus}.` });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Could not update invoice." });
    } finally {
      setBusyId("");
    }
  }

  async function deleteInvoice(invoiceId) {
    setBusyId(invoiceId);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE"
      });
      const payload = await readJsonResponse(response, "Could not delete invoice.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete invoice.");
      }

      startTransition(() => {
        setInvoices((current) => current.filter((invoice) => invoice.id !== invoiceId));
      });
      router.refresh();
      setToast({ type: "success", message: "Invoice deleted successfully." });
      setDeleteTarget(null);
    } catch (error) {
      setToast({ type: "error", message: error.message || "Could not delete invoice." });
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      {/* Search, Filter, Sort, and CTA Bar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="field pl-9 pr-3.5"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search invoice number, client, project..."
                type="text"
                value={query}
              />
              {query && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <select
                aria-label="Filter by payment status"
                className="field"
                onChange={(event) => setFilter(event.target.value)}
                value={filter}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-48">
              <select
                aria-label="Sort invoices by"
                className="field"
                onChange={(event) => setSortBy(event.target.value)}
                value={sortBy}
              >
                <option value="date-desc">Newest Date First</option>
                <option value="date-asc">Oldest Date First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="due-asc">Upcoming Due Date</option>
                <option value="number-asc">Invoice Number (A-Z)</option>
              </select>
            </div>
          </div>

          <Link
            className="button-primary shrink-0"
            href="/invoices/new"
          >
            <IconPlus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Filter Summary Pill Bar */}
        {(filter !== "All" || query) && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtering:</span>
            {filter !== "All" && (
              <span className="badge bg-slate-100 text-slate-700">
                Status: {filter}
              </span>
            )}
            {query && (
              <span className="badge bg-slate-100 text-slate-700">
                Query: &quot;{query}&quot;
              </span>
            )}
            <button
              className="text-teal-700 font-semibold hover:underline ml-auto"
              onClick={() => {
                setFilter("All");
                setQuery("");
              }}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="card overflow-hidden hidden md:block">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client & Project</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const isPaid = invoice.paymentStatus === "Paid";
                const isOverdue = invoice.paymentStatus === "Overdue";
                const isBusy = busyId === invoice.id;
                const grandTotal = Number(invoice.totals?.grandTotal || 0);
                const advance = Number(invoice.advancePayment || 0);
                const balanceDue = invoice.balanceDue != null ? Number(invoice.balanceDue) : Math.max(grandTotal - advance, 0);

                return (
                  <tr key={invoice.id}>
                    {/* Invoice Number */}
                    <td>
                      <Link
                        className="font-semibold text-slate-900 hover:text-teal-700 transition-colors"
                        href={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>

                    {/* Client & Project */}
                    <td>
                      <p className="font-medium text-slate-900">{invoiceClientName(invoice)}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{invoice.projectName || "-"}</p>
                    </td>

                    {/* Dates */}
                    <td>
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-700">
                          <span className="text-slate-400">Issued: </span>
                          {formatDate(invoice.invoiceDate)}
                        </p>
                        <p className="text-slate-500">
                          <span className="text-slate-400">Due: </span>
                          <span className={isOverdue ? "text-rose-600 font-medium" : ""}>
                            {formatDate(invoice.dueDate)}
                          </span>
                        </p>
                      </div>
                    </td>

                    {/* Amount & Balance */}
                    <td>
                      <p className="font-semibold text-slate-900">{formatCurrency(grandTotal)}</p>
                      {advance > 0 && !isPaid && (
                        <p className="text-xs text-slate-500">
                          Bal: {formatCurrency(balanceDue)}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`badge ${
                          isPaid ? "badge-paid" : isOverdue ? "badge-overdue" : "badge-pending"
                        }`}
                      >
                        {invoice.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && (
                          <button
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => updateStatus(invoice.id, "Paid")}
                            title="Mark as Paid"
                            type="button"
                          >
                            <IconCheck className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}

                        <Link
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          href={`/invoices/${invoice.id}`}
                          title="View Invoice"
                        >
                          <IconEye className="w-4 h-4" />
                        </Link>

                        <Link
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          href={`/invoices/${invoice.id}/edit`}
                          title="Edit Invoice"
                        >
                          <IconEdit className="w-4 h-4" />
                        </Link>

                        <a
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          download={`${invoice.invoiceNumber}.pdf`}
                          href={`/api/invoices/${invoice.id}/pdf`}
                          title="Download PDF"
                        >
                          <IconDownload className="w-4 h-4" />
                        </a>

                        <button
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(invoice)}
                          title="Delete Invoice"
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
        {filteredInvoices.map((invoice) => {
          const isPaid = invoice.paymentStatus === "Paid";
          const isOverdue = invoice.paymentStatus === "Overdue";
          const isBusy = busyId === invoice.id;
          const grandTotal = Number(invoice.totals?.grandTotal || 0);

          return (
            <div className="card p-4 space-y-3" key={invoice.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    className="font-bold text-slate-900 text-base hover:text-teal-700"
                    href={`/invoices/${invoice.id}`}
                  >
                    {invoice.invoiceNumber}
                  </Link>
                  <p className="mt-0.5 font-medium text-slate-800 text-sm">{invoiceClientName(invoice)}</p>
                  <p className="text-xs text-slate-500 truncate">{invoice.projectName || "-"}</p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    isPaid ? "badge-paid" : isOverdue ? "badge-overdue" : "badge-pending"
                  }`}
                >
                  {invoice.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Due Date</span>
                  <p className={`font-medium ${isOverdue ? "text-rose-600" : "text-slate-800"}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Total Amount</span>
                  <p className="font-bold text-slate-900 text-sm">{formatCurrency(grandTotal)}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {!isPaid && (
                  <button
                    className="button-primary text-xs py-1.5 px-3 flex-1"
                    disabled={isBusy}
                    onClick={() => updateStatus(invoice.id, "Paid")}
                    type="button"
                  >
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                )}
                <Link
                  className="button-secondary text-xs py-1.5 px-3"
                  href={`/invoices/${invoice.id}`}
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>
                <Link
                  className="button-secondary text-xs py-1.5 px-3"
                  href={`/invoices/${invoice.id}/edit`}
                >
                  <IconEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
                <a
                  className="button-secondary text-xs py-1.5 px-3"
                  download={`${invoice.invoiceNumber}.pdf`}
                  href={`/api/invoices/${invoice.id}/pdf`}
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
                <button
                  className="button-danger text-xs py-1.5 px-2.5 ml-auto"
                  disabled={isBusy}
                  onClick={() => setDeleteTarget(invoice)}
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
      {!filteredInvoices.length && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <IconInvoice className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No invoices found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {query || filter !== "All"
              ? "No invoices match your selected search or filter criteria. Try resetting them."
              : "Get started by creating your very first GST invoice."}
          </p>
          <div className="mt-6">
            {query || filter !== "All" ? (
              <button
                className="button-secondary text-sm"
                onClick={() => {
                  setFilter("All");
                  setQuery("");
                }}
                type="button"
              >
                Reset Filters
              </button>
            ) : (
              <Link className="button-primary text-sm" href="/invoices/new">
                <IconPlus className="w-4 h-4" />
                <span>Create Invoice</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete Invoice"
        isDeleting={busyId === deleteTarget?.id}
        message={`Are you sure you want to permanently delete invoice ${deleteTarget?.invoiceNumber || ""}? All associated line items will be removed.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteInvoice(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete Invoice"
      />

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}
