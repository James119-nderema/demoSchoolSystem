import { useEffect, useState } from 'react';
import { accountingService, type AccountingAccount, type JournalEntry, type JournalLineInput } from '../../../services/accountingService';

const nowDate = () => new Date().toISOString().slice(0, 10);

export default function JournalEntries() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entryDate, setEntryDate] = useState(nowDate());
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLineInput[]>([
    { account: '', debit: 0, credit: 0, memo: '' },
    { account: '', debit: 0, credit: 0, memo: '' },
  ]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);

  const load = async () => {
    const [accs, ents] = await Promise.all([
      accountingService.getAccounts(),
      accountingService.getJournalEntries(),
    ]);
    setAccounts(accs);
    setEntries(ents);
  };

  useEffect(() => {
    load().catch(() => setMessage('Failed to load journals'));
  }, []);

  const addLine = () => setLines((prev) => [...prev, { account: '', debit: 0, credit: 0, memo: '' }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const updateLine = (index: number, updates: Partial<JournalLineInput>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...updates } : line)));
  };

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await accountingService.createJournalEntry({
        entry_date: entryDate,
        description,
        reference,
        lines,
      });
      setDescription('');
      setReference('');
      setLines([
        { account: '', debit: 0, credit: 0, memo: '' },
        { account: '', debit: 0, credit: 0, memo: '' },
      ]);
      setMessage('Journal entry posted');
      load();
    } catch (error: any) {
      setMessage(error?.message || 'Failed to post journal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Journal Entries</h1>
      <p className="text-sm text-gray-500 mb-6">Post double-entry transactions and review recent journals.</p>

      {message && <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 text-sm">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={saveEntry} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">New Journal Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select className="col-span-4 border rounded-lg px-2 py-2 text-sm" value={line.account} onChange={(e) => updateLine(index, { account: e.target.value })} required>
                  <option value="">Account</option>
                  {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <input type="number" step="0.01" className="col-span-2 border rounded-lg px-2 py-2 text-sm" value={line.debit} onChange={(e) => updateLine(index, { debit: Number(e.target.value) })} placeholder="Dr" />
                <input type="number" step="0.01" className="col-span-2 border rounded-lg px-2 py-2 text-sm" value={line.credit} onChange={(e) => updateLine(index, { credit: Number(e.target.value) })} placeholder="Cr" />
                <input className="col-span-3 border rounded-lg px-2 py-2 text-sm" value={line.memo || ''} onChange={(e) => updateLine(index, { memo: e.target.value })} placeholder="Memo" />
                <button type="button" onClick={() => removeLine(index)} className="col-span-1 text-red-500 text-xs">X</button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={addLine} className="text-blue-600">+ Add line</button>
            <div className={`font-semibold ${totalDebit === totalCredit ? 'text-emerald-600' : 'text-red-500'}`}>
              Dr {totalDebit.toFixed(2)} | Cr {totalCredit.toFixed(2)}
            </div>
          </div>

          <button disabled={saving || totalDebit !== totalCredit} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
            {saving ? 'Posting...' : 'Post Journal'}
          </button>
        </form>

        <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Entries</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Date</th>
                <th>Description</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2">{entry.entry_date}</td>
                  <td>{entry.description}</td>
                  <td>{entry.reference || '-'}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-400">No entries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
