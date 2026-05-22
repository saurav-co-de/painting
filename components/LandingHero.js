import Link from "next/link";
import PublicNav from "@/components/PublicNav";

const features = [
  "Traditional Indian GST invoice format for contractors and interior firms",
  "Customer management, invoice history, payment tracking, and SaaS pricing",
  "PDF export, print-ready bills, and email or WhatsApp sharing links"
];

const plans = [
  { name: "Free", price: "Rs 0", detail: "10 invoices per month with core billing tools" },
  { name: "Pro", price: "Rs 799", detail: "Unlimited invoices, branding, reports, reminders" },
  { name: "Enterprise", price: "Custom", detail: "Team access, analytics, and API workflows" }
];

export default function LandingHero() {
  return (
    <>
      <PublicNav />
      <main className="relative overflow-hidden px-3 py-4 sm:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[1800px] space-y-6">
          <section className="hero-card min-h-[calc(100vh-7rem)] p-5 sm:p-10 lg:p-14">
            <div className="grid min-h-[calc(100vh-14rem)] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/90 sm:tracking-[0.22em]">
                  SaaS Billing Platform
                </span>
                <h1 className="font-display mt-6 max-w-5xl text-4xl leading-[1.04] text-white sm:text-6xl xl:text-7xl">
                  BuildBill AI helps Indian businesses bill like pros.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
                  Create professional GST invoices, track payments, manage customers, and
                  deliver polished PDFs that feel familiar to contractors, interiors teams,
                  painters, and fast-moving service businesses.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link className="button-light" href="/signup">
                    Start free
                  </Link>
                  <Link className="button-dark" href="/login">
                    View demo workspace
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/85">
                  <span className="break-all">Demo: demo@buildbill.ai</span>
                  <span>Password: buildbill123</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl sm:p-6">
                <div className="rounded-xl bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/20 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.24em]">
                        Invoice Snapshot
                      </p>
                      <h2 className="font-display mt-2 break-words text-2xl">BB-2026-014</h2>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-900 sm:tracking-[0.18em]">
                      Paid
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="stat-card bg-slate-950 text-white">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-400 sm:tracking-[0.18em]">Total</p>
                      <p className="mt-3 text-2xl font-semibold">Rs 1.84L</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.18em]">GST</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">Rs 27.9K</p>
                    </div>
                    <div className="stat-card">
                      <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.18em]">Items</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">12</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Modular kitchen installation</p>
                      <p className="shrink-0 text-sm font-semibold">Rs 82,600</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>CGST + SGST</span>
                      <span>18%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="glass-card p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)] sm:tracking-[0.28em]">
                Why teams choose it
              </p>
              <div className="mt-5 space-y-4">
                {features.map((feature) => (
                  <div className="rounded-xl border border-slate-200/75 bg-white/80 p-4" key={feature}>
                    <p className="text-sm leading-7 text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)] sm:tracking-[0.28em]">
                Subscription plans
              </p>
              <div className="mt-5 grid gap-4">
                {plans.map((plan) => (
                  <article className="rounded-xl border border-slate-200/75 bg-white/80 p-5" key={plan.name}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl text-slate-950">{plan.name}</h3>
                      <p className="text-lg font-semibold text-slate-950">{plan.price}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{plan.detail}</p>
                  </article>
                ))}
              </div>
              <Link className="button-primary mt-6" href="/pricing">
                Explore pricing
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
