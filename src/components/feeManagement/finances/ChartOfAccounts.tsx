import { useEffect, useState } from 'react';
import { accountingService, type AccountingAccount } from '../../../services/accountingService';

const emptyForm: AccountingAccount = {
  code: '',
  name: '',
  account_type: 'asset',
  normal_balance: 'debit',
  is_bank_account: false,
  is_cash_account: false,
  is_active: true,
};

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [form, setForm] = useState<AccountingAccount>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountingService.getAccounts();
      setAccounts(data);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await accountingService.createAccount(form);
      setForm(emptyForm);
      setMessage('Account created successfully');
      loadAccounts();
    } catch (error: any) {
      setMessage(error?.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Chart of Accounts</h1>
      <p className="text-sm text-gray-500 mb-6">Create and maintain accounting accounts used for double-entry journals.</p>

      {message && <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 text-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={onSave} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Add Account</h2>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Code (e.g. 1000)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.account_type}
            onChange={(e) => setForm((f) => ({ ...f, account_type: e.target.value as AccountingAccount['account_type'] }))}
          >
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.normal_balance}
            onChange={(e) => setForm((f) => ({ ...f, normal_balance: e.target.value as AccountingAccount['normal_balance'] }))}
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.is_cash_account} onChange={(e) => setForm((f) => ({ ...f, is_cash_account: e.target.checked }))} />
            Cash account
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!form.is_bank_account} onChange={(e) => setForm((f) => ({ ...f, is_bank_account: e.target.checked }))} />
            Bank account
          </label>
          <button disabled={saving} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
            {saving ? 'Saving...' : 'Create Account'}
          </button>
        </form>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
          <h2 className="font-semibold text-gray-800 mb-3">Accounts</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Normal</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{acc.code}</td>
                    <td>{acc.name}</td>
                    <td className="capitalize">{acc.account_type}</td>
                    <td className="capitalize">{acc.normal_balance}</td>
                    <td>{acc.is_cash_account ? 'Cash ' : ''}{acc.is_bank_account ? 'Bank' : ''}</td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-400">No accounts yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
