import { useEffect, useState } from 'react';
import { accountingService, type TrialBalanceResponse } from '../../../services/accountingService';

const money = (v: number) => `KES ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function TrialBalance() {
  const [report, setReport] = useState<TrialBalanceResponse | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await accountingService.getTrialBalance({ start_date: startDate || undefined, end_date: endDate || undefined });
      setReport(data);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Trial Balance</h1>
      <p className="text-sm text-gray-500 mb-4">Validate that total debits equal total credits.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">Run Report</button>
      </div>

      {message && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{message}</div>}

      <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Code</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {(report?.rows || []).map((row) => (
                  <tr key={row.account_id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.code}</td>
                    <td>{row.name}</td>
                    <td className="capitalize">{row.account_type}</td>
                    <td className="text-right">{money(row.debit)}</td>
                    <td className="text-right">{money(row.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 border px-3 py-2">Total Debit: <span className="font-semibold">{money(report?.total_debit || 0)}</span></div>
              <div className="rounded-lg bg-gray-50 border px-3 py-2">Total Credit: <span className="font-semibold">{money(report?.total_credit || 0)}</span></div>
              <div className={`rounded-lg border px-3 py-2 font-semibold ${(report?.is_balanced ?? false) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {(report?.is_balanced ?? false) ? 'Balanced' : 'Not Balanced'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
