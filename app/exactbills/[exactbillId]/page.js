import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { findExactBillForUser } from "@/lib/db";
import { formatCurrency } from "@/lib/billing";

export const metadata = {
  title: "Exact Bill Details - BuildBill",
};

function calculateValidity(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return days;
}

export default async function ExactBillDetailPage({ params }) {
  const user = await requireUser();
  const { exactbillId } = await params;

  const exactbill = await findExactBillForUser(user.id, exactbillId);

  if (!exactbill) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Exact bill not found</p>
        <Link href="/exactbills" className="text-blue-600 hover:underline mt-4">
          Back to Exact Bills
        </Link>
      </div>
    );
  }

  const validityDays = calculateValidity(
    exactbill.exactbillDate,
    exactbill.validityDate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {exactbill.exactbillNumber}
          </h1>
          <p className="text-slate-600 mt-1">{exactbill.projectName}</p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-4 py-2 rounded-lg font-medium ${
              exactbill.status === "Draft"
                ? "bg-slate-100 text-slate-800"
                : exactbill.status === "Sent"
                  ? "bg-blue-100 text-blue-800"
                  : exactbill.status === "Accepted"
                    ? "bg-emerald-100 text-emerald-800"
                    : exactbill.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-orange-100 text-orange-800"
            }`}
          >
            {exactbill.status}
          </span>
          <Link
            href={`/exactbills/${exactbill.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company & Customer Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg">
            {/* From */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                From
              </h3>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-medium">
                  {exactbill.companyDetails?.companyName}
                </p>
                <p>{exactbill.companyDetails?.address}</p>
                <p>{exactbill.companyDetails?.phone}</p>
                <p>{exactbill.companyDetails?.email}</p>
                <p className="text-xs mt-2">
                  GSTIN: {exactbill.companyDetails?.gstin}
                </p>
              </div>
            </div>

            {/* To */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">To</h3>
              <div className="space-y-1 text-sm text-slate-700">
                <p className="font-medium">
                  {exactbill.customerDetails?.name}
                </p>
                <p>{exactbill.customerDetails?.address}</p>
                <p>{exactbill.customerDetails?.phone}</p>
                <p>{exactbill.customerDetails?.email}</p>
                {exactbill.customerDetails?.gstin && (
                  <p className="text-xs mt-2">
                    GSTIN: {exactbill.customerDetails?.gstin}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-6 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Exact Bill Date
              </h3>
              <p className="text-slate-700">{exactbill.exactbillDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Valid Until
              </h3>
              <p className="text-slate-700">{exactbill.validityDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Validity Period
              </h3>
              <p className="text-slate-700">{validityDays} days</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    GST %
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {exactbill.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-right">
                      {item.quantity && item.rate
                        ? exactbill.taxMode === "none"
                          ? "0%"
                          : exactbill.taxMode === "IGST"
                            ? "18%"
                            : "9%"
                        : "0%"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 text-right font-medium">
                      {formatCurrency(item.quantity * item.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Notes
              </h3>
              <p className="text-sm text-slate-700">{exactbill.notes}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Terms & Conditions
              </h3>
              <p className="text-sm text-slate-700">{exactbill.terms}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="bg-slate-50 rounded-lg p-6 h-fit sticky top-24">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-700">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(exactbill.subtotal || 0)}
              </span>
            </div>
            {exactbill.gst > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-700">GST</span>
                <span className="font-medium">
                  {formatCurrency(exactbill.gst || 0)}
                </span>
              </div>
            )}
            <div className="border-t pt-4 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(exactbill.total || 0)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Download PDF
            </button>
            <button className="w-full px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 text-sm font-medium">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
