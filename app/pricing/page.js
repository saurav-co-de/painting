import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import { IconCheck } from "@/components/Icons";

export const metadata = {
  title: "Pricing Plans"
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "For individual contractors, painters, and solo consultants.",
    features: [
      "10 invoices per month",
      "Traditional GST bill format",
      "Customer directory & address book",
      "Print-ready A4 & PDF export"
    ]
  },
  {
    name: "Pro",
    price: "₹799",
    period: "per month",
    popular: true,
    description: "For active contractors and interior designers issuing weekly bills.",
    features: [
      "Unlimited invoices & quotations",
      "Custom branding & logo initials",
      "Authorized digital signature stamp",
      "Advance payment calculation",
      "Dual-database resilience (Supabase + Mongo)",
      "WhatsApp & email bill links"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "custom billing",
    description: "For multi-supervisor contractor companies and commercial firms.",
    features: [
      "Team roles & multi-user access",
      "Custom billing templates",
      "Automated cloud backup sync",
      "API & webhook integrations",
      "Dedicated priority support"
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="badge badge-paid">Simple & Transparent</span>
          <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Fair pricing for service businesses.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Start for free and create your first 10 invoices. Upgrade anytime as your project pipeline grows.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              className={`card p-8 flex flex-col justify-between ${
                plan.popular ? "border-teal-600 ring-2 ring-teal-600/10 shadow-md" : ""
              }`}
              key={plan.name}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                  {plan.popular && <span className="badge badge-paid">Recommended</span>}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-500">/{plan.period}</span>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-600">{plan.description}</p>

                <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
                  {plan.features.map((feature) => (
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700" key={feature}>
                      <IconCheck className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  className={`w-full ${plan.popular ? "button-primary" : "button-secondary"}`}
                  href="/signup"
                >
                  Choose {plan.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
