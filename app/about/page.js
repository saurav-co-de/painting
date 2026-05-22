import Link from "next/link";
import PublicNav from "@/components/PublicNav";

const values = [
  "Simple invoice creation for contractors, painters, interiors teams, and service businesses.",
  "Traditional bill format with GST, bank details, signature, advance payment, and PDF download.",
  "A clean SaaS workspace that works on mobile, tablet, and desktop."
];

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-6 sm:py-10 xl:px-8">
        <section className="glass-card p-5 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)] sm:tracking-[0.28em]">
            About BuildBill AI
          </p>
          <h1 className="font-display mt-4 text-3xl text-slate-950 sm:text-5xl">
            Billing software made for real service work.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            BuildBill AI helps small businesses create professional invoices quickly,
            manage customers, track payments, and download clean PDF bills without
            fighting complicated accounting software.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {values.map((value) => (
              <article className="rounded-xl border border-slate-200/80 bg-white/85 p-5" key={value}>
                <p className="text-sm leading-7 text-slate-700">{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 sm:tracking-[0.24em]">
              Built for Indian billing workflows
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
              The app focuses on practical invoice fields like GSTIN, site name,
              work subject, item table, GST options, advance payment, bank details,
              and signature upload so your downloaded bill is ready to send.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary sm:w-auto" href="/signup">
              Start free
            </Link>
            <Link className="button-secondary sm:w-auto" href="/pricing">
              View pricing
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
