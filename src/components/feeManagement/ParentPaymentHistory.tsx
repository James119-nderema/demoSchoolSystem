import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  invoice_number: string;  // For invoices: actual invoice number, For payments: M-PESA receipt or bank transaction number
  type: 'invoice' | 'payment';
  debit: number | null;
  credit: number | null;
}

interface PaymentHistoryStats {
  total_invoiced: number;
  total_paid: number;
  total_balance: number;
}

interface PaymentHistoryResponse {
  student_name: string;
  student_id: string;
  history: PaymentHistoryItem[];
  stats: PaymentHistoryStats;
}

export default function ParentPaymentHistory() {
  const [data, setData] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('parent_access_token');
      const response = await axios.get(`${API_BASE_URL}/api/finance/parent/payment-history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null || amount === 0) return '-';
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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={fetchPaymentHistory}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No payment history available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Student: <span className="font-medium">{data.student_name}</span>
          </p>
        </div>
        <Link
          to="/parent/pay-fees"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Pay Fees
        </Link>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total Invoiced */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">
                Total Invoiced
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1 truncate">
                {formatCurrency(data.stats.total_invoiced)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">
                Total Paid
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1 truncate">
                {formatCurrency(data.stats.total_paid)}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`rounded-xl shadow-sm border p-4 sm:p-5 ${
          data.stats.total_balance > 0 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide truncate">
                Balance Due
              </p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 truncate ${
                data.stats.total_balance > 0 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {formatCurrency(data.stats.total_balance)}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 ${
              data.stats.total_balance > 0 ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                data.stats.total_balance > 0 ? 'text-orange-600' : 'text-green-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h2>
        </div>

        {data.history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-200">
              {data.history.map((item, index) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        {item.type === 'invoice' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Invoice
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Payment
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span className="font-mono" title={item.type === 'invoice' ? 'Invoice Number' : 'Receipt/Transaction No'}>
                          {item.type === 'invoice' ? 'INV: ' : 'REF: '}{item.invoice_number}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.debit && (
                        <p className="text-sm font-semibold text-red-600">
                          -{formatCurrency(item.debit)}
                        </p>
                      )}
                      {item.credit && (
                        <p className="text-sm font-semibold text-green-600">
                          +{formatCurrency(item.credit)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mobile Totals */}
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Debits:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(data.stats.total_invoiced)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Credits:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(data.stats.total_paid)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Balance Due:</span>
                  <span className={`font-bold ${data.stats.total_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(data.stats.total_balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice # / Receipt #
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.history.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          {item.type === 'invoice' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Invoice
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Payment
                            </span>
                          )}
                          <span className="truncate max-w-xs">{item.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        <span title={item.type === 'invoice' ? 'Invoice Number' : 'Receipt/Transaction Number'}>
                          {item.invoice_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {formatCurrency(item.debit)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(item.credit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      Totals:
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-red-600">
                      {formatCurrency(data.stats.total_invoiced)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {formatCurrency(data.stats.total_paid)}
                    </td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      Balance Due:
                    </td>
                    <td colSpan={2} className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
                      data.stats.total_balance > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(data.stats.total_balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Legend - Responsive */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                Invoice
              </span>
              <span className="text-gray-600">School fees/charges (Debit) - Shows Invoice Number</span>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                Payment
              </span>
              <span className="text-gray-600">Payments made (Credit) - Shows M-PESA Receipt or Bank Transaction No.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
