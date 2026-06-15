import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatRupeesInWords } from "@/lib/billing";
import { findQuotationForUser } from "@/lib/db";

export const metadata = {
  title: "Quotation Details"
};

export default async function QuotationPage({ params }) {
  const user = await requireUser().catch(() => redirect("/login"));
  const { quotationId } = await params;
  const quotation = await findQuotationForUser(user.id, quotationId);

  if (!quotation) {
    redirect("/quotations");
  }

  const companyDetails = {
    ...quotation.companyDetails,
    accountNumber: quotation.companyDetails.accountNumber || user.accountNumber || "",
    ifscCode: quotation.companyDetails.ifscCode || user.ifscCode || "",
    bankName: quotation.companyDetails.bankName || user.bankName || "",
    branch: quotation.companyDetails.branch || user.branch || "",
    signatureImage: quotation.companyDetails.signatureImage || user.signatureImage || ""
  };
  const quoteSubject = quotation.description || quotation.projectName || "Work";
  const isWithoutGst = quotation.taxMode === "none";
  const customerDetails = quotation.customerDetails || {};
  const customerName = customerDetails.clientName || "";
  const shareText = encodeURIComponent(
    `Quotation ${quotation.quotationNumber}${customerName ? ` for ${customerName}` : ""} - ${formatCurrency(quotation.totals.grandTotal)}`
  );

  return (
    <AppShell
      actions={
        <>
          <a
            className="button-secondary"
            href={`mailto:${user.email}?subject=${quotation.quotationNumber}&body=${shareText}`}
          >
            Email
          </a>
          <a
            className="button-secondary"
            href={`https://wa.me/?text=${shareText}`}
            rel="noreferrer"
            target="_blank"
          >
            WhatsApp
          </a>
        </>
      }
      description="Review the quotation in the same bill format used for invoices."
      title={`Quotation ${quotation.quotationNumber}`}
      user={user}
    >
      <section className="glass-card mobile-scrollbar overflow-x-auto p-2 sm:p-6 print:overflow-visible print:bg-white print:p-0 print:shadow-none">
        <div className="invoice-sheet mx-auto bg-white p-4 text-slate-950 shadow-sm ring-1 ring-slate-200 sm:p-6 print:p-0 print:shadow-none print:ring-0">
          <article className="flex min-h-[277mm] flex-col border-2 border-slate-900 p-4 font-sans text-[12px] leading-5 sm:p-5 print:min-h-[277mm]">
            <header className="border-b-2 border-slate-700 pb-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-medium text-slate-700">
                <span className="break-words">GSTIN : {companyDetails.gstin || "-"}</span>
                <span className="break-words">Mob : {companyDetails.phone || "-"}</span>
              </div>
              <h2 className="mt-2 text-center text-3xl font-bold uppercase text-red-700 sm:text-4xl">
                {companyDetails.companyName}
              </h2>
              <p className="mt-1 text-center text-xs font-medium sm:text-sm">
                {companyDetails.address || "-"}
              </p>
            </header>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] gap-4">
              <div className="font-medium">
                <p>To,</p>
                {customerName ? <p className="mt-5">{customerName}</p> : null}
                {customerDetails.address ? <p>{customerDetails.address}</p> : null}
                {customerDetails.gstNumber ? <p>GSTN : {customerDetails.gstNumber}</p> : null}
              </div>
              <p className="self-start text-center font-semibold">
                <span className="premium-underline">
                  Quotation No: {quotation.quotationNumber}
                </span>
              </p>
              <div className="text-right font-semibold">
                <p>Date : {quotation.quotationDate}</p>
                <p>Valid Until : {quotation.validityDate}</p>
              </div>
            </div>

            <p className="mt-4 text-lg font-semibold">Site : {quotation.projectName}</p>
            <div className="mt-4 text-center text-base font-semibold">
              <span className="premium-underline">Sub : Quotation for {quoteSubject}</span>
            </div>

            <div className="mt-4">
              <table className="invoice-table w-full border-collapse border border-slate-800 text-left text-[10px]">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[49%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="border border-slate-800 px-1 py-1 align-top">Sl</th>
                    <th className="border border-slate-800 px-2 py-1 align-top">Description</th>
                    <th className="border border-slate-800 px-1 py-1 text-center align-top">Unit</th>
                    <th className="border border-slate-800 px-1 py-1 text-center align-top">Qty</th>
                    <th className="border border-slate-800 px-1 py-1 text-right align-top">Rate</th>
                    <th className="border border-slate-800 px-1 py-1 text-right align-top">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.id || item.description}>
                      <td className="invoice-num border border-slate-800 px-1 py-1 align-top">
                        {String(index + 1).padStart(2, "0")}.
                      </td>
                      <td className="border border-slate-800 px-2 py-1 align-top">
                        {item.description}
                      </td>
                      <td className="border border-slate-800 px-1 py-1 text-center align-top">
                        {item.unit}
                      </td>
                      <td className="invoice-num border border-slate-800 px-1 py-1 text-center align-top">
                        {item.quantity}
                      </td>
                      <td className="invoice-num border border-slate-800 px-1 py-1 text-right align-top">
                        {Number(item.rate).toFixed(2)}
                      </td>
                      <td className="invoice-num border border-slate-800 px-1 py-1 text-right align-top">
                        {Number(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-slate-800 px-1 py-1" />
                    <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                      <span className="float-right font-semibold">Total</span>
                    </td>
                    <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                      {Number(quotation.totals.subtotal).toFixed(2)}
                    </td>
                  </tr>
                  {!isWithoutGst && quotation.totals.igstTotal > 0 ? (
                    <tr>
                      <td className="border border-slate-800 px-1 py-1" />
                      <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                        <span className="float-right font-semibold">IGST</span>
                      </td>
                      <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                        {Number(quotation.totals.igstTotal).toFixed(2)}
                      </td>
                    </tr>
                  ) : null}
                  {!isWithoutGst && quotation.totals.igstTotal <= 0 ? (
                    <>
                      <tr>
                        <td className="border border-slate-800 px-1 py-1" />
                        <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                          <span className="float-right font-semibold">CGST</span>
                        </td>
                        <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                          {Number(quotation.totals.cgstTotal).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 px-1 py-1" />
                        <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                          <span className="float-right font-semibold">SGST</span>
                        </td>
                        <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                          {Number(quotation.totals.sgstTotal).toFixed(2)}
                        </td>
                      </tr>
                    </>
                  ) : null}
                  <tr>
                    <td className="border border-slate-800 px-1 py-1" />
                    <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                      <span className="float-right font-semibold">Grand Total</span>
                    </td>
                    <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                      {Number(quotation.totals.grandTotal).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-5 text-sm font-semibold sm:text-base">
              ({formatRupeesInWords(quotation.totals.grandTotal)})
            </p>

            <div className="mt-4 font-medium">
              {quotation.notes ? <p>Notes : {quotation.notes}</p> : null}
              {quotation.terms ? <p>Terms : {quotation.terms}</p> : null}
              {quotation.validityPeriod ? <p>Validity : {quotation.validityPeriod}</p> : null}
            </div>

            <div className="mt-auto grid grid-cols-[1fr_14rem] items-end gap-8 pt-10 font-medium">
              <p className="pb-2">Thanking You</p>
              <div className="justify-self-end text-center">
                <p className="mb-2 max-w-56 break-words">For {companyDetails.companyName}</p>
                <div className="flex h-14 w-56 items-center justify-center overflow-hidden">
                  {companyDetails.signatureImage ? (
                    <img
                      alt="Authorized signature"
                      className="max-h-14 max-w-44 object-contain"
                      src={companyDetails.signatureImage}
                    />
                  ) : null}
                </div>
                <p className="mt-1 font-semibold">Proprietor</p>
              </div>
            </div>

            <div className="mt-8 print:hidden">
              <Link className="text-sm font-semibold text-[var(--brand)]" href="/quotations">
                Back to quotation history
              </Link>
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
