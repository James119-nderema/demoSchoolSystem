// GePGTransactions.tsx
// Admin-facing table of GePG payment transactions with filters, summary stats, and CSV export.
// Fetches from GET /api/gepg/transactions/ and GET /api/gepg/admin/dashboard/

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GePGTransaction {
  id: string;
  gepg_trx_id: string;
  control_number: string;
  paid_amount: string;
  currency: string;
  payment_channel: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  tran_status: 'CONFIRMED' | 'FAILED' | 'REVERSED';
  payment_date: string;
  created_at: string;
  gepg_bill?: {
    bill_reference: string;
    invoice_student?: {
      invoice?: { invoice_number: string };
      student?: { first_name: string; surname: string; admission_number: string };
    };
  };
}

interface DashboardStats {
  date: string;
  total_billed: number;
  total_paid: number;
  total_paid_today: number;
  pending_count: number;
  partial_count: number;
  paid_count: number;
  failed_count: number;
  collections_by_channel: { channel: string; total: number; count: number }[];
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GePGTransaction[];
}

function getStaffToken(): string | null {
  return (
    localStorage.getItem('staff_access_token') ||
    localStorage.getItem('school_access_token') ||
    localStorage.getItem('access_token')
  );
}

function formatCurrency(amount: number | string, currency = 'TZS'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED': return 'bg-green-100 text-green-800';
    case 'FAILED': return 'bg-red-100 text-red-800';
    case 'REVERSED': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

function exportToCSV(transactions: GePGTransaction[]) {
  const headers = [
    'Date', 'Student', 'Admission No', 'Invoice', 'Control Number',
    'Amount', 'Currency', 'Channel', 'Status', 'GePG Tx ID', 'Payer Name',
  ];

  const rows = transactions.map((t) => {
    const student = t.gepg_bill?.invoice_student?.student;
    const invoice = t.gepg_bill?.invoice_student?.invoice;
    return [
      formatDate(t.payment_date),
      student ? `${student.first_name} ${student.surname}` : '-',
      student?.admission_number || '-',
      invoice?.invoice_number || t.gepg_bill?.bill_reference || '-',
      t.control_number,
      t.paid_amount,
      t.currency,
      t.payment_channel || '-',
      t.tran_status,
      t.gepg_trx_id,
      t.payer_name || '-',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gepg_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GePGTransactions() {
  const [transactions, setTransactions] = useState<GePGTransaction[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getStaffToken();
    if (!token) { setError('Not authenticated.'); setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (statusFilter) params.status = statusFilter;
    if (channelFilter) params.channel = channelFilter;

    try {
      const [txnRes, dashRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/gepg/transactions/`, { headers, params }),
        axios.get(`${API_BASE_URL}/api/gepg/admin/dashboard/`, { headers }),
      ]);

      const txnData = txnRes.data as PaginatedResponse | GePGTransaction[];
      if (Array.isArray(txnData)) {
        setTransactions(txnData);
        setTotalCount(txnData.length);
      } else {
        setTransactions(txnData.results || []);
        setTotalCount(txnData.count || 0);
      }

      setDashboard(dashRes.data as DashboardStats);
    } catch (err) {
      console.error('Failed to fetch GePG transactions:', err);
      setError('Failed to load GePG transactions.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter, channelFilter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleApplyFilters = () => { void fetchAll(); };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setChannelFilter('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">GePG Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tanzania Government Electronic Payment Gateway</p>
        </div>
        <button
          onClick={() => exportToCSV(transactions)}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary Stats Strip */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Total Collected</p>
            <p className="text-xl font-bold text-green-700 mt-0.5">{formatCurrency(dashboard.total_paid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Today: {formatCurrency(dashboard.total_paid_today)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Fully Paid</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{dashboard.paid_count}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Partial</p>
            <p className="text-xl font-bold text-yellow-600 mt-0.5">{dashboard.partial_count}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
            <p className="text-xl font-bold text-gray-600 mt-0.5">{dashboard.pending_count}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-medium">Failed</p>
            <p className="text-xl font-bold text-red-600 mt-0.5">{dashboard.failed_count}</p>
          </div>
        </div>
      )}

      {/* Collections by Channel */}
      {dashboard && dashboard.collections_by_channel.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Collections by Channel</h3>
          <div className="flex flex-wrap gap-3">
            {dashboard.collections_by_channel.map((ch) => (
              <div key={ch.channel} className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium">{ch.channel}</p>
                <p className="text-sm font-bold text-blue-900">{formatCurrency(ch.total)}</p>
                <p className="text-xs text-blue-500">{ch.count} txn{ch.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Channel</label>
            <input
              type="text"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              placeholder="e.g. NMB, MPESA"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Apply
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={() => void fetchAll()} className="ml-3 underline">Retry</button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Transactions</h2>
          <span className="text-sm text-gray-500">{totalCount} total</span>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p>No GePG transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control Number</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GePG Tx ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, i) => {
                  const student = txn.gepg_bill?.invoice_student?.student;
                  const invoice = txn.gepg_bill?.invoice_student?.invoice;
                  return (
                    <tr key={txn.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(txn.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {student ? (
                          <div>
                            <p className="font-medium">{student.first_name} {student.surname}</p>
                            <p className="text-xs text-gray-500">{student.admission_number}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        {invoice?.invoice_number || txn.gepg_bill?.bill_reference || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">
                        {txn.control_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-700">
                        {formatCurrency(txn.paid_amount, txn.currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {txn.payment_channel || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(txn.tran_status)}`}>
                          {txn.tran_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-500 max-w-xs truncate">
                        {txn.gepg_trx_id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
