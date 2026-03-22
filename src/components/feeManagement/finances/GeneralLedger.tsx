import { useEffect, useState } from 'react';
import { accountingService, type AccountingAccount, type GeneralLedgerResponse } from '../../../services/accountingService';

const money = (v: number) => `KES ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<GeneralLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    accountingService.getAccounts().then((data) => {
      setAccounts(data);
      if (data[0]?.id) setAccountId(data[0].id);
    }).catch(() => setMessage('Failed to load accounts'));
  }, []);

  const run = async () => {
    if (!accountId) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await accountingService.getGeneralLedger(accountId, { start_date: startDate || undefined, end_date: endDate || undefined });
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
      <p className="text-sm text-gray-500 mb-4">Detailed account movements and running balances.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-2 items-end">
        <div className="min-w-56">
          <label className="text-xs text-gray-500">Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="block w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Select account</option>
            {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
          </select>
        </div>
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
          <div className="rounded-lg bg-white border px-3 py-2">Opening: <span className="font-semibold">{money(report.opening_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Closing: <span className="font-semibold">{money(report.closing_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Account: <span className="font-semibold">{report.account.code} - {report.account.name}</span></div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {(report?.rows || []).map((row, idx) => (
                <tr key={`${row.journal_entry_id}-${idx}`} className="border-b last:border-0">
                  <td className="py-2">{row.date}</td>
                  <td>{row.description}</td>
                  <td>{row.reference || '-'}</td>
                  <td className="text-right">{money(row.debit)}</td>
                  <td className="text-right">{money(row.credit)}</td>
                  <td className="text-right font-medium">{money(row.running_balance)}</td>
                </tr>
              ))}
              {(!report || report.rows.length === 0) && !loading && <tr><td colSpan={6} className="text-center py-4 text-gray-400">No ledger data</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
