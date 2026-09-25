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
  IconInvoice
} from "@/components/Icons";

function createEmptyItem() {
  return {
    description: "",
    unit: "Sqft",
    quantity: 1,
    rate: 0,
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

function createDefaultForm(initialCustomer) {
  return {
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    projectName: "",
    billSubject: "",
    customerId: initialCustomer?.id || "",
    customerName: initialCustomer?.customerName || "",
    taxMode: "intra",
    advancePayment: "",
    notes: "Thank you for your business.",
    terms: "Payment due within 7 days.",
    paymentStatus: "Pending"
  };
}

function createInitialItems(initialInvoice) {
  if (Array.isArray(initialInvoice?.items) && initialInvoice.items.length) {
    return initialInvoice.items.map((item) => ({
      description: item.description || "",
      unit: item.unit || "Sqft",
      quantity: item.quantity ?? 1,
      rate: item.rate ?? 0,
      gstPercentage: item.gstPercentage ?? 18
    }));
  }

  return [createEmptyItem(), { ...createEmptyItem(), description: "Labour charges", unit: "Nos" }];
}

export default function InvoiceBuilder({ customers, user, initialInvoice = null }) {
  const router = useRouter();
  const initialCustomer = customers[0] || null;
  const isEditMode = Boolean(initialInvoice?.id);
  const [form, setForm] = useState(() => {
    const baseForm = createDefaultForm(initialCustomer);

    if (!initialInvoice) {
      return baseForm;
    }

    return {
      ...baseForm,
      invoiceNumber: initialInvoice.invoiceNumber || "",
      invoiceDate: initialInvoice.invoiceDate || baseForm.invoiceDate,
      dueDate: initialInvoice.dueDate || baseForm.dueDate,
      projectName: initialInvoice.projectName || "",
      billSubject: initialInvoice.billSubject || initialInvoice.projectName || "",
      customerId: initialInvoice.customerId || baseForm.customerId,
      customerName: initialInvoice.customerDetails?.clientName || initialInvoice.customerName || baseForm.customerName,
      taxMode: initialInvoice.taxMode || baseForm.taxMode,
      advancePayment: initialInvoice.advancePayment ?? "",
      notes: initialInvoice.notes || baseForm.notes,
      terms: initialInvoice.terms || baseForm.terms,
      paymentStatus: initialInvoice.paymentStatus || baseForm.paymentStatus
    };
  });
  const [items, setItems] = useState(() => createInitialItems(initialInvoice));
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === form.customerId) || null,
    [customers, form.customerId]
  );

  const preview = useMemo(() => calculateInvoice(items, form.taxMode), [form.taxMode, items]);
  const isWithoutGst = form.taxMode === "none";
  const advancePayment = Math.max(Number(form.advancePayment || 0), 0);
  const balanceDue = Math.max(preview.totals.grandTotal - advancePayment, 0);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCustomer(value) {
    const matchedCustomer =
      customers.find((customer) => customer.customerName === value) ||
      customers.find(
        (customer) => customer.customerName.toLowerCase() === value.trim().toLowerCase()
      );

    setForm((current) => ({
      ...current,
      customerId: matchedCustomer?.id || "",
      customerName: value
    }));
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
    setStatus("");

    try {
      const response = await fetch(isEditMode ? `/api/invoices/${initialInvoice.id}` : "/api/invoices", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          items
        })
      });
      const payload = await readJsonResponse(
        response,
        isEditMode ? "Unable to update invoice." : "Unable to create invoice."
      );

      if (!response.ok) {
        throw new Error(payload.error || (isEditMode ? "Unable to update invoice." : "Unable to create invoice."));
      }

      router.push(`/invoices/${payload.invoice.id}`);
      router.refresh();
    } catch (error) {
      setStatus(error.message);
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]" onSubmit={handleSubmit}>
      {/* Main Form Fields Column */}
      <div className="space-y-6">
        {/* Section 1: Invoice & Client Details */}
        <SectionCard
          description="Basic information about the bill, client, and project site"
          icon={IconBuilding}
          title="Project & Client Details"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField hint="Leave blank to automatically generate sequential number" label="Invoice Number">
              <input
                className="field"
                onChange={(event) => updateForm("invoiceNumber", event.target.value)}
                placeholder="e.g. BB-2026-001 (Auto)"
                value={form.invoiceNumber}
              />
            </FormField>

            <FormField label="Customer / Client" required>
              <input
                autoComplete="off"
                className="field"
                list="invoice-customers"
                onChange={(event) => updateCustomer(event.target.value)}
                placeholder="Select or enter customer name"
                required
                value={form.customerName}
              />
              <datalist id="invoice-customers">
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.customerName} />
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

            <FormField hint="Appears as subject line on the bill" label="Bill Subject">
              <input
                className="field"
                onChange={(event) => updateForm("billSubject", event.target.value)}
                placeholder="e.g. Painting & Waterproofing Work"
                value={form.billSubject}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 2: Dates, Tax & Payment Terms */}
        <SectionCard
          description="Billing schedule, GST calculation mode, and payment status"
          icon={IconCalendar}
          title="Dates & Tax Configuration"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Invoice Date" required>
              <input
                className="field"
                onChange={(event) => updateForm("invoiceDate", event.target.value)}
                required
                type="date"
                value={form.invoiceDate}
              />
            </FormField>

            <FormField label="Due Date" required>
              <input
                className="field"
                onChange={(event) => updateForm("dueDate", event.target.value)}
                required
                type="date"
                value={form.dueDate}
              />
            </FormField>

            <FormField hint="Intra-state uses CGST+SGST" label="Tax Mode">
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

            <FormField label="Payment Status">
              <select
                className="field"
                onChange={(event) => updateForm("paymentStatus", event.target.value)}
                value={form.paymentStatus}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </FormField>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 sm:w-1/2">
            <FormField hint="Any advance already received against this bill" label="Advance Payment Received (₹)">
              <input
                className="field"
                min="0"
                onChange={(event) => updateForm("advancePayment", event.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={form.advancePayment}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Section 3: Line Items */}
        <SectionCard
          description="Add work items, measurements, rates, and GST percentage"
          icon={IconInvoice}
          title="Line Items & Measurements"
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
          description="Customer notes and payment terms printed at the bottom of the bill"
          icon={IconCreditCard}
          title="Notes & Terms"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Customer Notes">
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
                placeholder="Payment terms..."
                value={form.terms}
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Form Action Controls at Bottom */}
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            className="button-secondary w-full sm:w-auto"
            href="/invoices"
          >
            Cancel
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {status && (
              <p className="text-xs font-medium text-rose-600 truncate max-w-xs">{status}</p>
            )}
            <button
              className="button-primary w-full sm:w-auto min-w-[140px]"
              disabled={isSaving}
              type="submit"
            >
              <IconCheck className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : isEditMode ? "Update Invoice" : "Create Invoice"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Live Calculation Summary Card */}
      <div className="2xl:sticky 2xl:top-6 2xl:self-start space-y-4">
        <div className="card p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Total Summary
            </span>
            <span className="badge badge-paid">Auto-Calculated</span>
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
                    <span className="font-medium text-slate-900">{formatCurrency(preview.totals.igstTotal)}</span>
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
              <span>Grand Total</span>
              <span>{formatCurrency(preview.totals.grandTotal)}</span>
            </div>

            {advancePayment > 0 && (
              <>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Advance Paid</span>
                  <span>- {formatCurrency(advancePayment)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-bold text-amber-700">
                  <span>Balance Due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Business Card Preview */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">{user.businessName}</p>
            <p className="truncate">{user.gstin ? `GSTIN: ${user.gstin}` : "GSTIN not configured"}</p>
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
              <span>{isSaving ? "Saving..." : isEditMode ? "Update Invoice" : "Create Invoice"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
