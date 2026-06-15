"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/billing";

export default function QuotationsTable({ quotations, user }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = quotations.filter((quotation) => {
    const matchesSearch =
      String(quotation.quotationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(search.toLowerCase()) ||
      quotation.projectName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <table className="w-full">
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
                  {quotation.customerName}
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
                  <Link
                    className="text-sm font-medium text-teal-700 hover:underline"
                    href={`/quotations/${quotation.id}`}
                  >
                    View
                  </Link>
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
    </div>
  );
}
