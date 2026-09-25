"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { readJsonResponse } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCustomers,
  IconPhone,
  IconBuilding,
  IconInvoice,
  IconCheck,
  IconX
} from "@/components/Icons";

const emptyForm = {
  id: "",
  customerName: "",
  gstNumber: "",
  address: "",
  mobile: ""
};

export default function CustomersManager({ initialCustomers, invoiceCounts }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredCustomers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.customerName, customer.gstNumber, customer.mobile, customer.address]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [customers, deferredSearch]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/customers/${form.id}` : "/api/customers";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = await readJsonResponse(response, "Could not save customer.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not save customer.");
      }

      startTransition(() => {
        setCustomers((current) => {
          if (form.id) {
            return current.map((customer) =>
              customer.id === payload.customer.id ? payload.customer : customer
            );
          }
          return [payload.customer, ...current];
        });
      });

      const wasEditing = Boolean(form.id);
      setForm(emptyForm);
      setToast({
        type: "success",
        message: wasEditing ? "Customer updated successfully." : "Customer added successfully."
      });
    } catch (err) {
      setStatus(err.message || "Could not save customer.");
      setToast({
        type: "error",
        message: err.message || "Could not save customer."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(customerId) {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE"
      });
      const payload = await readJsonResponse(response, "Could not delete customer.");

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete customer.");
      }

      startTransition(() => {
        setCustomers((current) => current.filter((customer) => customer.id !== customerId));
      });
      setDeleteTarget(null);
      setToast({ type: "success", message: "Customer deleted successfully." });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Could not delete customer." });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
      {/* Left Column: Add / Edit Customer Form */}
      <div className="card p-5 sm:p-6 2xl:sticky 2xl:top-6 2xl:self-start">
        <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <IconCustomers className="w-4 h-4" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">
              {form.id ? "Edit Customer" : "Add New Customer"}
            </h2>
          </div>
          {form.id && (
            <button
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              onClick={() => setForm(emptyForm)}
              type="button"
            >
              <IconX className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Client or Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              className="field"
              onChange={(event) => updateField("customerName", event.target.value)}
              placeholder="e.g. Acme Enterprises or John Doe"
              required
              value={form.customerName}
            />
          </div>

          {/* GSTIN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              GSTIN Number (Optional)
            </label>
            <input
              className="field uppercase"
              maxLength={15}
              onChange={(event) => updateField("gstNumber", event.target.value.toUpperCase())}
              placeholder="15-character GSTIN"
              value={form.gstNumber}
            />
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Phone / Mobile Number
            </label>
            <input
              className="field"
              onChange={(event) => updateField("mobile", event.target.value)}
              placeholder="e.g. +91 98765 43210"
              value={form.mobile}
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Site / Billing Address
            </label>
            <textarea
              className="field min-h-[90px]"
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Full billing address..."
              value={form.address}
            />
          </div>

          {status && (
            <p className="text-xs font-medium text-rose-600">{status}</p>
          )}

          <div className="pt-2 flex items-center gap-2.5">
            <button
              className="button-primary flex-1"
              disabled={isSaving}
              type="submit"
            >
              <IconCheck className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : form.id ? "Update Customer" : "Add Customer"}</span>
            </button>
            {form.id && (
              <button
                className="button-secondary"
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Customer Directory List */}
      <div className="space-y-4">
        {/* Search Header Bar */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Customer Directory ({filteredCustomers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Quickly find clients to auto-fill invoices and track billing history
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="field pl-9 pr-3.5"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, GST, phone..."
              type="text"
              value={search}
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                onClick={() => setSearch("")}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const count = invoiceCounts[customer.id] || 0;

            return (
              <div
                className="card p-4 sm:p-5 transition-all hover:border-slate-300"
                key={customer.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {customer.customerName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 break-words line-clamp-2">
                      {customer.address || "No address specified"}
                    </p>

                    {/* Metadata Badges with Icons */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {customer.gstNumber ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          <IconBuilding className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{customer.gstNumber}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-slate-400">
                          No GSTIN
                        </span>
                      )}

                      {customer.mobile && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          <IconPhone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.mobile}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 font-semibold text-teal-800">
                        <IconInvoice className="w-3.5 h-3.5 text-teal-600" />
                        <span>{count} {count === 1 ? "invoice" : "invoices"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 sm:shrink-0">
                    <button
                      className="button-secondary text-xs py-1.5 px-3"
                      onClick={() => setForm(customer)}
                      type="button"
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      className="button-danger text-xs py-1.5 px-3"
                      onClick={() => setDeleteTarget(customer)}
                      type="button"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!filteredCustomers.length && (
          <div className="card p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <IconCustomers className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No customers found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {search
                ? `No clients matched "${search}". Try searching another name or phone number.`
                : "Add your first client or company using the form on the left."}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete Customer"
        isDeleting={isDeleting}
        message={`Are you sure you want to delete customer "${deleteTarget?.customerName || ""}"? Past invoices linked to this customer will remain in history.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
        open={Boolean(deleteTarget)}
        title="Delete Customer"
      />

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  );
}
