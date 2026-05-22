"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/billing";

export default function InvoicesTable({ initialInvoices }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesFilter = filter === "All" || invoice.paymentStatus === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          invoice.invoiceNumber,
          invoice.projectName,
          invoice.customerDetails.clientName
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [deferredQuery, filter, invoices]);

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
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not update invoice.");
      }

      startTransition(() => {
        setInvoices((current) =>
          current.map((invoice) => (invoice.id === invoiceId ? payload.invoice : invoice))
        );
      });
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
          <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-4" key={invoice.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="font-semibold text-slate-950" href={`/invoices/${invoice.id}`}>
                  {invoice.invoiceNumber}
                </Link>
                <p className="mt-1 break-words text-sm text-slate-500">{invoice.projectName}</p>
                <p className="mt-2 break-words text-sm text-slate-700">
                  {invoice.customerDetails.clientName}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
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
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Due</p>
                <p className="mt-1 font-semibold text-slate-950">{invoice.dueDate}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-right">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Balance</p>
                <p className="mt-1 font-semibold text-slate-950">
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
                  {invoice.customerDetails.clientName}
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
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
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
                  <div className="flex justify-end gap-2">
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
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
          No invoices matched your filters.
        </div>
      ) : null}
    </section>
  );
}
