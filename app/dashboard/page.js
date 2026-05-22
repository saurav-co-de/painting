import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { buildDashboardStats, formatCurrency } from "@/lib/billing";
import { readDatabase } from "@/lib/db";

function MetricCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone === "dark" ? "bg-slate-950 text-white" : ""}`}>
      <p className={`text-xs uppercase tracking-[0.18em] ${tone === "dark" ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-4 break-words text-2xl font-semibold sm:text-3xl">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  try {
    const user = await requireUser();
    const database = await readDatabase();
    const invoices = database.invoices
      .filter((invoice) => invoice.userId === user.id)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const stats = buildDashboardStats(invoices);

    return (
      <AppShell
        actions={<Link className="button-primary" href="/invoices/new">Create invoice</Link>}
        description="Track revenue, monitor pending collections, and jump straight into customer or invoice actions."
        title="Business dashboard"
        user={user}
      >
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total invoices" tone="dark" value={stats.totalInvoices} />
          <MetricCard label="Monthly revenue" value={formatCurrency(stats.monthlyRevenue)} />
          <MetricCard label="Pending payments" value={formatCurrency(stats.pendingPayments)} />
          <MetricCard label="Paid invoices" value={stats.paidInvoices} />
        </section>

        <section className="grid gap-5 2xl:grid-cols-[1.25fr_0.75fr]">
          <div className="glass-card p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  Recent invoices
                </p>
                <h3 className="font-display mt-3 text-2xl text-slate-950">Latest billing activity</h3>
              </div>
              <Link className="shrink-0 text-sm font-semibold text-[var(--brand)]" href="/invoices">
                View all
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <article className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 sm:p-5" key={invoice.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link className="text-lg font-semibold text-slate-950" href={`/invoices/${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {invoice.customerDetails.clientName} · {invoice.projectName}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-slate-950">
                        {formatCurrency(invoice.totals.grandTotal)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {invoice.paymentStatus}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
              BuildBill AI roadmap
            </p>
            <div className="mt-5 space-y-4">
              {[
                "AI OCR bill reader for auto-filling invoice fields from uploaded images",
                "Voice billing workflows for rapid contractor invoicing on-site",
                "Inventory, quotations, purchase orders, and analytics in future phases"
              ].map((point) => (
                <div className="rounded-2xl bg-white/75 p-4 text-sm leading-7 text-slate-700" key={point}>
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick actions</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link className="button-light w-full justify-center" href="/customers">
                  Manage customers
                </Link>
                <Link className="button-dark w-full justify-center border-white/15 bg-white/10 text-white" href="/settings">
                  Update branding
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AppShell>
    );
  } catch {
    redirect("/login");
  }
}
