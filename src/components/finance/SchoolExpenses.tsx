import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Save, X, AlertCircle, CheckCircle, Loader2,
  Search, Send, CreditCard, Banknote, Building2, Phone,
  Eye, CheckCircle2, Clock, XCircle,
  DollarSign, BarChart3,
  FileText, Receipt, Settings,
} from 'lucide-react';
import { financeService } from '../../services/financeService';
import type {
  Expense, ExpenseCategory, ExpensePayment, ExpenseStats,
} from '../../services/financeService';

const STATUS_BADGES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  partially_paid: { label: 'Partial', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <DollarSign className="w-3.5 h-3.5" /> },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  mpesa: { label: 'M-Pesa', icon: <Phone className="w-4 h-4" /> },
  bank: { label: 'Bank Transfer', icon: <Building2 className="w-4 h-4" /> },
  cash: { label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
  cheque: { label: 'Cheque', icon: <FileText className="w-4 h-4" /> },
};

const PAYMENT_TYPES = [
  { value: 'b2c', label: 'B2C (M-Pesa)', icon: <Phone className="w-4 h-4" />, desc: 'Send to phone number' },
  { value: 'b2b', label: 'B2B (Bank)', icon: <Building2 className="w-4 h-4" />, desc: 'Pay to business/bank' },
  { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" />, desc: 'Manual cash payment' },
  { value: 'cheque', label: 'Cheque', icon: <FileText className="w-4 h-4" />, desc: 'Cheque payment' },
];

const EMPTY_EXPENSE: Partial<Expense> = {
  title: '', description: '', amount: 0, expense_date: new Date().toISOString().split('T')[0],
  due_date: '', payment_method: 'mpesa', payee_name: '', payee_phone: '',
  payee_bank_name: '', payee_bank_account: '', category: '',
};

export default function SchoolExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>(EMPTY_EXPENSE);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [payForm, setPayForm] = useState({ payment_type: 'b2c', amount: 0, destination: '' });
  const [paying, setPaying] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'expenses' | 'categories'>('expenses');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchExpenses = useCallback(async () => {
    try {
      const result = await financeService.getExpenses({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      setExpenses(result);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load expenses');
    }
  }, [statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const result = await financeService.getExpenseCategories();
      setCategories(result);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const result = await financeService.getExpenseStats();
      setStats(result);
    } catch {}
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchExpenses(), fetchCategories(), fetchStats()]);
    setLoading(false);
  }, [fetchExpenses]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (v: number) => `KES ${v.toLocaleString()}`;
  const set = (field: string, value: any) => setExpenseForm(prev => ({ ...prev, [field]: value }));

  // ─── Expense CRUD ──────────────────────────────────────────────
  const saveExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) { showToast('error', 'Title and amount are required'); return; }
    setSaving(true);
    try {
      if (editExpenseId) {
        await financeService.updateExpense(editExpenseId, expenseForm);
        showToast('success', 'Expense updated');
      } else {
        await financeService.createExpense(expenseForm);
        showToast('success', 'Expense created');
      }
      setShowExpenseForm(false);
      setEditExpenseId(null);
      setExpenseForm(EMPTY_EXPENSE);
      fetchAll();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save expense');
    } finally { setSaving(false); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await financeService.deleteExpense(id);
      showToast('success', 'Deleted');
      fetchAll();
    } catch (err: any) { showToast('error', err.message || 'Failed to delete'); }
  };

  const openEditExpense = (e: Expense) => {
    setEditExpenseId(e.id!);
    setExpenseForm({ ...e, category: e.category || (e as any).category?.id || '' });
    setShowExpenseForm(true);
  };

  const approveExpense = async (id: string) => {
    try {
      await financeService.approveExpense(id);
      showToast('success', 'Expense approved');
      fetchAll();
    } catch (err: any) { showToast('error', err.message || 'Failed to approve'); }
  };

  // ─── Payment ───────────────────────────────────────────────────
  const openPayModal = (e: Expense) => {
    setPayingExpense(e);
    const bal = Number(e.amount) - Number(e.amount_paid || 0);
    setPayForm({
      payment_type: e.payment_method === 'bank' ? 'b2b' : e.payment_method === 'mpesa' ? 'b2c' : e.payment_method || 'cash',
      amount: bal,
      destination: e.payee_phone || e.payee_bank_account || '',
    });
    setShowPayModal(true);
  };

  const submitPayment = async () => {
    if (!payingExpense) return;
    if (payForm.amount <= 0) { showToast('error', 'Amount must be > 0'); return; }
    setPaying(true);
    try {
      await financeService.payExpense({
        expense_id: payingExpense.id!,
        amount: payForm.amount,
        payment_type: payForm.payment_type,
        destination: payForm.destination || undefined,
      });
      showToast('success', 'Payment processed successfully');
      setShowPayModal(false);
      setPayingExpense(null);
      fetchAll();
    } catch (err: any) {
      showToast('error', err.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  // ─── Category CRUD ─────────────────────────────────────────────
  const saveCategory = async () => {
    if (!catForm.name) { showToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      if (editCatId) {
        await financeService.updateExpenseCategory(editCatId, catForm);
        showToast('success', 'Category updated');
      } else {
        await financeService.createExpenseCategory(catForm);
        showToast('success', 'Category created');
      }
      setShowCategoryModal(false);
      setCatForm({ name: '', description: '' });
      setEditCatId(null);
      fetchCategories();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await financeService.deleteExpenseCategory(id);
      showToast('success', 'Deleted');
      fetchCategories();
    } catch (err: any) { showToast('error', err.message || 'Failed'); }
  };

  // ─── Detail View ───────────────────────────────────────────────
  const openDetail = async (e: Expense) => {
    try {
      const full = await financeService.getExpense(e.id!);
      setDetailExpense(full);
      setShowDetail(true);
    } catch {
      setDetailExpense(e);
      setShowDetail(true);
    }
  };

  // ─── Filtered list ─────────────────────────────────────────────
  const filtered = expenses.filter(e =>
    (!searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.payee_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">School Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Record, approve, and pay school expenses via M-Pesa B2C/B2B, cash, or cheque</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab(activeTab === 'expenses' ? 'categories' : 'expenses'); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" /> {activeTab === 'expenses' ? 'Manage Categories' : 'View Expenses'}
          </button>
          {activeTab === 'expenses' && (
            <button
              onClick={() => { setEditExpenseId(null); setExpenseForm(EMPTY_EXPENSE); setShowExpenseForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl"
            >
              <Plus className="w-4 h-4" /> New Expense
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Receipt className="w-5 h-5" />} label="Total Expenses" value={fmt(stats.total_expenses || 0)} color="blue" />
          <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Total Paid" value={fmt(stats.total_paid || 0)} color="emerald" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Outstanding" value={fmt((stats.total_expenses || 0) - (stats.total_paid || 0))} color="amber" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Categories" value={String(categories.length)} color="purple" />
        </div>
      )}

      {/* Category Breakdown */}
      {stats?.by_category && stats.by_category.length > 0 && activeTab === 'expenses' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {stats.by_category.map((c: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-xs text-gray-500 truncate">{c.category__name || 'Uncategorized'}</p>
              <p className="text-sm font-bold text-gray-800">KES {Number(c.total || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search expenses..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Expense Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expense</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No expenses found</td></tr>
                  ) : (
                    filtered.map(e => {
                      const badge = STATUS_BADGES[e.status] || STATUS_BADGES.pending;
                      const method = PAYMENT_METHOD_LABELS[e.payment_method] || PAYMENT_METHOD_LABELS.cash;
                      const bal = Number(e.amount) - Number(e.amount_paid || 0);
                      return (
                        <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">{e.title}</p>
                            <p className="text-xs text-gray-400">{e.payee_name || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{e.category_name || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right tabular-nums">{fmt(Number(e.amount))}</td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums">
                            <span className={Number(e.amount_paid) > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>{fmt(Number(e.amount_paid || 0))}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                              {badge.icon}{badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">{method.icon}{method.label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{e.expense_date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openDetail(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="View"><Eye className="w-4 h-4" /></button>
                              {e.status === 'pending' && (
                                <button onClick={() => approveExpense(e.id!)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                              )}
                              {(e.status === 'approved' || e.status === 'partially_paid') && bal > 0 && (
                                <button onClick={() => openPayModal(e)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Pay"><Send className="w-4 h-4" /></button>
                              )}
                              <button onClick={() => openEditExpense(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Edit"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => deleteExpense(e.id!)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Categories Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Expense Categories</h2>
            <button
              onClick={() => { setEditCatId(null); setCatForm({ name: '', description: '' }); setShowCategoryModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {categories.length === 0 ? (
              <p className="py-12 text-center text-gray-400 text-sm">No categories yet</p>
            ) : categories.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 group">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.description || 'No description'} · {c.expense_count || 0} expense(s)</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button onClick={() => { setEditCatId(c.id!); setCatForm({ name: c.name, description: c.description || '' }); setShowCategoryModal(true); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteCategory(c.id!)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         EXPENSE FORM MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showExpenseForm && (
        <Modal title={editExpenseId ? 'Edit Expense' : 'New Expense'} onClose={() => setShowExpenseForm(false)}>
          <div className="space-y-4">
            <Field label="Title *">
              <input type="text" value={expenseForm.title || ''} onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. Textbook Purchase" />
            </Field>

            <Field label="Description">
              <textarea rows={2} value={expenseForm.description || ''} onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (KES) *">
                <input type="number" min="0" value={expenseForm.amount || 0} onChange={e => set('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </Field>
              <Field label="Category">
                <select value={expenseForm.category || ''} onChange={e => set('category', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Expense Date *">
                <input type="date" value={expenseForm.expense_date || ''} onChange={e => set('expense_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </Field>
              <Field label="Due Date">
                <input type="date" value={expenseForm.due_date || ''} onChange={e => set('due_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </Field>
            </div>

            {/* Payment Method */}
            <Field label="Payment Method">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, { label, icon }]) => (
                  <button key={value} onClick={() => set('payment_method', value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${expenseForm.payment_method === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >{icon}{label}</button>
                ))}
              </div>
            </Field>

            {/* Payee Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase">Payee Information</p>
              <Field label="Payee Name">
                <input type="text" value={expenseForm.payee_name || ''} onChange={e => set('payee_name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. ABC Supplies Ltd" />
              </Field>
              {(expenseForm.payment_method === 'mpesa') && (
                <Field label="Phone Number">
                  <input type="text" value={expenseForm.payee_phone || ''} onChange={e => set('payee_phone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="254712345678" />
                </Field>
              )}
              {(expenseForm.payment_method === 'bank') && (
                <>
                  <Field label="Bank Name">
                    <input type="text" value={expenseForm.payee_bank_name || ''} onChange={e => set('payee_bank_name', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                  </Field>
                  <Field label="Account Number">
                    <input type="text" value={expenseForm.payee_bank_account || ''} onChange={e => set('payee_bank_account', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                  </Field>
                </>
              )}
            </div>
          </div>
          <ModalFooter onCancel={() => setShowExpenseForm(false)} onSave={saveExpense} saving={saving} label={editExpenseId ? 'Update' : 'Create'} />
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         PAY MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showPayModal && payingExpense && (
        <Modal title={`Pay Expense — ${payingExpense.title}`} onClose={() => setShowPayModal(false)}>
          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-gray-800">{fmt(Number(payingExpense.amount))}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Already Paid</span>
              <span className="font-medium text-emerald-600">{fmt(Number(payingExpense.amount_paid || 0))}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-blue-200">
              <span className="font-semibold text-gray-700">Balance</span>
              <span className="font-bold text-blue-700">{fmt(Number(payingExpense.amount) - Number(payingExpense.amount_paid || 0))}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Payment Type */}
            <Field label="Payment Channel">
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_TYPES.map(pt => (
                  <button key={pt.value} onClick={() => setPayForm(p => ({ ...p, payment_type: pt.value }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all
                      ${payForm.payment_type === pt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payForm.payment_type === pt.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{pt.icon}</div>
                    <div>
                      <p className={`text-sm font-medium ${payForm.payment_type === pt.value ? 'text-blue-700' : 'text-gray-600'}`}>{pt.label}</p>
                      <p className="text-xs text-gray-400">{pt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            {/* Amount */}
            <Field label="Amount to Pay (KES)">
              <input type="number" min="1" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </Field>

            {/* Destination */}
            {(payForm.payment_type === 'b2c' || payForm.payment_type === 'b2b') && (
              <Field label={payForm.payment_type === 'b2c' ? 'Phone Number' : 'Bank / Till Number'}>
                <input type="text" value={payForm.destination} onChange={e => setPayForm(p => ({ ...p, destination: e.target.value }))}
                  placeholder={payForm.payment_type === 'b2c' ? '254712345678' : 'Account/Till number'}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </Field>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowPayModal(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={submitPayment} disabled={paying}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Payment
            </button>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         DETAIL MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showDetail && detailExpense && (
        <Modal title="Expense Details" onClose={() => setShowDetail(false)} maxW="max-w-2xl">
          <div className="space-y-5">
            {/* Top info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailExpense.title}</h3>
                <p className="text-sm text-gray-500">{detailExpense.description}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${(STATUS_BADGES[detailExpense.status] || STATUS_BADGES.pending).color}`}>
                {(STATUS_BADGES[detailExpense.status] || STATUS_BADGES.pending).icon}
                {(STATUS_BADGES[detailExpense.status] || STATUS_BADGES.pending).label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Amount:</span> <span className="font-bold ml-1">{fmt(Number(detailExpense.amount))}</span></div>
              <div><span className="text-gray-500">Paid:</span> <span className="font-bold text-emerald-600 ml-1">{fmt(Number(detailExpense.amount_paid || 0))}</span></div>
              <div><span className="text-gray-500">Balance:</span> <span className="font-bold text-amber-600 ml-1">{fmt(Number(detailExpense.amount) - Number(detailExpense.amount_paid || 0))}</span></div>
              <div><span className="text-gray-500">Category:</span> <span className="ml-1">{detailExpense.category_name || '—'}</span></div>
              <div><span className="text-gray-500">Expense Date:</span> <span className="ml-1">{detailExpense.expense_date}</span></div>
              <div><span className="text-gray-500">Due Date:</span> <span className="ml-1">{detailExpense.due_date || '—'}</span></div>
              <div><span className="text-gray-500">Payee:</span> <span className="ml-1">{detailExpense.payee_name || '—'}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="ml-1">{detailExpense.payee_phone || '—'}</span></div>
            </div>

            {/* Payment History */}
            {detailExpense.payments && detailExpense.payments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Payment History</h4>
                <div className="space-y-2">
                  {detailExpense.payments.map((p: ExpensePayment, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {p.payment_type === 'b2c' ? <Phone className="w-4 h-4" /> : p.payment_type === 'b2b' ? <Building2 className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{p.payment_type.toUpperCase()} — {p.destination || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleString() : ''} {p.mpesa_receipt ? `• ${p.mpesa_receipt}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{fmt(Number(p.amount))}</p>
                        <span className={`text-xs font-medium ${p.status === 'completed' ? 'text-emerald-600' : p.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => setShowDetail(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Close</button>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         CATEGORY FORM MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      {showCategoryModal && (
        <Modal title={editCatId ? 'Edit Category' : 'New Category'} onClose={() => setShowCategoryModal(false)} maxW="max-w-md">
          <div className="space-y-4">
            <Field label="Name *">
              <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. Office Supplies" />
            </Field>
            <Field label="Description">
              <textarea rows={2} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </Field>
          </div>
          <ModalFooter onCancel={() => setShowCategoryModal(false)} onSave={saveCategory} saving={saving} label={editCatId ? 'Update' : 'Create'} />
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg[color]}`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, maxW = 'max-w-lg' }: { title: string; children: React.ReactNode; onClose: () => void; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxW} bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-modal-pop`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
      <style>{`
        @keyframes modalPop { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal-pop { animation: modalPop 0.2s ease-out; }
      `}</style>
    </div>
  );
}

function ModalFooter({ onCancel, onSave, saving, label }: { onCancel: () => void; onSave: () => void; saving: boolean; label: string }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {label}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
