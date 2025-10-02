import { useState, useEffect, useRef } from "react";

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
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [bankSearch, setBanking] = useState("");
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // List of Banks
  const banks = [
    "KCB",
    "Equity Bank",
    "Co-operative Bank of Kenya",
    "I&M Bank",
    "Absa Bank Kenya",
    "Stanbic Bank Kenya",
    "DTB (Diamond Trust Bank)",
    "Prime Bank",
    "Ecobank Kenya",
    "UBA Kenya",
    "First Community Bank",
    "Sidian Bank",
    "Credit Bank",
    "National Bank of Kenya",
    "Habib Bank A.G. Zurich",
  ];
  const filteredBanks = banks.filter((b) => b.toLowerCase().includes(bankSearch.toLowerCase()));

  function handleBankSelect(bank: string) {
    setBanking(bank);
    handleDetailChange("Bank Name", bank);
    setShowBankSuggestions(false);
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowBankSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const schoolInfo = localStorage.getItem("school_info");
    if (schoolInfo) {
      try {
        const parsedInfo = JSON.parse(schoolInfo);
        setSchoolId(parsedInfo.id);
      } catch (error) {
        console.error("Error parsing school_info:", error);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchPaymentMethods() {
      if (!schoolId) return;
      try {
        const response = await fetch(`http://localhost:8000/api/schools/${schoolId}/payment-methods/`);
        if (response.ok) {
          const data = await response.json();
          setMethods(data.flat());
          console.log("Fetched payment methods:", data);
        } else {
          console.error("Failed to fetch payment methods:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    }
    fetchPaymentMethods();
  }, [schoolId]);

  const paymentTypes: PaymentType[] = ["Mpesa", "Airtel", "Bank Transfer", "Card", "PayPal"];
  const filtered = methods.filter((m) => {
    const q = filter.trim().toLowerCase();
    return q === "" || m.type.toLowerCase().includes(q);
  }); 

  function handleEdit(method: PaymentMethod) {
    setForm({ type: method.type, details: method.details, active: method.active });
    setShowForm(true);
  }

  function handleDetailChange(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      details: { ...(prev.details || {}), [key]: value },
    }));
  }

  function getDetailsComponent(
    method: PaymentMethod,
    isEditing: boolean,
    updateDetails?: (key: string, value: string) => void
  ): React.ReactElement {
    const detailKeys = Object.keys(method.details || {});
    if (detailKeys.length === 0) {
      return <p className="text-sm text-gray-500">No details available.</p>;
    }
 console.log("tpe:", method.id)
    return (
      <div className="text-sm text-gray-600 space-y-2">
        {Object.entries(method.details).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong>
            {isEditing ? (
              <input
                type="text"
                value={value}
                onChange={(e) => updateDetails?.(key, e.target.value)}
                className="ml-2 border rounded-lg px-2 py-1 w-full"
              />
            ) : (
              <span className="ml-2">{value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }



  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type) return alert("Please select a type");
    if (!schoolId) return alert("Error: School ID is not available.");

    const newMethod = {
      type: form.type,
      details: form.details || {},
      active: form.active ?? true,
    };

    try {
      const response = await fetch(`http://localhost:8000/api/schools/${schoolId}/payment-methods/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMethod),
      });

      if (response.ok) {
        const savedMethod = await response.json();
        setMethods((prev) => [savedMethod, ...prev]);
        setShowForm(false);
        setForm({ type: "Mpesa", details: {}, active: true });
        setBanking("");
      } else {
        alert("Failed to save payment method.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">School Finance — Payment Methods</h1>
        <section className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Manage fee payment methods</h2>
            <button
              onClick={() => {
                setForm({ type: "Mpesa", details: {}, active: true });
                setShowForm(true);
                setBanking("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
            >
              + Add payment method
            </button>
          </div>

          <input
            placeholder="Filter by type"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 mb-4 w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No payment methods found.</p>
            ) : (
              filtered.map((m) => (
                <div key={m.id} className="border rounded-2xl p-4 shadow-md bg-white flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{m.type}</h3>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    
                      <input
                        type="checkbox"
                        checked={m.active}
                        
                      />
                      Active
                    </label>
                  </div>
                  {getDetailsComponent(m, false)  }
                  {/* <div className="text-sm text-gray-600 space-y-2">
                    {m.details && Object.entries(m.details).length > 0 ? (
                      Object.entries(m.details).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> <span>{value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">No details provided</p>
                    )}
                  </div> */}

                  <div className="text-right">
                    <button onClick={() => handleEdit(m)} className="text-blue-600 hover:underline text-sm">
                      Change Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={onSubmit} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-lg space-y-4">
              <h4 className="text-lg font-semibold">Add / Edit payment method</h4>
              <select
                value={form.type}
                onChange={(e) => {
                  setForm((f) => ({ ...f, type: e.target.value as PaymentType, details: {} }));
                  setBanking("");
                }}
                className="border rounded px-3 py-2 w-full"
              >
                {paymentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {form.type === "Mpesa" && (
                <>
                  <input placeholder="Paybill" value={form.details?.["Paybill"] || ""} onChange={(e) => handleDetailChange("Paybill", e.target.value)} className="border rounded px-3 py-2 w-full" />
                  <input placeholder="Account Number" value={form.details?.["Account Number"] || ""} onChange={(e) => handleDetailChange("Account Number", e.target.value)} className="border rounded px-3 py-2 w-full" />
                </>
              )}

              {form.type === "Airtel" && (
                <>
                  <input placeholder="Airtel Number" value={form.details?.["Airtel Number"] || ""} onChange={(e) => handleDetailChange("Airtel Number", e.target.value)} className="border rounded px-3 py-2 w-full" />
                  <input placeholder="Reference" value={form.details?.["Reference"] || ""} onChange={(e) => handleDetailChange("Reference", e.target.value)} className="border rounded px-3 py-2 w-full" />
                </>
              )}

              {form.type === "Bank Transfer" && (
                <>
                  <div className="relative" ref={suggestionRef}>
                    <input
                      placeholder="Bank Name"
                      value={bankSearch || form.details?.["Bank Name"] || ""}
                      onChange={(e) => {
                        setBanking(e.target.value);
                        setShowBankSuggestions(true);
                        handleDetailChange("Bank Name", e.target.value);
                      }}
                      onFocus={() => setShowBankSuggestions(true)}
                      className="border rounded px-3 py-2 w-full"
                    />
                    {showBankSuggestions && filteredBanks.length > 0 && (
                      <ul className="absolute left-0 right-0 bg-white border rounded-lg shadow-md mt-1 max-h-48 overflow-y-auto z-50">
                        {filteredBanks.map((bank) => (
                          <li key={bank} onClick={() => handleBankSelect(bank)} className="px-3 py-2 cursor-pointer hover:bg-gray-100">
                            {bank}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input placeholder="Bank Account Number" value={form.details?.["Bank Account Number"] || ""} onChange={(e) => handleDetailChange("Bank Account Number", e.target.value)} className="border rounded px-3 py-2 w-full mt-2" />
                </>
              )}

              {form.type === "Card" && (
                <input placeholder="Accepted Cards" value={form.details?.["Accepted Cards"] || ""} onChange={(e) => handleDetailChange("Accepted Cards", e.target.value)} className="border rounded px-3 py-2 w-full" />
              )}

              {form.type === "PayPal" && (
                <input placeholder="PayPal Email" value={form.details?.["PayPal Email"] || ""} onChange={(e) => handleDetailChange("PayPal Email", e.target.value)} className="border rounded px-3 py-2 w-full" />
              )}

              <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active ?? false}
                onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))}
                disabled={false}  // <--- editable here
              />
                <span className="text-sm">Active</span>
              </label>


              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}