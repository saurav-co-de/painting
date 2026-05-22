"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateInvoice, formatCurrency } from "@/lib/billing";

function createEmptyItem() {
  return {
    description: "",
    unit: "Sqft",
    quantity: 1,
    rate: 0,
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

export default function InvoiceBuilder({ customers, user }) {
  const router = useRouter();
  const [form, setForm] = useState({
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    projectName: "",
    billSubject: "",
    customerId: customers[0]?.id || "",
    taxMode: "intra",
    advancePayment: "",
    notes: "Thank you for your business.",
    terms: "Payment due within 7 days.",
    paymentStatus: "Pending"
  });
  const [items, setItems] = useState([
    createEmptyItem(),
    { ...createEmptyItem(), description: "Labour charges", unit: "Nos" }
  ]);
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
    setStatus("");

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          items
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to create invoice.");
      }

      router.push(`/invoices/${payload.invoice.id}`);
      router.refresh();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] 2xl:gap-5" onSubmit={handleSubmit}>
      <section className="glass-card min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Project or site name">
            <input
              className="field"
              onChange={(event) => updateForm("projectName", event.target.value)}
              placeholder="Project or site name"
              required
              value={form.projectName}
            />
          </FieldLabel>
          <FieldLabel label="Bill subject">
            <input
              className="field"
              onChange={(event) => updateForm("billSubject", event.target.value)}
              placeholder="e.g. Painting Work"
              value={form.billSubject}
            />
          </FieldLabel>
          <FieldLabel label="Customer">
            <select
              className="field"
              onChange={(event) => updateForm("customerId", event.target.value)}
              value={form.customerId}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerName}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Invoice date">
            <input
              className="field"
              onChange={(event) => updateForm("invoiceDate", event.target.value)}
              required
              type="date"
              value={form.invoiceDate}
            />
          </FieldLabel>
          <FieldLabel label="Due date">
            <input
              className="field"
              onChange={(event) => updateForm("dueDate", event.target.value)}
              required
              type="date"
              value={form.dueDate}
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
          <FieldLabel label="Payment status">
            <select
              className="field"
              onChange={(event) => updateForm("paymentStatus", event.target.value)}
              value={form.paymentStatus}
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Advance payment">
            <input
              className="field"
              min="0"
              onChange={(event) => updateForm("advancePayment", event.target.value)}
              placeholder="Advance payment received"
              step="0.01"
              type="number"
              value={form.advancePayment}
            />
          </FieldLabel>
        </div>

        <div className="mt-8 space-y-4">
          {items.map((item, index) => (
            <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4" key={index}>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[2fr_0.7fr_0.7fr_0.9fr_0.8fr_auto]">
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
                    min="0"
                    onChange={(event) => updateItem(index, "rate", event.target.value)}
                    placeholder="Rate"
                    type="number"
                    value={item.rate}
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
            {isSaving ? "Creating..." : "Create invoice"}
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
          {status ? <p className="text-sm text-rose-700">{status}</p> : null}
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
            {selectedCustomer?.customerName || "Select a customer"}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {selectedCustomer?.address || "Customer address will appear here."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {preview.items.map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/85 px-4 py-3" key={item.id}>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-950">{item.description || "Untitled item"}</p>
                <p className="break-words text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.14em]">
                  {item.quantity} {item.unit} x {formatCurrency(item.rate)}
                </p>
              </div>
              <p className="shrink-0 text-right text-sm font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
            </div>
          ))}
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
          {advancePayment > 0 ? (
            <>
              <div className="mt-3 flex justify-between text-sm text-slate-300">
                <span>Advance payment</span>
                <span>- {formatCurrency(advancePayment)}</span>
              </div>
              <div className="mt-3 border-t border-white/10 pt-4 text-lg font-semibold">
                <div className="flex justify-between">
                  <span>Balance due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </form>
  );
}
