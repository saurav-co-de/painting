"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/invoices/new", label: "Create" },
  { href: "/customers", label: "Customers" },
  { href: "/settings", label: "Settings" },
  { href: "/pricing", label: "Pricing" }
];

export default function AppShell({ user, title, description, children, actions }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--surface)] px-2.5 py-2.5 sm:px-5 xl:px-7 2xl:px-10 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-[1800px] print:max-w-none">
        <header className="glass-card sticky top-2 z-30 mb-4 p-3 lg:hidden print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                {user.logoText || "BB"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{user.businessName}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <button
              className="button-primary shrink-0 px-3 py-2 text-sm"
              onClick={() => router.push("/invoices/new")}
              type="button"
            >
              New
            </button>
          </div>

          <nav className="mobile-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-slate-50 shadow-md shadow-slate-900/15"
                      : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5 print:block">
        <aside className="glass-card sticky top-4 hidden h-[calc(100vh-2rem)] flex-col gap-6 overflow-y-auto p-5 xl:flex print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white">
                {user.logoText || "BB"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand)]">
                  BuildBill AI
                </p>
                <h1 className="font-display truncate text-xl text-slate-950">{user.businessName}</h1>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{user.name}</p>
              <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
              <p className="mt-3 inline-flex rounded-lg bg-teal-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                {user.subscriptionPlan} plan
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-slate-50 shadow-lg shadow-slate-900/20"
                      : "bg-slate-50 text-slate-700 hover:bg-white hover:text-slate-950 hover:shadow-sm"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                  <span
                    className={`text-xs uppercase tracking-[0.18em] ${
                      isActive
                        ? "text-emerald-200"
                        : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {isActive ? "Live" : "Go"}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <button
              className="button-secondary w-full"
              onClick={() => router.push("/invoices/new")}
              type="button"
            >
              Quick Invoice
            </button>
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0 space-y-5 print:space-y-0">
          <header className="glass-card p-4 sm:p-7 lg:p-8 print:hidden">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)] sm:tracking-[0.24em]">
                  SaaS Billing Workspace
                </p>
                <h2 className="font-display mt-3 break-words text-2xl text-slate-950 sm:text-4xl xl:text-5xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-600 sm:text-base">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div> : null}
            </div>
          </header>

          {children}
        </section>
        </div>
      </div>
    </main>
  );
}
