import { useEffect, useState } from 'react';
import { financeService, type RevenueLedgerResponse } from '../../../services/financeService';

const money = (v: number) => `KES ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GeneralLedger() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<RevenueLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    run();
  }, []);

  const run = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await financeService.getRevenueLedger({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setReport(data);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">General Ledger</h1>
      <p className="text-sm text-gray-500 mb-4">Unified revenue transaction ledger (money in / out) with running balance.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-500">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={run} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">Run Ledger</button>
      </div>

      {message && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{message}</div>}

      {report && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-white border px-3 py-2">Opening: <span className="font-semibold">{money(report.summary.opening_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Closing: <span className="font-semibold">{money(report.summary.closing_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Transactions: <span className="font-semibold">{report.summary.transaction_count}</span></div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Date</th>
                <th>Description</th>
                <th>Source</th>
                <th>Reference</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {(report?.transactions || []).map((row) => (
                <tr key={`${row.source}-${row.id}`} className="border-b last:border-0">
                  <td className="py-2">{new Date(row.transaction_date).toLocaleString()}</td>
                  <td>{row.description}</td>
                  <td className="capitalize">{row.source.replaceAll('_', ' ')}</td>
                  <td>{row.reference || '-'}</td>
                  <td className="text-right">{money(row.amount_in)}</td>
                  <td className="text-right">{money(row.amount_out)}</td>
                  <td className="text-right font-medium">{money(row.running_balance)}</td>
                </tr>
              ))}
              {(!report || report.transactions.length === 0) && !loading && <tr><td colSpan={7} className="text-center py-4 text-gray-400">No ledger data</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
