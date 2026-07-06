import React, { useState, useEffect, useCallback } from 'react';
import { APIService, SmsCreditsAPI } from '../../services/baseUrl';
import { usePermissions } from '../../hooks/usePermissions';
import { sendBulkSms } from '../../services/smsService';
import type { SmsMessage } from '../../services/smsService';

// Types
interface InvoiceItem {
  id?: string;
  item_name: string;
  amount: number;
  description?: string;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_field: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  term: string;
  academic_year: string;
  date_created: string;
  due_date: string | null;
  status: string;
  total_amount: number;
  student_count: number;
  items?: InvoiceItem[];
  invoice_students?: {
    id: string;
    student: string;
    student_name: string;
    admission_number: string;
    class_name: string;
    parent_guardian_name?: string;
    parent_guardian_phone?: string;
    parent_guardian_email?: string;
    amount_paid: number;
    payment_status: string;
    total_amount: number;
    balance: number;
  }[];
}

interface CreateInvoiceData {
  term: string;
  academic_year: string;
  due_date?: string;
  student_selection: 'single' | 'multiple' | 'all' | 'class';
  student_ids?: string[];
  class_id?: string;
  items: { item_name: string; amount: number; description?: string }[];
}

interface FeeBalanceReminder {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_email?: string;
  invoice_number: string;
  due_date?: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
}

type NotificationRecipientMode = 'individual' | 'class' | 'school';

const InvoiceManagement: React.FC = () => {
  const permissions = usePermissions();
  
  // State for invoices list
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for create invoice modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [notificationInvoice, setNotificationInvoice] = useState<Invoice | null>(null);
  
  // Form state
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'>('sent');
  const [studentSelection, setStudentSelection] = useState<'single' | 'multiple' | 'all' | 'class'>('single');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ item_name: '', amount: 0, description: '' }]);
  
  // Data for dropdowns
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [notificationMode, setNotificationMode] = useState<'created' | 'reminders'>('created');
  const [reminderBalances, setReminderBalances] = useState<FeeBalanceReminder[]>([]);
  const [notificationResult, setNotificationResult] = useState<string | null>(null);
  const [notificationRecipientMode, setNotificationRecipientMode] = useState<NotificationRecipientMode>('school');
  const [notificationSearchTerm, setNotificationSearchTerm] = useState('');
  const [notificationSelectedClass, setNotificationSelectedClass] = useState('');
  const [notificationSelectedStudentKey, setNotificationSelectedStudentKey] = useState('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');

  const buildFeeMessage = (item: {
    student_name: string;
    admission_number: string;
    invoice_number: string;
    balance: number;
    due_date?: string | null;
  }) => {
    const dueText = item.due_date ? ` Due date: ${formatDate(item.due_date)}.` : '';
    return `Dear Parent, ${item.student_name} (${item.admission_number}) has a fee balance of ${formatCurrency(Number(item.balance || 0))} on invoice ${item.invoice_number}.${dueText} Please clear the balance or contact the school accounts office.`;
  };

  const getBaseNotificationRows = () => {
    if (notificationMode === 'created') {
      return (notificationInvoice?.invoice_students || [])
        .filter(student => Number(student.balance || 0) > 0)
        .map(student => ({
          id: student.id,
          student_name: student.student_name,
          admission_number: student.admission_number,
          class_name: student.class_name,
          parent_guardian_name: student.parent_guardian_name,
          parent_guardian_phone: student.parent_guardian_phone,
          invoice_number: notificationInvoice?.invoice_number || '',
          due_date: notificationInvoice?.due_date || null,
          balance: Number(student.balance || 0)
        }));
    }

    return reminderBalances
      .filter(student => Number(student.balance || 0) > 0)
      .map(student => ({
        id: student.id,
        student_name: student.student_name,
        admission_number: student.admission_number,
        parent_guardian_name: student.parent_guardian_name,
        parent_guardian_phone: student.parent_guardian_phone,
        class_name: student.class_name,
        invoice_number: student.invoice_number,
        due_date: student.due_date || null,
        balance: Number(student.balance || 0)
      }));
  };

  const getNotificationRows = () => {
    const query = notificationSearchTerm.trim().toLowerCase();

    return getBaseNotificationRows().filter(row => {
      const matchesMode = notificationRecipientMode === 'school'
        || (notificationRecipientMode === 'class' && row.class_name === notificationSelectedClass)
        || (notificationRecipientMode === 'individual' && row.admission_number === notificationSelectedStudentKey);

      if (!matchesMode) return false;
      if (!query) return true;

      return (
        row.student_name.toLowerCase().includes(query) ||
        row.admission_number.toLowerCase().includes(query)
      );
    });
  };

  const getNotificationSearchRows = () => {
    const query = notificationSearchTerm.trim().toLowerCase();

    return getBaseNotificationRows().filter(row => {
      const matchesMode = notificationRecipientMode === 'school'
        || (notificationRecipientMode === 'class' && row.class_name === notificationSelectedClass)
        || notificationRecipientMode === 'individual';

      if (!matchesMode) return false;
      if (!query) return true;

      return (
        row.student_name.toLowerCase().includes(query) ||
        row.admission_number.toLowerCase().includes(query)
      );
    });
  };

  const notificationClasses = [...new Set(getBaseNotificationRows().map(row => row.class_name).filter(Boolean))].sort();

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await APIService.get<{ results: Invoice[]; count: number } | Invoice[]>('/api/finance/invoices/', { page_size: '200' }, 'staff');
      // Handle both paginated { results } and plain array responses
      const list = Array.isArray(response) ? response : (response as any).results ?? [];
      setInvoices(list);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students for dropdown
  const fetchStudents = async (classId?: string) => {
    try {
      const params: Record<string, string> = {};
      if (classId) params.class_id = classId;
      const response = await APIService.get<Student[]>('/api/finance/invoice-students/', params, 'staff');
      setStudents(response);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // Fetch classes for dropdown
  const fetchClasses = async () => {
    try {
      const response = await APIService.get<ClassOption[]>('/api/finance/invoice-classes/', {}, 'staff');
      setClasses(response);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // Fetch next invoice number
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await APIService.get<{ next_invoice_number: string }>('/api/finance/next-invoice-number/', {}, 'staff');
      setNextInvoiceNumber(response.next_invoice_number);
    } catch (err) {
      console.error('Error fetching next invoice number:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Open create modal
  const openCreateModal = async () => {
    await Promise.all([fetchStudents(), fetchClasses(), fetchNextInvoiceNumber()]);
    setShowCreateModal(true);
  };

  // Close create modal and reset form
  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setTerm('');
    setAcademicYear('');
    setDueDate('');
    setEditStatus('sent');
    setStudentSelection('single');
    setSelectedStudents([]);
    setSelectedClass('');
    setInvoiceItems([{ item_name: '', amount: 0, description: '' }]);
  };

  // Handle student selection change
  const handleStudentSelectionChange = async (selection: 'single' | 'multiple' | 'all' | 'class') => {
    setStudentSelection(selection);
    setSelectedStudents([]);
    setSelectedClass('');
    
    if (selection !== 'class') {
      await fetchStudents();
    }
  };

  // Handle class selection change
  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (classId) {
      await fetchStudents(classId);
    }
  };

  // Add invoice item
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { item_name: '', amount: 0, description: '' }]);
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  // Update invoice item
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  // Calculate total amount
  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  // Handle form submission
  const handleCreateInvoice = async () => {
    // Validate form
    if (!term.trim()) {
      setError('Term is required');
      return;
    }
    if (!academicYear.trim()) {
      setError('Academic year is required');
      return;
    }
    if (invoiceItems.some(item => !item.item_name.trim() || item.amount <= 0)) {
      setError('All items must have a name and a positive amount');
      return;
    }
    if (studentSelection === 'single' && selectedStudents.length !== 1) {
      setError('Please select exactly one student');
      return;
    }
    if (studentSelection === 'multiple' && selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    if (studentSelection === 'class' && !selectedClass) {
      setError('Please select a class');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data: CreateInvoiceData = {
        term,
        academic_year: academicYear,
        student_selection: studentSelection,
        items: invoiceItems.map(item => ({
          item_name: item.item_name,
          amount: Number(item.amount),
          description: item.description || ''
        }))
      };

      if (dueDate) {
        data.due_date = dueDate;
      }

      if (studentSelection === 'single' || studentSelection === 'multiple') {
        data.student_ids = selectedStudents;
      } else if (studentSelection === 'class') {
        data.class_id = selectedClass;
      }

      const createdInvoice = await APIService.post<Invoice>('/api/finance/invoices/', data, 'staff');
      
      closeCreateModal();
      setNotificationMode('created');
      setNotificationInvoice(createdInvoice);
      setReminderBalances([]);
      setNotificationResult(null);
      setNotificationRecipientMode('school');
      setNotificationSearchTerm('');
      setNotificationSelectedClass('');
      setNotificationSelectedStudentKey('');
      setShowNotifyModal(true);
      fetchInvoices();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const openReminderModal = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const balances = await APIService.get<FeeBalanceReminder[]>('/api/finance/invoice-student-balances/', {}, 'staff');
      setNotificationMode('reminders');
      setNotificationInvoice(null);
      setReminderBalances(Array.isArray(balances) ? balances : []);
      setNotificationResult(null);
      setNotificationRecipientMode('school');
      setNotificationSearchTerm('');
      setNotificationSelectedClass('');
      setNotificationSelectedStudentKey('');
      setShowNotifyModal(true);
    } catch (err: any) {
      console.error('Error loading fee balances:', err);
      setError(err.message || 'Failed to load fee balances');
    } finally {
      setSubmitting(false);
    }
  };

  const closeNotifyModal = () => {
    setShowNotifyModal(false);
    setNotificationInvoice(null);
    setReminderBalances([]);
    setNotificationResult(null);
    setNotificationRecipientMode('school');
    setNotificationSearchTerm('');
    setNotificationSelectedClass('');
    setNotificationSelectedStudentKey('');
  };

  const sendFeeNotifications = async () => {
    const rows = getNotificationRows();
    const messages: SmsMessage[] = rows
      .filter(row => row.parent_guardian_phone)
      .map(row => ({
        recipient: {
          phoneNumber: row.parent_guardian_phone || '',
          studentName: row.student_name,
          studentId: row.id,
          parentName: row.parent_guardian_name || undefined,
        },
        message: buildFeeMessage(row),
      }));

    if (messages.length === 0) {
      setNotificationResult('No parent phone numbers were found for these fee balances.');
      return;
    }

    try {
      setSendingNotifications(true);
      setNotificationResult(null);
      const result = await sendBulkSms(messages);
      try {
        await SmsCreditsAPI.recordUsage({
          recipient_count: messages.length,
          successful_count: result.totalSent,
          failed_count: result.totalFailed,
          message_type: notificationMode === 'created' ? 'fee_invoice_created' : 'fee_balance_reminder',
        });
      } catch {
        // SMS delivery result is more important to show here than credit logging failure.
      }
      setNotificationResult(`Sent ${result.totalSent} notification(s). Failed: ${result.totalFailed}.`);
    } catch (err: any) {
      console.error('Error sending fee notifications:', err);
      setNotificationResult(err.message || 'Failed to send fee notifications.');
    } finally {
      setSendingNotifications(false);
    }
  };

  // Open edit modal
  const openEditModal = async (invoice: Invoice) => {
    try {
      const response = await APIService.get<Invoice>(`/api/finance/invoices/${invoice.id}/`, {}, 'staff');
      setSelectedInvoice(response);
      setTerm(response.term);
      setAcademicYear(response.academic_year);
      setDueDate(response.due_date || '');
      setEditStatus((response.status as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled') || 'sent');
      setInvoiceItems(response.items?.map(item => ({
        id: item.id,
        item_name: item.item_name,
        amount: item.amount,
        description: item.description || ''
      })) || [{ item_name: '', amount: 0, description: '' }]);
      setShowEditModal(true);
    } catch (err: any) {
      console.error('Error fetching invoice for edit:', err);
      setError(err.message || 'Failed to fetch invoice details');
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedInvoice(null);
    resetForm();
  };

  // Handle edit submission
  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;
    
    if (!term.trim()) {
      setError('Term is required');
      return;
    }
    if (!academicYear.trim()) {
      setError('Academic year is required');
      return;
    }
    if (invoiceItems.some(item => !item.item_name.trim() || item.amount <= 0)) {
      setError('All items must have a name and a positive amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data = {
        term,
        academic_year: academicYear,
        due_date: dueDate || null,
        status: editStatus,
        items: invoiceItems.map(item => ({
          id: item.id,
          item_name: item.item_name,
          amount: Number(item.amount),
          description: item.description || ''
        }))
      };

      await APIService.put(`/api/finance/invoices/${selectedInvoice.id}/`, data, 'staff');
      
      closeEditModal();
      fetchInvoices();
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      setError(err.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  // Handle delete
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      setSubmitting(true);
      await APIService.delete(`/api/finance/invoices/${invoiceToDelete.id}/`, 'staff');
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      setError(err.message || 'Failed to delete invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // View invoice details
  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      const response = await APIService.get<Invoice>(`/api/finance/invoices/${invoice.id}/`, {}, 'staff');
      setSelectedInvoice(response);
      setShowDetailModal(true);
    } catch (err: any) {
      console.error('Error fetching invoice details:', err);
      setError(err.message || 'Failed to fetch invoice details');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter invoices by search
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.academic_year.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user can access this page (Bursar only)
  if (!permissions.isBursar() && !permissions.canManageFinance()) {
    return (
      <div className="p-6 font-sans bg-gray-50 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> Only Bursar can access invoice management.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Invoice Management</h2>
          <p className="text-gray-600">Create and manage student invoices</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openReminderModal}
            disabled={submitting}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Send Fee Reminders
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
          <p className="text-gray-500">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term / Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.term} / {invoice.academic_year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.date_created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.student_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => viewInvoiceDetails(invoice)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(invoice)}
                        className="text-green-600 hover:text-green-800 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(invoice)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Create New Invoice</h3>
                  <p className="text-sm text-gray-500">Invoice Number: <span className="font-medium">{nextInvoiceNumber}</span></p>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Academic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g., 2024/2025"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Student Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Student Selection</h4>
                <div className="flex flex-wrap gap-4 mb-4">
                  {(['single', 'multiple', 'class', 'all'] as const).map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="studentSelection"
                        value={option}
                        checked={studentSelection === option}
                        onChange={() => handleStudentSelectionChange(option)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {option === 'all' ? 'All Students' : option === 'class' ? 'By Class' : `${option.charAt(0).toUpperCase() + option.slice(1)} Student${option === 'multiple' ? 's' : ''}`}
                      </span>
                    </label>
                  ))}
                </div>

                {studentSelection === 'class' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(studentSelection === 'single' || studentSelection === 'multiple') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Student{studentSelection === 'multiple' ? 's' : ''}
                    </label>
                    <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                      {students.length === 0 ? (
                        <p className="p-4 text-gray-500 text-center">No students available</p>
                      ) : (
                        students.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type={studentSelection === 'single' ? 'radio' : 'checkbox'}
                              name="student"
                              value={student.id}
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                if (studentSelection === 'single') {
                                  setSelectedStudents([student.id]);
                                } else {
                                  if (e.target.checked) {
                                    setSelectedStudents([...selectedStudents, student.id]);
                                  } else {
                                    setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                  }
                                }
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                              <p className="text-xs text-gray-500">{student.admission_number} • {student.class_field}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedStudents.length > 0 && (
                      <p className="mt-2 text-sm text-gray-500">{selectedStudents.length} student(s) selected</p>
                    )}
                  </div>
                )}

                {studentSelection === 'all' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> This invoice will be created for all active students in the school.
                    </p>
                  </div>
                )}
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Invoice Items</h4>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateInvoiceItem(index, 'item_name', e.target.value)}
                          placeholder="Item name (e.g., Tuition Fees)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateInvoiceItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {notificationMode === 'created' ? 'Notify Parents' : 'Send Fee Balance Reminders'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {notificationMode === 'created'
                      ? `Invoice ${notificationInvoice?.invoice_number || ''} has been created.`
                      : 'Parents with outstanding student fee balances will receive an SMS reminder.'}
                  </p>
                </div>
                <button
                  onClick={closeNotifyModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['individual', 'class', 'school'] as NotificationRecipientMode[]).map(mode => (
                  <label key={mode} className={`border rounded-lg p-3 cursor-pointer ${notificationRecipientMode === mode ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="notificationRecipientMode"
                      value={mode}
                      checked={notificationRecipientMode === mode}
                      onChange={() => {
                        setNotificationRecipientMode(mode);
                        setNotificationSelectedStudentKey('');
                        setNotificationResult(null);
                      }}
                      className="mr-2 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {mode === 'individual' ? 'Individual Student' : mode === 'class' ? 'Class' : 'Whole School'}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or admission no</label>
                  <input
                    type="text"
                    value={notificationSearchTerm}
                    onChange={(e) => setNotificationSearchTerm(e.target.value)}
                    placeholder="Type student name or admission number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {notificationRecipientMode === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={notificationSelectedClass}
                      onChange={(e) => setNotificationSelectedClass(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Select class</option>
                      {notificationClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(() => {
                const rows = getNotificationRows();
                const visibleRows = getNotificationSearchRows();
                const reachableCount = rows.filter(row => row.parent_guardian_phone).length;
                const missingCount = rows.length - reachableCount;

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Balances</p>
                        <p className="text-lg font-semibold text-gray-900">{rows.length}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-700">Ready to send</p>
                        <p className="text-lg font-semibold text-green-900">{reachableCount}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-700">Missing phone</p>
                        <p className="text-lg font-semibold text-amber-900">{missingCount}</p>
                      </div>
                    </div>

                    {visibleRows.length === 0 ? (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                        No outstanding balances were found.
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {notificationRecipientMode === 'individual' && <th className="px-4 py-2"></th>}
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Phone</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {visibleRows.slice(0, 50).map(row => (
                              <tr key={`${row.id}-${row.invoice_number}`}>
                                {notificationRecipientMode === 'individual' && (
                                  <td className="px-4 py-3">
                                    <input
                                      type="radio"
                                      name="notificationStudent"
                                      checked={notificationSelectedStudentKey === row.admission_number}
                                      onChange={() => setNotificationSelectedStudentKey(row.admission_number)}
                                      className="text-amber-600 focus:ring-amber-500"
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm">
                                  <p className="font-medium text-gray-900">{row.student_name}</p>
                                  <p className="text-gray-500">{row.admission_number}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{row.invoice_number}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{row.class_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{row.parent_guardian_phone || 'Missing'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {visibleRows.length > 50 && (
                      <p className="text-xs text-gray-500">Showing first 50 matching balances. Use search to narrow the list.</p>
                    )}
                  </>
                );
              })()}

              {notificationResult && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
                  {notificationResult}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeNotifyModal}
                disabled={sendingNotifications}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={sendFeeNotifications}
                disabled={
                  sendingNotifications ||
                  (notificationRecipientMode === 'individual' && !notificationSelectedStudentKey) ||
                  (notificationRecipientMode === 'class' && !notificationSelectedClass) ||
                  getNotificationRows().filter(row => row.parent_guardian_phone).length === 0
                }
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {sendingNotifications && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Invoice {selectedInvoice.invoice_number}</h3>
                  <p className="text-sm text-gray-500">{selectedInvoice.term} • {selectedInvoice.academic_year}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </span>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date Created</p>
                  <p className="font-medium">{formatDate(selectedInvoice.date_created)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="font-medium">{selectedInvoice.student_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium text-lg text-green-600">{formatCurrency(selectedInvoice.total_amount)}</p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Invoice Items</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-900">Total</td>
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedInvoice.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Students */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Students ({selectedInvoice.student_count})</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admission No.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.invoice_students?.map((invStudent) => (
                        <tr key={invStudent.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{invStudent.student_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{invStudent.admission_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{invStudent.class_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invStudent.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              invStudent.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invStudent.payment_status.charAt(0).toUpperCase() + invStudent.payment_status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(invStudent.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInvoice(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Edit Invoice</h3>
                  <p className="text-sm text-gray-500">Invoice Number: <span className="font-medium">{selectedInvoice.invoice_number}</span></p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Academic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g., 2024/2025"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Invoice Items</h4>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateInvoiceItem(index, 'item_name', e.target.value)}
                          placeholder="Item name (e.g., Tuition Fees)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateInvoiceItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInvoiceItem(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditInvoice}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && invoiceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Invoice</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete invoice <strong>{invoiceToDelete.invoice_number}</strong>? 
                This action cannot be undone and will remove all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setInvoiceToDelete(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvoice}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
