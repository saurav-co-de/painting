"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import {
  IconDashboard,
  IconInvoice,
  IconQuotation,
  IconCustomers,
  IconSettings,
  IconPlus,
  IconMenu,
  IconX
} from "@/components/Icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/invoices", label: "Invoices", icon: IconInvoice },
  { href: "/quotations", label: "Quotations", icon: IconQuotation },
  { href: "/customers", label: "Customers", icon: IconCustomers },
  { href: "/settings", label: "Settings", icon: IconSettings }
];

export default function AppShell({ user, title, description, children, actions }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function isItemActive(href) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:hidden print:hidden">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
          >
            {mobileMenuOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>
          <Link className="flex items-center gap-2.5" href="/dashboard">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white shadow-xs">
              {user.logoText || "BB"}
            </span>
            <span className="truncate text-sm font-semibold text-slate-900 max-w-[150px] sm:max-w-[200px]">
              {user.businessName || "BuildBill AI"}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
            onClick={() => router.push("/invoices/new")}
            type="button"
          >
            <IconPlus className="w-3.5 h-3.5" />
            <span>New Bill</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                  {user.logoText || "BB"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.businessName}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.subscriptionPlan || "Pro"} plan</p>
                </div>
              </div>
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-1">
              {navItems.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-50 text-teal-800 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-teal-700" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto pt-5 border-t border-slate-100 space-y-3">
              <Link
                className="button-primary w-full text-center"
                href="/invoices/new"
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconPlus className="w-4 h-4" />
                <span>Create Invoice</span>
              </Link>
              <LogoutButton className="button-secondary w-full" />
            </div>
          </nav>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="mx-auto flex w-full max-w-[1600px] min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex print:hidden">
          {/* Logo & Workspace Info */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-xs">
              {user.logoText || "BB"}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-900">{user.businessName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-500 capitalize">{user.subscriptionPlan || "Pro"} workspace</span>
              </div>
            </div>
          </div>

          {/* Quick Create Invoice CTA */}
          <div className="mt-5">
            <Link
              className="button-primary w-full shadow-xs"
              href="/invoices/new"
            >
              <IconPlus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>

          {/* Main Navigation Links */}
          <nav className="mt-6 flex-1 space-y-1">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-teal-50/80 text-teal-800 font-semibold shadow-2xs border border-teal-200/50"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-teal-700" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Box */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-[11px] text-slate-400">{user.email}</p>
              </div>
            </div>
            <LogoutButton className="button-secondary w-full text-xs py-2" />
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Professional Compact Page Header */}
          <header className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-8 sm:py-5 print:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
