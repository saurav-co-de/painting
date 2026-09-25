import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatRupeesInWords } from "@/lib/billing";
import { listInvoicesForUser } from "@/lib/db";
import {
  IconDownload,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
  IconMail,
  IconWhatsApp
} from "@/components/Icons";

export const metadata = {
  title: "Invoice Details"
};

export default async function InvoiceDetailPage({ params }) {
  const user = await requireUser().catch(() => redirect("/login"));
  const { invoiceId } = await params;
  const invoices = (await listInvoicesForUser(user.id)).sort(
    (left, right) => new Date(right.createdAt || right.invoiceDate) - new Date(left.createdAt || left.invoiceDate)
  );
  const currentIndex = invoices.findIndex((entry) => entry.id === invoiceId);
  const invoice = invoices[currentIndex];

  if (!invoice) {
    redirect("/invoices");
  }

  const companyDetails = {
    ...invoice.companyDetails,
    accountNumber: invoice.companyDetails?.accountNumber || user.accountNumber || "",
    ifscCode: invoice.companyDetails?.ifscCode || user.ifscCode || "",
    bankName: invoice.companyDetails?.bankName || user.bankName || "",
    branch: invoice.companyDetails?.branch || user.branch || "",
    signatureImage: invoice.companyDetails?.signatureImage || user.signatureImage || ""
  };
  const customerDetails = invoice.customerDetails || {};
  const customerName = customerDetails.clientName || "-";
  const shareText = encodeURIComponent(
    `Invoice ${invoice.invoiceNumber} for ${customerName} - ${formatCurrency(invoice.totals?.grandTotal || 0)}`
  );
  const billSubject = invoice.billSubject || invoice.projectName || "Work";
  const isWithoutGst = invoice.taxMode === "none";
  const taxLabel = invoice.totals?.igstTotal > 0 ? "IGST" : "GST";
  const advancePayment = Number(invoice.advancePayment || 0);
  const balanceDue =
    invoice.balanceDue != null
      ? invoice.balanceDue
      : Math.round(Math.max((invoice.totals?.grandTotal || 0) - advancePayment, 0) * 100) / 100;
  const payableAmount = advancePayment > 0 ? balanceDue : (invoice.totals?.grandTotal || 0);
  const previousInvoice = currentIndex > 0 ? invoices[currentIndex - 1] : null;
  const nextInvoice = currentIndex < invoices.length - 1 ? invoices[currentIndex + 1] : null;

  return (
    <AppShell
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="button-secondary text-xs sm:text-sm py-2"
            href={`/invoices/${invoice.id}/edit`}
          >
            <IconEdit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit</span>
          </Link>
          <a
            className="button-primary text-xs sm:text-sm py-2"
            download={`${invoice.invoiceNumber}.pdf`}
            href={`/api/invoices/${invoice.id}/pdf`}
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
          <a
            className="button-secondary text-xs sm:text-sm py-2"
            href={`mailto:${user.email}?subject=${invoice.invoiceNumber}&body=${shareText}`}
            title="Share via Email"
          >
            <IconMail className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Email</span>
          </a>
          <a
            className="button-secondary text-xs sm:text-sm py-2"
            href={`https://wa.me/?text=${shareText}`}
            rel="noreferrer"
            target="_blank"
            title="Share via WhatsApp"
          >
            <IconWhatsApp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      }
      description="Review final tax invoice, download print-ready PDF, or share with client."
      title={`Invoice ${invoice.invoiceNumber}`}
      user={user}
    >
      {/* Sub-Navigation Bar */}
      <nav className="card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between print:hidden mb-5">
        <Link
          className="button-ghost text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 self-start sm:self-auto"
          href="/invoices"
        >
          <IconChevronLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {previousInvoice ? (
            <Link
              className="button-secondary text-xs py-1.5 px-2.5"
              href={`/invoices/${previousInvoice.id}`}
              title="Previous Invoice"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
              <span>{previousInvoice.invoiceNumber}</span>
            </Link>
          ) : (
            <span className="button-secondary text-xs py-1.5 px-2.5 opacity-40 cursor-not-allowed">
              <IconChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </span>
          )}
          {nextInvoice ? (
            <Link
              className="button-secondary text-xs py-1.5 px-2.5"
              href={`/invoices/${nextInvoice.id}`}
              title="Next Invoice"
            >
              <span>{nextInvoice.invoiceNumber}</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span className="button-secondary text-xs py-1.5 px-2.5 opacity-40 cursor-not-allowed">
              <span>Next</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </nav>

      {/* Printable Sheet Card */}
      <section className="card overflow-hidden p-2 sm:p-6 print:overflow-visible print:bg-white print:p-0 print:border-0 print:shadow-none">
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

            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div className="font-medium">
                <p>To,</p>
                <p className="mt-5">{customerName}</p>
                <p>{customerDetails.address || "-"}</p>
                <p>GSTN : {customerDetails.gstNumber || "-"}</p>
              </div>
              <p className="self-start text-center font-semibold">
                <span className="premium-underline">Tax Invoice No: {invoice.invoiceNumber}</span>
              </p>
              <p className="font-semibold sm:text-right">Date : {invoice.invoiceDate}</p>
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
                      {Number(invoice.totals?.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>
                  {!isWithoutGst && invoice.totals?.igstTotal > 0 ? (
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
                  {!isWithoutGst && Number(invoice.totals?.igstTotal || 0) <= 0 ? (
                    <>
                      <tr>
                        <td className="border border-slate-800 px-1 py-1" />
                        <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                          <span className="float-right font-semibold">CGST</span>
                        </td>
                        <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                          {Number(invoice.totals?.cgstTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 px-1 py-1" />
                        <td className="border border-slate-800 px-2 py-1" colSpan={4}>
                          <span className="float-right font-semibold">SGST</span>
                        </td>
                        <td className="invoice-num border border-slate-800 px-1 py-1 text-right font-semibold">
                          {Number(invoice.totals?.sgstTotal || 0).toFixed(2)}
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
                      {Number(invoice.totals?.grandTotal || 0).toFixed(2)}
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

            <div className="mt-auto grid gap-6 pt-10 font-medium sm:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)] sm:items-end sm:gap-8">
              <p className="pb-2">Thanking You</p>
              <div className="justify-self-start text-center sm:justify-self-end">
                <p className="mb-2 max-w-56 break-words">For {companyDetails.companyName}</p>
                <div className="flex h-14 w-full max-w-56 items-center justify-center overflow-hidden">
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
          </article>
        </div>
      </section>
    </AppShell>
  );
}
