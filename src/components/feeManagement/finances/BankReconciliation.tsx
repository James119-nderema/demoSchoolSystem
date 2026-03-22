import { useEffect, useState } from 'react';
import { accountingService, type BankStatementLine, type ReconciliationSummary, type JournalEntry } from '../../../services/accountingService';

const money = (v: number) => `KES ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BankReconciliation() {
  const [lines, setLines] = useState<BankStatementLine[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [statementLineId, setStatementLineId] = useState('');
  const [journalLineId, setJournalLineId] = useState('');
  const [form, setForm] = useState<BankStatementLine>({
    statement_date: new Date().toISOString().slice(0, 10),
    reference: '',
    amount: 0,
    direction: 'outflow',
    bank_account_number: '',
    notes: '',
  });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [statementLines, reconSummary, entries] = await Promise.all([
        accountingService.getBankStatementLines(),
        accountingService.getBankReconciliationSummary(),
        accountingService.getJournalEntries(),
      ]);
      setLines(statementLines);
      setSummary(reconSummary);
      setJournalEntries(entries);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load reconciliation data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addStatementLine = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await accountingService.addBankStatementLine(form);
      setForm({ statement_date: new Date().toISOString().slice(0, 10), reference: '', amount: 0, direction: 'outflow', bank_account_number: '', notes: '' });
      setMessage('Statement line added');
      load();
    } catch (error: any) {
      setMessage(error?.message || 'Failed to add statement line');
    }
  };

  const match = async () => {
    if (!statementLineId || !journalLineId) return;
    setMessage('');
    try {
      await accountingService.matchBankTransaction({ statement_line_id: statementLineId, journal_line_id: journalLineId });
      setMessage('Matched successfully');
      setStatementLineId('');
      setJournalLineId('');
      load();
    } catch (error: any) {
      setMessage(error?.message || 'Match failed');
    }
  };

  const availableJournalLines = journalEntries.flatMap((entry) =>
    (entry.lines || []).map((line) => ({ ...line, entry_date: entry.entry_date, entry_description: entry.description })),
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bank Reconciliation</h1>
      <p className="text-sm text-gray-500 mb-4">Import statement lines and match them to posted bank journal lines.</p>

      {message && <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 text-sm">{message}</div>}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4 text-sm">
          <div className="rounded-lg bg-white border px-3 py-2">Book: <span className="font-semibold">{money(summary.book_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Statement: <span className="font-semibold">{money(summary.statement_balance)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Difference: <span className="font-semibold">{money(summary.difference)}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Unmatched Count: <span className="font-semibold">{summary.unmatched_count}</span></div>
          <div className="rounded-lg bg-white border px-3 py-2">Unmatched Amount: <span className="font-semibold">{money(summary.unmatched_amount)}</span></div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={addStatementLine} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-gray-800">Add Statement Line</h2>
          <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.statement_date} onChange={(e) => setForm((f) => ({ ...f, statement_date: e.target.value }))} required />
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Reference" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} required />
          <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Amount" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} required />
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as BankStatementLine['direction'] }))}>
            <option value="inflow">Inflow</option>
            <option value="outflow">Outflow</option>
          </select>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Bank account number" value={form.bank_account_number || ''} onChange={(e) => setForm((f) => ({ ...f, bank_account_number: e.target.value }))} />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">Add Line</button>
        </form>

        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-gray-800">Match Transactions</h2>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={statementLineId} onChange={(e) => setStatementLineId(e.target.value)}>
            <option value="">Select statement line</option>
            {lines.filter((line) => !line.matched).map((line) => (
              <option key={line.id} value={line.id}>{line.statement_date} | {line.reference} | {money(line.amount)}</option>
            ))}
          </select>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={journalLineId} onChange={(e) => setJournalLineId(e.target.value)}>
            <option value="">Select journal line</option>
            {availableJournalLines.map((line) => (
              <option key={line.id} value={line.id}>{line.entry_date} | {line.account_code} {line.account_name} | Dr {money(line.debit)} Cr {money(line.credit)}</option>
            ))}
          </select>
          <button onClick={match} className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium">Match</button>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold text-gray-800 mb-3">Statement Lines</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th>Reference</th>
              <th>Direction</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b last:border-0">
                <td className="py-2">{line.statement_date}</td>
                <td>{line.reference}</td>
                <td className="capitalize">{line.direction}</td>
                <td className="text-right">{money(line.amount)}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${line.matched ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {line.matched ? 'Matched' : 'Unmatched'}
                  </span>
                </td>
              </tr>
            ))}
            {lines.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-400">No statement lines</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
