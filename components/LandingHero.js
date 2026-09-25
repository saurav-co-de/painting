import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import {
  IconCheck,
  IconInvoice,
  IconQuotation,
  IconCustomers,
  IconShieldCheck,
  IconDownload
} from "@/components/Icons";

const features = [
  {
    title: "Traditional Tax Invoice Format",
    description: "Itemized measurements, work description, square-footage/running-meter units, and compliant GST breakdown."
  },
  {
    title: "Quotations & Estimates",
    description: "Generate preliminary cost estimates and easily track validity, customer acceptance, and status."
  },
  {
    title: "Customer Directory & History",
    description: "Keep client GSTIN, contact numbers, and billing addresses saved for instant invoice generation."
  },
  {
    title: "Print & PDF Downloads",
    description: "Crisp vector-sharp PDF generation and printer-ready A4 layouts ready for WhatsApp and email dispatch."
  }
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Ideal for freelancers, individual contractors, and small workshops.",
    features: ["10 invoices per month", "Traditional GST format", "Customer directory", "PDF & print downloads"]
  },
  {
    name: "Pro",
    price: "₹799",
    period: "per month",
    popular: true,
    description: "For growing contractors, interior designers, and painting firms.",
    features: [
      "Unlimited invoices & quotations",
      "Custom branding & signature stamp",
      "Advance payment tracking",
      "Dual-database backup & resilience",
      "Priority WhatsApp sharing"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored",
    description: "For multi-site contracting firms requiring custom roles and data feeds.",
    features: [
      "Multi-user team access",
      "Custom billing templates",
      "Automated backup exports",
      "Dedicated account manager"
    ]
  }
];

export default function LandingHero() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="badge badge-paid">
              Contractor & Interior GST Invoicing
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Indian businesses bill faster with{" "}
              <span className="text-teal-700">BuildBill AI</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Create professional, traditional GST invoices and quotations in seconds.
              Track payments, manage client records, and generate print-ready PDFs without
              fighting complex accounting software.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link className="button-primary w-full sm:w-auto text-base py-3 px-6" href="/signup">
                Start Free Workspace
              </Link>
              <Link className="button-secondary w-full sm:w-auto text-base py-3 px-6" href="/login">
                Explore Demo Account
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <IconCheck className="w-4 h-4 text-teal-700" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <IconCheck className="w-4 h-4 text-teal-700" />
                CGST + SGST / IGST ready
              </span>
            </div>
          </div>

          {/* Interactive Invoice Sample Preview Card */}
          <div className="card p-6 shadow-md bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tax Invoice Preview
                </span>
                <p className="font-bold text-slate-900 text-lg">BB-2026-001</p>
              </div>
              <span className="badge badge-paid">Paid</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Billed To</span>
                <span className="font-semibold text-slate-800">Avanta Residences</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Project Site</span>
                <span className="font-semibold text-slate-800">3BHK Renovation</span>
              </div>
            </div>

            {/* Line items mini preview */}
            <div className="mt-4 rounded-lg bg-slate-50 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>Modular wardrobe installation</span>
                <span>₹74,000.00</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>False ceiling work</span>
                <span>₹81,250.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold text-sm">
                <span>Total Amount (incl. 18% GST)</span>
                <span className="text-teal-800">₹1,83,195.00</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>Ready for download in 1 click</span>
              <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                <IconDownload className="w-3.5 h-3.5" />
                <span>PDF Available</span>
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Everything contractor businesses need
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Built for real field requirements — no bloated corporate accounting baggage.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => (
              <div className="card p-6" key={feat.title}>
                <h3 className="font-bold text-slate-900 text-base">{feat.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans Section */}
        <section className="mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Transparent, simple pricing
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Start with free billing and upgrade when your client volume grows.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                className={`card p-6 flex flex-col justify-between ${
                  plan.popular ? "border-teal-600 ring-2 ring-teal-600/10 shadow-sm" : ""
                }`}
                key={plan.name}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    {plan.popular && (
                      <span className="badge badge-paid">Most Popular</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">{plan.description}</p>

                  <div className="mt-6 space-y-2.5 pt-6 border-t border-slate-100">
                    {plan.features.map((item) => (
                      <div className="flex items-center gap-2 text-xs text-slate-700" key={item}>
                        <IconCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    className={`w-full ${plan.popular ? "button-primary" : "button-secondary"}`}
                    href="/signup"
                  >
                    Get Started with {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} BuildBill AI. Simple, compliant Indian GST billing.</p>
      </footer>
    </div>
  );
}
