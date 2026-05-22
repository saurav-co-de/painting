"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";

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
  const deferredSearch = useDeferredValue(search);

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
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/customers/${form.id}` : "/api/customers";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || "Could not save customer.");
      return;
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

    setForm(emptyForm);
    setStatus(form.id ? "Customer updated." : "Customer added.");
  }

  async function handleDelete(customerId) {
    const response = await fetch(`/api/customers/${customerId}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || "Could not delete customer.");
      return;
    }

    startTransition(() => {
      setCustomers((current) => current.filter((customer) => customer.id !== customerId));
    });
    setStatus("Customer deleted.");
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-[0.85fr_1.15fr] 2xl:gap-5">
      <section className="glass-card p-4 sm:p-6 lg:p-8">
        <h3 className="font-display text-2xl text-slate-950">
          {form.id ? "Edit customer" : "Add customer"}
        </h3>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <input
            className="field"
            onChange={(event) => updateField("customerName", event.target.value)}
            placeholder="Client or company name"
            required
            value={form.customerName}
          />
          <input
            className="field"
            onChange={(event) => updateField("gstNumber", event.target.value)}
            placeholder="GST number"
            value={form.gstNumber}
          />
          <textarea
            className="field min-h-[110px]"
            onChange={(event) => updateField("address", event.target.value)}
            placeholder="Address"
            value={form.address}
          />
          <input
            className="field"
            onChange={(event) => updateField("mobile", event.target.value)}
            placeholder="Mobile number"
            value={form.mobile}
          />
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="button-primary flex-1" type="submit">
              {form.id ? "Save changes" : "Add customer"}
            </button>
            {form.id ? (
              <button
                className="button-secondary"
                onClick={() => setForm(emptyForm)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="glass-card p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-2xl text-slate-950">Customer directory</h3>
          <input
            className="field sm:max-w-md"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers"
            value={search}
          />
        </div>

        <div className="mt-6 space-y-4">
          {filteredCustomers.map((customer) => (
            <article
              className="rounded-xl border border-slate-200/80 bg-white/85 p-4 sm:p-5"
              key={customer.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-slate-950">
                    {customer.customerName}
                  </h4>
                  <p className="mt-2 break-words text-sm leading-7 text-slate-600">
                    {customer.address || "No address saved."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-slate-500 sm:tracking-[0.14em]">
                    <span className="max-w-full break-words rounded-lg bg-slate-50 px-2 py-1">
                      {customer.gstNumber || "GST pending"}
                    </span>
                    <span className="max-w-full break-words rounded-lg bg-slate-50 px-2 py-1">
                      {customer.mobile || "No mobile"}
                    </span>
                    <span className="rounded-lg bg-slate-50 px-2 py-1">
                      {invoiceCounts[customer.id] || 0} invoices
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                  <button
                    className="button-secondary px-3 py-2 text-sm"
                    onClick={() => setForm(customer)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 transition hover:border-rose-300 hover:bg-rose-100"
                    onClick={() => handleDelete(customer.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filteredCustomers.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
              No customers found yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
