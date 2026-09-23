"use client";

import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/api";

function FieldControl({ id, label, children, className = "" }) {
  return (
    <div className={`grid min-w-0 gap-2 text-sm font-semibold text-slate-700 ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export default function SettingsForm({ user }) {
  const [form, setForm] = useState({
    name: user.name || "",
    businessName: user.businessName || "",
    gstin: user.gstin || "",
    address: user.address || "",
    phone: user.phone || "",
    logoText: user.logoText || "",
    accountNumber: user.accountNumber || "",
    ifscCode: user.ifscCode || "",
    bankName: user.bankName || "",
    branch: user.branch || "",
    signatureImage: user.signatureImage || "",
    subscriptionPlan: user.subscriptionPlan || "Free"
  });
  const [status, setStatus] = useState("");
  const [dbHealth, setDbHealth] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  async function loadHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await readJsonResponse(res);
      setDbHealth(data);
    } catch {
      setDbHealth(null);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  async function handleRunSync() {
    setSyncLoading(true);
    setSyncMessage("Synchronizing pending records...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await readJsonResponse(res);
      if (res.ok) {
        setSyncMessage(`Sync complete: ${data.results?.succeeded ?? 0} processed successfully.`);
        await loadHealth();
      } else {
        setSyncMessage(data.error || "Sync failed.");
      }
    } catch (err) {
      setSyncMessage(err.message || "Failed to trigger sync.");
    } finally {
      setSyncLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  function updateSignature(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("signatureImage", reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });
    const payload = await readJsonResponse(response, "Save failed.");

    setStatus(response.ok ? "Business settings saved." : payload.error || "Save failed.");
  }

  return (
    <section className="glass-card p-4 sm:p-6 lg:p-8">
      <form className="grid min-w-0 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <FieldControl id="settings-name" label="Owner name">
          <input
            className="field"
            id="settings-name"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Owner name"
            value={form.name}
          />
        </FieldControl>
        <FieldControl id="settings-business-name" label="Business name">
          <input
            className="field"
            id="settings-business-name"
            onChange={(event) => updateField("businessName", event.target.value)}
            placeholder="Business name"
            value={form.businessName}
          />
        </FieldControl>
        <FieldControl id="settings-gstin" label="GSTIN">
          <input
            className="field"
            id="settings-gstin"
            onChange={(event) => updateField("gstin", event.target.value)}
            placeholder="GSTIN"
            value={form.gstin}
          />
        </FieldControl>
        <FieldControl id="settings-phone" label="Phone">
          <input
            className="field"
            id="settings-phone"
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="Phone"
            value={form.phone}
          />
        </FieldControl>
        <FieldControl id="settings-logo-text" label="Logo initials">
          <input
            className="field"
            id="settings-logo-text"
            maxLength={3}
            onChange={(event) => updateField("logoText", event.target.value.toUpperCase())}
            placeholder="Logo initials"
            value={form.logoText}
          />
        </FieldControl>
        <FieldControl id="settings-plan" label="Plan">
          <select
            className="field"
            id="settings-plan"
            onChange={(event) => updateField("subscriptionPlan", event.target.value)}
            value={form.subscriptionPlan}
          >
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </FieldControl>
        <FieldControl id="settings-account-number" label="Bank account number">
          <input
            className="field"
            id="settings-account-number"
            onChange={(event) => updateField("accountNumber", event.target.value)}
            placeholder="Bank account number"
            value={form.accountNumber}
          />
        </FieldControl>
        <FieldControl id="settings-ifsc-code" label="IFSC code">
          <input
            className="field"
            id="settings-ifsc-code"
            onChange={(event) => updateField("ifscCode", event.target.value.toUpperCase())}
            placeholder="IFSC code"
            value={form.ifscCode}
          />
        </FieldControl>
        <FieldControl id="settings-bank-name" label="Bank name">
          <input
            className="field"
            id="settings-bank-name"
            onChange={(event) => updateField("bankName", event.target.value)}
            placeholder="Bank name"
            value={form.bankName}
          />
        </FieldControl>
        <FieldControl id="settings-branch" label="Branch">
          <input
            className="field"
            id="settings-branch"
            onChange={(event) => updateField("branch", event.target.value)}
            placeholder="Branch"
            value={form.branch}
          />
        </FieldControl>
        <FieldControl id="settings-signature" label="Signature image">
          <input
            accept="image/*"
            className="field"
            id="settings-signature"
            onChange={updateSignature}
            type="file"
          />
        </FieldControl>
        <div className="flex min-w-0 items-end overflow-hidden rounded-xl bg-white/70 p-3">
          {form.signatureImage ? (
            <img
              alt="Uploaded signature preview"
              className="max-h-20 max-w-full rounded-lg border border-slate-200 bg-white object-contain p-2 sm:max-w-56"
              src={form.signatureImage}
            />
          ) : (
            <p className="text-sm text-slate-500">No signature uploaded.</p>
          )}
        </div>
        <FieldControl className="md:col-span-2" id="settings-address" label="Business address">
          <textarea
            className="field min-h-[140px]"
            id="settings-address"
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Business address"
            value={form.address}
          />
        </FieldControl>
        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-h-5 break-words text-sm text-slate-500">{status}</p>
          <button className="button-primary w-full sm:w-auto" type="submit">
            Save settings
          </button>
        </div>
      </form>

      {/* Database Resilience & Backup Status Card */}
      <div className="mt-8 border-t border-slate-200/80 pt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Database Resilience & Backup Status</h3>
            <p className="text-xs text-slate-500">
              High-availability dual-database architecture: Supabase Primary with MongoDB Atlas Secondary backup.
            </p>
          </div>
          <button
            className="button-secondary text-xs"
            disabled={syncLoading}
            onClick={handleRunSync}
            type="button"
          >
            {syncLoading ? "Syncing..." : "Run Sync Now"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Supabase Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Supabase (Primary)</span>
              {dbHealth?.databases?.supabase?.status === "ONLINE" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : dbHealth?.databases?.supabase?.status === "OFFLINE" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Checking
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {dbHealth?.databases?.supabase?.mode === "supabase_postgres"
                ? "PostgreSQL connection pool active"
                : "Local zero-dependency DB active"}
            </p>
          </div>

          {/* MongoDB Atlas Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">MongoDB Atlas (Backup)</span>
              {dbHealth?.databases?.mongodb?.status === "ONLINE" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : dbHealth?.databases?.mongodb?.status === "NOT_CONFIGURED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Not Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Offline
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {dbHealth?.databases?.mongodb?.status === "ONLINE"
                ? `Latency: ${dbHealth.databases.mongodb.latencyMs ?? 0}ms`
                : dbHealth?.databases?.mongodb?.status === "NOT_CONFIGURED"
                ? "Add MONGODB_URI to enable"
                : "Unreachable (retrying)"}
            </p>
          </div>

          {/* Synchronization Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sync Status</span>
              {(dbHealth?.sync?.pending ?? 0) === 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Up to date
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending: {dbHealth?.sync?.pending}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {(dbHealth?.sync?.failed ?? 0) > 0
                ? `${dbHealth.sync.failed} jobs need attention`
                : "Automatic retry on standby"}
            </p>
          </div>
        </div>

        {syncMessage && (
          <p className="mt-3 text-xs text-slate-600 italic animate-fade-in">{syncMessage}</p>
        )}
      </div>
    </section>
  );
}
