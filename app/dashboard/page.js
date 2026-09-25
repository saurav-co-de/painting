import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/billing";
import { readDatabase } from "@/lib/db";
import {
  IconInvoice,
  IconQuotation,
  IconPlus,
  IconCheckCircle,
  IconAlertCircle,
  IconCustomers,
  IconSettings,
  IconEye,
  IconChevronRight
} from "@/components/Icons";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  try {
    const user = await requireUser();
    const database = await readDatabase();

    const invoices = (database.invoices || [])
      .filter((invoice) => invoice.userId === user.id)
      .sort((a, b) => new Date(b.createdAt || b.invoiceDate) - new Date(a.createdAt || a.invoiceDate));

    const quotations = (database.quotations || [])
      .filter((quotation) => quotation.userId === user.id)
      .sort((a, b) => new Date(b.createdAt || b.quotationDate) - new Date(a.createdAt || a.quotationDate));

    const customers = (database.customers || []).filter((c) => c.userId === user.id);

    // Business statistics calculation
    const totalInvoices = invoices.length;
    const totalQuotations = quotations.length;

    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const inv of invoices) {
      const grandTotal = Number(inv.totals?.grandTotal || 0);
      const advance = Number(inv.advancePayment || 0);
      const balance = inv.balanceDue != null ? Number(inv.balanceDue) : Math.max(grandTotal - advance, 0);

      if (inv.paymentStatus === "Paid") {
        paidAmount += grandTotal;
        paidCount++;
      } else {
        pendingAmount += balance;
        pendingCount++;
      }
    }

    const totalQuotationValue = quotations.reduce(
      (sum, q) => sum + Number(q.totals?.grandTotal || 0),
      0
    );

    return (
      <AppShell
        actions={
          <div className="flex items-center gap-2">
            <Link
              className="button-secondary text-xs sm:text-sm"
              href="/quotations/new"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>New Quotation</span>
            </Link>
            <Link
              className="button-primary text-xs sm:text-sm"
              href="/invoices/new"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </Link>
          </div>
        }
        description="Monitor billings, pending receivables, estimates, and customer activity at a glance."
        title="Business Overview"
        user={user}
      >
        {/* Metric Cards Grid */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Paid Revenue */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Paid Revenue
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <IconCheckCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(paidAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {paidCount} {paidCount === 1 ? "invoice" : "invoices"} settled
            </p>
          </div>

          {/* Pending Receivables */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Collections
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <IconAlertCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-amber-700">
              {formatCurrency(pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {pendingCount} {pendingCount === 1 ? "invoice" : "invoices"} awaiting payment
            </p>
          </div>

          {/* Total Invoices */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Invoices
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <IconInvoice className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {totalInvoices}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Issued to date</span>
              <Link className="font-semibold text-teal-700 hover:underline" href="/invoices">
                View all
              </Link>
            </div>
          </div>

          {/* Total Quotations */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estimates & Quotes
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <IconQuotation className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {totalQuotations}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{formatCurrency(totalQuotationValue)} pipeline</span>
              <Link className="font-semibold text-teal-700 hover:underline" href="/quotations">
                View all
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Shortcuts Bar */}
        <section className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            className="card card-hover flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700"
            href="/invoices/new"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-100 text-teal-800">
              <IconPlus className="w-3.5 h-3.5" />
            </span>
            <span>Create New Invoice</span>
          </Link>
          <Link
            className="card card-hover flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700"
            href="/quotations/new"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 text-indigo-800">
              <IconPlus className="w-3.5 h-3.5" />
            </span>
            <span>New Quotation</span>
          </Link>
          <Link
            className="card card-hover flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700"
            href="/customers"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700">
              <IconCustomers className="w-3.5 h-3.5" />
            </span>
            <span>Customer Directory ({customers.length})</span>
          </Link>
          <Link
            className="card card-hover flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700"
            href="/settings"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700">
              <IconSettings className="w-3.5 h-3.5" />
            </span>
            <span>Branding & GST Settings</span>
          </Link>
        </section>

        {/* Recent Invoices & Recent Quotations Grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent Invoices Section */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Invoices</h2>
                <p className="text-xs text-slate-500">Latest billing activity</p>
              </div>
              <Link
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                href="/invoices"
              >
                <span>View all ({totalInvoices})</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {invoices.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((invoice) => {
                  const clientName = invoice.customerDetails?.clientName || "Unnamed Client";
                  const isPaid = invoice.paymentStatus === "Paid";
                  const isOverdue = invoice.paymentStatus === "Overdue";

                  return (
                    <div
                      className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/70"
                      key={invoice.id}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <Link
                            className="font-semibold text-sm text-slate-900 hover:text-teal-700 transition-colors"
                            href={`/invoices/${invoice.id}`}
                          >
                            {invoice.invoiceNumber}
                          </Link>
                          <span
                            className={`badge ${
                              isPaid ? "badge-paid" : isOverdue ? "badge-overdue" : "badge-pending"
                            }`}
                          >
                            {invoice.paymentStatus}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {clientName} · {invoice.projectName || "General Work"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(invoice.totals?.grandTotal || 0)}
                        </p>
                        <Link
                          className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-teal-700 transition-colors"
                          href={`/invoices/${invoice.id}`}
                        >
                          <IconEye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <IconInvoice className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No invoices generated yet</p>
                <Link className="button-primary mt-4 text-xs" href="/invoices/new">
                  Create your first invoice
                </Link>
              </div>
            )}
          </div>

          {/* Recent Quotations Section */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Quotations</h2>
                <p className="text-xs text-slate-500">Latest cost estimates</p>
              </div>
              <Link
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                href="/quotations"
              >
                <span>View all ({totalQuotations})</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {quotations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {quotations.slice(0, 5).map((quotation) => {
                  const clientName =
                    quotation.customerDetails?.clientName ||
                    quotation.customerName ||
                    "Client";
                  const status = quotation.status || "Draft";
                  const badgeClass =
                    status === "Accepted"
                      ? "badge-accepted"
                      : status === "Sent"
                        ? "badge-sent"
                        : status === "Rejected"
                          ? "badge-rejected"
                          : "badge-draft";

                  return (
                    <div
                      className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/70"
                      key={quotation.id}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <Link
                            className="font-semibold text-sm text-slate-900 hover:text-teal-700 transition-colors"
                            href={`/quotations/${quotation.id}`}
                          >
                            {quotation.quotationNumber}
                          </Link>
                          <span className={`badge ${badgeClass}`}>{status}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {clientName} · {quotation.projectName || "General Work"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(quotation.totals?.grandTotal || 0)}
                        </p>
                        <Link
                          className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-teal-700 transition-colors"
                          href={`/quotations/${quotation.id}`}
                        >
                          <IconEye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <IconQuotation className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No quotations prepared yet</p>
                <Link className="button-secondary mt-4 text-xs" href="/quotations/new">
                  Create your first quotation
                </Link>
              </div>
            )}
          </div>
        </section>
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
