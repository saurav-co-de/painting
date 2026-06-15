"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/billing";

const STATUS_COLORS = {
  Draft: "bg-slate-100 text-slate-800",
  Sent: "bg-blue-100 text-blue-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  Expired: "bg-orange-100 text-orange-800",
};

export default function ExactBillsTable({ exactbills = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredBills = useMemo(() => {
    return exactbills.filter((bill) => {
      const matchesSearch =
        bill.exactbillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerDetails?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || bill.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exactbills, searchTerm, statusFilter]);

  if (exactbills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No exact bills found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search exact bill number, client, or project"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="All">All</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b-2 border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Exact Bill
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Client
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Valid Until
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Total
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredBills.map((bill) => (
              <tr
                key={bill.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <Link
                      href={`/exactbills/${bill.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {bill.exactbillNumber}
                    </Link>
                    {bill.projectName && (
                      <p className="text-sm text-slate-600">
                        {bill.projectName}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {bill.customerDetails?.name || "Unknown"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {bill.validityDate}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {formatCurrency(bill.total)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[bill.status] || "bg-slate-100"
                    }`}
                  >
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/exactbills/${bill.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBills.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          No exact bills match your search
        </div>
      )}
    </div>
  );
}
