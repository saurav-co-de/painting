"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonResponse } from "@/lib/api";
import { IconCheckCircle, IconAlertCircle } from "@/components/Icons";

export default function ResetPasswordForm({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setStatus({ tone: "error", message: "Reset token is missing from this link." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    setIsSaving(true);
    setStatus({ tone: "", message: "" });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });
      const payload = await readJsonResponse(response, "Could not reset password.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not reset password.");
      }

      setStatus({ tone: "success", message: payload.message });
      setTimeout(() => router.replace("/login"), 1200);
    } catch (error) {
      setStatus({ tone: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          New Password (min 8 chars)
        </label>
        <input
          className="field"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Confirm New Password
        </label>
        <input
          className="field"
          minLength={8}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={confirmPassword}
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

      <button className="button-primary w-full" disabled={isSaving} type="submit">
        {isSaving ? "Updating Password..." : "Set New Password"}
      </button>

      <div className="text-center pt-2">
        <Link className="text-xs font-medium text-slate-500 hover:text-slate-800" href="/login">
          ← Back to Sign In
        </Link>
      </div>
    </form>
  );
}
