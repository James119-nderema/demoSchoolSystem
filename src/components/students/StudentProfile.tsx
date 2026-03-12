import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { APIService } from '../../services/baseUrl';
import { SkeletonProfile, SkeletonCards, SkeletonTable } from '../ui/Skeleton';

interface StudentData {
  id: string;
  upi_no?: string;
  assessment_no?: string;
  surname: string;
  first_name: string;
  other_names?: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  birth_entry_no?: string;
  disability?: string;
  admission_number: string;
  class_field?: string;
  class_name?: string;
  current_class?: string;
  admission_class?: string;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email?: string;
  address?: string;
  status: string;
  date_added: string;
  date_updated?: string;
  age?: number;
  school_name?: string;
  added_by?: string;
}

interface SubjectResult {
  subject: string;
  subject_code?: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  points?: number;
  remarks?: string;
  subject_position?: number;
}

interface ReportData {
  student_info: {
    name: string;
    admission_number: string;
    class_name?: string;
    class?: string;
    position?: number;
    total_students?: number;
  };
  exam_info: {
    term: string;
    academic_year: string;
    exam_type: string;
  };
  subjects: SubjectResult[];
  summary: {
    total_marks_obtained: number;
    total_possible_marks: number;
    overall_percentage: number;
    overall_grade: string;
    total_subjects: number;
    position?: number;
    total_students?: number;
    class_average?: number;
    average?: number;
    total_points?: number;
    overall_remarks?: string;
  };
  class_teacher_name?: string;
}

interface InvoiceStudent {
  id: string;
  student: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  amount_paid: number;
  payment_status: string;
  total_amount: number;
  balance: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  term: string;
  academic_year: string;
  date_created: string;
  due_date?: string;
  status: string;
  total_amount: number;
  student_count: number;
  items?: { id: string; item_name: string; amount: number; description?: string }[];
  invoice_students?: InvoiceStudent[];
}

interface DropdownData {
  classes: { id: string; class_name: string }[];
  exam_types: string[];
  terms: string[];
  years: string[];
}

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

  // Finance state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [studentFees, setStudentFees] = useState<{ total: number; paid: number; balance: number }>({ total: 0, paid: 0, balance: 0 });
  const [feesLoading, setFeesLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'fees'>('overview');

  // Determine back path from current route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const backPath = isAdminRoute ? '/admin/students' : '/students';

  useEffect(() => {
    if (studentId) {
      fetchStudent();
      fetchDropdownData();
      fetchInvoices();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await APIService.get(`/api/students/${studentId}/`);
      setStudent(data);
    } catch (err: any) {
      console.error('Error fetching student:', err);
      setError(err.message || 'Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const data = await APIService.get('/api/input-marks/dropdown-data/');
      setDropdownData(data);
      // Auto-select first available values
      if (data.terms?.length) setSelectedTerm(data.terms[0]);
      if (data.years?.length) setSelectedYear(data.years[0]);
      if (data.exam_types?.length) setSelectedExamType(data.exam_types[0]);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchResults = async () => {
    if (!studentId || !selectedTerm || !selectedYear || !selectedExamType) return;
    try {
      setResultsLoading(true);
      setResultsError(null);
      const data = await APIService.get('/api/input-marks/student-report-data/', {
        student_id: studentId,
        term: selectedTerm,
        academic_year: selectedYear,
        exam_type: selectedExamType,
      });
      setReportData(data);
    } catch (err: any) {
      console.error('Error fetching results:', err);
      setResultsError(err.message || 'No results found for the selected criteria');
      setReportData(null);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTerm && selectedYear && selectedExamType && studentId) {
      fetchResults();
    }
  }, [selectedTerm, selectedYear, selectedExamType]);

  const fetchInvoices = async () => {
    try {
      setFeesLoading(true);
      const data = await APIService.get('/api/finance/invoices/');
      // data may be paginated: { results: [...], count, next, previous } or just array
      const allInvoices: Invoice[] = data.results || data;
      
      // Fetch detail for each invoice to find student-specific data
      let totalFees = 0;
      let totalPaid = 0;
      const studentInvoices: Invoice[] = [];

      // Fetch details for invoices (limit to recent 50 to avoid too many requests)
      const invoicesToCheck = allInvoices.slice(0, 50);
      
      await Promise.all(
        invoicesToCheck.map(async (invoice) => {
          try {
            const detail = await APIService.get(`/api/finance/invoices/${invoice.id}/`);
            const studentEntry = detail.invoice_students?.find(
              (is: InvoiceStudent) => is.student === studentId || is.admission_number === student?.admission_number
            );
            if (studentEntry) {
              studentInvoices.push({ ...detail });
              totalFees += studentEntry.total_amount || 0;
              totalPaid += studentEntry.amount_paid || 0;
            }
          } catch {
            // Skip invoices we can't access
          }
        })
      );

      setInvoices(studentInvoices);
      setStudentFees({
        total: totalFees,
        paid: totalPaid,
        balance: totalFees - totalPaid,
      });
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setFeesLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
      case 'inactive': return 'bg-gray-100 text-gray-700 ring-gray-600/20';
      case 'suspended': return 'bg-red-100 text-red-700 ring-red-600/20';
      case 'graduated': return 'bg-blue-100 text-blue-700 ring-blue-600/20';
      default: return 'bg-yellow-100 text-yellow-700 ring-yellow-600/20';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-emerald-600 bg-emerald-50';
      case 'A-': return 'text-emerald-500 bg-emerald-50';
      case 'B+': return 'text-blue-600 bg-blue-50';
      case 'B': return 'text-blue-500 bg-blue-50';
      case 'B-': return 'text-blue-400 bg-blue-50';
      case 'C+': return 'text-amber-600 bg-amber-50';
      case 'C': return 'text-amber-500 bg-amber-50';
      case 'C-': return 'text-orange-500 bg-orange-50';
      case 'D+': return 'text-orange-600 bg-orange-50';
      case 'D': return 'text-red-500 bg-red-50';
      case 'D-': return 'text-red-600 bg-red-50';
      case 'E': return 'text-red-700 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'unpaid': case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-24 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Profile</h1>
        <SkeletonProfile />
        <SkeletonCards count={3} className="mt-6" />
        <SkeletonTable rows={4} cols={4} className="mt-6" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Student Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'The student profile could not be loaded.'}</p>
          <button onClick={() => navigate(backPath)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200/50">
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const initials = student.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const studentClass = student.current_class || student.class_field || student.class_name || student.admission_class || '—';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5" />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-24">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-indigo-200 text-sm mb-6">
            <button onClick={() => navigate(backPath)} className="hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Students
            </button>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">{student.full_name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">Student Profile</h1>
          <p className="mt-1 text-indigo-200 text-sm">View detailed student information, academic results, and fee records</p>
        </div>
      </div>

      {/* ─── Profile Card (overlaps hero) ────────────────────────────── */}
      <div className="relative px-4 sm:px-6 lg:px-8 -mt-16 pb-8">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Profile strip */}
          <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/60 flex-shrink-0 ring-4 ring-white">
              <span className="text-xl sm:text-2xl font-bold text-white">{initials}</span>
            </div>

            {/* Name & info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ring-1 ring-inset ${getStatusColor(student.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {studentClass}
                </span>
                <span className="text-sm text-slate-400">Adm: {student.admission_number}</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-4 sm:gap-6">
              {student.age && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{student.age}</p>
                  <p className="text-xs text-slate-400 font-medium">Years Old</p>
                </div>
              )}
              {reportData?.summary && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{reportData.summary.overall_percentage?.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400 font-medium">Average</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Tab Navigation ─────────────────────────────────────── */}
          <div className="border-t border-slate-100">
            <nav className="flex px-6 sm:px-8 -mb-px">
              {[
                { key: 'overview' as const, label: 'Overview', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { key: 'results' as const, label: 'Academic Results', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                { key: 'fees' as const, label: 'Fees & Payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ─── Tab Content ──────────────────────────────────────────── */}
        <div className="mt-6">
          {/* === OVERVIEW TAB === */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Personal Information</h3>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <InfoRow label="Full Name" value={student.full_name} />
                    <InfoRow label="Surname" value={student.surname} />
                    <InfoRow label="First Name" value={student.first_name} />
                    <InfoRow label="Other Names" value={student.other_names || '—'} />
                    <InfoRow label="Gender" value={student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1)} />
                    <InfoRow label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                    <InfoRow label="Age" value={student.age ? `${student.age} years` : '—'} />
                    {student.disability && <InfoRow label="Disability" value={student.disability} highlight />}
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Academic Information</h3>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <InfoRow label="Admission Number" value={student.admission_number} />
                    <InfoRow label="Current Class" value={studentClass} />
                    {student.admission_class && <InfoRow label="Admission Class" value={student.admission_class} />}
                    {student.upi_no && <InfoRow label="UPI Number" value={student.upi_no} />}
                    {student.assessment_no && <InfoRow label="Assessment Number" value={student.assessment_no} />}
                    {student.birth_entry_no && <InfoRow label="Birth Entry No" value={student.birth_entry_no} />}
                    <InfoRow label="Status" value={
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${getStatusColor(student.status)}`}>
                        {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                      </span>
                    } />
                    <InfoRow label="Date Added" value={student.date_added ? new Date(student.date_added).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                    {student.school_name && <InfoRow label="School" value={student.school_name} />}
                  </div>
                </div>

                {/* Parent/Guardian Information */}
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden lg:col-span-2">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Parent / Guardian Information</h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</label>
                          <p className="mt-1 text-sm font-medium text-slate-800">{student.parent_guardian_name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</label>
                          <p className="mt-1 text-sm font-medium text-slate-800">{student.parent_guardian_phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</label>
                          <p className="mt-1 text-sm font-medium text-slate-800">{student.parent_guardian_email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Address</label>
                          <p className="mt-1 text-sm font-medium text-slate-800">{student.address || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === RESULTS TAB === */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Filter Controls */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Filter Results</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Term</label>
                      <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                        <option value="">Select Term</option>
                        {dropdownData?.terms?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Year</label>
                      <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                        <option value="">Select Year</option>
                        {dropdownData?.years?.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Exam Type</label>
                      <select value={selectedExamType} onChange={e => setSelectedExamType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
                        <option value="">Select Exam</option>
                        {dropdownData?.exam_types?.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Content */}
              {resultsLoading ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Loading results...</p>
                </div>
              ) : resultsError ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">No Results Found</p>
                  <p className="text-sm text-slate-400 mt-1">Try selecting different filter criteria</p>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard
                      label="Total Marks"
                      value={`${reportData.summary.total_marks_obtained}/${reportData.summary.total_possible_marks}`}
                      color="indigo"
                    />
                    <SummaryCard
                      label="Average"
                      value={`${reportData.summary.overall_percentage?.toFixed(1)}%`}
                      color="emerald"
                    />
                    <SummaryCard
                      label="Grade"
                      value={reportData.summary.overall_grade}
                      color="blue"
                    />
                    <SummaryCard
                      label="Position"
                      value={reportData.summary.position ? `${reportData.summary.position}/${reportData.summary.total_students}` : '—'}
                      color="purple"
                    />
                  </div>

                  {/* Results Table */}
                  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800">Subject Results</h3>
                          <p className="text-xs text-slate-400">{reportData.exam_info.term} • {reportData.exam_info.academic_year} • {reportData.exam_info.exam_type}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                        {reportData.subjects.length} subject{reportData.subjects.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-slate-50/80">
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Marks</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Percentage</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                            {reportData.subjects[0]?.points !== undefined && (
                              <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Points</th>
                            )}
                            {reportData.subjects[0]?.remarks && (
                              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.subjects.map((subject, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5 text-sm text-slate-400 font-medium">{idx + 1}</td>
                              <td className="px-6 py-3.5">
                                <span className="text-sm font-semibold text-slate-800">{subject.subject}</span>
                                {subject.subject_code && <span className="text-xs text-slate-400 ml-2">({subject.subject_code})</span>}
                              </td>
                              <td className="px-6 py-3.5 text-center text-sm font-medium text-slate-700">{subject.marks_obtained}/{subject.total_marks}</td>
                              <td className="px-6 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(subject.percentage, 100)}%` }} />
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">{subject.percentage?.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${getGradeColor(subject.grade)}`}>
                                  {subject.grade}
                                </span>
                              </td>
                              {reportData.subjects[0]?.points !== undefined && (
                                <td className="px-6 py-3.5 text-center text-sm font-medium text-slate-700">{subject.points ?? '—'}</td>
                              )}
                              {reportData.subjects[0]?.remarks && (
                                <td className="px-6 py-3.5 text-sm text-slate-500">{subject.remarks || '—'}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        {/* Summary Row */}
                        <tfoot>
                          <tr className="bg-indigo-50/50 border-t-2 border-indigo-100">
                            <td className="px-6 py-3.5" colSpan={2}>
                              <span className="text-sm font-bold text-indigo-700">Total / Average</span>
                            </td>
                            <td className="px-6 py-3.5 text-center text-sm font-bold text-indigo-700">
                              {reportData.summary.total_marks_obtained}/{reportData.summary.total_possible_marks}
                            </td>
                            <td className="px-6 py-3.5 text-center text-sm font-bold text-indigo-700">
                              {reportData.summary.overall_percentage?.toFixed(1)}%
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${getGradeColor(reportData.summary.overall_grade)}`}>
                                {reportData.summary.overall_grade}
                              </span>
                            </td>
                            {reportData.subjects[0]?.points !== undefined && (
                              <td className="px-6 py-3.5 text-center text-sm font-bold text-indigo-700">{reportData.summary.total_points ?? '—'}</td>
                            )}
                            {reportData.subjects[0]?.remarks && (
                              <td className="px-6 py-3.5 text-sm font-semibold text-indigo-700">{reportData.summary.overall_remarks || '—'}</td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Class Performance Context */}
                  {(reportData.summary.class_average || reportData.class_teacher_name) && (
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Class Context</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {reportData.summary.class_average && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-medium">Class Average</p>
                              <p className="text-sm font-bold text-slate-800">{reportData.summary.class_average?.toFixed(1)}%</p>
                            </div>
                          </div>
                        )}
                        {reportData.summary.position && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-medium">Position in Class</p>
                              <p className="text-sm font-bold text-slate-800">{reportData.summary.position} of {reportData.summary.total_students}</p>
                            </div>
                          </div>
                        )}
                        {reportData.class_teacher_name && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-medium">Class Teacher</p>
                              <p className="text-sm font-bold text-slate-800">{reportData.class_teacher_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">Select filters above to view results</p>
                  <p className="text-sm text-slate-400 mt-1">Choose a term, year, and exam type to load academic results</p>
                </div>
              )}
            </div>
          )}

          {/* === FEES TAB === */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Fee Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Fees</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {feesLoading ? '...' : `KES ${studentFees.total.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount Paid</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {feesLoading ? '...' : `KES ${studentFees.paid.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Balance</p>
                      <p className={`text-2xl font-bold ${studentFees.balance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {feesLoading ? '...' : `KES ${studentFees.balance.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Invoice History</h3>
                    <p className="text-xs text-slate-400">All invoices associated with this student</p>
                  </div>
                </div>

                {feesLoading ? (
                  <div className="p-12 text-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Loading fee records...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">No invoices found</p>
                    <p className="text-sm text-slate-400 mt-1">No fee records have been created for this student yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-slate-50/80">
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Term / Year</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map(invoice => {
                          const studentEntry = invoice.invoice_students?.find(
                            is => is.student === studentId || is.admission_number === student?.admission_number
                          );
                          return (
                            <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3.5 text-sm font-semibold text-indigo-600">{invoice.invoice_number}</td>
                              <td className="px-6 py-3.5 text-sm text-slate-700">{invoice.term} • {invoice.academic_year}</td>
                              <td className="px-6 py-3.5 text-center text-sm font-medium text-slate-700">
                                KES {(studentEntry?.total_amount || invoice.total_amount || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-3.5 text-center text-sm font-medium text-emerald-600">
                                KES {(studentEntry?.amount_paid || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-3.5 text-center text-sm font-medium text-red-600">
                                KES {(studentEntry?.balance || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(studentEntry?.payment_status || invoice.status)}`}>
                                  {studentEntry?.payment_status || invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-sm text-slate-500">
                                {new Date(invoice.date_created).toLocaleDateString('en-GB')}
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
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Reusable sub-components ─────────────────────────────────────── */

const InfoRow: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${highlight ? 'bg-orange-50 border border-orange-100' : 'hover:bg-slate-50'} transition-colors`}>
    <span className="text-sm text-slate-400 font-medium">{label}</span>
    <span className={`text-sm font-semibold ${highlight ? 'text-orange-700' : 'text-slate-800'}`}>{value}</span>
  </div>
);

const SummaryCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default StudentProfile;
