"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/billing";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import { readJsonResponse } from "@/lib/api";

export default function QuotationsTable({ quotations, user }) {
  const router = useRouter();
  const [quotationList, setQuotationList] = useState(quotations);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = quotationList.filter((quotation) => {
    const matchesSearch =
      String(quotation.quotationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      String(quotation.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      String(quotation.projectName || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

      setQuotationList((current) => current.filter((quotation) => quotation.id !== quotationId));
      setDeleteTarget(null);
      router.refresh();
      setToast({ type: "success", message: "Quotation deleted successfully." });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Could not delete quotation." });
    } finally {
      setBusyId("");
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-900";
      case "Sent":
        return "bg-blue-100 text-blue-900";
      case "Accepted":
        return "bg-green-100 text-green-900";
      case "Rejected":
        return "bg-rose-100 text-rose-900";
      case "Expired":
        return "bg-yellow-100 text-yellow-900";
      default:
        return "bg-slate-100 text-slate-900";
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass-card grid gap-3 p-4 md:flex md:items-center md:justify-between sm:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="field w-full sm:w-72"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quotation number, client, or project"
            type="text"
            value={search}
          />
          <select
            className="field"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option>All</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Expired</option>
          </select>
        </div>
        <Link className="button-primary w-full sm:w-auto" href="/quotations/new">
          New quotation
        </Link>
      </div>

      <div className="glass-card min-w-0 overflow-x-auto">
        <div className="space-y-3 p-4 md:hidden">
          {filtered.map((quotation) => (
            <article className="rounded-xl border border-slate-200/80 bg-white/90 p-4" key={quotation.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    className="break-words text-sm font-semibold text-teal-700 hover:underline"
                    href={`/quotations/${quotation.id}`}
                  >
                    {quotation.quotationNumber}
                  </Link>
                  <p className="mt-1 break-words text-sm text-slate-500">{quotation.projectName}</p>
                  <p className="mt-2 break-words text-sm text-slate-700">{quotation.customerName || "-"}</p>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                  {quotation.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Valid Until</p>
                  <p className="mt-1 font-semibold text-slate-950">{quotation.validityDate}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-right">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total</p>
                  <p className="mt-1 break-words font-semibold text-slate-950">
                    {formatCurrency(quotation.totals.grandTotal)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link className="button-secondary px-3 py-2 text-center text-sm" href={`/quotations/${quotation.id}/edit`}>
                  <span aria-hidden="true">✏️</span>
                  Edit
                </Link>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busyId === quotation.id}
                  onClick={() => setDeleteTarget(quotation)}
                  type="button"
                >
                  <span aria-hidden="true">🗑️</span>
                  {busyId === quotation.id && deleteTarget?.id === quotation.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <table className="hidden min-w-[860px] md:table">
          <thead>
            <tr className="border-b border-slate-200/80">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Quotation
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Client
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Valid Until
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Total
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sm:px-6 lg:px-8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quotation) => (
              <tr className="border-b border-slate-200/80 hover:bg-slate-50" key={quotation.id}>
                <td className="px-4 py-4 sm:px-6 lg:px-8">
                  <div>
                    <Link
                      className="text-sm font-semibold text-teal-700 hover:underline"
                      href={`/quotations/${quotation.id}`}
                    >
                      {quotation.quotationNumber}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{quotation.projectName}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 sm:px-6 lg:px-8">
                  {quotation.customerName || "-"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 sm:px-6 lg:px-8">
                  {quotation.validityDate}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-950 sm:px-6 lg:px-8">
                  {formatCurrency(quotation.totals.grandTotal)}
                </td>
                <td className="px-4 py-4 sm:px-6 lg:px-8">
                  <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </span>
                </td>
                <td className="px-4 py-4 sm:px-6 lg:px-8">
                  <div className="flex flex-wrap gap-2">
                    <Link className="button-secondary px-3 py-2 text-sm" href={`/quotations/${quotation.id}/edit`}>
                      <span aria-hidden="true">✏️</span>
                      Edit
                    </Link>
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busyId === quotation.id}
                      onClick={() => setDeleteTarget(quotation)}
                      type="button"
                    >
                      <span aria-hidden="true">🗑️</span>
                      {busyId === quotation.id && deleteTarget?.id === quotation.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-6 lg:px-8">
            <p className="text-slate-500">No quotations found.</p>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        isDeleting={busyId === deleteTarget?.id}
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteQuotation(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete Quotation"
      />
      <Toast toast={toast} />
    </div>
  );
}
