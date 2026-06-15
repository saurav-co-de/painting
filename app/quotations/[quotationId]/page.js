import { requireUser } from "@/lib/auth";
import { findQuotationForUser } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";
import Link from "next/link";

export const metadata = {
  title: "Quotation Details"
};

export default async function QuotationPage({ params }) {
  const { quotationId } = await params;
  const user = await requireUser();
  const quotation = await findQuotationForUser(user.id, quotationId);

  if (!quotation) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-center">
        <p className="text-slate-600">Quotation not found.</p>
      </div>
    );
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
      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-950">{quotation.quotationNumber}</h1>
          <p className="mt-1 text-sm text-slate-600">{quotation.projectName}</p>
        </div>
        <div className="flex gap-3">
          <span className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold ${getStatusColor(quotation.status)}`}>
            {quotation.status}
          </span>
          <Link href={`/quotations/${quotationId}/edit`} className="button-secondary">
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Company & Customer Details */}
          <div className="glass-card grid gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:p-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">From</h3>
              <p className="mt-3 text-sm font-semibold text-slate-950">{quotation.companyDetails.companyName}</p>
              <p className="mt-1 text-sm text-slate-600">{quotation.companyDetails.address}</p>
              <p className="mt-1 text-sm text-slate-600">{quotation.companyDetails.phone}</p>
              <p className="mt-1 text-sm text-slate-600">{quotation.companyDetails.email}</p>
              {quotation.companyDetails.gstin && (
                <p className="mt-1 text-sm text-slate-600">GSTIN: {quotation.companyDetails.gstin}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">To</h3>
              <p className="mt-3 text-sm font-semibold text-slate-950">{quotation.customerDetails.clientName}</p>
              <p className="mt-1 text-sm text-slate-600">{quotation.customerDetails.address}</p>
              <p className="mt-1 text-sm text-slate-600">{quotation.customerDetails.mobile}</p>
              {quotation.customerDetails.gstNumber && (
                <p className="mt-1 text-sm text-slate-600">GSTIN: {quotation.customerDetails.gstNumber}</p>
              )}
            </div>
          </div>

          {/* Quotation Dates */}
          <div className="glass-card grid gap-4 p-4 sm:grid-cols-3 sm:p-6 lg:p-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Quotation Date</h3>
              <p className="mt-2 text-sm text-slate-950">{quotation.quotationDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Valid Until</h3>
              <p className="mt-2 text-sm text-slate-950">{quotation.validityDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Validity Period</h3>
              <p className="mt-2 text-sm text-slate-950">{quotation.validityPeriod}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="glass-card overflow-x-auto p-4 sm:p-6 lg:p-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/80">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Rate</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">GST %</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item) => (
                  <tr className="border-b border-slate-200/80" key={item.id}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}</td>
                    <td className="px-4 py-3 text-right">{item.gstPercentage}%</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes and Terms */}
          {(quotation.notes || quotation.terms) && (
            <div className="glass-card space-y-4 p-4 sm:p-6 lg:p-8">
              {quotation.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
              {quotation.terms && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Terms & Conditions</h3>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{quotation.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="glass-card p-4 sm:p-6 lg:p-8 h-fit">
          <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-semibold text-slate-950">{formatCurrency(quotation.totals.subtotal)}</span>
            </div>
            {quotation.taxMode !== "none" && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">
                  {quotation.taxMode === "inter" ? "IGST" : "GST"}
                </span>
                <span className="text-sm font-semibold text-slate-950">{formatCurrency(quotation.totals.gstTotal)}</span>
              </div>
            )}
            <div className="border-t border-slate-200/80 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-slate-950">Total</span>
              <span className="text-lg font-bold text-slate-950">{formatCurrency(quotation.totals.grandTotal)}</span>
            </div>
          </div>

          <button className="button-primary w-full mt-6">Download PDF</button>
          <button className="button-secondary w-full mt-2">Share</button>
        </div>
      </div>
    </div>
  );
}
