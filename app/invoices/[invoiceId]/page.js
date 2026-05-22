import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatRupeesInWords } from "@/lib/billing";
import { readDatabase } from "@/lib/db";

export default async function InvoiceDetailPage({ params }) {
  const user = await requireUser().catch(() => redirect("/login"));
  const { invoiceId } = await params;
  const database = await readDatabase();
  const invoice = database.invoices.find(
    (entry) => entry.id === invoiceId && entry.userId === user.id
  );

  if (!invoice) {
    redirect("/invoices");
  }

  const companyDetails = {
    ...invoice.companyDetails,
    accountNumber: invoice.companyDetails.accountNumber || user.accountNumber || "",
    ifscCode: invoice.companyDetails.ifscCode || user.ifscCode || "",
    bankName: invoice.companyDetails.bankName || user.bankName || "",
    branch: invoice.companyDetails.branch || user.branch || "",
    signatureImage: invoice.companyDetails.signatureImage || user.signatureImage || ""
  };
  const shareText = encodeURIComponent(
    `Invoice ${invoice.invoiceNumber} for ${invoice.customerDetails.clientName} - ${formatCurrency(invoice.totals.grandTotal)}`
  );
  const billSubject = invoice.billSubject || invoice.projectName || "Work";
  const isWithoutGst = invoice.taxMode === "none";
  const taxLabel = invoice.totals.igstTotal > 0 ? "IGST" : "GST";
  const advancePayment = Number(invoice.advancePayment || 0);
  const balanceDue =
    invoice.balanceDue ?? Math.round(Math.max(invoice.totals.grandTotal - advancePayment, 0) * 100) / 100;
  const payableAmount = advancePayment > 0 ? balanceDue : invoice.totals.grandTotal;

  return (
      <AppShell
        actions={
          <>
            <a
              className="button-primary"
              download={`${invoice.invoiceNumber}.pdf`}
              href={`/api/invoices/${invoice.id}/pdf`}
            >
              Download PDF
            </a>
            <a className="button-secondary" href={`mailto:${user.email}?subject=${invoice.invoiceNumber}&body=${shareText}`}>
              Email
            </a>
            <a className="button-secondary" href={`https://wa.me/?text=${shareText}`} rel="noreferrer" target="_blank">
              WhatsApp
            </a>
          </>
        }
        description="Review the final invoice, download the PDF, or share it with the customer."
        title={`Invoice ${invoice.invoiceNumber}`}
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
                  <p className="mt-5">{invoice.customerDetails.clientName}</p>
                  <p>{invoice.customerDetails.address}</p>
                  <p>GSTN : {invoice.customerDetails.gstNumber || "-"}</p>
                </div>
                  <p className="self-start text-center font-semibold">
                  <span className="premium-underline">Tax Invoice No: {invoice.invoiceNumber}</span>
                </p>
                <p className="text-right font-semibold">Date : {invoice.invoiceDate}</p>
              </div>

              <p className="mt-4 text-lg font-semibold">Site : {invoice.projectName}</p>
              <div className="mt-4 text-center text-base font-semibold">
                <span className="premium-underline">Sub : Bill for {billSubject}</span>
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
                    {invoice.items.map((item, index) => (
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
                        {Number(invoice.totals.subtotal).toFixed(2)}
                      </td>
                    </tr>
                    {!isWithoutGst && invoice.totals.igstTotal > 0 ? (
                      <tr>
                        <td className="border border-slate-800 px-1 py-1" />
                        <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                          <span className="float-right font-semibold">{taxLabel}</span>
                        </td>
                        <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                          {Number(invoice.totals.igstTotal).toFixed(2)}
                        </td>
                      </tr>
                    ) : null}
                    {!isWithoutGst && invoice.totals.igstTotal <= 0 ? (
                      <>
                        <tr>
                          <td className="border border-slate-800 px-1 py-1" />
                          <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                            <span className="float-right font-semibold">CGST</span>
                          </td>
                          <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                            {Number(invoice.totals.cgstTotal).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-800 px-1 py-1" />
                          <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                            <span className="float-right font-semibold">SGST</span>
                          </td>
                          <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                            {Number(invoice.totals.sgstTotal).toFixed(2)}
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
                        {Number(invoice.totals.grandTotal).toFixed(2)}
                      </td>
                    </tr>
                    {advancePayment > 0 ? (
                      <>
                        <tr>
                          <td className="border border-slate-800 px-1 py-1" />
                          <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                            <span className="float-right pr-4 whitespace-nowrap text-[9px] font-semibold sm:text-[10px]">
                              Advance Payment
                            </span>
                          </td>
                          <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                            {Number(advancePayment).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-800 px-1 py-1" />
                          <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                            <span className="float-right pr-4 font-semibold">Balance Due</span>
                          </td>
                          <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                            {Number(balanceDue).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 text-sm font-semibold sm:text-base">
                ({formatRupeesInWords(payableAmount)})
              </p>

              <div className="mt-5 font-medium">
                <p className="underline">Bank Details:</p>
                <p>Bank Holder Name : {companyDetails.companyName}</p>
                <p>A/c Number : {companyDetails.accountNumber || "-"}</p>
                <p>IFSC Code : {companyDetails.ifscCode || "-"}</p>
                <p>Bank Name : {companyDetails.bankName || "-"}</p>
                <p>Branch : {companyDetails.branch || "-"}</p>
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
                <Link className="text-sm font-semibold text-[var(--brand)]" href="/invoices">
                  Back to invoice history
                </Link>
              </div>
            </article>
          </div>
        </section>
      </AppShell>
    );
}
