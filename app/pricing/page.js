import Link from "next/link";
import PublicNav from "@/components/PublicNav";

const plans = [
  {
    name: "Free",
    price: "₹0",
    detail: "For new freelancers and small shops",
    features: ["10 invoices/month", "Basic templates", "Customer records"]
  },
  {
    name: "Pro",
    price: "₹799/mo",
    detail: "For growing contractors and interiors teams",
    features: ["Unlimited invoices", "Custom branding", "GST summaries"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    detail: "For multi-user operations and advanced reporting",
    features: ["Team roles", "API access", "Advanced analytics"]
  }
];

export default function PricingPage() {
  return (
    <>
      <PublicNav />
      <main className="mx-auto w-full max-w-[1800px] px-3 py-5 sm:px-6 sm:py-10 xl:px-8">
        <section className="glass-card p-5 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
          Pricing
        </p>
        <h1 className="font-display mt-4 text-3xl text-slate-950 sm:text-5xl">
          Plans built for service businesses that invoice every week.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
          Start with a free workspace, upgrade when invoice volume grows, and move to
          enterprise when your team needs shared access and reports.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 sm:p-6" key={plan.name}>
              <h2 className="font-display text-3xl text-slate-950">{plan.name}</h2>
              <p className="mt-2 text-lg font-semibold text-slate-950">{plan.price}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{plan.detail}</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div className="rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm text-slate-700" key={feature}>
                    {feature}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="button-primary sm:w-auto" href="/signup">
            Start free
          </Link>
          <Link className="button-secondary sm:w-auto" href="/">
            Back to home
          </Link>
        </div>
        </section>
      </main>
    </>
  );
}
