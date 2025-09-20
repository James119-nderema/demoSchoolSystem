import React, { useState } from "react";

type PaymentType = "Mpesa" | "Airtel" | "Bank Transfer" | "Card" | "PayPal";

interface PaymentMethod {
  id: string;
  type: PaymentType;
  details: Record<string, string>;
  active: boolean;
}

export default function SchoolFinance(): React.ReactElement {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<PaymentMethod>>({ type: "Mpesa", details: {}, active: true });

  const paymentTypes: PaymentType[] = ["Mpesa", "Airtel", "Bank Transfer", "Card", "PayPal"];

  const filtered = methods.filter((m) => {
    const q = filter.trim().toLowerCase();
    return q === "" || m.type.toLowerCase().includes(q);
  });

  function handleDetailChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, details: { ...(prev.details || {}), [key]: value } }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type) return alert("Please select a type");

    const newMethod: PaymentMethod = {
      id: Math.random().toString(36).slice(2, 9),
      type: form.type,
      details: form.details || {},
      active: form.active ?? true,
    };
    setMethods((prev) => [newMethod, ...prev]);
    setShowForm(false);
    setForm({ type: "Mpesa", details: {}, active: true });
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">School Finance — Payment Methods</h1>

        <section className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Manage fee payment methods</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
            >
              + Add fee payment method
            </button>
          </div>

          <input
            placeholder="Filter by type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 mb-4 w-full"
          />

          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-sm text-gray-500">No payment methods found.</p>}
            {filtered.map((m) => (
              <div key={m.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="font-medium">{m.type}</div>
                <div className="text-sm text-gray-600">
                  {Object.entries(m.details).map(([k, v]) => (
                    <div key={k}><strong>{k}:</strong> {v}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={onSubmit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-lg space-y-4">
              <h4 className="text-lg font-semibold">Add payment method</h4>
              <label className="text-sm">Payment Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PaymentType, details: {} }))}
                className="border rounded px-3 py-2 w-full"
              >
                {paymentTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Dynamic fields based on selection */}
              {form.type === "Mpesa" && (
                <>
                  <input
                    placeholder="Paybill"
                    onChange={(e) => handleDetailChange("Paybill", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Account Number"
                    onChange={(e) => handleDetailChange("Account Number", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                </>
              )}

              {form.type === "Airtel" && (
                <>
                  <input
                    placeholder="Airtel Money Number"
                    onChange={(e) => handleDetailChange("Airtel Number", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Reference/Account"
                    onChange={(e) => handleDetailChange("Reference", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                </>
              )}

              {form.type === "Bank Transfer" && (
                <>
                  <input
                    placeholder="Bank Name"
                    onChange={(e) => handleDetailChange("Bank Name", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    placeholder="Bank Account Number"
                    onChange={(e) => handleDetailChange("Bank Account Number", e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  />
                </>
              )}

              {form.type === "Card" && (
                <input
                  placeholder="Accepted Card Types (e.g. Visa, MasterCard)"
                  onChange={(e) => handleDetailChange("Accepted Cards", e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                />
              )}

              {form.type === "PayPal" && (
                <input
                  placeholder="PayPal Email"
                  onChange={(e) => handleDetailChange("PayPal Email", e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                />
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <span className="text-sm">Active</span>
              </label>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
