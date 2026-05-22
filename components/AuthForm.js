"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      const payload = await response.json();

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
        message: "Enter your email first and then request a reset link."
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
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not start password reset.");
      }

      setStatus({
        tone: "success",
        message: payload.message
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
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-5 px-3 py-5 sm:px-6 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <section className="glass-card overflow-hidden p-5 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)] sm:tracking-[0.28em]">
          Indian GST Billing
        </p>
        <h1 className="font-display mt-4 text-3xl text-slate-950 sm:text-5xl">
          {isSignup ? "Launch your invoice workspace." : "Welcome back to BuildBill AI."}
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          Create contractor-style GST invoices, manage customers, track payment status,
          and download branded PDF bills from one clean workspace.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.18em]">Templates</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">GST Ready</p>
          </div>
          <div className="stat-card">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.18em]">Exports</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">PDF + Print</p>
          </div>
          <div className="stat-card">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.18em]">Sharing</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">Email + WhatsApp</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-white/70 p-5 text-sm leading-7 text-slate-600">
          Demo access:
          <br />
          Email: <strong>demo@buildbill.ai</strong>
          <br />
          Password: <strong>buildbill123</strong>
        </div>
      </section>

      <section className="glass-card p-5 sm:p-10">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)] sm:tracking-[0.28em]">
                {isSignup ? "Create Account" : "Secure Login"}
              </p>
              <h2 className="font-display mt-2 text-2xl text-slate-950 sm:text-3xl">
                {isSignup ? "Start billing in minutes" : "Access your dashboard"}
              </h2>
            </div>
            <Link className="text-sm font-medium text-[var(--brand)]" href="/">
              Back home
            </Link>
          </div>

          {isSignup ? (
            <>
              <input
                className="field"
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Your full name"
                required
                value={form.name}
              />
              <input
                className="field"
                onChange={(event) => updateField("businessName", event.target.value)}
                placeholder="Business or company name"
                required
                value={form.businessName}
              />
              <input
                className="field"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Phone number"
                value={form.phone}
              />
            </>
          ) : null}

          <input
            className="field"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="Email address"
            required
            type="email"
            value={form.email}
          />
          <input
            className="field"
            minLength={8}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={form.password}
          />

          {status.message ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                status.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <button className="button-primary w-full" disabled={isLoading} type="submit">
            {isLoading
              ? "Please wait..."
              : isSignup
                ? "Create workspace"
                : "Login to dashboard"}
          </button>

          {!isSignup ? (
            <button
              className="button-secondary w-full"
              disabled={isLoading}
              onClick={handleDemoLogin}
              type="button"
            >
              Use demo login
            </button>
          ) : null}

          <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="text-left font-medium text-[var(--brand)] hover:text-[var(--brand-strong)]"
              onClick={handleForgotPassword}
              type="button"
            >
              Forgot password?
            </button>
            <p>
              {isSignup ? "Already registered?" : "New to BuildBill AI?"}{" "}
              <Link
                className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4"
                href={isSignup ? "/login" : "/signup"}
              >
                {isSignup ? "Login here" : "Create an account"}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
