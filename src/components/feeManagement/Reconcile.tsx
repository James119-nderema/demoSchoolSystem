import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';
import { SkeletonTable, SkeletonCards } from '../ui/Skeleton';
import LoadingProgress from '../ui/LoadingProgress';
import { useProgressiveLoad, type PaginatedResponse } from '../../hooks/useProgressiveLoad';

interface Transaction {
  id: string;
  phone_number: string | null;
  amount: number;
  status: string;
  payment_method: string;
  payment_method_display: string;
  mpesa_receipt_number: string | null;
  reference_number: string | null;
  result_desc: string | null;
  transaction_date: string | null;
  created_at: string;
  student_name: string | null;
  parent_name: string | null;
  admission_number: string | null;
  student_class: string | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const paymentMethodColors: Record<string, { bg: string; text: string }> = {
  mpesa: { bg: 'bg-green-100', text: 'text-green-800' },
  mpesa_stk: { bg: 'bg-green-100', text: 'text-green-800' },
  airtel_money: { bg: 'bg-red-100', text: 'text-red-800' },
  tkash: { bg: 'bg-blue-100', text: 'text-blue-800' },
  equity_bank: { bg: 'bg-orange-100', text: 'text-orange-800' },
  kcb_bank: { bg: 'bg-teal-100', text: 'text-teal-800' },
  cooperative_bank: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  absa_bank: { bg: 'bg-pink-100', text: 'text-pink-800' },
  stanbic_bank: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  standard_chartered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  dtb_bank: { bg: 'bg-amber-100', text: 'text-amber-800' },
  ncba_bank: { bg: 'bg-violet-100', text: 'text-violet-800' },
  family_bank: { bg: 'bg-rose-100', text: 'text-rose-800' },
  im_bank: { bg: 'bg-sky-100', text: 'text-sky-800' },
  bank_transfer: { bg: 'bg-purple-100', text: 'text-purple-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function Reconcile() {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const token = localStorage.getItem('staff_access_token');

  // Progressive data loading for transactions
  const {
    data: transactions,
    loading,
    totalCount,
    loadedCount,
    progress,
    isComplete,
    error: loadError,
    refresh: refreshTransactions,
  } = useProgressiveLoad<Transaction>(
    async (page, pageSize) => {
      const response = await axios.get(`${API_BASE_URL}/api/mpesa/transactions/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, page_size: pageSize }
      });
      return response.data as PaginatedResponse<Transaction>;
    },
    [],
    { pageSize: 100 }
  );

  // Set error from progressive load
  useEffect(() => {
    if (loadError) setError(loadError);
  }, [loadError]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, statusFilter, methodFilter, searchQuery]);

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (methodFilter !== 'all') {
      filtered = filtered.filter(t => t.payment_method === methodFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.student_name?.toLowerCase().includes(query)) ||
        (t.admission_number?.toLowerCase().includes(query)) ||
        (t.reference_number?.toLowerCase().includes(query)) ||
        (t.mpesa_receipt_number?.toLowerCase().includes(query)) ||
        (t.phone_number?.toLowerCase().includes(query))
      );
    }
    
    setFilteredTransactions(filtered);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setNewStatus(transaction.status);
    setNotes(transaction.result_desc || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewStatus('');
    setNotes('');
  };

  const handleUpdateStatus = async (transactionId: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('staff_access_token');
      await axios.put(
        `${API_BASE_URL}/api/mpesa/transactions/${transactionId}/status/`,
        { status: newStatus, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh transactions
      refreshTransactions();
      setEditingId(null);
      setNewStatus('');
      setNotes('');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique payment methods for filter
  const uniqueMethods = [...new Set(transactions.map(t => t.payment_method))];

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
        </div>
        <SkeletonCards count={3} className="mb-6" />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={refreshTransactions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Review and verify payment transactions from all payment methods
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">
            {transactions.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Processing</p>
          <p className="text-2xl font-bold text-blue-700">
            {transactions.filter(t => t.status === 'processing').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {transactions.filter(t => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-700">
            {transactions.filter(t => t.status === 'failed').length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">Cancelled</p>
          <p className="text-2xl font-bold text-gray-700">
            {transactions.filter(t => t.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Student name, Adm No, Receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              {uniqueMethods.map(method => (
                <option key={method} value={method}>{method.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading progress */}
      <LoadingProgress
        loadedCount={loadedCount}
        totalCount={totalCount}
        progress={progress}
        isComplete={isComplete}
      />

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Transactions ({filteredTransactions.length})
          </h2>
          <button
            onClick={refreshTransactions}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference No
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.student_name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{transaction.admission_number || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {transaction.student_class || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        paymentMethodColors[transaction.payment_method]?.bg || 'bg-gray-100'
                      } ${paymentMethodColors[transaction.payment_method]?.text || 'text-gray-800'}`}>
                        {transaction.payment_method_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                      {transaction.reference_number || transaction.mpesa_receipt_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingId === transaction.id ? (
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          statusColors[transaction.status]?.bg || 'bg-gray-100'
                        } ${statusColors[transaction.status]?.text || 'text-gray-800'}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {editingId === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(transaction.id)}
                            disabled={updating}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updating}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(transaction)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal for notes (optional enhancement) */}
      {editingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={handleCancelEdit}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Transaction Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this transaction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(editingId)}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
