"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateInvoice, formatCurrency } from "@/lib/billing";
import { readJsonResponse } from "@/lib/api";

export default function ExactBillBuilder({ customers = [] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    exactbillNumber: "",
    exactbillDate: new Date().toISOString().split("T")[0],
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    projectName: "",
    description: "",
    customerId: customers[0]?.id || "",
    items: [
      { description: "", quantity: 1, unit: "Nos", rate: 0 },
      { description: "Labour charges", quantity: 1, unit: "Nos", rate: 0 },
    ],
    taxMode: "CGST+SGST",
    status: "Draft",
    notes: "Thank you for considering us for this project.",
    terms: "Exact bill is valid for 30 days from the date of issue.",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === formData.customerId);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] =
      field === "quantity" || field === "rate" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unit: "Nos", rate: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculations = calculateInvoice(formData.items, formData.taxMode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/exactbills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const data = await readJsonResponse(response);

      if (!data.success) {
        setErrors({ submit: data.error });
        setLoading(false);
        return;
      }

      router.push(`/exactbills/${data.data.id}`);
    } catch (error) {
      setErrors({ submit: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        {errors.submit && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Header Section */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Exact Bill Date
            </label>
            <input
              type="date"
              value={formData.exactbillDate}
              onChange={(e) => handleInputChange("exactbillDate", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validityDate}
              onChange={(e) => handleInputChange("validityDate", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Client
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleInputChange("customerId", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select a client</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Project Name
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => handleInputChange("projectName", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Office Renovation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="Project description..."
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
          <h3 className="font-semibold text-slate-900">Items</h3>
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-6 gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                  className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <select
                  value={item.unit}
                  onChange={(e) =>
                    handleItemChange(index, "unit", e.target.value)
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option>Nos</option>
                  <option>Sqft</option>
                  <option>Sqm</option>
                  <option>Hrs</option>
                  <option>Days</option>
                </select>
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) =>
                    handleItemChange(index, "rate", e.target.value)
                  }
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Add Item
          </button>
        </div>

        {/* Tax & Status */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Tax Mode
            </label>
            <select
              value={formData.taxMode}
              onChange={(e) => handleInputChange("taxMode", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="CGST+SGST">CGST + SGST</option>
              <option value="IGST">IGST</option>
              <option value="none">Without GST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Terms & Conditions
            </label>
            <textarea
              value={formData.terms}
              onChange={(e) => handleInputChange("terms", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-slate-400"
        >
          {loading ? "Creating..." : "Create Exact Bill"}
        </button>
      </form>

      {/* Preview Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-slate-50 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Preview</h3>
            {selectedCustomer && (
              <div className="text-sm space-y-1 text-slate-700">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p>{selectedCustomer.address}</p>
                <p>{selectedCustomer.phone}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>
              {calculations.gst > 0 && (
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span className="font-medium">
                    {formatCurrency(calculations.gst)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                <span>Total:</span>
                <span>{formatCurrency(calculations.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
