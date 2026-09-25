"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonResponse } from "@/lib/api";
import {
  IconCheckCircle,
  IconAlertCircle,
  IconInvoice,
  IconQuotation,
  IconShieldCheck,
  IconPlus,
  IconChevronLeft
} from "@/components/Icons";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    phone: ""
  });
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setStatus({ tone: "", message: "" });

    try {
      await submitAuth(form);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAuth(authForm) {
    try {
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(authForm)
      });
      const payload = await readJsonResponse(response, "Unable to continue.");

      if (!response.ok) {
        throw new Error(payload.error || "Unable to continue.");
      }

      router.refresh();
      router.replace("/dashboard");
    } catch (error) {
      setStatus({
        tone: "error",
        message: error.message
      });
    }
  }

  async function handleDemoLogin() {
    setIsLoading(true);
    setStatus({ tone: "", message: "" });
    const demoForm = {
      ...form,
      email: "demo@buildbill.ai",
      password: "buildbill123"
    };

    setForm(demoForm);

    try {
      await submitAuth(demoForm);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email.trim()) {
      setStatus({
        tone: "error",
        message: "Enter your email address in the field above first, then click Forgot password."
      });
      return;
    }

    setIsLoading(true);
    setStatus({ tone: "", message: "" });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: form.email })
      });
      const payload = await readJsonResponse(response, "Could not start password reset.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not start password reset.");
      }

      setStatus({
        tone: "success",
        message: payload.resetUrl ? `${payload.message} ${payload.resetUrl}` : payload.message
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
      {/* Brand Value Column */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link className="inline-flex items-center gap-2.5" href="/" title="Return to Home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold text-white shadow-xs">
              BB
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              BuildBill AI
            </span>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors py-1.5 px-3 rounded-lg border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 lg:hidden"
            href="/"
          >
            <IconChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div>
          <span className="badge badge-paid">Indian GST Billing</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {isSignup
              ? "Start issuing GST invoices in under 2 minutes."
              : "Welcome back to your billing workspace."}
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
            Professional tax invoicing and quotation software crafted specifically for contractors,
            interior designers, painters, and fast-moving trade service businesses.
          </p>
        </div>

        {/* Highlight Badges */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="card p-3.5 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Format</span>
            <p className="mt-1 font-bold text-slate-900 text-sm">Contractor Bill</p>
          </div>
          <div className="card p-3.5 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Taxes</span>
            <p className="mt-1 font-bold text-slate-900 text-sm">CGST + SGST / IGST</p>
          </div>
          <div className="card p-3.5 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Exports</span>
            <p className="mt-1 font-bold text-slate-900 text-sm">Print & PDF</p>
          </div>
        </div>

        {/* Demo Credentials Box */}
        <div className="rounded-xl border border-teal-200/70 bg-teal-50/60 p-4 text-xs text-teal-900">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider">Demo Account Credentials</span>
            <button
              className="text-xs font-semibold text-teal-800 underline hover:text-teal-950"
              onClick={handleDemoLogin}
              type="button"
            >
              One-Click Demo Login →
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-slate-400 block">Email:</span>
              <span className="font-mono font-medium">demo@buildbill.ai</span>
            </div>
            <div>
              <span className="text-slate-400 block">Password:</span>
              <span className="font-mono font-medium">buildbill123</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card Column */}
      <div className="card p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isSignup ? "Create Your Free Workspace" : "Sign In to Your Account"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSignup ? "No credit card required. Free 10 invoices every month." : "Enter your email and password to continue."}
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shrink-0"
            href="/"
            title="Return to Home page"
          >
            <IconChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Back to Home</span>
          </Link>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  className="field"
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Raghav Menon"
                  required
                  value={form.name}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Business / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  className="field"
                  onChange={(event) => updateField("businessName", event.target.value)}
                  placeholder="e.g. BuildCraft Interiors"
                  required
                  value={form.businessName}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Phone Number
                </label>
                <input
                  className="field"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  value={form.phone}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              className="field"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@company.com"
              required
              type="email"
              value={form.email}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              {!isSignup && (
                <button
                  className="text-xs text-teal-700 hover:text-teal-800 font-medium"
                  onClick={handleForgotPassword}
                  type="button"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              className="field"
              minLength={8}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="••••••••"
              required
              type="password"
              value={form.password}
            />
          </div>

          {status.message && (
            <div
              className={`rounded-lg p-3 text-xs leading-relaxed flex items-start gap-2 ${
                status.tone === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {status.tone === "error" ? (
                <IconAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              ) : (
                <IconCheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <button
            className="button-primary w-full"
            disabled={isLoading}
            type="submit"
          >
            {isLoading
              ? "Processing..."
              : isSignup
                ? "Create Workspace"
                : "Sign In"}
          </button>

          {!isSignup && (
            <button
              className="button-secondary w-full"
              disabled={isLoading}
              onClick={handleDemoLogin}
              type="button"
            >
              Use Demo Account (One-Click)
            </button>
          )}

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
            {isSignup ? (
              <p>
                Already have an account?{" "}
                <Link className="font-semibold text-teal-700 hover:underline" href="/login">
                  Sign in
                </Link>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{" "}
                <Link className="font-semibold text-teal-700 hover:underline" href="/signup">
                  Sign up for free
                </Link>
              </p>
            )}
            <Link
              className="font-medium text-slate-500 hover:text-teal-700 hover:underline inline-flex items-center gap-1 transition-colors"
              href="/"
            >
              <span>Back to Home</span>
              <span>→</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
