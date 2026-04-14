import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';
import { SkeletonTable } from '../ui/Skeleton';
import LoadingProgress from '../ui/LoadingProgress';
import { useProgressiveLoad, type PaginatedResponse } from '../../hooks/useProgressiveLoad';

interface Payment {
  id: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  invoice_number: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
  recorded_by: string;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_field: string;
}

interface InvoiceStudent {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  invoice_number: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
}

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoiceStudents, setInvoiceStudents] = useState<InvoiceStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const token = localStorage.getItem('staff_access_token');

  // Progressive data loading for payments
  const {
    data: payments,
    loading: paymentsLoading,
    totalCount,
    loadedCount,
    progress,
    isComplete,
    error: loadError,
    refresh: refreshPayments,
  } = useProgressiveLoad<Payment>(
    async (page, pageSize) => {
      const response = await axios.get(`${API_BASE_URL}/api/finance/payments/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, page_size: pageSize }
      });
      return response.data as PaginatedResponse<Payment>;
    },
    [],
    { pageSize: 100 }
  );

  // Sync loading states
  useEffect(() => {
    setLoading(paymentsLoading);
    if (loadError) setError(loadError);
  }, [paymentsLoading, loadError]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('staff_access_token');
      const response = await axios.get(`${API_BASE_URL}/api/finance/invoice-student-balances/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const rows: InvoiceStudent[] = Array.isArray(response.data) ? response.data : [];
      const uniqueStudents = new Map<string, Student>();

      rows.forEach((row) => {
        if (!uniqueStudents.has(row.student)) {
          uniqueStudents.set(row.student, {
            id: row.student,
            full_name: row.student_name,
            admission_number: row.admission_number,
            class_field: row.class_name,
          });
        }
      });

      const result = Array.from(uniqueStudents.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(result);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
    }
  };

  const fetchInvoiceStudents = async (studentId: string) => {
    try {
      setLoadingInvoices(true);
      const token = localStorage.getItem('staff_access_token');
      const response = await axios.get(`${API_BASE_URL}/api/finance/invoice-student-balances/`, {
        params: { student_id: studentId },
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvoiceStudents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching invoice students:', err);
      setInvoiceStudents([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    fetchStudents();
    setSelectedStudent('');
    setStudentSearchTerm('');
    setShowStudentSuggestions(false);
    setInvoiceStudents([]);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setPaymentNotes('');
    setFormError(null);
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    setFormError(null);
    if (studentId) {
      fetchInvoiceStudents(studentId);
    } else {
      setInvoiceStudents([]);
    }
  };

  const outstandingInvoices = invoiceStudents.filter(inv => Number(inv.balance) > 0);
  const totalStudentBalance = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
  const paymentAmountValue = parseFloat(paymentAmount) || 0;

  let remainingPreview = paymentAmountValue;
  const allocationPreview = outstandingInvoices
    .map((inv) => {
      if (remainingPreview <= 0) return null;
      const allocation = Math.min(remainingPreview, Number(inv.balance || 0));
      remainingPreview -= allocation;
      return allocation > 0
        ? { invoiceId: inv.id, invoiceNumber: inv.invoice_number, amount: allocation }
        : null;
    })
    .filter((item): item is { invoiceId: string; invoiceNumber: string; amount: number } => item !== null);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountToPay = parseFloat(paymentAmount);

    if (!selectedStudent || !paymentAmount || amountToPay <= 0) {
      setFormError('Please select a student and enter a valid amount');
      return;
    }

    if (outstandingInvoices.length === 0) {
      setFormError('This student has no outstanding invoice balance');
      return;
    }

    setAddingPayment(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('staff_access_token');
      const trimmedReference = referenceNumber.trim();

      let remaining = amountToPay;
      let allocationIndex = 0;
      for (const inv of outstandingInvoices) {
        if (remaining <= 0) break;

        const invoiceBalance = Number(inv.balance || 0);
        if (invoiceBalance <= 0) continue;

        const allocation = Math.min(remaining, invoiceBalance);
        allocationIndex += 1;
        const allocationReference = trimmedReference
          ? `${trimmedReference}-${allocationIndex}`
          : '';

        await axios.post(
          `${API_BASE_URL}/api/finance/payments/record/`,
          {
            invoice_student_id: inv.id,
            amount: allocation,
            payment_method: paymentMethod,
            reference_number: allocationReference,
            notes: paymentNotes
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        remaining -= allocation;
      }
      
      setShowAddModal(false);
      refreshPayments(); // Refresh the list
    } catch (err: unknown) {
      console.error('Error recording payment:', err);
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Failed to record payment';
      setFormError(errorMessage);
    } finally {
      setAddingPayment(false);
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

  const getPaymentMethodBadge = (method: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      cash: { bg: 'bg-green-100', text: 'text-green-800' },
      mpesa: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      bank_transfer: { bg: 'bg-blue-100', text: 'text-blue-800' },
      cheque: { bg: 'bg-purple-100', text: 'text-purple-800' },
      other: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    const style = badges[method] || badges.other;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {method.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getDisplayReferenceNumber = (reference?: string): string => {
    if (!reference) return '-';
    return reference.replace(/-\d+$/, '');
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDisplayReferenceNumber(payment.reference_number).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = filterMethod === 'all' || payment.payment_method === filterMethod;
    
    return matchesSearch && matchesMethod;
  });

  const filteredStudents = students.filter((student) => {
    const q = studentSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      student.full_name.toLowerCase().includes(q) ||
      student.admission_number.toLowerCase().includes(q)
    );
  });

  const getStudentLabel = (student: Student): string =>
    `${student.full_name} (${student.admission_number}) - ${student.class_field}`;

  const selectedStudentRecord = students.find((s) => s.id === selectedStudent);
  const selectedStudentLabel = selectedStudentRecord ? getStudentLabel(selectedStudentRecord) : '';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-36" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 flex-1 max-w-sm" />
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-28" />
        </div>
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={refreshPayments}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">View and manage all payment records</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, admission number, invoice, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Filtered Results</p>
          <p className="text-2xl font-bold text-blue-600">{filteredPayments.length}</p>
        </div>
      </div>

      {/* Loading progress */}
      <LoadingProgress
        loadedCount={loadedCount}
        totalCount={totalCount}
        progress={progress}
        isComplete={isComplete}
      />

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.student_name}</p>
                        <p className="text-xs text-gray-500">{payment.admission_number} • {payment.class_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payment.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {getPaymentMethodBadge(payment.payment_method)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {getDisplayReferenceNumber(payment.reference_number)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.recorded_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Record Payment</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-1 text-sm">
                Manually record a payment for a student invoice
              </p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student (With Outstanding Balance)
                </label>
                <input
                  type="text"
                  value={studentSearchTerm}
                  onFocus={() => setShowStudentSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 120)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStudentSearchTerm(value);
                    setShowStudentSuggestions(true);

                    if (selectedStudent && value !== selectedStudentLabel) {
                      handleStudentChange('');
                    }
                  }}
                  placeholder="Search by student name or admission number..."
                  className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {showStudentSuggestions && studentSearchTerm.trim() && filteredStudents.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onMouseDown={() => {
                          const label = getStudentLabel(student);
                          setStudentSearchTerm(label);
                          setShowStudentSuggestions(false);
                          handleStudentChange(student.id);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        {getStudentLabel(student)}
                      </button>
                    ))}
                  </div>
                )}

                {showStudentSuggestions && studentSearchTerm.trim() && !filteredStudents.length && (
                  <p className="text-xs text-gray-500 mt-2">No students found for your search.</p>
                )}

                {selectedStudent && (
                  <p className="text-xs text-green-700 mt-2">Selected: {selectedStudentLabel}</p>
                )}
              </div>

              {/* Invoice Selection */}
              {selectedStudent && (
                <div>
                  {loadingInvoices ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : invoiceStudents.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No invoices found for this student</p>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        <span className="font-semibold">Total Student Balance:</span> {formatCurrency(totalStudentBalance)}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Outstanding invoices: {outstandingInvoices.length}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                  step="0.01"
                />
                {selectedStudent && paymentAmountValue > 0 && allocationPreview.length > 0 && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Auto-allocation preview</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {allocationPreview.map((item) => (
                        <p key={item.invoiceId} className="text-xs text-blue-700">
                          {item.invoiceNumber}: {formatCurrency(item.amount)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference / Receipt Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., QJK7ABCD12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPayment || !selectedStudent || paymentAmountValue <= 0 || totalStudentBalance <= 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingPayment ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Recording...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
