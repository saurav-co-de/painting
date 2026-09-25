"use client";

import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/api";
import Toast from "@/components/Toast";
import {
  IconBuilding,
  IconCreditCard,
  IconCheck,
  IconRefresh,
  IconEdit,
  IconSettings,
  IconShieldCheck
} from "@/components/Icons";

function FormSection({ title, icon: Icon, description, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, hint, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
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
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dbHealth, setDbHealth] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
    setSyncMessage("Synchronizing records with backup database...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await readJsonResponse(res);
      if (res.ok) {
        setSyncMessage(`Sync complete: ${data.results?.succeeded ?? 0} records synchronized.`);
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateField("signatureImage", reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = await readJsonResponse(response, "Save failed.");

      if (response.ok) {
        setToast({ type: "success", message: "Business settings saved successfully." });
      } else {
        throw new Error(payload.error || "Save failed.");
      }
    } catch (err) {
      setStatus(err.message || "Save failed.");
      setToast({ type: "error", message: err.message || "Save failed." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Identity & Branding */}
        <FormSection
          description="Your business name, logo initials, and GST identification details"
          icon={IconBuilding}
          title="Business Identity & Branding"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Owner / Authorized Person">
              <input
                className="field"
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Full Name"
                value={form.name}
              />
            </FormField>

            <FormField label="Business / Company Name">
              <input
                className="field font-medium"
                onChange={(event) => updateField("businessName", event.target.value)}
                placeholder="Trading or legal company name"
                value={form.businessName}
              />
            </FormField>

            <FormField hint="Printed on all tax invoices" label="GSTIN">
              <input
                className="field uppercase"
                maxLength={15}
                onChange={(event) => updateField("gstin", event.target.value.toUpperCase())}
                placeholder="15-character GSTIN"
                value={form.gstin}
              />
            </FormField>

            <FormField label="Contact Phone">
              <input
                className="field"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+91 98765 43210"
                value={form.phone}
              />
            </FormField>

            <FormField hint="1-3 characters shown on avatar" label="Logo Initials">
              <div className="flex items-center gap-3">
                <input
                  className="field uppercase w-24 text-center font-bold"
                  maxLength={3}
                  onChange={(event) => updateField("logoText", event.target.value.toUpperCase())}
                  placeholder="BC"
                  value={form.logoText}
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-bold text-white text-xs shadow-xs">
                  {form.logoText || "BB"}
                </div>
                <span className="text-xs text-slate-400">Avatar Preview</span>
              </div>
            </FormField>

            <FormField label="Subscription Plan">
              <select
                className="field"
                onChange={(event) => updateField("subscriptionPlan", event.target.value)}
                value={form.subscriptionPlan}
              >
                <option value="Free">Free Plan (10 invoices/mo)</option>
                <option value="Pro">Pro Plan (Unlimited)</option>
                <option value="Enterprise">Enterprise Plan</option>
              </select>
            </FormField>

            <FormField className="sm:col-span-2 lg:col-span-3" label="Business Billing Address">
              <textarea
                className="field min-h-[80px]"
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Street address, city, state, pincode..."
                value={form.address}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Section 2: Bank & Payment Settlement Details */}
        <FormSection
          description="Bank account details printed on invoices for customer NEFT/RTGS/UPI transfers"
          icon={IconCreditCard}
          title="Bank & Payment Details"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Bank Account Number">
              <input
                className="field font-mono"
                onChange={(event) => updateField("accountNumber", event.target.value)}
                placeholder="e.g. 50200012345678"
                value={form.accountNumber}
              />
            </FormField>

            <FormField label="IFSC Code">
              <input
                className="field font-mono uppercase"
                maxLength={11}
                onChange={(event) => updateField("ifscCode", event.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                value={form.ifscCode}
              />
            </FormField>

            <FormField label="Bank Name">
              <input
                className="field"
                onChange={(event) => updateField("bankName", event.target.value)}
                placeholder="e.g. HDFC Bank"
                value={form.bankName}
              />
            </FormField>

            <FormField label="Branch Location">
              <input
                className="field"
                onChange={(event) => updateField("branch", event.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru"
                value={form.branch}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Section 3: Authorized Signature */}
        <FormSection
          description="Upload an image of your authorized signature to stamp automatically on bills"
          icon={IconEdit}
          title="Authorized Signature"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-full sm:w-72">
              <FormField hint="PNG or JPEG with transparent or white background" label="Select Signature Image">
                <input
                  accept="image/*"
                  className="field file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  onChange={updateSignature}
                  type="file"
                />
              </FormField>
            </div>

            <div className="flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Signature Stamp
              </span>
              <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 min-h-[90px] max-w-sm">
                {form.signatureImage ? (
                  <div className="relative group">
                    <img
                      alt="Authorized signature stamp"
                      className="max-h-16 max-w-full object-contain"
                      src={form.signatureImage}
                    />
                    <button
                      className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-1 text-xs shadow-xs hover:bg-rose-700 transition-colors"
                      onClick={() => updateField("signatureImage", "")}
                      title="Remove signature"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No signature image uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>

        {/* Save Bar */}
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {status ? (
            <p className="text-xs font-medium text-rose-600">{status}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Changes apply instantly to all newly issued invoices and quotations.
            </p>
          )}

          <button
            className="button-primary w-full sm:w-auto min-w-[140px]"
            disabled={isSaving}
            type="submit"
          >
            <IconCheck className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Database Resilience & Backup Architecture (PRESERVED & BEAUTIFIED) */}
      <div className="card p-5 sm:p-6 border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <IconRefresh className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Database Resilience & Dual-Backup Status</h2>
              <p className="text-xs text-slate-500">
                High-availability architecture: Supabase Primary with MongoDB Atlas Secondary sync
              </p>
            </div>
          </div>

          <button
            className="button-secondary text-xs py-1.5 px-3 self-start sm:self-auto"
            disabled={syncLoading}
            onClick={handleRunSync}
            type="button"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin text-teal-700" : ""}`} />
            <span>{syncLoading ? "Syncing..." : "Run Sync Now"}</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Supabase Status Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Supabase (Primary)</span>
              {dbHealth?.databases?.supabase?.status === "ONLINE" ? (
                <span className="badge badge-paid">Online</span>
              ) : dbHealth?.databases?.supabase?.status === "OFFLINE" ? (
                <span className="badge badge-overdue">Offline</span>
              ) : (
                <span className="badge badge-pending">Checking</span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {dbHealth?.databases?.supabase?.mode === "supabase_postgres"
                ? "PostgreSQL connection pool active"
                : "Zero-dependency local database active"}
            </p>
          </div>

          {/* MongoDB Atlas Status Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">MongoDB Atlas (Backup)</span>
              {dbHealth?.databases?.mongodb?.status === "ONLINE" ? (
                <span className="badge badge-paid">Connected</span>
              ) : dbHealth?.databases?.mongodb?.status === "NOT_CONFIGURED" ? (
                <span className="badge badge-draft">Not Configured</span>
              ) : (
                <span className="badge badge-overdue">Offline</span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {dbHealth?.databases?.mongodb?.status === "ONLINE"
                ? `Latency: ${dbHealth.databases.mongodb.latencyMs ?? 0}ms`
                : dbHealth?.databases?.mongodb?.status === "NOT_CONFIGURED"
                  ? "Add MONGODB_URI to enable secondary sync"
                  : "Unreachable (retrying)"}
            </p>
          </div>

          {/* Sync Status Card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Sync Status</span>
              {(dbHealth?.sync?.pending ?? 0) === 0 ? (
                <span className="badge badge-paid">Up to date</span>
              ) : (
                <span className="badge badge-pending">Pending: {dbHealth?.sync?.pending}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {(dbHealth?.sync?.failed ?? 0) > 0
                ? `${dbHealth.sync.failed} jobs need attention`
                : "Automatic dual-write active"}
            </p>
          </div>
        </div>

        {syncMessage && (
          <p className="mt-3 text-xs text-teal-700 font-medium">{syncMessage}</p>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
