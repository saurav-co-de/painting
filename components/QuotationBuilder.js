"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readJsonResponse } from "@/lib/api";
import { calculateInvoice, formatCurrency } from "@/lib/billing";
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconBuilding,
  IconCalendar,
  IconCreditCard,
  IconQuotation
} from "@/components/Icons";

function createEmptyItem() {
  return {
    description: "",
    unit: "Sqft",
    quantity: 1,
    rate: "0",
    amount: "",
    gstPercentage: 18
  };
}

function SectionCard({ title, icon: Icon, description, children, className = "" }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
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

function FormField({ label, required = false, hint, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        <span>{label}</span>
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function createDefaultForm() {
  return {
    quotationNumber: "",
    quotationDate: new Date().toISOString().slice(0, 10),
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    projectName: "",
    description: "",
    customerId: "",
    customerName: "",
    taxMode: "intra",
    notes: "Thank you for considering us for this project.",
    terms: "Quotation is valid for 30 days from the date of issue.",
    validityPeriod: "30 days",
    status: "Draft"
  };
}

function createInitialItems(initialQuotation) {
  if (Array.isArray(initialQuotation?.items) && initialQuotation.items.length) {
    return initialQuotation.items.map((item) => ({
      description: item.description || "",
      unit: item.unit || "Sqft",
      quantity: item.quantity ?? 1,
      rate: item.rate ?? "0",
      amount: item.amount ?? "",
      gstPercentage: item.gstPercentage ?? 18
    }));
  }

  return [createEmptyItem(), { ...createEmptyItem(), description: "Labour charges", unit: "Nos" }];
}

export default function QuotationBuilder({ customers, user, initialQuotation = null }) {
  const router = useRouter();
  const isEditMode = Boolean(initialQuotation?.id);
  const [form, setForm] = useState(() => {
    const baseForm = createDefaultForm();

    if (!initialQuotation) {
      return baseForm;
    }

    return {
      ...baseForm,
      quotationNumber: initialQuotation.quotationNumber || "",
      quotationDate: initialQuotation.quotationDate || baseForm.quotationDate,
      validityDate: initialQuotation.validityDate || baseForm.validityDate,
      projectName: initialQuotation.projectName || "",
      description: initialQuotation.description || "",
      customerId: initialQuotation.customerId || "",
      customerName: initialQuotation.customerDetails?.clientName || initialQuotation.customerName || "",
      taxMode: initialQuotation.taxMode || baseForm.taxMode,
      notes: initialQuotation.notes || baseForm.notes,
      terms: initialQuotation.terms || baseForm.terms,
      validityPeriod: initialQuotation.validityPeriod || baseForm.validityPeriod,
      status: initialQuotation.status || baseForm.status
    };
  });
  const [items, setItems] = useState(() => createInitialItems(initialQuotation));
  const [statusMsg, setStatusMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === form.customerId) || null,
    [customers, form.customerId]
  );

  const preview = useMemo(
    () =>
      calculateInvoice(items, form.taxMode, {
        includeAmountOnlyItems: true,
        useDirectAmount: true
      }),
    [form.taxMode, items]
  );

  const isWithoutGst = form.taxMode === "none";

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index, key, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, createEmptyItem()]);
  }

  function removeItem(index) {
    if (items.length <= 1) {
      setItems([createEmptyItem()]);
      return;
    }
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMsg("");

    try {
      const response = await fetch(
        isEditMode ? `/api/quotations/${initialQuotation.id}` : "/api/quotations",
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            items
          })
        }
      );
      const payload = await readJsonResponse(
        response,
        isEditMode ? "Unable to update quotation." : "Unable to create quotation."
      );

      if (!response.ok) {
        throw new Error(payload.error || (isEditMode ? "Unable to update quotation." : "Unable to create quotation."));
      }

      router.push(`/quotations/${payload.quotation.id}`);
      router.refresh();
    } catch (error) {
      setStatusMsg(error.message);
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]" onSubmit={handleSubmit}>
      {/* Form Fields Column */}
      <div className="space-y-6">
        {/* Section 1: Quotation & Client Details */}
        <SectionCard
          description="Project and recipient details for this quotation"
          icon={IconBuilding}
          title="Project & Client Details"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField hint="Leave blank to auto-generate" label="Quotation Number">
              <input
                className="field"
                onChange={(event) => updateForm("quotationNumber", event.target.value)}
                placeholder="e.g. QT-2026-001 (Auto)"
                value={form.quotationNumber}
              />
            </FormField>

            <FormField label="Customer / Client" required>
              <input
                autoComplete="off"
                className="field"
                list="quotation-customers"
                onChange={(event) => {
                  const val = event.target.value;
                  const matched = customers.find((c) => c.customerName === val);
                  setForm((current) => ({
                    ...current,
                    customerId: matched?.id || "",
                    customerName: val
                  }));
                }}
                placeholder="Select or enter customer name"
                required
                value={form.customerName}
              />
              <datalist id="quotation-customers">
                {customers.map((c) => (
                  <option key={c.id} value={c.customerName} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Project or Site Name" required>
              <input
                className="field"
                onChange={(event) => updateForm("projectName", event.target.value)}
                placeholder="e.g. 3BHK Renovation, Plot 42"
                required
                value={form.projectName}
              />
            </FormField>

            <FormField hint="Appears as subject on the quotation" label="Quotation Subject">
              <input
                className="field"
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="e.g. Commercial Interior Estimate"
                value={form.description}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 2: Dates, Tax & Status */}
        <SectionCard
          description="Quotation date, validity period, and tax configuration"
          icon={IconCalendar}
          title="Validity & Tax Configuration"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Quotation Date" required>
              <input
                className="field"
                onChange={(event) => updateForm("quotationDate", event.target.value)}
                required
                type="date"
                value={form.quotationDate}
              />
            </FormField>

            <FormField label="Valid Until" required>
              <input
                className="field"
                onChange={(event) => updateForm("validityDate", event.target.value)}
                required
                type="date"
                value={form.validityDate}
              />
            </FormField>

            <FormField label="Tax Mode">
              <select
                className="field"
                onChange={(event) => updateForm("taxMode", event.target.value)}
                value={form.taxMode}
              >
                <option value="intra">Intra-State (CGST + SGST)</option>
                <option value="inter">Inter-State (IGST)</option>
                <option value="none">Without GST (No Tax)</option>
              </select>
            </FormField>

            <FormField label="Status">
              <select
                className="field"
                onChange={(event) => updateForm("status", event.target.value)}
                value={form.status}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </FormField>
          </div>
        </SectionCard>

        {/* Section 3: Line Items */}
        <SectionCard
          description="Detailed items, unit rates, quantities, and GST rates"
          icon={IconQuotation}
          title="Line Items & Estimated Scope"
        >
          <div className="space-y-3">
            {/* Header Labels (Desktop) */}
            <div className="hidden sm:grid sm:grid-cols-[minmax(0,2.5fr)_90px_90px_110px_90px_auto] gap-2 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Description</span>
              <span>Unit</span>
              <span>Qty</span>
              <span>Rate (₹)</span>
              <span>GST %</span>
              <span className="w-8"></span>
            </div>

            {items.map((item, index) => {
              const itemTotal = Number(item.quantity || 0) * Number(item.rate || 0);

              return (
                <div
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 transition-all hover:border-slate-300"
                  key={index}
                >
                  <div className="grid gap-2.5 sm:grid-cols-[minmax(0,2.5fr)_90px_90px_110px_90px_auto] sm:items-center">
                    {/* Description */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 sm:hidden">Description</label>
                      <input
                        className="field bg-white"
                        onChange={(event) => updateItem(index, "description", event.target.value)}
                        placeholder="Item or work description"
                        value={item.description}
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 sm:hidden">Unit</label>
                      <input
                        className="field bg-white px-2.5 text-center"
                        onChange={(event) => updateItem(index, "unit", event.target.value)}
                        placeholder="Unit"
                        value={item.unit}
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 sm:hidden">Quantity</label>
                      <input
                        className="field bg-white px-2.5 text-center"
                        min="0"
                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                        placeholder="Qty"
                        step="any"
                        type="number"
                        value={item.quantity}
                      />
                    </div>

                    {/* Rate */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 sm:hidden">Rate (₹)</label>
                      <input
                        className="field bg-white px-2.5 text-right font-medium"
                        min="0"
                        onChange={(event) => updateItem(index, "rate", event.target.value)}
                        placeholder="0.00"
                        step="any"
                        type="number"
                        value={item.rate}
                      />
                    </div>

                    {/* GST % */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 sm:hidden">GST %</label>
                      <input
                        className="field bg-white px-2 text-center"
                        disabled={isWithoutGst}
                        min="0"
                        onChange={(event) => updateItem(index, "gstPercentage", event.target.value)}
                        placeholder="18"
                        type="number"
                        value={isWithoutGst ? 0 : item.gstPercentage}
                      />
                    </div>

                    {/* Remove Action */}
                    <div className="flex items-center justify-end sm:justify-center">
                      <button
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                        type="button"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calculated Sub-total Row */}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/50 sm:hidden">
                    <span>Line Amount:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(itemTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              className="button-secondary text-xs sm:text-sm"
              onClick={addItem}
              type="button"
            >
              <IconPlus className="w-4 h-4 text-slate-500" />
              <span>Add Line Item</span>
            </button>
          </div>
        </SectionCard>

        {/* Section 4: Notes and Terms */}
        <SectionCard
          description="Validity notes and estimate disclaimer"
          icon={IconCreditCard}
          title="Notes & Validity Terms"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Quotation Notes">
              <textarea
                className="field min-h-[90px]"
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Notes for client..."
                value={form.notes}
              />
            </FormField>

            <FormField label="Terms & Conditions">
              <textarea
                className="field min-h-[90px]"
                onChange={(event) => updateForm("terms", event.target.value)}
                placeholder="Payment and validity terms..."
                value={form.terms}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Form Action Controls at Bottom */}
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            className="button-secondary w-full sm:w-auto"
            href="/quotations"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {statusMsg && (
              <p className="text-xs font-medium text-rose-600 truncate max-w-xs">{statusMsg}</p>
            )}
            <button
              className="button-primary w-full sm:w-auto min-w-[140px]"
              disabled={isSaving}
              type="submit"
            >
              <IconCheck className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : isEditMode ? "Update Quotation" : "Create Quotation"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Calculation Summary Card */}
      <div className="2xl:sticky 2xl:top-6 2xl:self-start space-y-4">
        <div className="card p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimate Summary
            </span>
            <span className="badge badge-draft">{form.status}</span>
          </div>

          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-medium text-slate-900">{formatCurrency(preview.totals.subtotal)}</span>
            </div>

            {!isWithoutGst && (
              <>
                {form.taxMode === "inter" ? (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span className="font-medium text-slate-900">{formatCurrency(preview.totals.gstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(preview.totals.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(preview.totals.sgstTotal)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Total Tax</span>
                  <span className="font-medium text-slate-700">{formatCurrency(preview.totals.gstTotal)}</span>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-bold text-slate-900">
              <span>Estimated Total</span>
              <span>{formatCurrency(preview.totals.grandTotal)}</span>
            </div>
          </div>

          {/* Quick Business Card Preview */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">{user.businessName}</p>
            <p className="text-[11px] text-slate-400">
              Client: {selectedCustomer?.customerName || form.customerName || "None selected"}
            </p>
          </div>

          {/* Submit button duplicate inside sticky sidebar for convenience */}
          <div className="mt-5">
            <button
              className="button-primary w-full"
              disabled={isSaving}
              type="submit"
            >
              <IconCheck className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : isEditMode ? "Update Quotation" : "Create Quotation"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
