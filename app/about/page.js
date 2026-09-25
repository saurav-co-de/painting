import Link from "next/link";
import PublicNav from "@/components/PublicNav";

export const metadata = {
  title: "About"
};

const values = [
  {
    title: "Field-First Workflow",
    description: "Built for contractors, interior teams, and site supervisors who need to generate bills quickly without complex ERP hurdles."
  },
  {
    title: "Authentic Bill Layout",
    description: "Compliant Indian tax invoice layout featuring project site name, subject line, item measurements, CGST/SGST/IGST breakdown, and bank details."
  },
  {
    title: "High-Availability Resilience",
    description: "Dual-database cloud architecture combining primary storage with automatic secondary backup for zero data loss."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="space-y-8">
          <div>
            <span className="badge badge-paid">About BuildBill AI</span>
            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Billing software crafted for Indian trade businesses.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              We started BuildBill AI because existing accounting software is either too complicated,
              too expensive, or doesn&apos;t understand the traditional Indian billing format that clients and
              sub-contractors actually expect.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((val) => (
              <div className="card p-6" key={val.title}>
                <h3 className="font-bold text-slate-900 text-base">{val.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>

          <div className="card p-8 bg-slate-900 text-white border-0">
            <h2 className="text-xl font-bold">Why the traditional format matters</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
              Clients and project architects review bills on physical paper or WhatsApp PDFs.
              BuildBill AI matches the standard Indian bill format — complete with header GSTIN,
              site name, item table with square-footage rates, bank details, and an authorized signature.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="button-primary bg-teal-600 hover:bg-teal-500" href="/signup">
                Create Free Workspace
              </Link>
              <Link className="button-secondary bg-slate-800 text-white border-slate-700 hover:bg-slate-700" href="/pricing">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
