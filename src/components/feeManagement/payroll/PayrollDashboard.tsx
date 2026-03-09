import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Users, Wallet, CheckCircle, AlertCircle, Plus,
  Play, Trash2, Eye, X, ChevronRight, Calendar, DollarSign,
  TrendingUp, TrendingDown, FileText, Loader2, Landmark, PiggyBank, Scale,
} from 'lucide-react';
import { payrollService } from '../../../services/payrollService';
import type { PayrollRun, PayrollDashboardStats, PaymentTransaction, RevenueStats } from '../../../services/payrollService';

/* ═══════════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════════ */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText className="w-3 h-3" /> },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  failed: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
};

const TXN_STATUS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  failed: { bg: 'bg-red-100', text: 'text-red-700' },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PayrollDashboard() {
  const [stats, setStats] = useState<PayrollDashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create run modal
  const [showCreate, setShowCreate] = useState(false);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);

  // Detail drawer
  const [detailRun, setDetailRun] = useState<PayrollRun | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Process confirmation
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processConfirm, setProcessConfirm] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  /* ─── Fetch ────────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, rev, r, t] = await Promise.all([
        payrollService.getDashboardStats(),
        payrollService.getRevenueStats(),
        payrollService.getPayrollRuns(),
        payrollService.getTransactions(),
      ]);
      setStats(s);
      setRevenue(rev);
      setRuns(r);
      setTransactions(t);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Create Run ───────────────────────────────────────────────────────── */
  const handleCreateRun = async () => {
    setCreating(true);
    try {
      await payrollService.createPayrollRun(newMonth, newYear);
      showToast('success', `Payroll run for ${MONTHS[newMonth - 1]} ${newYear} created`);
      setShowCreate(false);
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to create run';
      showToast('error', msg);
    } finally {
      setCreating(false);
    }
  };

  /* ─── Process Run ──────────────────────────────────────────────────────── */
  const handleProcess = async (id: number) => {
    setProcessConfirm(null);
    setProcessingId(id);
    try {
      await payrollService.processPayrollRun(id);
      showToast('success', 'Payroll processing initiated. Payments are being sent.');
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to process';
      showToast('error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  /* ─── Delete Run ───────────────────────────────────────────────────────── */
  const handleDelete = async (id: number) => {
    try {
      await payrollService.deletePayrollRun(id);
      showToast('success', 'Payroll run deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || err.message || 'Failed to delete');
    }
  };

  /* ─── View Detail ──────────────────────────────────────────────────────── */
  const openDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const run = await payrollService.getPayrollRun(id);
      setDetailRun(run);
    } catch {
      showToast('error', 'Failed to load details');
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm
          ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue overview, payroll runs, and transaction history</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Payroll Run
        </button>
      </div>

      {/* ─── Revenue vs Expenditure Banner ──────────────────────────────────── */}
      {revenue && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Revenue vs Expenditure</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-emerald-700">Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-emerald-700">KES {revenue.total_revenue.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-xs font-semibold text-red-700">Total Paid Out</span>
              </div>
              <div className="text-xl font-bold text-red-700">KES {revenue.total_paid_out.toLocaleString()}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-amber-700">Pending</span>
              </div>
              <div className="text-xl font-bold text-amber-700">KES {revenue.total_pending.toLocaleString()}</div>
            </div>

            <div className={`bg-gradient-to-br rounded-xl p-4 border ${
              revenue.available_balance >= 0 ? 'from-blue-50 to-indigo-50 border-blue-100' : 'from-red-50 to-rose-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${revenue.available_balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                  <PiggyBank className={`w-4 h-4 ${revenue.available_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <span className={`text-xs font-semibold ${revenue.available_balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Available Balance</span>
              </div>
              <div className={`text-xl font-bold ${revenue.available_balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                KES {revenue.available_balance.toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-xs font-semibold text-violet-700">Monthly Obligation</span>
              </div>
              <div className="text-xl font-bold text-violet-700">KES {revenue.monthly_obligation.toLocaleString()}</div>
            </div>
          </div>

          {revenue.total_revenue > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Revenue Utilization</span>
                <span>{Math.min(100, Math.round((revenue.total_paid_out / revenue.total_revenue) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (revenue.total_paid_out / revenue.total_revenue) > 0.9 ? 'bg-red-500' :
                    (revenue.total_paid_out / revenue.total_revenue) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (revenue.total_paid_out / revenue.total_revenue) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Users className="w-5 h-5" />} label="Staff on Payroll" value={stats.total_staff} color="blue" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Monthly Gross" value={`KES ${stats.total_gross.toLocaleString()}`} color="emerald" />
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Monthly Net" value={`KES ${stats.total_net.toLocaleString()}`} color="violet" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Runs" value={stats.total_runs} color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Payroll Runs */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Payroll Runs
              </h2>
              <span className="text-xs text-gray-400">{runs.length} runs</span>
            </div>

            {runs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No payroll runs yet</p>
                <p className="text-xs mt-1">Create a new run to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {runs.map((run) => {
                  const st = STATUS_STYLES[run.status] || STATUS_STYLES.draft;
                  return (
                    <div key={run.id} className="px-5 py-4 hover:bg-blue-50/20 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {run.month_name || MONTHS[run.month - 1]} {run.year}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${st.bg} ${st.text}`}>
                              {st.icon} {run.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>KES {run.total_amount?.toLocaleString() || 0}</span>
                            <span>{run.record_count || 0} staff</span>
                            {run.processed_count > 0 && (
                              <span className="text-emerald-600">{run.processed_count} paid</span>
                            )}
                            {run.failed_count > 0 && (
                              <span className="text-red-500">{run.failed_count} failed</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openDetail(run.id)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(run.status === 'draft' || run.status === 'failed') && (
                            <>
                              {processConfirm === run.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleProcess(run.id)}
                                    disabled={processingId === run.id}
                                    className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium transition-colors"
                                  >
                                    {processingId === run.id ? 'Sending...' : 'Confirm Pay'}
                                  </button>
                                  <button onClick={() => setProcessConfirm(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setProcessConfirm(run.id)} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors" title="Process Payments">
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {deleteConfirm === run.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(run.id)} className="px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-xs font-medium">
                                    Delete
                                  </button>
                                  <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm(run.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Recent Transactions
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {transactions.slice(0, 20).map((txn) => {
                  const st = TXN_STATUS[txn.status] || TXN_STATUS.pending;
                  return (
                    <div key={txn.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900">KES {txn.amount.toLocaleString()}</span>
                          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${st.bg} ${st.text}`}>
                            {txn.status}
                          </span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${txn.transaction_type === 'b2c' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                          {txn.transaction_type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{txn.destination}</span>
                        {txn.mpesa_receipt && <span className="text-emerald-600">{txn.mpesa_receipt}</span>}
                      </div>
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(txn.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Create Run Modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Payroll Run</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Month</label>
                <select
                  value={newMonth}
                  onChange={(e) => setNewMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Year</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(parseInt(e.target.value))}
                  min={2020}
                  max={2099}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400">
                This will generate payroll records for all staff with defined salary structures.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateRun}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-sm"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Drawer ─────────────────────────────────────────────────── */}
      {(detailRun || loadingDetail) && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailRun(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {detailRun ? `${detailRun.month_name || MONTHS[detailRun.month - 1]} ${detailRun.year}` : 'Loading...'}
              </h2>
              <button onClick={() => setDetailRun(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : detailRun && (
              <div className="px-6 py-5">
                {/* Run info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <MiniStat label="Status" value={detailRun.status} />
                  <MiniStat label="Total" value={`KES ${detailRun.total_amount?.toLocaleString()}`} />
                  <MiniStat label="Paid" value={detailRun.processed_count} />
                  <MiniStat label="Failed" value={detailRun.failed_count} />
                </div>

                {/* Records */}
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Staff Records
                </h3>
                <div className="space-y-2">
                  {detailRun.records && detailRun.records.length > 0 ? (
                    detailRun.records.map((rec) => {
                      const st = TXN_STATUS[rec.status] || TXN_STATUS.pending;
                      return (
                        <div key={rec.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{rec.staff_name}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                              <span>{rec.staff_role}</span>
                              <ChevronRight className="w-3 h-3" />
                              <span>{rec.payment_method === 'mpesa' ? 'M-Pesa' : 'Bank'}: {rec.payment_destination}</span>
                            </div>
                            {rec.failure_reason && (
                              <div className="text-xs text-red-500 mt-0.5">{rec.failure_reason}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">KES {rec.net_salary.toLocaleString()}</div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${st.bg} ${st.text}`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No records</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════════ */

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{value}</div>
    </div>
  );
}
