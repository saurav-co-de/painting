"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/api";
import { calculateInvoice, formatCurrency } from "@/lib/billing";

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

function FieldLabel({ label, children, className = "" }) {
  return (
    <label className={`grid min-w-0 gap-2 text-sm font-semibold text-slate-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function hasQuotationItemValue(item) {
  return Boolean(
    item.description?.trim() ||
      String(item.amount ?? "").trim() ||
      String(item.rate ?? "").trim()
  );
}

export default function QuotationBuilder({ customers, user }) {
  const router = useRouter();
  const [form, setForm] = useState({
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
  });
  const [items, setItems] = useState([
    createEmptyItem(),
    { ...createEmptyItem(), description: "Labour charges", unit: "Nos" }
  ]);
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
  const previewSourceItems = useMemo(
    () => items.filter(hasQuotationItemValue),
    [items]
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
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMsg("");

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          items
        })
      });
      const payload = await readJsonResponse(response, "Unable to create quotation.");

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create quotation.");
      }

      router.push(`/quotations/${payload.quotation.id}`);
      router.refresh();
    } catch (error) {
      setStatusMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] 2xl:gap-5" onSubmit={handleSubmit}>
      <section className="glass-card min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Quotation number">
            <input
              className="field"
              onChange={(event) => updateForm("quotationNumber", event.target.value)}
              placeholder="Auto-generated if blank"
              value={form.quotationNumber}
            />
          </FieldLabel>
          <FieldLabel label="Project name">
            <input
              className="field"
              onChange={(event) => updateForm("projectName", event.target.value)}
              placeholder="Project name"
              required
              value={form.projectName}
            />
          </FieldLabel>
          <FieldLabel label="Description" className="md:col-span-2">
            <textarea
              className="field min-h-[80px]"
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Detailed description of the quotation"
              value={form.description}
            />
          </FieldLabel>
          <FieldLabel label="Saved customer">
            <select
              className="field"
              onChange={(event) => updateForm("customerId", event.target.value)}
              value={form.customerId}
            >
              <option value="">No saved customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Customer name">
            <input
              className="field"
              onChange={(event) => updateForm("customerName", event.target.value)}
              placeholder="Optional"
              value={form.customerName}
            />
          </FieldLabel>
          <FieldLabel label="Quotation date">
            <input
              className="field"
              onChange={(event) => updateForm("quotationDate", event.target.value)}
              required
              type="date"
              value={form.quotationDate}
            />
          </FieldLabel>
          <FieldLabel label="Validity date">
            <input
              className="field"
              onChange={(event) => updateForm("validityDate", event.target.value)}
              required
              type="date"
              value={form.validityDate}
            />
          </FieldLabel>
          <FieldLabel label="Tax type">
            <select
              className="field"
              onChange={(event) => updateForm("taxMode", event.target.value)}
              value={form.taxMode}
            >
              <option value="intra">CGST + SGST</option>
              <option value="inter">IGST</option>
              <option value="none">Without GST</option>
            </select>
            <span className="text-xs font-normal text-slate-500">
              Use Without GST when tax should not be charged.
            </span>
          </FieldLabel>
          <FieldLabel label="Status">
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
          </FieldLabel>
        </div>

        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4" key={index}>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[2fr_0.65fr_0.65fr_0.85fr_0.9fr_0.75fr_auto]">
                <FieldLabel label="Description">
                  <input
                    className="field"
                    onChange={(event) => updateItem(index, "description", event.target.value)}
                    placeholder="Description"
                    value={item.description}
                  />
                </FieldLabel>
                <FieldLabel label="Unit">
                  <input
                    className="field"
                    onChange={(event) => updateItem(index, "unit", event.target.value)}
                    placeholder="Unit"
                    value={item.unit}
                  />
                </FieldLabel>
                <FieldLabel label="Qty">
                  <input
                    className="field"
                    min="0"
                    onChange={(event) => updateItem(index, "quantity", event.target.value)}
                    placeholder="Qty"
                    type="number"
                    value={item.quantity}
                  />
                </FieldLabel>
                <FieldLabel label="Rate">
                  <input
                    className="field"
                    onChange={(event) => updateItem(index, "rate", event.target.value)}
                    placeholder="Rate or text"
                    type="text"
                    value={item.rate}
                  />
                </FieldLabel>
                <FieldLabel label="Amount">
                  <input
                    className="field"
                    onChange={(event) => updateItem(index, "amount", event.target.value)}
                    placeholder="Amount"
                    type="text"
                    value={item.amount}
                  />
                </FieldLabel>
                <FieldLabel label="GST %">
                  <input
                    className="field"
                    disabled={isWithoutGst}
                    min="0"
                    onChange={(event) => updateItem(index, "gstPercentage", event.target.value)}
                    placeholder="GST %"
                    type="number"
                    value={item.gstPercentage}
                  />
                </FieldLabel>
                <button
                  className="inline-flex min-h-11 items-center justify-center self-end rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100"
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row">
          <button className="button-secondary w-full sm:w-auto" onClick={addItem} type="button">
            Add item
          </button>
          <button className="button-primary w-full sm:w-auto" disabled={isSaving} type="submit">
            {isSaving ? "Creating..." : "Create quotation"}
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <FieldLabel label="Notes">
            <textarea
              className="field min-h-[100px]"
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Notes"
              value={form.notes}
            />
          </FieldLabel>
          <FieldLabel label="Terms and conditions">
            <textarea
              className="field min-h-[100px]"
              onChange={(event) => updateForm("terms", event.target.value)}
              placeholder="Terms and conditions"
              value={form.terms}
            />
          </FieldLabel>
          {statusMsg ? <p className="text-sm text-rose-700">{statusMsg}</p> : null}
        </div>
      </section>

      <aside className="glass-card min-w-0 p-4 sm:p-6 lg:p-8 2xl:sticky 2xl:top-4 2xl:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)] sm:tracking-[0.28em]">
          Live Preview
        </p>
        <h3 className="font-display mt-3 text-2xl text-slate-950">
          {user.businessName}
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {user.address || "Add your business address in settings."}
        </p>

        <div className="mt-6 rounded-xl border border-slate-200/80 bg-white/85 p-5">
          <p className="text-sm font-semibold text-slate-950">
            {selectedCustomer?.customerName || form.customerName || "No customer name"}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {selectedCustomer?.address || "Customer details are optional."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {preview.items.map((item, index) => {
            const displayRate = previewSourceItems[index]?.rate ?? item.rate;

            return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/85 px-4 py-3" key={item.id}>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-950">{item.description || "Untitled item"}</p>
                <p className="break-words text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.14em]">
                  {item.quantity} {item.unit} x {displayRate || "-"}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
            </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl bg-slate-950 p-5 text-white">
          <div className="flex justify-between text-sm text-slate-300">
            <span>Subtotal</span>
            <span>{formatCurrency(preview.totals.subtotal)}</span>
          </div>
          {!isWithoutGst ? (
            <div className="mt-3 flex justify-between text-sm text-slate-300">
              <span>{form.taxMode === "inter" ? "IGST" : "GST"}</span>
              <span>{formatCurrency(preview.totals.gstTotal)}</span>
            </div>
          ) : null}
          <div className="mt-4 border-t border-white/10 pt-4 text-lg font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(preview.totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
