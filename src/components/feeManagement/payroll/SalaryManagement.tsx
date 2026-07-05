import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Edit3, Trash2, Search, DollarSign, Briefcase, Phone,
  Building2, ChevronDown, ChevronUp, Save, X, AlertCircle, CheckCircle,
  ArrowUpDown, Wallet, TrendingUp, TrendingDown, CalendarClock, Loader2, Info,
} from 'lucide-react';
import { payrollService } from '../../../services/payrollService';
import type { SalaryStructure, StaffForPayroll, DeductionPreview } from '../../../services/payrollService';
//import { useStaffAuth } from '../../../components/authentication/contexts/StaffAuthContext';

/* ═══════════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Teacher',
  CLASS_TEACHER: 'Class Teacher',
  HOD: 'Head of Dept',
  DIRECTOR_OF_STUDIES: 'Director of Studies',
  BURSAR: 'Bursar',
  LIBRARIAN: 'Librarian',
  ADMINISTRATIVE_STAFF: 'Admin Staff',
};

const FREQUENCY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  monthly: { label: 'Monthly', color: 'text-blue-700', bg: 'bg-blue-50' },
  once: { label: 'One-time', color: 'text-violet-700', bg: 'bg-violet-50' },
  yearly: { label: 'Yearly', color: 'text-amber-700', bg: 'bg-amber-50' },
};

const EMPTY_FORM: Partial<SalaryStructure> = {
  staff: '',
  basic_salary: 0,
  housing_allowance: 0,
  transport_allowance: 0,
  medical_allowance: 0,
  other_allowances: 0,
  tax_deduction: 0,
  nhif_deduction: 0,
  nssf_deduction: 0,
  sha_deduction: 0,
  kra_pin: '',
  bank_account: '',
  mpesa_number: '',
  nhif_number: '',
  nssf_number: '',
  department: '',

  housing_levy_deduction: 0,
  insurance_deduction: 0,
  loan_deduction: 0,
  other_deductions: 0,
  pay_frequency: 'monthly',
  payment_method: 'mpesa',
  phone_number: '',
  bank_name: '',
  bank_account_number: '',
  bank_code: '',
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function SalaryManagement() {
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [staffList, setStaffList] = useState<StaffForPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'name' | 'role' | 'net'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<SalaryStructure>>(EMPTY_FORM);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deductionPreview, setDeductionPreview] = useState<DeductionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  /* ─── Fetch ────────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sal, staff] = await Promise.all([
        payrollService.getSalaryStructures(),
        payrollService.getStaffList(),
      ]);
      setSalaries(sal);
      setStaffList(staff);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Toast ────────────────────────────────────────────────────────────── */
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Form helpers ─────────────────────────────────────────────────────── */
  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  // Add fields for payroll details in the form UI
  // Example: Add input fields for kra_pin, bank_account, mpesa_number, loan_deductions, nhif_number, nssf_number, department in the form rendering section.

  // Show Add Staff button for BURSAR role
  
  
  
  const openEdit = (s: SalaryStructure) => {
    setEditId(s.id ?? null);
    setForm({ ...s });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const set = (field: string, value: any) =>
    setForm((p) => ({ ...p, [field]: value }));

  const num = (field: string) => Number(form[field as keyof typeof form]) || 0;

  const gross =
    num('basic_salary') +
    num('housing_allowance') +
    num('transport_allowance') +
    num('medical_allowance') +
    num('other_allowances');

  const deductions = deductionPreview
    ? deductionPreview.total_deductions
    : num('tax_deduction') + num('nhif_deduction') + num('nssf_deduction') +
      num('sha_deduction') + num('housing_levy_deduction') + num('insurance_deduction') +
      num('loan_deduction') + num('other_deductions');

  const net = deductionPreview ? deductionPreview.net_salary : gross - deductions;

  /* ─── Auto-preview deductions when gross or loan changes ────────────── */
  useEffect(() => {
    if (!showForm || gross <= 0) {
      setDeductionPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await payrollService.previewDeductions(gross, num('loan_deduction'));
        setDeductionPreview(result);
      } catch {
        setDeductionPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [showForm, gross, form.loan_deduction]);

  /* ─── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.staff) {
      showToast('error', 'Please select a staff member');
      return;
    }
    if (num('basic_salary') <= 0) {
      showToast('error', 'Basic salary must be greater than zero');
      return;
    }
    if (form.payment_method === 'mpesa' && !form.phone_number) {
      showToast('error', 'Phone number is required for M-Pesa payment');
      return;
    }
    if (form.payment_method === 'bank' && (!form.bank_name || !form.bank_account_number)) {
      showToast('error', 'Bank name and account number are required');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await payrollService.updateSalaryStructure(editId, form);
        showToast('success', 'Salary structure updated successfully');
      } else {
        await payrollService.createSalaryStructure(form);
        showToast('success', 'Salary structure created successfully');
      }
      closeForm();
      fetchData();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err.message ||
        'Failed to save';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete ───────────────────────────────────────────────────────────── */
  const handleDelete = async (id: number) => {
    try {
      await payrollService.deleteSalaryStructure(id);
      showToast('success', 'Salary structure deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  /* ─── Filter / Sort ────────────────────────────────────────────────────── */
  const filtered = salaries
    .filter((s) => {
      const q = search.toLowerCase();
      return (
        (s.staff_name || '').toLowerCase().includes(q) ||
        (s.staff_role || '').toLowerCase().includes(q) ||
        (s.staff_email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.staff_name || '').localeCompare(b.staff_name || '');
      else if (sortField === 'role') cmp = (a.staff_role || '').localeCompare(b.staff_role || '');
      else cmp = (parseFloat(String(a.net_salary)) || 0) - (parseFloat(String(b.net_salary)) || 0);
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (f: typeof sortField) => {
    if (sortField === f) setSortAsc(!sortAsc);
    else { setSortField(f); setSortAsc(true); }
  };

  // Staff already assigned
  const assignedIds = salaries.map((s) => s.staff);
  const availableStaff = staffList.filter(
    (s) => !assignedIds.includes(s.id) || s.id === form.staff
  );

  /* ─── Summary Stats ────────────────────────────────────────────────────── */
  const totalGross = salaries.reduce((s, r) => s + (parseFloat(String(r.gross_salary)) || 0), 0);
  const totalDed = salaries.reduce((s, r) => s + (parseFloat(String(r.total_deductions)) || 0), 0);
  const totalNet = salaries.reduce((s, r) => s + (parseFloat(String(r.net_salary)) || 0), 0);

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm
          ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
        <p className="text-gray-500 text-sm mt-1">Define and manage staff salary structures, allowances, and deductions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<Users className="w-5 h-5" />} label="Total Staff" value={salaries.length} color="blue" />
        <SummaryCard icon={<TrendingUp className="w-5 h-5" />} label="Total Gross" value={`KES ${totalGross.toLocaleString()}`} color="emerald" />
        <SummaryCard icon={<TrendingDown className="w-5 h-5" />} label="Total Deductions" value={`KES ${totalDed.toLocaleString()}`} color="amber" />
        <SummaryCard icon={<Wallet className="w-5 h-5" />} label="Total Net Pay" value={`KES ${totalNet.toLocaleString()}`} color="violet" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Assign Salary
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No salary structures found</p>
            <p className="text-xs mt-1">Click "Assign Salary" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <SortHeader label="Staff Name" field="name" current={sortField} asc={sortAsc} onClick={toggleSort} />
                  <SortHeader label="Role" field="role" current={sortField} asc={sortAsc} onClick={toggleSort} />
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Gross</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Deductions</th>
                  <SortHeader label="Net Pay" field="net" current={sortField} asc={sortAsc} onClick={toggleSort} />
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Frequency</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Pay Method</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.staff_name}</div>
                      <div className="text-xs text-gray-400">{s.staff_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {ROLE_LABELS[s.staff_role || ''] || s.staff_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">KES {(parseFloat(String(s.gross_salary)) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">KES {(parseFloat(String(s.total_deductions)) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">KES {(parseFloat(String(s.net_salary)) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const freq = FREQUENCY_LABELS[s.pay_frequency || 'monthly'] || FREQUENCY_LABELS.monthly;
                        return (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${freq.color} ${freq.bg} px-2 py-0.5 rounded-md`}>
                            <CalendarClock className="w-3 h-3" /> {freq.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {s.payment_method === 'mpesa' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                          <Phone className="w-3 h-3" /> M-Pesa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3" /> Bank
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === s.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(s.id!)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-xs font-medium transition-colors">
                              Confirm
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(s.id!)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal Form ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto animate-modal-pop">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Edit Salary' : 'Assign Salary'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Staff Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Staff Member</label>
                <select
                  value={form.staff || ''}
                  onChange={(e) => {
                    set('staff', e.target.value);
                    const s = staffList.find((x) => x.id === e.target.value);
                    if (s) set('phone_number', s.phone_number || '');
                  }}
                  disabled={!!editId}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select staff member...</option>
                  {availableStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {ROLE_LABELS[s.role] || s.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pay Frequency */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Pay Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'once', 'yearly'] as const).map((freq) => {
                    const meta = FREQUENCY_LABELS[freq];
                    const isActive = form.pay_frequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => set('pay_frequency', freq)}
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-sm font-medium transition-all
                          ${isActive ? `${meta.bg} ${meta.color} border-current shadow-sm` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Earnings */}
              <FormSection title="Earnings" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
                <FormRow label="Basic Salary *" value={form.basic_salary} onChange={(v) => set('basic_salary', v)} />
                <FormRow label="Housing Allowance" value={form.housing_allowance} onChange={(v) => set('housing_allowance', v)} />
                <FormRow label="Transport Allowance" value={form.transport_allowance} onChange={(v) => set('transport_allowance', v)} />
                <FormRow label="Medical Allowance" value={form.medical_allowance} onChange={(v) => set('medical_allowance', v)} />
                <FormRow label="Other Allowances" value={form.other_allowances} onChange={(v) => set('other_allowances', v)} />
                <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
                  <span className="text-gray-600">Gross Salary</span>
                  <span className="text-emerald-600">KES {gross.toLocaleString()}</span>
                </div>
              </FormSection>

              {/* Deductions (Auto-calculated) */}
              <FormSection title="Deductions" icon={<TrendingDown className="w-4 h-4 text-amber-500" />}>
                {previewLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating deductions...
                  </div>
                ) : deductionPreview ? (
                  <>
                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2.5 mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <Info className="w-3.5 h-3.5" />
                        Deductions are auto-calculated based on <a href="/payroll/deductions" className="underline font-medium">configured rates</a>.
                      </div>
                    </div>
                    <ReadOnlyRow label="PAYE (Tax)" value={deductionPreview.paye} color="text-red-600" />
                    <ReadOnlyRow label="SHA (Social Health)" value={deductionPreview.sha} color="text-pink-600" />
                    <ReadOnlyRow label="NSSF" value={deductionPreview.nssf} color="text-blue-600" />
                    <ReadOnlyRow label="Housing Levy" value={deductionPreview.housing_levy} color="text-amber-600" />
                    {deductionPreview.insurance > 0 && (
                      <ReadOnlyRow label="Insurance" value={deductionPreview.insurance} color="text-violet-600" />
                    )}
                    <FormRow label="Loan Deduction" value={form.loan_deduction} onChange={(v) => set('loan_deduction', v)} />
                    <FormRow label="Other Deductions" value={form.other_deductions} onChange={(v) => set('other_deductions', v)} />
                    <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-semibold">
                      <span className="text-gray-600">Total Deductions</span>
                      <span className="text-amber-600">KES {deductions.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <FormRow label="Loan Deduction" value={form.loan_deduction} onChange={(v) => set('loan_deduction', v)} />
                    <FormRow label="Other Deductions" value={form.other_deductions} onChange={(v) => set('other_deductions', v)} />
                    <div className="text-xs text-gray-400 italic pt-1">Enter a basic salary above to see auto-calculated deductions.</div>
                  </>
                )}
              </FormSection>

              {/* Net Pay */}
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-violet-600" />
                  <span className="text-sm font-semibold text-gray-700">Net Pay</span>
                </div>
                <span className={`text-lg font-bold ${net >= 0 ? 'text-violet-600' : 'text-red-600'}`}>
                  KES {net.toLocaleString()}
                </span>
              </div>

              {/* Payment Method */}
              <FormSection title="Payment Method" icon={<DollarSign className="w-4 h-4 text-blue-500" />}>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors
                    ${form.payment_method === 'mpesa' ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={form.payment_method === 'mpesa'}
                      onChange={() => set('payment_method', 'mpesa')}
                      className="sr-only"
                    />
                    <Phone className={`w-4 h-4 ${form.payment_method === 'mpesa' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${form.payment_method === 'mpesa' ? 'text-green-700' : 'text-gray-600'}`}>
                      M-Pesa (B2C)
                    </span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors
                    ${form.payment_method === 'bank' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={form.payment_method === 'bank'}
                      onChange={() => set('payment_method', 'bank')}
                      className="sr-only"
                    />
                    <Building2 className={`w-4 h-4 ${form.payment_method === 'bank' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${form.payment_method === 'bank' ? 'text-blue-700' : 'text-gray-600'}`}>
                      Bank (B2B)
                    </span>
                  </label>
                </div>

                {form.payment_method === 'mpesa' ? (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
                    <input
                      type="text"
                      value={form.phone_number || ''}
                      onChange={(e) => set('phone_number', e.target.value)}
                      placeholder="e.g. 254712345678"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        value={form.bank_name || ''}
                        onChange={(e) => set('bank_name', e.target.value)}
                        placeholder="e.g. Equity Bank"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Number *</label>
                      <input
                        type="text"
                        value={form.bank_account_number || ''}
                        onChange={(e) => set('bank_account_number', e.target.value)}
                        placeholder="e.g. 0123456789"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank Code</label>
                      <input
                        type="text"
                        value={form.bank_code || ''}
                        onChange={(e) => set('bank_code', e.target.value)}
                        placeholder="e.g. 68"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </FormSection>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={closeForm} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal animation */}
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-pop {
          animation: modalPop 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
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

function SortHeader({
  label, field, current, asc, onClick,
}: {
  label: string;
  field: 'name' | 'role' | 'net';
  current: string;
  asc: boolean;
  onClick: (f: 'name' | 'role' | 'net') => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button onClick={() => onClick(field)} className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 transition-colors">
        {label}
        {current === field ? (
          asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FormRow({ label, value, onChange }: { label: string; value: any; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-gray-600 whitespace-nowrap">{label}</label>
      <input
        type="number"
        min="0"
        value={value || 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
      />
    </div>
  );
}

function ReadOnlyRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-xs text-gray-600 whitespace-nowrap">{label}</label>
      <span className={`text-sm font-medium ${color} tabular-nums`}>
        KES {value.toLocaleString()}
      </span>
    </div>
  );
}
