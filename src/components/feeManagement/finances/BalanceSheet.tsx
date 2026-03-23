import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Save, X, AlertCircle, CheckCircle, Loader2,
  Landmark, TrendingUp, TrendingDown,
  Scale, Info, RefreshCw, Calendar,
} from 'lucide-react';
import { financeService } from '../../../services/financeService';
import type { BalanceSheetEntry, BalanceSheetData } from '../../../services/financeService';
import { FinancePageSkeleton } from '../../ui/Skeleton';

const ENTRY_TYPES = [
  { value: 'asset', label: 'Asset', icon: <TrendingUp className="w-4 h-4" />, color: 'emerald' },
  { value: 'liability', label: 'Liability', icon: <TrendingDown className="w-4 h-4" />, color: 'red' },
] as const;

const SUB_TYPES: Record<string, { label: string; value: string }[]> = {
  asset: [
    { value: 'cash', label: 'Cash & Bank' },
    { value: 'receivable', label: 'Accounts Receivable' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'fixed_asset', label: 'Fixed Assets' },
    { value: 'prepaid', label: 'Prepaid Expenses' },
    { value: 'other', label: 'Other' },
  ],
  liability: [
    { value: 'payable', label: 'Accounts Payable' },
    { value: 'loan', label: 'Loans & Borrowings' },
    { value: 'accrued', label: 'Accrued Expenses' },
    { value: 'deferred', label: 'Deferred Revenue' },
    { value: 'other', label: 'Other' },
  ],
};

const SUB_TYPE_LABELS: Record<string, string> = {};
Object.values(SUB_TYPES).flat().forEach(s => { SUB_TYPE_LABELS[s.value] = s.label; });

const EMPTY_FORM: Partial<BalanceSheetEntry> = {
  entry_type: 'asset',
  sub_type: 'cash',
  name: '',
  amount: 0,
  as_of_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function BalanceSheet() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BalanceSheetEntry>>(EMPTY_FORM);
  const [filterDate, setFilterDate] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeService.getBalanceSheet(filterDate || undefined);
      setData(result);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name || !form.amount) {
      showToast('error', 'Name and amount are required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await financeService.updateBalanceSheetEntry(editId, form);
        showToast('success', 'Entry updated');
      } else {
        await financeService.createBalanceSheetEntry(form);
        showToast('success', 'Entry created');
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await financeService.deleteBalanceSheetEntry(id);
      showToast('success', 'Deleted');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  const openEdit = (e: BalanceSheetEntry) => {
    setEditId(e.id!);
    setForm({ ...e });
    setShowForm(true);
  };

  const openNew = (type: 'asset' | 'liability') => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, entry_type: type, sub_type: SUB_TYPES[type][0].value });
    setShowForm(true);
  };

  const fmt = (v: number) => `KES ${v.toLocaleString()}`;
  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) {
    return <FinancePageSkeleton title="Balance Sheet" subtitle="Loading balance sheet data..." />;
  }

  const entries = data?.entries || [];
  const computed = data?.computed;
  const totals = data?.totals || { assets: 0, liabilities: 0, equity: 0 };

  const assets = entries.filter(e => e.entry_type === 'asset');
  const liabilities = entries.filter(e => e.entry_type === 'liability');
  // Combined totals (manual entries + computed)
  const totalAssets = computed?.total_assets ?? (totals.assets + (computed?.cash_and_bank || 0) + (computed?.accounts_receivable || 0));
  const totalLiabilities = computed?.total_liabilities ?? (totals.liabilities + (computed?.accounts_payable || 0));
  const totalEquity = computed?.auto_equity ?? (totalAssets - totalLiabilities);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-500 text-sm mt-1">Track assets, liabilities, and equity — with auto-computed figures from your financial data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date" value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              title="Filter by as-of date"
            />
          </div>
          <button onClick={fetchData} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TopCard icon={<TrendingUp className="w-5 h-5" />} label="Total Assets" value={fmt(totalAssets)} color="emerald" />
        <TopCard icon={<TrendingDown className="w-5 h-5" />} label="Total Liabilities" value={fmt(totalLiabilities)} color="red" />
        <TopCard icon={<Landmark className="w-5 h-5" />} label="Total Equity" value={fmt(totalEquity)} color="blue" />
        <TopCard icon={<Scale className="w-5 h-5" />} label="Net Worth" value={fmt(netWorth)} color={netWorth >= 0 ? 'emerald' : 'red'} />
      </div>

      {/* Auto-computed Section */}
      {computed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-blue-800">Auto-Computed from Financial Records</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3">
            <ComputedCard label="Cash & Bank" value={computed.cash_and_bank} color="text-emerald-600" />
            <ComputedCard label="Receivables" value={computed.accounts_receivable} color="text-blue-600" />
            <ComputedCard label="Revenue Collected" value={computed.total_revenue_collected} color="text-emerald-600" />
            <ComputedCard label="Revenue (Adj. by A/L)" value={computed.adjusted_total_revenue || computed.total_revenue_collected} color="text-violet-600" />
            <ComputedCard label="Total Outflow" value={computed.total_outflow || 0} color="text-red-600" />
            <ComputedCard label="Payroll Paid" value={computed.total_payroll_paid} color="text-red-600" />
            <ComputedCard label="Expenses Paid" value={computed.total_expenses_paid} color="text-red-600" />
            <ComputedCard label="Payables" value={computed.accounts_payable} color="text-amber-600" />
          </div>
        </div>
      )}

      {/* Three-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <EntrySection
          title="Assets"
          subtitle="What the school owns"
          entries={assets}
          color="emerald"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          onAdd={() => openNew('asset')}
          onEdit={openEdit}
          onDelete={handleDelete}
        />

        {/* Liabilities */}
        <EntrySection
          title="Liabilities"
          subtitle="What the school owes"
          entries={liabilities}
          color="red"
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          onAdd={() => openNew('liability')}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Accounting Equation */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-500" /> Accounting Equation Check
        </h3>
        <div className="flex items-center justify-center gap-4 flex-wrap text-center">
          <div className="bg-emerald-50 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-500">Assets</p>
            <p className="text-lg font-bold text-emerald-600">{fmt(totalAssets)}</p>
          </div>
          <span className="text-2xl font-bold text-gray-300">=</span>
          <div className="bg-red-50 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-500">Liabilities</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalLiabilities)}</p>
          </div>
          <span className="text-2xl font-bold text-gray-300">+</span>
          <div className="bg-blue-50 rounded-xl px-6 py-3">
            <p className="text-xs text-gray-500">Equity</p>
            <p className="text-lg font-bold text-blue-600">{fmt(totalEquity)}</p>
          </div>
        </div>
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle className="w-4 h-4" />
          <span>Balanced automatically: Equity is auto-calculated as Net Worth (Assets - Liabilities).</span>
        </div>
      </div>

      {/* ─── Form Modal ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-modal-pop">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Entry' : 'New Balance Sheet Entry'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {ENTRY_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { set('entry_type', t.value); set('sub_type', SUB_TYPES[t.value][0].value); }}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${form.entry_type === t.value
                          ? t.color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : t.color === 'red' ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-category</label>
                <select
                  value={form.sub_type || 'other'}
                  onChange={e => set('sub_type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {(SUB_TYPES[form.entry_type || 'asset'] || []).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. School Bus, Term 2 Fees Receivable"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (KES) *</label>
                <input
                  type="number" min="0"
                  value={form.amount || 0}
                  onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* As of date */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">As of Date *</label>
                <input
                  type="date"
                  value={form.as_of_date || ''}
                  onChange={e => set('as_of_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes || ''}
                  onChange={e => set('notes', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
          <style>{`
            @keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .animate-modal-pop { animation: modalPop 0.2s ease-out; }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function TopCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function ComputedCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/70 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color}`}>KES {value.toLocaleString()}</p>
    </div>
  );
}

function EntrySection({
  title, subtitle, entries, color, icon, onAdd, onEdit, onDelete,
}: {
  title: string; subtitle: string; entries: BalanceSheetEntry[];
  color: string; icon: React.ReactNode;
  onAdd: () => void; onEdit: (e: BalanceSheetEntry) => void; onDelete: (id: string) => void;
}) {
  const gradients: Record<string, string> = {
    emerald: 'from-emerald-600 to-teal-600',
    red: 'from-red-600 to-rose-600',
    blue: 'from-blue-600 to-indigo-600',
  };
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);

  // Group by sub_type
  const grouped: Record<string, BalanceSheetEntry[]> = {};
  entries.forEach(e => {
    const key = e.sub_type || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradients[color]} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">{icon}</div>
          <div>
            <h3 className="text-white font-bold">{title}</h3>
            <p className="text-white/70 text-xs">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/70 text-xs">Total</p>
          <p className="text-white font-bold">KES {total.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4">
        {Object.keys(grouped).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(grouped).map(([subType, items]) => (
              <div key={subType}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {SUB_TYPE_LABELS[subType] || subType}
                </p>
                {items.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 group">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.name}</p>
                      {e.notes && <p className="text-xs text-gray-400">{e.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">KES {Number(e.amount).toLocaleString()}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button onClick={() => onEdit(e)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(e.id!)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No entries yet</p>
        )}

        <button
          onClick={onAdd}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>
    </div>
  );
}
