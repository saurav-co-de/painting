"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { readJsonResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/billing";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";

export default function InvoicesTable({ initialInvoices }) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const deferredQuery = useDeferredValue(query);

  function invoiceClientName(invoice) {
    return invoice.customerDetails?.clientName || "-";
  }

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return invoices.filter((invoice) => {
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
  }, [deferredQuery, filter, invoices]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2600);
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
      setToast({ type: "success", message: "Invoice updated successfully." });
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
    <section className="glass-card p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            className="field"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoice number, client, or project"
            value={query}
          />
          <select
            className="field sm:max-w-[180px]"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
        <Link className="button-primary sm:w-auto" href="/invoices/new">
          New invoice
        </Link>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {filteredInvoices.map((invoice) => (
          <article className="rounded-xl border border-slate-200/80 bg-white/90 p-4" key={invoice.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="break-words font-semibold text-slate-950" href={`/invoices/${invoice.id}`}>
                  {invoice.invoiceNumber}
                </Link>
                <p className="mt-1 break-words text-sm text-slate-500">{invoice.projectName}</p>
                <p className="mt-2 break-words text-sm text-slate-700">
                  {invoiceClientName(invoice)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  invoice.paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-900"
                    : invoice.paymentStatus === "Overdue"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-amber-100 text-amber-900"
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Due</p>
                <p className="mt-1 font-semibold text-slate-950">{invoice.dueDate}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-right">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Balance</p>
                <p className="mt-1 break-words font-semibold text-slate-950">
                  {formatCurrency(invoice.balanceDue ?? invoice.totals.grandTotal)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {invoice.paymentStatus !== "Paid" ? (
                <button
                  className="button-secondary px-3 py-2 text-sm"
                  disabled={busyId === invoice.id}
                  onClick={() => updateStatus(invoice.id, "Paid")}
                  type="button"
                >
                  Mark Paid
                </button>
              ) : null}
              <Link className="button-secondary px-3 py-2 text-center text-sm" href={`/invoices/${invoice.id}/edit`}>
                <span aria-hidden="true">✏️</span>
                Edit
              </Link>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busyId === invoice.id}
                onClick={() => setDeleteTarget(invoice)}
                type="button"
              >
                <span aria-hidden="true">🗑️</span>
                {busyId === invoice.id && deleteTarget?.id === invoice.id ? "Deleting..." : "Delete"}
              </button>
              <a
                className="button-secondary px-3 py-2 text-sm"
                download={`${invoice.invoiceNumber}.pdf`}
                href={`/api/invoices/${invoice.id}/pdf`}
              >
                PDF
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.22em] text-slate-500">
              <th className="pb-4 pr-4">Invoice</th>
              <th className="pb-4 pr-4">Client</th>
              <th className="pb-4 pr-4">Due</th>
              <th className="pb-4 pr-4">Total</th>
              <th className="pb-4 pr-4">Status</th>
              <th className="pb-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-4 pr-4">
                  <Link className="font-semibold text-slate-950" href={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{invoice.projectName}</p>
                </td>
                <td className="py-4 pr-4 text-sm text-slate-700">
                  {invoiceClientName(invoice)}
                </td>
                <td className="py-4 pr-4 text-sm text-slate-700">{invoice.dueDate}</td>
                <td className="py-4 pr-4 text-sm font-semibold text-slate-950">
                  {formatCurrency(invoice.balanceDue ?? invoice.totals.grandTotal)}
                  {Number(invoice.advancePayment || 0) > 0 ? (
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      Advance {formatCurrency(invoice.advancePayment)}
                    </p>
                  ) : null}
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${
                      invoice.paymentStatus === "Paid"
                        ? "bg-emerald-100 text-emerald-900"
                        : invoice.paymentStatus === "Overdue"
                          ? "bg-rose-100 text-rose-900"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {invoice.paymentStatus}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {invoice.paymentStatus !== "Paid" ? (
                      <button
                        className="button-secondary px-3 py-2 text-sm"
                        disabled={busyId === invoice.id}
                        onClick={() => updateStatus(invoice.id, "Paid")}
                        type="button"
                      >
                        Mark Paid
                      </button>
                    ) : null}
                    <Link className="button-secondary px-3 py-2 text-center text-sm" href={`/invoices/${invoice.id}/edit`}>
                      <span aria-hidden="true">✏️</span>
                      Edit
                    </Link>
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busyId === invoice.id}
                      onClick={() => setDeleteTarget(invoice)}
                      type="button"
                    >
                      <span aria-hidden="true">🗑️</span>
                      {busyId === invoice.id && deleteTarget?.id === invoice.id ? "Deleting..." : "Delete"}
                    </button>
                    <a
                      className="button-secondary px-3 py-2 text-sm"
                      download={`${invoice.invoiceNumber}.pdf`}
                      href={`/api/invoices/${invoice.id}/pdf`}
                    >
                      PDF
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredInvoices.length ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
          No invoices matched your filters.
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        isDeleting={busyId === deleteTarget?.id}
        message="Are you sure you want to delete this record? This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteInvoice(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete Invoice"
      />
      <Toast toast={toast} />
    </section>
  );
}
