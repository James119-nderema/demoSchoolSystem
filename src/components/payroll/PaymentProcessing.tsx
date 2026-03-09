import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Phone, Building2, User, AlertCircle, CheckCircle,
  Loader2, Search, Wallet, Shield, Clock, FileText, CheckSquare, Square,
  Users, TrendingDown, Landmark, PiggyBank, CalendarClock, Filter, X,
  ArrowUpDown, ChevronUp, ChevronDown, CreditCard,
} from 'lucide-react';
import { payrollService } from '../../services/payrollService';
import type { StaffForPayroll, SalaryStructure, PaymentTransaction, RevenueStats } from '../../services/payrollService';

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

const FREQ_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  monthly: { label: 'Monthly', color: 'text-blue-700', bg: 'bg-blue-50' },
  once: { label: 'One-time', color: 'text-violet-700', bg: 'bg-violet-50' },
  yearly: { label: 'Yearly', color: 'text-amber-700', bg: 'bg-amber-50' },
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

export default function PaymentProcessing() {
  const [staffList, setStaffList] = useState<StaffForPayroll[]>([]);
  const [salaries, setSalaries] = useState<SalaryStructure[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pay Salary Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Transaction filters
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState<string>('all');
  const [txnSort, setTxnSort] = useState<'date' | 'amount'>('date');
  const [txnSortAsc, setTxnSortAsc] = useState(false);

  // Sending state
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  /* ─── Fetch ────────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staff, sal, txn, rev] = await Promise.all([
        payrollService.getStaffList(),
        payrollService.getSalaryStructures(),
        payrollService.getTransactions(),
        payrollService.getRevenueStats(),
      ]);
      setStaffList(staff);
      setSalaries(sal);
      setTransactions(txn);
      setRevenue(rev);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Staff with salary structures (payable) ───────────────────────────── */
  const payableStaff = useMemo(() => {
    return salaries.map((sal) => {
      const staff = staffList.find((s) => s.id === sal.staff);
      return {
        ...sal,
        staffId: sal.staff,
        staffName: sal.staff_name || staff?.full_name || 'Unknown',
        staffEmail: sal.staff_email || staff?.email || '',
        staffRole: sal.staff_role || staff?.role || '',
        staffPhone: sal.staff_phone || staff?.phone_number || '',
      };
    });
  }, [salaries, staffList]);

  /* ─── Filtered staff list for modal ────────────────────────────────────── */
  const filteredStaff = useMemo(() => {
    return payableStaff.filter((s) => {
      const q = staffSearch.toLowerCase();
      const matchesSearch =
        s.staffName.toLowerCase().includes(q) ||
        s.staffRole.toLowerCase().includes(q) ||
        s.staffEmail.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || s.staffRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [payableStaff, staffSearch, roleFilter]);

  /* ─── Unique roles for filter ──────────────────────────────────────────── */
  const availableRoles = useMemo(() => {
    const roles = new Set(payableStaff.map((s) => s.staffRole));
    return Array.from(roles).sort();
  }, [payableStaff]);

  /* ─── Filtered & sorted transactions ───────────────────────────────────── */
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((txn) => {
        const q = txnSearch.toLowerCase();
        const matchesSearch =
          (txn.destination || '').toLowerCase().includes(q) ||
          (txn.result_description || '').toLowerCase().includes(q) ||
          txn.amount.toString().includes(q);
        const matchesStatus = txnStatusFilter === 'all' || txn.status === txnStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (txnSort === 'date') {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else {
          cmp = a.amount - b.amount;
        }
        return txnSortAsc ? cmp : -cmp;
      });
  }, [transactions, txnSearch, txnStatusFilter, txnSort, txnSortAsc]);

  /* ─── Transaction summary stats ────────────────────────────────────────── */
  const txnStats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed');
    const pending = transactions.filter(t => t.status === 'processing' || t.status === 'pending');
    const failed = transactions.filter(t => t.status === 'failed');
    return {
      totalCompleted: completed.reduce((s, t) => s + t.amount, 0),
      completedCount: completed.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, t) => s + t.amount, 0),
      failedCount: failed.length,
      totalCount: transactions.length,
    };
  }, [transactions]);

  /* ─── Selection helpers ────────────────────────────────────────────────── */
  const toggleSelect = (staffId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStaff.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStaff.map((s) => s.staffId)));
    }
  };

  const allSelected = filteredStaff.length > 0 && selectedIds.size === filteredStaff.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  /* ─── Selected totals ──────────────────────────────────────────────────── */
  const selectedSalaries = payableStaff.filter((s) => selectedIds.has(s.staffId));
  const totalSelectedNet = selectedSalaries.reduce((sum, s) => sum + (s.net_salary || 0), 0);
  const totalSelectedGross = selectedSalaries.reduce((sum, s) => sum + (s.gross_salary || 0), 0);

  /* ─── Open / Close Pay Modal ───────────────────────────────────────────── */
  const openPayModal = () => {
    setSelectedIds(new Set());
    setStaffSearch('');
    setRoleFilter('all');
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedIds(new Set());
    setStaffSearch('');
    setRoleFilter('all');
  };

  /* ─── Send Batch Payment ───────────────────────────────────────────────── */
  const handleBatchPay = async () => {
    if (selectedIds.size === 0) {
      showToast('error', 'Please select at least one staff member');
      return;
    }

    if (revenue && totalSelectedNet > revenue.available_balance) {
      showToast('error', `Insufficient balance. Available: KES ${revenue.available_balance.toLocaleString()}, Required: KES ${totalSelectedNet.toLocaleString()}`);
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const staff of selectedSalaries) {
      const amount = staff.net_salary || 0;
      if (amount <= 0) {
        failCount++;
        continue;
      }

      const destination =
        staff.payment_method === 'mpesa'
          ? staff.phone_number || staff.staffPhone
          : staff.bank_account_number;

      if (!destination) {
        failCount++;
        continue;
      }

      setSendingId(staff.staffId);
      try {
        const result = await payrollService.singlePayment({
          staff_id: staff.staffId,
          amount,
          payment_method: staff.payment_method,
          destination,
          description: `Salary Payment - ${staff.pay_frequency || 'monthly'}`,
        });
        if (result.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setSendingId(null);
    setSending(false);

    if (successCount > 0) {
      showToast('success', `${successCount} payment${successCount > 1 ? 's' : ''} initiated successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } else {
      showToast('error', `All ${failCount} payments failed`);
    }

    closePayModal();
    fetchData();
  };

  /* ─── Send Single Payment ──────────────────────────────────────────────── */
  const handleSinglePay = async (staff: typeof payableStaff[0]) => {
    const amount = staff.net_salary || 0;
    if (amount <= 0) {
      showToast('error', 'Net salary is zero');
      return;
    }

    const destination =
      staff.payment_method === 'mpesa'
        ? staff.phone_number || staff.staffPhone
        : staff.bank_account_number;

    if (!destination) {
      showToast('error', staff.payment_method === 'mpesa' ? 'No phone number' : 'No bank account');
      return;
    }

    setSendingId(staff.staffId);
    try {
      const result = await payrollService.singlePayment({
        staff_id: staff.staffId,
        amount,
        payment_method: staff.payment_method,
        destination,
        description: `Salary Payment - ${staff.pay_frequency || 'monthly'}`,
      });
      if (result.success) {
        showToast('success', `KES ${amount.toLocaleString()} sent to ${staff.staffName}`);
        fetchData();
      } else {
        showToast('error', result.error || 'Payment failed');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || err.message || 'Payment failed');
    } finally {
      setSendingId(null);
    }
  };

  const toggleTxnSort = (field: typeof txnSort) => {
    if (txnSort === field) setTxnSortAsc(!txnSortAsc);
    else { setTxnSort(field); setTxnSortAsc(false); }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
          <p className="text-gray-500 text-sm mt-1">Track payments and initiate new salary disbursements</p>
        </div>
        <button
          onClick={openPayModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          <CreditCard className="w-4 h-4" /> Pay Salary
        </button>
      </div>

      {/* ─── Revenue Balance Banner ──────────────────────────────────────────── */}
      {revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Revenue</div>
              <div className="text-lg font-bold text-emerald-700">KES {revenue.total_revenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Total Paid Out</div>
              <div className="text-lg font-bold text-red-700">KES {revenue.total_paid_out.toLocaleString()}</div>
            </div>
          </div>

          <div className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm ${
            revenue.available_balance >= 0 ? 'border-blue-200' : 'border-red-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              revenue.available_balance >= 0 ? 'bg-blue-50' : 'bg-red-50'
            }`}>
              <PiggyBank className={`w-5 h-5 ${revenue.available_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Available Balance</div>
              <div className={`text-lg font-bold ${revenue.available_balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                KES {revenue.available_balance.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Completed</div>
              <div className="text-lg font-bold text-gray-900">{txnStats.completedCount} payments</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Pending</div>
              <div className="text-lg font-bold text-gray-900">{txnStats.pendingCount} payments</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment History (Full Width, Larger) ────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Payment History</h2>
                <p className="text-gray-300 text-xs">
                  {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''} •
                  KES {txnStats.totalCompleted.toLocaleString()} paid out
                </p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-200 rounded-lg text-xs font-medium">
                <CheckCircle className="w-3 h-3" /> {txnStats.completedCount} Completed
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-200 rounded-lg text-xs font-medium">
                <Clock className="w-3 h-3" /> {txnStats.pendingCount} Pending
              </span>
              {txnStats.failedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-200 rounded-lg text-xs font-medium">
                  <AlertCircle className="w-3 h-3" /> {txnStats.failedCount} Failed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by destination, description, or amount..."
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={txnStatusFilter}
              onChange={(e) => setTxnStatusFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transaction Table */}
        {transactions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-lg">No transactions yet</p>
            <p className="text-sm mt-1">Click "Pay Salary" to initiate your first payment</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No matching transactions</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 text-left">
                    <button
                      onClick={() => toggleTxnSort('date')}
                      className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Date
                      {txnSort === 'date' ? (
                        txnSortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Destination</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-5 py-3 text-left">
                    <button
                      onClick={() => toggleTxnSort('amount')}
                      className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Amount
                      {txnSort === 'amount' ? (
                        txnSortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((txn, idx) => {
                  const st = TXN_STATUS[txn.status] || TXN_STATUS.pending;
                  return (
                    <tr key={txn.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-900 font-medium">
                          {new Date(txn.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(txn.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-700 max-w-xs truncate">{txn.result_description || 'Salary Payment'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {txn.transaction_type === 'b2c' ? (
                            <Phone className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          )}
                          <span className="text-gray-700">{txn.destination}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {txn.transaction_type === 'b2c' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                            M-Pesa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            Bank
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        KES {txn.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${st.bg} ${st.text}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-400 font-mono">{txn.mpesa_receipt || txn.conversation_id || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer summary */}
        {filteredTransactions.length > 0 && (
          <div className="bg-gray-50/60 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-gray-700">
              Total: KES {filteredTransactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         Pay Salary Modal
         ═══════════════════════════════════════════════════════════════════════ */}
      {showPayModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePayModal} />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-modal-pop">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Pay Salary</h2>
                  <p className="text-blue-100 text-xs">
                    Select staff members to pay • {selectedIds.size} selected
                    {selectedIds.size > 0 && ` • KES ${totalSelectedNet.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <button onClick={closePayModal} className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Staff Table */}
            <div className="flex-1 overflow-y-auto">
              {payableStaff.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No staff with salary structures</p>
                  <p className="text-xs mt-1">Set up salary structures first in Salary Management</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 text-left w-10">
                        <button onClick={toggleAll} className="text-gray-500 hover:text-blue-600 transition-colors">
                          {allSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : someSelected ? (
                            <div className="w-5 h-5 border-2 border-blue-500 bg-blue-100 rounded flex items-center justify-center">
                              <div className="w-2.5 h-0.5 bg-blue-500 rounded" />
                            </div>
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Staff Member</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Frequency</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Gross Pay</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Deductions</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Net Pay</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Method</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStaff.map((s) => {
                      const isSelected = selectedIds.has(s.staffId);
                      const isSending = sendingId === s.staffId;
                      const freq = FREQ_LABELS[s.pay_frequency || 'monthly'] || FREQ_LABELS.monthly;
                      return (
                        <tr
                          key={s.staffId}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'
                          }`}
                          onClick={() => toggleSelect(s.staffId)}
                        >
                          <td className="px-4 py-3">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-300" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {s.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{s.staffName}</div>
                                <div className="text-xs text-gray-400">{ROLE_LABELS[s.staffRole] || s.staffRole}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${freq.color} ${freq.bg} px-2 py-0.5 rounded-md`}>
                              <CalendarClock className="w-3 h-3" /> {freq.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            KES {(s.gross_salary || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            KES {(s.total_deductions || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            KES {(s.net_salary || 0).toLocaleString()}
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
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSinglePay(s)}
                              disabled={isSending || sending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Pay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer - Payment Summary & Action */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/60 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Summary info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Selected:</span>
                    <span className="font-bold text-gray-900">{selectedIds.size} staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Gross:</span>
                    <span className="font-medium text-gray-700">KES {totalSelectedGross.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Net:</span>
                    <span className="font-bold text-blue-600 text-base">KES {totalSelectedNet.toLocaleString()}</span>
                  </div>
                  {revenue && selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Balance after:</span>
                      <span className={`font-bold ${(revenue.available_balance - totalSelectedNet) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        KES {(revenue.available_balance - totalSelectedNet).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={closePayModal}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchPay}
                    disabled={sending || selectedIds.size === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Pay {selectedIds.size > 0 ? `${selectedIds.size} Staff` : 'Selected'}</>
                    )}
                  </button>
                </div>
              </div>

              {/* Insufficient balance warning */}
              {revenue && selectedIds.size > 0 && totalSelectedNet > revenue.available_balance && (
                <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3 mt-3 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Payment amount exceeds available balance. Reduce selection or add more funds.</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-gray-400 mt-3">
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Payments are processed securely via Safaricom Daraja API. Only selected staff will receive payment.</span>
              </div>
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
