"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not reset password.");
      }

      setStatus({ tone: "success", message: payload.message });
      setTimeout(() => router.replace("/login"), 1000);
    } catch (error) {
      setStatus({ tone: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="field"
        minLength={8}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        required
        type="password"
        value={password}
      />
      <input
        className="field"
        minLength={8}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        required
        type="password"
        value={confirmPassword}
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

      <button className="button-primary w-full" disabled={isSaving} type="submit">
        {isSaving ? "Updating..." : "Update password"}
      </button>

      <Link className="button-secondary w-full" href="/login">
        Back to login
      </Link>
    </form>
  );
}
