"use client";

import { useState } from "react";

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
    const payload = await response.json();

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
        <div className="flex min-w-0 items-end overflow-hidden">
          {form.signatureImage ? (
            <img
              alt="Uploaded signature preview"
              className="max-h-20 max-w-56 rounded-lg border border-slate-200 bg-white object-contain p-2"
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
          <p className="text-sm text-slate-500">{status}</p>
          <button className="button-primary sm:w-auto" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
}
