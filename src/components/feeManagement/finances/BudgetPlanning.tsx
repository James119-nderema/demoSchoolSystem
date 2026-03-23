import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, Trash2, Save, X, AlertCircle, CheckCircle, Loader2,
  CalendarRange, TrendingUp, TrendingDown,
  Target, ChevronDown, ChevronRight, Info,
  Calculator, Layers,
} from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { payrollService } from '../../../services/payrollService';
import type {
  BudgetPeriod, BudgetPeriodListItem, BudgetCategory, BudgetItem,
  BudgetSimulation, BudgetPlanningAssumptions,
} from '../../../services/financeService';
import type { SalaryStructure } from '../../../services/payrollService';
import { FinancePageSkeleton } from '../../ui/Skeleton';

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function BudgetPlanning() {
  const [periods, setPeriods] = useState<BudgetPeriodListItem[]>([]);
  const [activePeriod, setActivePeriod] = useState<BudgetPeriod | null>(null);
  const [simulation, setSimulation] = useState<BudgetSimulation | null>(null);
  const [assumptions, setAssumptions] = useState<BudgetPlanningAssumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form modals
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [periodForm, setPeriodForm] = useState({ name: '', start_date: '', end_date: '', status: 'draft' as const, notes: '' });
  const [editPeriodId, setEditPeriodId] = useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', category_type: 'revenue' as 'revenue' | 'expenditure', description: '' });

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ category_id: '', name: '', planned_amount: 0, actual_amount: 0, notes: '' });
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [yearlyFeePerStudent, setYearlyFeePerStudent] = useState(0);
  const [salaryMonths, setSalaryMonths] = useState(12);
  const [staffMonths, setStaffMonths] = useState<Record<string, number>>({});
  const [payrollSalaries, setPayrollSalaries] = useState<SalaryStructure[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showSimulation, setShowSimulation] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Fetch ────────────────────────────────────────────────────────────── */
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getBudgetPeriods();
      setPeriods(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load budget periods');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPeriodDetail = useCallback(async (id: string) => {
    try {
      const data = await financeService.getBudgetPeriod(id);
      setActivePeriod(data);
      // Expand all categories by default
      const catIds = new Set((data.categories || []).map(c => c.id!));
      setExpandedCats(catIds);
      try {
        const assumptionsData = await financeService.getBudgetPlanningAssumptions({ period_id: id, salary_months: salaryMonths });
        setAssumptions(assumptionsData);
        const initialMonths: Record<string, number> = {};
        (assumptionsData.salary_staff || []).forEach((s) => { initialMonths[s.staff_id] = s.months; });
        setStaffMonths(initialMonths);
        if (!yearlyFeePerStudent && assumptionsData.suggestions.yearly_fee_per_student > 0) {
          setYearlyFeePerStudent(assumptionsData.suggestions.yearly_fee_per_student);
        }
      } catch {
        setAssumptions(null);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load period');
    }
  }, [salaryMonths, yearlyFeePerStudent]);

  const refreshAssumptions = useCallback(async () => {
    if (!activePeriod?.id) return;
    try {
      const assumptionsData = await financeService.getBudgetPlanningAssumptions({
        period_id: activePeriod.id,
        yearly_fee_per_student: yearlyFeePerStudent,
        salary_months: salaryMonths,
        staff_months: getStaffMonthOverrides(),
      });
      setAssumptions(assumptionsData);
    } catch {
      setAssumptions(null);
    }
  }, [activePeriod?.id, salaryMonths, yearlyFeePerStudent, staffMonths]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);
  useEffect(() => { refreshAssumptions(); }, [refreshAssumptions]);

  /* ─── Simulation ───────────────────────────────────────────────────────── */
  const runSimulation = async () => {
    if (!activePeriod?.id) return;
    setSimLoading(true);
    try {
      const data = await financeService.getBudgetSimulation(activePeriod.id);
      setSimulation(data);
      setShowSimulation(true);
    } catch (err: any) {
      showToast('error', err.message || 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  /* ─── Period CRUD ──────────────────────────────────────────────────────── */
  const savePeriod = async () => {
    setSaving(true);
    try {
      if (editPeriodId) {
        await financeService.updateBudgetPeriod(editPeriodId, periodForm);
        showToast('success', 'Budget period updated');
      } else {
        await financeService.createBudgetPeriod(periodForm);
        showToast('success', 'Budget period created');
      }
      setShowPeriodForm(false);
      setEditPeriodId(null);
      fetchPeriods();
      if (activePeriod?.id) fetchPeriodDetail(activePeriod.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deletePeriod = async (id: string) => {
    if (!confirm('Delete this entire budget period and all its data?')) return;
    try {
      await financeService.deleteBudgetPeriod(id);
      showToast('success', 'Deleted');
      if (activePeriod?.id === id) setActivePeriod(null);
      fetchPeriods();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  /* ─── Category CRUD ────────────────────────────────────────────────────── */
  const saveCategory = async () => {
    if (!activePeriod?.id) return;
    setSaving(true);
    try {
      await financeService.createBudgetCategory({
        ...categoryForm,
        budget_period: activePeriod.id,
      });
      showToast('success', 'Category added');
      setShowCategoryForm(false);
      fetchPeriodDetail(activePeriod.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      await financeService.deleteBudgetCategory(id);
      showToast('success', 'Category deleted');
      if (activePeriod?.id) fetchPeriodDetail(activePeriod.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  /* ─── Item CRUD ────────────────────────────────────────────────────────── */
  const saveItem = async () => {
    setSaving(true);
    try {
      if (editItemId) {
        await financeService.updateBudgetItem(editItemId, {
          name: itemForm.name,
          planned_amount: itemForm.planned_amount,
          actual_amount: itemForm.actual_amount,
          notes: itemForm.notes,
        });
        showToast('success', 'Item updated');
      } else {
        await financeService.createBudgetItem({
          category: itemForm.category_id,
          name: itemForm.name,
          planned_amount: itemForm.planned_amount,
          actual_amount: itemForm.actual_amount,
          notes: itemForm.notes,
        });
        showToast('success', 'Item added');
      }
      setShowItemForm(false);
      setEditItemId(null);
      if (activePeriod?.id) fetchPeriodDetail(activePeriod.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await financeService.deleteBudgetItem(id);
      showToast('success', 'Item deleted');
      if (activePeriod?.id) fetchPeriodDetail(activePeriod.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete');
    }
  };

  /* ─── Helpers ──────────────────────────────────────────────────────────── */
  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditPeriod = (p: BudgetPeriodListItem) => {
    setEditPeriodId(p.id);
    setPeriodForm({ name: p.name, start_date: p.start_date, end_date: p.end_date, status: p.status as any, notes: '' });
    setShowPeriodForm(true);
  };

  const openNewItem = (catId: string) => {
    setEditItemId(null);
    setItemForm({ category_id: catId, name: '', planned_amount: 0, actual_amount: 0, notes: '' });
    if (assumptions?.assumptions?.period_months) {
      setSalaryMonths(assumptions.assumptions.period_months);
    }

    const cat = (activePeriod?.categories || []).find(c => c.id === catId);
    if (cat?.category_type === 'expenditure') {
      (async () => {
        setPayrollLoading(true);
        try {
          const rows = await payrollService.getSalaryStructures();
          setPayrollSalaries(rows || []);
          setStaffMonths((prev) => {
            const next = { ...prev };
            (rows || []).forEach((r) => {
              const sid = String(r.staff || '');
              if (sid && typeof next[sid] !== 'number') next[sid] = salaryMonths;
            });
            return next;
          });
        } catch {
          setPayrollSalaries([]);
        } finally {
          setPayrollLoading(false);
        }
      })();
    }
    setShowItemForm(true);
  };

  const openEditItem = (item: BudgetItem, catId: string) => {
    setEditItemId(item.id!);
    setItemForm({
      category_id: catId,
      name: item.name,
      planned_amount: item.planned_amount,
      actual_amount: item.actual_amount,
      notes: item.notes || '',
    });
    setShowItemForm(true);
  };

  const fmt = (v: number) => `KES ${v.toLocaleString()}`;
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-red-100 text-red-700',
  };

  const selectedCategory = (activePeriod?.categories || []).find(c => c.id === itemForm.category_id);
  const isFeesItem = selectedCategory?.category_type === 'revenue';
  const isSalaryItem = selectedCategory?.category_type === 'expenditure';

  const getStaffMonthOverrides = () => {
    const overrides: Record<string, number> = {};
    Object.entries(staffMonths).forEach(([staffId, months]) => {
      const m = Number(months);
      if (Number.isFinite(m) && m !== salaryMonths) {
        overrides[staffId] = m;
      }
    });
    return overrides;
  };

  const applyFeeAutoCalc = async () => {
    if (!activePeriod?.id) return;
    if (yearlyFeePerStudent <= 0) {
      showToast('error', 'Enter yearly fee per student first');
      return;
    }
    try {
      const data = await financeService.getBudgetPlanningAssumptions({
        period_id: activePeriod.id,
        yearly_fee_per_student: yearlyFeePerStudent,
        salary_months: salaryMonths,
      });
      setAssumptions(data);
      setItemForm(prev => ({
        ...prev,
        planned_amount: data.suggestions.fee_planned_projection,
        actual_amount: data.suggestions.fee_actual_projection,
      }));
    } catch (err: any) {
      showToast('error', err.message || 'Failed to auto-calculate fee projection');
    }
  };

  const applySalaryAutoCalc = async () => {
    if (!activePeriod?.id) return;
    try {
      const data = await financeService.getBudgetPlanningAssumptions({
        period_id: activePeriod.id,
        yearly_fee_per_student: yearlyFeePerStudent,
        salary_months: salaryMonths,
        staff_months: getStaffMonthOverrides(),
      });
      setAssumptions(data);
      setItemForm(prev => ({
        ...prev,
        planned_amount: data.suggestions.salary_planned_total_payment || data.suggestions.salary_planned_gross_total,
        actual_amount: data.suggestions.salary_actual_total_payment || data.suggestions.salary_actual_gross_total,
      }));
    } catch (err: any) {
      showToast('error', err.message || 'Failed to auto-calculate salary projection');
    }
  };

  const salaryRowsForModal = assumptions?.salary_staff?.length
    ? assumptions.salary_staff.map((s) => ({
      staff_id: s.staff_id,
      staff_name: s.staff_name,
      monthly_total_payment: s.monthly_total_payment || s.monthly_gross,
      months: s.months,
    }))
    : payrollSalaries.map((s) => ({
      staff_id: String(s.staff || ''),
      staff_name: s.staff_name || 'Staff',
      monthly_total_payment: Number(s.gross_salary || 0),
      months: staffMonths[String(s.staff || '')] ?? salaryMonths,
    }));

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return <FinancePageSkeleton title="Budget Planning" subtitle="Loading budget data..." />;
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
          <h1 className="text-2xl font-bold text-gray-900">Budget Planning</h1>
          <p className="text-gray-500 text-sm mt-1">Plan your financial year, simulate budgets, and track revenue vs expenditure</p>
        </div>
        <button
          onClick={() => { setEditPeriodId(null); setPeriodForm({ name: '', start_date: '', end_date: '', status: 'draft', notes: '' }); setShowPeriodForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Budget Period
        </button>
      </div>

      {/* Period Selector Cards */}
      {periods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <CalendarRange className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-600 font-semibold mb-1">No Budget Periods</h3>
          <p className="text-gray-400 text-sm">Create your first budget period to start planning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {periods.map(p => (
            <div
              key={p.id}
              onClick={() => fetchPeriodDetail(p.id)}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${activePeriod?.id === p.id ? 'border-blue-500 shadow-md' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[p.status] || statusColors.draft}`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEditPeriod(p); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePeriod(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{p.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{p.start_date} → {p.end_date}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Revenue</span>
                  <p className="font-bold text-emerald-600">{fmt(p.total_revenue_planned)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Expenditure</span>
                  <p className="font-bold text-red-600">{fmt(p.total_expenditure_planned)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Period Detail */}
      {activePeriod && (
        <>
          {!!assumptions && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Active Students</p>
                <p className="text-lg font-bold text-gray-900">{assumptions.assumptions.total_students.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Assumed Fee Payers (70%)</p>
                <p className="text-lg font-bold text-emerald-600">{assumptions.assumptions.assumed_fee_payers.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Monthly Salary Base</p>
                <p className="text-lg font-bold text-red-600">{fmt(assumptions.assumptions.monthly_salary_base)}</p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard icon={<TrendingUp className="w-5 h-5" />} label="Revenue Planned" value={fmt(activePeriod.total_revenue_planned || 0)} color="emerald" />
            <SummaryCard icon={<TrendingDown className="w-5 h-5" />} label="Expenditure Planned" value={fmt(activePeriod.total_expenditure_planned || 0)} color="red" />
            <SummaryCard icon={<Target className="w-5 h-5" />} label="Surplus / Deficit" value={fmt(activePeriod.surplus_deficit_planned || 0)} color={(activePeriod.surplus_deficit_planned || 0) >= 0 ? 'blue' : 'red'} />
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={runSimulation}
                disabled={simLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {simLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Run Simulation
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => { setCategoryForm({ name: '', category_type: 'revenue', description: '' }); setShowCategoryForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Revenue Category
            </button>
            <button
              onClick={() => { setCategoryForm({ name: '', category_type: 'expenditure', description: '' }); setShowCategoryForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Expenditure Category
            </button>
          </div>

          {/* Categories & Items */}
          <div className="space-y-4">
            {/* Revenue Categories */}
            {(activePeriod.categories || []).filter(c => c.category_type === 'revenue').length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Revenue
                </h3>
                {(activePeriod.categories || []).filter(c => c.category_type === 'revenue').map(cat => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    expanded={expandedCats.has(cat.id!)}
                    onToggle={() => toggleCat(cat.id!)}
                    onAddItem={() => openNewItem(cat.id!)}
                    onEditItem={(item) => openEditItem(item, cat.id!)}
                    onDeleteItem={deleteItem}
                    onDeleteCategory={() => deleteCategory(cat.id!)}
                    colorScheme="emerald"
                  />
                ))}
              </div>
            )}

            {/* Expenditure Categories */}
            {(activePeriod.categories || []).filter(c => c.category_type === 'expenditure').length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Expenditure
                </h3>
                {(activePeriod.categories || []).filter(c => c.category_type === 'expenditure').map(cat => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    expanded={expandedCats.has(cat.id!)}
                    onToggle={() => toggleCat(cat.id!)}
                    onAddItem={() => openNewItem(cat.id!)}
                    onEditItem={(item) => openEditItem(item, cat.id!)}
                    onDeleteItem={deleteItem}
                    onDeleteCategory={() => deleteCategory(cat.id!)}
                    colorScheme="red"
                  />
                ))}
              </div>
            )}

            {(activePeriod.categories || []).length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No categories yet. Add revenue and expenditure categories to start budgeting.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Simulation Results Modal ──────────────────────────────────────── */}
      {showSimulation && simulation && (
        <Modal title="Budget Simulation Results" onClose={() => setShowSimulation(false)}>
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                This simulation compares your planned budget against actual collected revenue, recorded expenses, and payroll paid.
              </p>
            </div>

            {/* Revenue */}
            <div>
              <h4 className="text-sm font-bold text-emerald-700 mb-2">Revenue</h4>
              <div className="grid grid-cols-3 gap-3">
                <SimCard label="Planned" value={simulation.summary.revenue_planned} color="text-gray-700" />
                <SimCard label="Actual Collected" value={simulation.summary.revenue_actual} color="text-emerald-600" />
                <SimCard label="Variance" value={simulation.summary.revenue_variance} color={simulation.summary.revenue_variance >= 0 ? 'text-emerald-600' : 'text-red-600'} />
              </div>
            </div>

            {/* Expenditure */}
            <div>
              <h4 className="text-sm font-bold text-red-700 mb-2">Expenditure</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SimCard label="Planned" value={simulation.summary.expenditure_planned} color="text-gray-700" />
                <SimCard label="Expenses Recorded" value={simulation.summary.expenses_recorded} color="text-amber-600" />
                <SimCard label="Expenses Paid" value={simulation.summary.expenses_paid} color="text-red-600" />
                <SimCard label="Payroll Paid" value={simulation.summary.payroll_paid} color="text-red-600" />
              </div>
            </div>

            {/* Net */}
            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Planned Surplus / Deficit</p>
                  <p className={`text-xl font-bold ${simulation.summary.surplus_planned >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {fmt(simulation.summary.surplus_planned)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Actual Surplus / Deficit</p>
                  <p className={`text-xl font-bold ${simulation.summary.surplus_actual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmt(simulation.summary.surplus_actual)}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Revenue Collection Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(100, simulation.summary.revenue_planned > 0 ? (simulation.summary.revenue_actual / simulation.summary.revenue_planned * 100) : 0)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {simulation.summary.revenue_planned > 0 ? `${(simulation.summary.revenue_actual / simulation.summary.revenue_planned * 100).toFixed(1)}%` : '0%'} collected
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Period Form Modal ─────────────────────────────────────────────── */}
      {showPeriodForm && (
        <Modal title={editPeriodId ? 'Edit Budget Period' : 'New Budget Period'} onClose={() => setShowPeriodForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Period Name *</label>
              <input type="text" value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="e.g. 2026 Financial Year" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date *</label>
                <input type="date" value={periodForm.start_date} onChange={e => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date *</label>
                <input type="date" value={periodForm.end_date} onChange={e => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={periodForm.status} onChange={e => setPeriodForm({ ...periodForm, status: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea rows={2} value={periodForm.notes} onChange={e => setPeriodForm({ ...periodForm, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPeriodForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={savePeriod} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editPeriodId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Category Form Modal ───────────────────────────────────────────── */}
      {showCategoryForm && (
        <Modal title="Add Budget Category" onClose={() => setShowCategoryForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category Name *</label>
              <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Tuition Fees, Salaries, Utilities" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['revenue', 'expenditure'] as const).map(t => (
                  <button key={t} onClick={() => setCategoryForm({ ...categoryForm, category_type: t })}
                    className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${categoryForm.category_type === t
                      ? t === 'revenue' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {t === 'revenue' ? '↑ Revenue' : '↓ Expenditure'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <input type="text" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCategoryForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveCategory} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add Category
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Item Form Modal ───────────────────────────────────────────────── */}
      {showItemForm && (
        <Modal title={editItemId ? 'Edit Budget Item' : 'Add Budget Item'} onClose={() => setShowItemForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <input type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g. Term 1 Fees, Electricity Bill" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Planned Amount (KES)</label>
                <input type="number" min="0" value={itemForm.planned_amount} onChange={e => setItemForm({ ...itemForm, planned_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Actual Amount (KES)</label>
                <input type="number" min="0" value={itemForm.actual_amount} onChange={e => setItemForm({ ...itemForm, actual_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>

            {isFeesItem && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700">Fee Auto-Calculator (Yearly)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Yearly Fee per Student (KES)</label>
                    <input type="number" min="0" value={yearlyFeePerStudent} onChange={e => setYearlyFeePerStudent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Students Paying (70%)</label>
                    <input type="text" readOnly value={assumptions?.assumptions.assumed_fee_payers || 0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/70" />
                  </div>
                </div>
                <p className="text-xs text-emerald-700/90">
                  Planned uses 70% payer assumption and Actual uses 100% student collection.
                </p>
                <button onClick={applyFeeAutoCalc} className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  Auto-calculate Planned + Actual Fee
                </button>
              </div>
            )}

            {isSalaryItem && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-red-700">Salary Auto-Calculator</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Months to Pay</label>
                    <input type="number" min="1" max="12" value={salaryMonths} onChange={e => setSalaryMonths(Math.max(1, Math.min(12, parseInt(e.target.value || '1', 10))))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Monthly Salary Base (KES)</label>
                    <input type="text" readOnly value={fmt(assumptions?.assumptions.monthly_salary_base || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white/70" />
                  </div>
                </div>

                {!!salaryRowsForModal.length && (
                  <div className="rounded-lg border border-red-100 bg-white p-2 max-h-52 overflow-auto">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Months per Staff</p>
                    <div className="space-y-1.5">
                      {salaryRowsForModal.map((s) => (
                        <div key={s.staff_id} className="grid grid-cols-12 gap-2 items-center text-xs">
                          <span className="col-span-6 text-gray-700 truncate">{s.staff_name}</span>
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={staffMonths[s.staff_id] ?? s.months}
                            onChange={(e) => setStaffMonths((prev) => ({
                              ...prev,
                              [s.staff_id]: Math.max(0, Math.min(12, parseInt(e.target.value || '0', 10))),
                            }))}
                            className="col-span-2 px-2 py-1 border border-gray-200 rounded text-right"
                          />
                          <span className="col-span-4 text-right text-gray-500">KES {(s.monthly_total_payment || 0).toLocaleString()}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {payrollLoading && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading existing salary structures...
                  </div>
                )}

                {!payrollLoading && !salaryRowsForModal.length && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    No existing salaries found in payroll. Please configure staff salaries first.
                  </div>
                )}

                <p className="text-xs text-red-700/90">
                  Uses existing salary structures. Total = Net Pay + PAYE + deductions (without relief), then Actual = 102% and Planned = 103%.
                </p>
                <button onClick={applySalaryAutoCalc} className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white">
                  Auto-calculate Planned + Actual Salary
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <input type="text" value={itemForm.notes} onChange={e => setItemForm({ ...itemForm, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowItemForm(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveItem} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editItemId ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-modal-pop">
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

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
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

function SimCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${color}`}>KES {value.toLocaleString()}</p>
    </div>
  );
}

function CategoryCard({
  category, expanded, onToggle, onAddItem, onEditItem, onDeleteItem, onDeleteCategory, colorScheme,
}: {
  category: BudgetCategory;
  expanded: boolean;
  onToggle: () => void;
  onAddItem: () => void;
  onEditItem: (item: BudgetItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteCategory: () => void;
  colorScheme: 'emerald' | 'red';
}) {
  const borderColor = colorScheme === 'emerald' ? 'border-l-emerald-500' : 'border-l-red-500';
  const items = category.items || [];

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm mb-3 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="font-semibold text-gray-800 text-sm">{category.name}</span>
          <span className="text-xs text-gray-400">({items.length} items)</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Planned: <strong className={colorScheme === 'emerald' ? 'text-emerald-600' : 'text-red-600'}>KES {(category.total_planned || 0).toLocaleString()}</strong></span>
          <span className="text-gray-500">Actual: <strong>KES {(category.total_actual || 0).toLocaleString()}</strong></span>
          <button onClick={(e) => { e.stopPropagation(); onAddItem(); }} className="p-1 rounded hover:bg-blue-50 text-blue-500" title="Add item">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(); }} className="p-1 rounded hover:bg-red-50 text-red-400" title="Delete category">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && items.length > 0 && (
        <div className="border-t border-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50/50">
                <th className="px-4 py-2 text-left font-semibold">Item</th>
                <th className="px-4 py-2 text-right font-semibold">Planned</th>
                <th className="px-4 py-2 text-right font-semibold">Actual</th>
                <th className="px-4 py-2 text-right font-semibold">Variance</th>
                <th className="px-4 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const variance = (item.actual_amount || 0) - (item.planned_amount || 0);
                return (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-800">{item.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">KES {(item.planned_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">KES {(item.actual_amount || 0).toLocaleString()}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {variance >= 0 ? '+' : ''}KES {variance.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEditItem(item)} className="p-1 rounded hover:bg-gray-100 text-gray-400"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDeleteItem(item.id!)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {expanded && items.length === 0 && (
        <div className="border-t border-gray-50 px-4 py-4 text-center">
          <p className="text-xs text-gray-400">No items yet. Click <strong>+</strong> to add one.</p>
        </div>
      )}
    </div>
  );
}
