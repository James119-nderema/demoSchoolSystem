/**
 * MessagingPage — Professional SMS Dashboard
 *
 * Features:
 * - SMS credit balance & usage stats
 * - Send SMS (custom / exam results / term summary)
 * - Top-up with M-Pesa (Daraja STK Push) or Bank Transfer
 * - Transaction history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  sendBulkSms,
  isSmsConfigured,
  saveSmsSettings,
  getSmsSettings,
  type SmsMessage,
  type SmsSendResult,
} from '../../services/smsService';
import { DataAPI, MarksAPI, ReportsAPI, SmsCreditsAPI } from '../../services/baseUrl';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface StudentOption {
  id: number | string;
  full_name: string;
  admission_number: string;
  assessment_no?: string;
  current_class?: string;
  current_class_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_name?: string;
}

interface ClassOption {
  id: number | string;
  name: string;
  class_name?: string;
}

interface ExamType { value: string; label: string; }

interface SubjectResult {
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  percentage?: number;
  points?: number;
  remarks?: string;
}

interface StudentResult {
  student: StudentOption;
  results: SubjectResult[];
  average: number;
  grade: string;
  position: number;
  totalStudents: number;
  examType: string;
  totalMarks?: number;
  overallRemarks?: string;
}

interface SchoolInfo {
  name: string;
  phone: string;
  email: string;
  motto: string;
  principal_name?: string;
}

interface CreditBalance {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
}

interface CreditStats {
  total_sent: number;
  total_failed: number;
  total_sessions: number;
}

interface TopUpPackage {
  sms_count: number;
  amount: number;
  label: string;
}

type MessageTemplateType = 'custom' | 'individual_exam' | 'term_summary';
type ActiveTab = 'compose' | 'history' | 'topup';

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

const MessagingPage: React.FC = () => {
  // ── Tab ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('compose');

  // ── Credits ──
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({ total_credits: 5000, used_credits: 0, remaining_credits: 5000 });
  const [creditStats, setCreditStats] = useState<CreditStats>({ total_sent: 0, total_failed: 0, total_sessions: 0 });
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [pricePerSms, setPricePerSms] = useState(0.25);

  // ── Classes & students ──
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Term / Year / Exam ──
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);

  // ── Message ──
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplateType>('custom');
  const [customMessage, setCustomMessage] = useState('');
  const [studentResults, setStudentResults] = useState<Map<string, StudentResult>>(new Map());
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // ── Sending ──
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsResults, setSmsResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  // ── Notifications ──
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── SMS settings ──
  const [showSmsSettings, setShowSmsSettings] = useState(false);
  const [smsSettingsForm, setSmsSettingsForm] = useState({ apiToken: '', senderId: '' });

  // ── Top-up modal ──
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpStep, setTopUpStep] = useState<'package' | 'payment' | 'mpesa' | 'bank' | 'processing' | 'done'>('package');
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);
  const [customSmsCount, setCustomSmsCount] = useState('');
  const [_paymentMethod, setPaymentMethod] = useState<'MPESA' | 'BANK' | ''>('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [bankTransactionId, setBankTransactionId] = useState('');
  const [currentTopUpId, setCurrentTopUpId] = useState('');
  const [topUpProcessing, setTopUpProcessing] = useState(false);

  // ── Transaction History ──
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topUpHistory, setTopUpHistory] = useState<any[]>([]);

  // ── Year options ──
  const yearOptions = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  // ── Filtered students ──
  const filteredStudents = students.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.admission_number?.toLowerCase().includes(q) || s.assessment_no?.toLowerCase().includes(q);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Data Fetching
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchBalance = useCallback(async () => {
    try {
      const res = await SmsCreditsAPI.getBalance();
      if (res.balance) {
        setCreditBalance(res.balance);
      }
      if (res.stats) setCreditStats(res.stats);
      if (res.packages) setPackages(res.packages);
      if (res.price_per_sms) setPricePerSms(parseFloat(res.price_per_sms));
    } catch { /* will use defaults */ }
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await DataAPI.getClasses({ show_all: 'true' });
      const raw = res.results || res || [];
      setClasses(raw.map((c: any) => ({ id: c.id, name: c.class_name || c.name || 'Unknown', class_name: c.class_name })));
    } catch { setError('Failed to fetch classes'); }
  };

  const fetchDropdownData = async () => {
    try {
      const res = await MarksAPI.getDropdownData();
      if (res.exam_types) setExamTypes(res.exam_types);
    } catch {
      setExamTypes([{ value: 'exam_1', label: 'Exam 1' }, { value: 'exam_2', label: 'Exam 2' }, { value: 'exam_3', label: 'Exam 3' }]);
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    try {
      setLoading(true);
      const res = await MarksAPI.getClassStudents(classId);
      setStudents((res.students || []).map((s: any) => ({
        id: s.id, full_name: s.full_name, admission_number: s.admission_number,
        current_class: s.current_class, assessment_no: s.assessment_no || '',
        parent_guardian_phone: s.parent_guardian_phone || '', parent_guardian_name: s.parent_guardian_name || '',
      })));
    } catch { setError('Failed to fetch students'); } finally { setLoading(false); }
  };

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const promises = classes.map(cls => MarksAPI.getClassStudents(cls.id.toString()).catch(() => ({ students: [] })));
      const responses = await Promise.all(promises);
      const all: StudentOption[] = [];
      const seen = new Set<string>();
      for (const r of responses) {
        for (const s of (r.students || [])) {
          const key = s.id?.toString();
          if (key && !seen.has(key)) {
            seen.add(key);
            all.push({ id: s.id, full_name: s.full_name, admission_number: s.admission_number, current_class: s.current_class, assessment_no: s.assessment_no || '', parent_guardian_phone: s.parent_guardian_phone || '', parent_guardian_name: s.parent_guardian_name || '' });
          }
        }
      }
      all.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(all);
    } catch { setError('Failed to fetch students'); } finally { setLoading(false); }
  };

  const fetchStudentResults = async () => {
    if (!selectedTerm || !selectedYear) return;
    setLoading(true);
    const resultsMap = new Map<string, StudentResult>();
    try {
      const examsToFetch = messageTemplate === 'term_summary' ? examTypes.map(e => e.value) : selectedExamType ? [selectedExamType] : [];
      if (examsToFetch.length === 0) { setStudentResults(resultsMap); setLoading(false); return; }

      // When 'all' is selected, iterate over each class; otherwise use the single selected class
      const classIdsToFetch = selectedClass === 'all'
        ? classes.map(c => c.id.toString())
        : selectedClass ? [selectedClass] : [];

      if (classIdsToFetch.length === 0) { setStudentResults(resultsMap); setLoading(false); return; }

      for (const classId of classIdsToFetch) {
        for (const examType of examsToFetch) {
          try {
            const response = await ReportsAPI.getBulkReportData({ class_id: classId, term: selectedTerm, academic_year: selectedYear, exam_type: examType });
            if (!response?.reports) continue;
            if (response.reports.length > 0 && !schoolInfo) {
              const info = response.reports[0].school_info;
              if (info) setSchoolInfo({ name: info.name, phone: info.phone || '', email: info.email || '', motto: info.motto || '', principal_name: '' });
            }
            for (const report of response.reports) {
              const matched = students.find(s => s.full_name === report.student_info?.name || s.admission_number === report.student_info?.admission_number);
              if (!matched) continue;
              const sid = matched.id.toString();
              const subRes: SubjectResult[] = (report.subjects || []).map((r: any) => ({ subject_name: r.subject || r.subject_name, marks_obtained: r.marks_obtained, total_marks: r.total_marks || 100, percentage: r.percentage || 0, grade: r.grade, points: r.points || 0, remarks: r.remarks || '' }));
              if (subRes.length === 0) continue;
              const existing = resultsMap.get(sid);
              const allR = existing ? [...existing.results, ...subRes] : subRes;
              const totalM = allR.reduce((s, r) => s + r.marks_obtained, 0);
              const totalP = allR.reduce((s, r) => s + r.total_marks, 0);
              const avg = totalP > 0 ? (totalM / totalP) * 100 : 0;
              resultsMap.set(sid, { student: matched, results: allR, average: avg, grade: report.summary?.overall_grade || gradeFromAvg(avg), position: report.summary?.position || 0, totalStudents: report.summary?.total_students || students.length, examType: messageTemplate === 'term_summary' ? 'Term Summary' : selectedExamType, totalMarks: totalM, overallRemarks: report.summary?.overall_remarks || '' });
            }
          } catch { /* continue to next class/exam */ }
        }
      }
      const sorted = Array.from(resultsMap.entries()).sort((a, b) => b[1].average - a[1].average);
      sorted.forEach(([id, r], i) => { if (r.position === 0) r.position = i + 1; resultsMap.set(id, r); });
      setStudentResults(resultsMap);
    } catch { setError('Failed to fetch student results'); } finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await SmsCreditsAPI.getTransactions({ limit: '50', offset: '0' });
      setTransactions(res.transactions || []);
    } catch { /* ignore */ }
  };

  const fetchTopUpHistory = async () => {
    try {
      const res = await SmsCreditsAPI.getTopUpHistory({ limit: '50', offset: '0' });
      setTopUpHistory(res.topups || []);
    } catch { /* ignore */ }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => { fetchBalance(); fetchClasses(); fetchDropdownData(); const saved = getSmsSettings(); if (saved) setSmsSettingsForm(saved); }, []);
  useEffect(() => { if (classes.length > 0 && selectedClass === 'all') fetchAllStudents(); }, [classes]);
  useEffect(() => { if (selectedClass === 'all') fetchAllStudents(); else if (selectedClass) fetchStudentsForClass(selectedClass); else { setStudents([]); setSelectedStudents([]); } }, [selectedClass]);
  useEffect(() => {
    if (selectedTerm && selectedYear && messageTemplate !== 'custom') {
      if (selectedClass === 'all' && classes.length > 0) fetchStudentResults();
      else if (selectedClass && selectedClass !== 'all') fetchStudentResults();
    }
  }, [selectedClass, selectedTerm, selectedYear, selectedExamType, messageTemplate, classes]);
  useEffect(() => { if (activeTab === 'history') { fetchTransactions(); fetchTopUpHistory(); } }, [activeTab]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const gradeFromAvg = (a: number) => a >= 80 ? 'A' : a >= 75 ? 'A-' : a >= 70 ? 'B+' : a >= 65 ? 'B' : a >= 60 ? 'B-' : a >= 55 ? 'C+' : a >= 50 ? 'C' : a >= 45 ? 'C-' : a >= 40 ? 'D+' : a >= 35 ? 'D' : a >= 30 ? 'D-' : 'E';

  const selectAllStudents = () => { setSelectedStudents(filteredStudents.filter(s => s.parent_guardian_phone).map(s => s.id.toString())); };
  const deselectAllStudents = () => setSelectedStudents([]);
  const toggleStudent = (id: string) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const generateMessage = (student: StudentOption): string => {
    const r = studentResults.get(student.id.toString());
    const sch = schoolInfo;
    if (messageTemplate === 'custom') {
      return customMessage
        .replace(/{studentName}/g, student.full_name)
        .replace(/{parentName}/g, student.parent_guardian_name || 'Parent')
        .replace(/{admissionNumber}/g, student.admission_number)
        .replace(/{className}/g, student.current_class_name || student.current_class || '')
        .replace(/{schoolName}/g, sch?.name || 'School')
        .replace(/{schoolPhone}/g, sch?.phone || '')
        .replace(/{schoolEmail}/g, sch?.email || '');
    }
    if (!r) return `Dear Parent/Guardian,\n\nResults for ${student.full_name} are not yet available.\n\n${sch?.name || 'School Administration'}`;
    const subTable = r.results.slice(0, 8).map(s => `${s.subject_name}: ${s.marks_obtained} (${s.grade})`).join('\n');
    const totalM = r.totalMarks || r.results.reduce((s, x) => s + x.marks_obtained, 0);
    const examDisp = selectedExamType ? selectedExamType.replace('_', ' ').toUpperCase() : 'EXAM';
    if (messageTemplate === 'individual_exam') {
      return `Dear Parent/Guardian,\n\nGreetings from ${sch?.name || 'School'}.\n\nTerm ${selectedTerm}, ${selectedYear} (${examDisp}) results:\n\nName: ${student.full_name}\nAdm: ${student.admission_number}\n\n${subTable}\n\nTotal: ${totalM} | Mean: ${r.average.toFixed(1)}% | Grade: ${r.grade}\nPosition: ${r.position} of ${r.totalStudents}\n\n${sch?.name || ''}`;
    }
    return `Dear Parent/Guardian,\n\nGreetings from ${sch?.name || 'School'}.\n\nTerm ${selectedTerm}, ${selectedYear} Summary:\n\nName: ${student.full_name}\nAdm: ${student.admission_number}\n\n${subTable}\n\nTotal: ${totalM} | Mean: ${r.average.toFixed(1)}% | Grade: ${r.grade}\nPosition: ${r.position} of ${r.totalStudents}\n\n${sch?.name || ''}`;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Send SMS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSendSms = async () => {
    if (!isSmsConfigured()) { setError('SMS not configured. Click Settings to add your Ping Africa API token.'); setShowSmsSettings(true); return; }
    if (selectedStudents.length === 0) { setError('Select at least one student'); return; }
    if (messageTemplate === 'custom' && !customMessage.trim()) { setError('Enter a message'); return; }
    if (messageTemplate === 'individual_exam' && !selectedExamType) { setError('Select an exam type'); return; }

    // Check credits
    if (creditBalance.remaining_credits < selectedStudents.length) {
      setError(`Insufficient SMS credits. You need ${selectedStudents.length} but have ${creditBalance.remaining_credits}. Please top up.`);
      return;
    }

    setIsSending(true);
    setSmsProgress(0);
    setSmsResults({ success: 0, failed: 0, errors: [] });

    try {
      const messages: SmsMessage[] = [];
      for (const sid of selectedStudents) {
        const student = students.find(s => s.id.toString() === sid);
        if (!student || !student.parent_guardian_phone) continue;
        messages.push({ recipient: { phoneNumber: student.parent_guardian_phone, studentName: student.full_name, studentId: student.id.toString(), parentName: student.parent_guardian_name }, message: generateMessage(student) });
      }
      if (messages.length === 0) { setError('No valid phone numbers for selected students'); setIsSending(false); return; }

      const results = await sendBulkSms(messages, (c: number, t: number) => setSmsProgress(Math.round((c / t) * 100)));
      setSmsResults({ success: results.totalSent, failed: results.totalFailed, errors: results.results.filter((r: SmsSendResult) => !r.success).map((r: SmsSendResult) => `${r.recipient.studentName}: ${r.error}`) });

      // Record usage on backend
      try {
        await SmsCreditsAPI.recordUsage({ recipient_count: messages.length, successful_count: results.totalSent, failed_count: results.totalFailed, message_type: messageTemplate });
        fetchBalance();
      } catch { /* non-critical */ }

      if (results.totalSent > 0) setSuccess(`Successfully sent ${results.totalSent} SMS messages!`);
      if (results.totalFailed > 0) setError(`Failed to send ${results.totalFailed} messages`);
    } catch { setError('Failed to send SMS messages'); } finally { setIsSending(false); setSmsProgress(100); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Top-Up Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const openTopUp = () => { setShowTopUpModal(true); setTopUpStep('package'); setSelectedPackage(null); setCustomSmsCount(''); setPaymentMethod(''); setMpesaPhone(''); setSelectedBank(''); setBankTransactionId(''); setBankDetails(null); };

  const computeCustomAmount = () => {
    const n = parseInt(customSmsCount);
    return isNaN(n) || n <= 0 ? 0 : Math.ceil(n * pricePerSms);
  };

  const handleSelectPackage = (pkg: TopUpPackage | null) => {
    setSelectedPackage(pkg);
    setTopUpStep('payment');
  };

  const handleSelectCustom = () => {
    const n = parseInt(customSmsCount);
    if (isNaN(n) || n <= 0) { setError('Enter a valid SMS count'); return; }
    setSelectedPackage({ sms_count: n, amount: computeCustomAmount(), label: `${n.toLocaleString()} SMS` });
    setTopUpStep('payment');
  };

  const handlePaymentMethodSelect = async (method: 'MPESA' | 'BANK') => {
    setPaymentMethod(method);
    if (method === 'MPESA') setTopUpStep('mpesa');
    else {
      // fetch bank details
      try {
        const res = await SmsCreditsAPI.getBankDetails();
        setBankDetails(res.banks || {});
      } catch { /* use empty */ }
      setTopUpStep('bank');
    }
  };

  const handleMpesaPay = async () => {
    if (!mpesaPhone.trim()) { setError('Enter M-Pesa phone number'); return; }
    if (!selectedPackage) return;
    setTopUpProcessing(true);
    try {
      const res = await SmsCreditsAPI.initiateTopUp({ sms_count: selectedPackage.sms_count, amount: selectedPackage.amount, payment_method: 'MPESA', mpesa_phone: mpesaPhone });
      setCurrentTopUpId(res.topup?.id || '');
      setTopUpStep('processing');
      setSuccess('STK push sent. Complete payment on your phone.');
      // Poll status
      const poll = setInterval(async () => {
        try {
          const st = await SmsCreditsAPI.checkTopUpStatus(res.topup?.id);
          if (st.topup?.status === 'SUCCESS') { clearInterval(poll); setTopUpStep('done'); fetchBalance(); setSuccess(`${selectedPackage.sms_count.toLocaleString()} SMS credits added!`); }
          else if (st.topup?.status === 'FAILED') { clearInterval(poll); setTopUpStep('done'); setError(st.topup?.status_message || 'Payment failed'); }
        } catch { /* keep polling */ }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120000);
    } catch (e: any) { setError(e?.message || 'M-Pesa payment failed'); } finally { setTopUpProcessing(false); }
  };

  const handleBankSubmit = async () => {
    if (!bankTransactionId.trim()) { setError('Enter the bank transaction ID'); return; }
    if (!currentTopUpId && selectedPackage) {
      // Create the top-up first
      setTopUpProcessing(true);
      try {
        const res = await SmsCreditsAPI.initiateTopUp({ sms_count: selectedPackage.sms_count, amount: selectedPackage.amount, payment_method: 'BANK', bank_name: selectedBank });
        setCurrentTopUpId(res.topup?.id || '');
        // Now verify
        await SmsCreditsAPI.verifyBankTransfer({ topup_id: res.topup?.id, bank_transaction_id: bankTransactionId });
        setTopUpStep('done');
        setSuccess('Transaction ID submitted for verification. Credits will be added once confirmed.');
      } catch (e: any) { setError(e?.message || 'Failed to submit'); } finally { setTopUpProcessing(false); }
    } else {
      setTopUpProcessing(true);
      try {
        await SmsCreditsAPI.verifyBankTransfer({ topup_id: currentTopUpId, bank_transaction_id: bankTransactionId });
        setTopUpStep('done');
        setSuccess('Transaction ID submitted for verification.');
      } catch (e: any) { setError(e?.message || 'Failed to submit'); } finally { setTopUpProcessing(false); }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const creditPct = creditBalance.total_credits > 0 ? Math.round((creditBalance.remaining_credits / creditBalance.total_credits) * 100) : 0;
  const barColor = creditPct > 50 ? 'bg-emerald-500' : creditPct > 20 ? 'bg-amber-500' : 'bg-red-500';

  const getSelectedClassName = () => {
    const cls = classes.find(c => c.id.toString() === selectedClass);
    return cls?.name || 'All Classes';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">SMS Messaging</h1>
                <p className="text-xs text-slate-400">Send messages & manage SMS credits</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSmsSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="SMS Settings">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ─── Notifications ─── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center animate-in">
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg><span className="text-sm">{error}</span></div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span className="text-sm">{success}</span></div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {/* ═══ STATS CARDS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Remaining */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining</span>
              <div className="p-1.5 bg-indigo-50 rounded-lg"><svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{creditBalance.remaining_credits.toLocaleString()}</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>{creditPct}% remaining</span>
                <span>{creditBalance.total_credits.toLocaleString()} total</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${creditPct}%` }} />
              </div>
            </div>
          </div>

          {/* Sent */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sent</span>
              <div className="p-1.5 bg-emerald-50 rounded-lg"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{creditStats.total_sent.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Successfully delivered</p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed</span>
              <div className="p-1.5 bg-red-50 rounded-lg"><svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{creditStats.total_failed.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Delivery failures</p>
          </div>

          {/* Top Up */}
          <button onClick={openTopUp} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-left hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200/50 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Top Up</span>
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
            </div>
            <p className="text-2xl font-bold text-white">Buy SMS</p>
            <p className="text-xs text-indigo-200 mt-1">From KSH 0.25/SMS</p>
          </button>
        </div>

        {/* ═══ TAB NAV ═══ */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { key: 'compose' as ActiveTab, label: 'Compose Message', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
              { key: 'history' as ActiveTab, label: 'History', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { key: 'topup' as ActiveTab, label: 'Top-Up History', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* ═══ COMPOSE TAB ═══ */}
          {activeTab === 'compose' && (
            <div className="p-6">
              {!isSmsConfigured() && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <div className="flex-1"><p className="text-sm font-medium text-amber-800">SMS Not Configured</p><p className="text-xs text-amber-600">Configure your Ping Africa API token to start sending messages.</p></div>
                  <button onClick={() => setShowSmsSettings(true)} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium">Configure</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Filters & Template */}
                <div className="space-y-5">
                  {/* Filters */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                      Filters
                    </h3>
                    <div className="space-y-3">
                      <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        <option value="all">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                          <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
                        </select>
                      </div>
                      <select value={selectedExamType} onChange={e => setSelectedExamType(e.target.value)} disabled={messageTemplate === 'term_summary'} className="w-full text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50">
                        <option value="">Select Exam Type</option>
                        {examTypes.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Template */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Message Template
                    </h3>
                    <div className="space-y-2">
                      {[
                        { val: 'custom' as MessageTemplateType, label: 'Custom Message', desc: 'Write your own' },
                        { val: 'individual_exam' as MessageTemplateType, label: 'Exam Results', desc: 'Single exam results' },
                        { val: 'term_summary' as MessageTemplateType, label: 'Term Summary', desc: 'All exams combined' },
                      ].map(t => (
                        <label key={t.val} className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${messageTemplate === t.val ? 'border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name="template" value={t.val} checked={messageTemplate === t.val} onChange={e => setMessageTemplate(e.target.value as MessageTemplateType)} className="w-3.5 h-3.5 text-indigo-600" />
                          <div className="ml-3"><span className="text-sm font-medium text-slate-700">{t.label}</span><p className="text-[11px] text-slate-400">{t.desc}</p></div>
                        </label>
                      ))}
                    </div>
                    {messageTemplate === 'custom' && (
                      <div className="mt-3">
                        <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={5} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={"Use placeholders:\n{studentName}, {parentName}\n{admissionNumber}, {className}\n{schoolName}"} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right — Students & Send */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Student list */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700">Select Recipients</h3>
                        <p className="text-[11px] text-slate-400">{filteredStudents.length} students in {getSelectedClassName()} · {selectedStudents.length} selected</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={selectAllStudents} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Select All</button>
                        <button onClick={deselectAllStudents} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Clear</button>
                      </div>
                    </div>
                    {students.length > 0 && (
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                      </div>
                    )}
                    <div className="max-h-[400px] overflow-y-auto">
                      {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" /></div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-12 text-sm text-slate-400">{!selectedClass ? 'Select a class' : searchTerm ? 'No matches' : 'No students found'}</div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-10">
                                <input type="checkbox" checked={selectedStudents.length === filteredStudents.filter(s => s.parent_guardian_phone).length && selectedStudents.length > 0} onChange={e => e.target.checked ? selectAllStudents() : deselectAllStudents()} className="w-3.5 h-3.5 text-indigo-600 rounded" />
                              </th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Student</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Adm No.</th>
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Phone</th>
                              {messageTemplate !== 'custom' && <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Avg</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map(s => {
                              const res = studentResults.get(s.id.toString());
                              const hasPhone = !!s.parent_guardian_phone;
                              return (
                                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${!hasPhone ? 'opacity-40' : ''}`}>
                                  <td className="px-4 py-2.5"><input type="checkbox" checked={selectedStudents.includes(s.id.toString())} onChange={() => toggleStudent(s.id.toString())} disabled={!hasPhone} className="w-3.5 h-3.5 text-indigo-600 rounded" /></td>
                                  <td className="px-4 py-2.5">
                                    <span className="text-sm font-medium text-slate-700">{s.full_name}</span>
                                    {s.parent_guardian_name && <p className="text-[11px] text-slate-400">{s.parent_guardian_name}</p>}
                                  </td>
                                  <td className="px-4 py-2.5 text-sm text-slate-500">{s.admission_number}</td>
                                  <td className="px-4 py-2.5 text-sm">{hasPhone ? <span className="text-emerald-600">{s.parent_guardian_phone}</span> : <span className="text-red-400 text-xs">No phone</span>}</td>
                                  {messageTemplate !== 'custom' && <td className="px-4 py-2.5 text-sm">{res ? <span className="font-medium text-slate-700">{res.average.toFixed(1)}%</span> : <span className="text-slate-300">—</span>}</td>}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Send bar */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{selectedStudents.length} recipient{selectedStudents.length !== 1 ? 's' : ''} selected</p>
                        <p className="text-[11px] text-slate-400">Credits: {creditBalance.remaining_credits.toLocaleString()} remaining · Cost: {selectedStudents.length} SMS</p>
                      </div>
                      <button onClick={handleSendSms} disabled={isSending || selectedStudents.length === 0} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isSending || selectedStudents.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50'}`}>
                        {isSending ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Sending...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Send SMS</>}
                      </button>
                    </div>
                    {isSending && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1"><span>Sending…</span><span>{smsProgress}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${smsProgress}%` }} /></div>
                      </div>
                    )}
                    {(smsResults.success > 0 || smsResults.failed > 0) && !isSending && (
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-emerald-600 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{smsResults.success} Sent</span>
                        {smsResults.failed > 0 && <span className="text-red-500 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>{smsResults.failed} Failed</span>}
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {selectedStudents.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Message Preview</h3>
                      <div className="bg-slate-50 rounded-lg p-3 whitespace-pre-wrap text-xs text-slate-600 max-h-48 overflow-y-auto">
                        {students.find(s => s.id.toString() === selectedStudents[0]) && generateMessage(students.find(s => s.id.toString() === selectedStudents[0])!)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Preview for first recipient. Each message is personalised.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ HISTORY TAB ═══ */}
          {activeTab === 'history' && (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">SMS Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">No transactions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Type</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Recipients</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Sent</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Failed</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Credits</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm text-slate-600">{new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-2.5"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.message_type}</span></td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{t.recipient_count}</td>
                          <td className="px-4 py-2.5 text-sm text-emerald-600 font-medium">{t.successful_count}</td>
                          <td className="px-4 py-2.5 text-sm text-red-500">{t.failed_count}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{t.credits_used}</td>
                          <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ TOP-UP HISTORY TAB ═══ */}
          {activeTab === 'topup' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Top-Up History</h3>
                <button onClick={openTopUp} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">+ Buy SMS Credits</button>
              </div>
              {topUpHistory.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">No top-up requests yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Date</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">SMS Count</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Amount</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Method</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {topUpHistory.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm text-slate-600">{new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{t.sms_count?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">KSH {parseFloat(t.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.payment_method === 'MPESA' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{t.payment_method}</span></td>
                          <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : t.status === 'PENDING' || t.status === 'PROCESSING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP-UP MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Buy SMS Credits</h2>
                  <p className="text-xs text-slate-400">
                    {topUpStep === 'package' && 'Choose a package'}
                    {topUpStep === 'payment' && 'Select payment method'}
                    {topUpStep === 'mpesa' && 'M-Pesa payment'}
                    {topUpStep === 'bank' && 'Bank transfer'}
                    {topUpStep === 'processing' && 'Processing payment'}
                    {topUpStep === 'done' && 'Complete'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-5 space-y-4">

              {/* STEP 1: Package selection */}
              {topUpStep === 'package' && (
                <>
                  <div className="space-y-2">
                    {packages.map(pkg => (
                      <button key={pkg.sms_count} onClick={() => handleSelectPackage(pkg)} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{pkg.label}</p>
                          <p className="text-xs text-slate-400">KSH {pkg.amount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-indigo-600">KSH {pkg.amount.toLocaleString()}</p>
                          <p className="text-[11px] text-slate-400">KSH {(pkg.amount / pkg.sms_count).toFixed(2)}/SMS</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Custom Amount</p>
                    <div className="flex gap-2">
                      <input type="number" value={customSmsCount} onChange={e => setCustomSmsCount(e.target.value)} placeholder="Number of SMS" className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={handleSelectCustom} disabled={!customSmsCount || parseInt(customSmsCount) <= 0} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">
                        Buy
                      </button>
                    </div>
                    {customSmsCount && parseInt(customSmsCount) > 0 && (
                      <p className="text-xs text-slate-400 mt-1">Cost: KSH {computeCustomAmount().toLocaleString()} ({pricePerSms}/SMS)</p>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2: Payment method */}
              {topUpStep === 'payment' && selectedPackage && (
                <>
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-indigo-600 font-medium">{selectedPackage.label}</p>
                    <p className="text-2xl font-bold text-indigo-700 mt-1">KSH {selectedPackage.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-600 text-center">Choose payment method</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handlePaymentMethodSelect('MPESA')} className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50/50 transition-all">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">M-Pesa</span>
                      <span className="text-[11px] text-slate-400">Instant via STK Push</span>
                    </button>
                    <button onClick={() => handlePaymentMethodSelect('BANK')} className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Bank Transfer</span>
                      <span className="text-[11px] text-slate-400">Manual verification</span>
                    </button>
                  </div>
                  <button onClick={() => setTopUpStep('package')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-2">← Back to packages</button>
                </>
              )}

              {/* STEP 3a: M-Pesa */}
              {topUpStep === 'mpesa' && selectedPackage && (
                <>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-600 font-medium">M-Pesa Payment</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">KSH {selectedPackage.amount.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">{selectedPackage.label}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone Number</label>
                    <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="e.g. 0712345678" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                    <p className="text-[11px] text-slate-400 mt-1">You'll receive an STK push prompt on this number</p>
                  </div>
                  <button onClick={handleMpesaPay} disabled={topUpProcessing || !mpesaPhone.trim()} className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2">
                    {topUpProcessing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Processing...</> : 'Pay with M-Pesa'}
                  </button>
                  <button onClick={() => setTopUpStep('payment')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">← Back</button>
                </>
              )}

              {/* STEP 3b: Bank transfer */}
              {topUpStep === 'bank' && selectedPackage && (
                <>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 font-medium">Bank Transfer</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">KSH {selectedPackage.amount.toLocaleString()}</p>
                    <p className="text-xs text-blue-500 mt-1">{selectedPackage.label}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Select Bank</label>
                    <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">Choose a bank...</option>
                      {bankDetails && Object.entries(bankDetails).map(([key, info]: [string, any]) => (
                        <option key={key} value={key}>{info.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedBank && bankDetails?.[selectedBank] && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">Payment Instructions</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Bank:</span><span className="font-medium text-slate-700">{bankDetails[selectedBank].name}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Account Name:</span><span className="font-medium text-slate-700">{bankDetails[selectedBank].account_name}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Account No:</span><span className="font-medium text-slate-700">{bankDetails[selectedBank].account_number}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Branch:</span><span className="font-medium text-slate-700">{bankDetails[selectedBank].branch}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Amount:</span><span className="font-bold text-indigo-600">KSH {selectedPackage.amount.toLocaleString()}</span></div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Transaction ID / Reference</label>
                    <input type="text" value={bankTransactionId} onChange={e => setBankTransactionId(e.target.value)} placeholder="Enter bank transaction reference" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <p className="text-[11px] text-slate-400 mt-1">Enter the transaction reference from your bank receipt</p>
                  </div>
                  <button onClick={handleBankSubmit} disabled={topUpProcessing || !bankTransactionId.trim() || !selectedBank} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2">
                    {topUpProcessing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Submitting...</> : 'Submit for Verification'}
                  </button>
                  <button onClick={() => setTopUpStep('payment')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">← Back</button>
                </>
              )}

              {/* Processing */}
              {topUpStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-700">Processing your payment...</p>
                  <p className="text-xs text-slate-400 mt-1">Please complete the M-Pesa payment on your phone</p>
                </div>
              )}

              {/* Done */}
              {topUpStep === 'done' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">Request Submitted!</p>
                  <p className="text-xs text-slate-400 mt-1">Your credits will be updated shortly</p>
                  <button onClick={() => { setShowTopUpModal(false); fetchBalance(); }} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SMS SETTINGS MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showSmsSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                <h2 className="text-lg font-bold text-slate-800">Ping Africa SMS Settings</h2>
              </div>
              <button onClick={() => setShowSmsSettings(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500">Configure your <span className="font-semibold text-slate-700">Ping Africa</span> API credentials. Get your token from <a href="https://bulk.ping.africa" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-700">bulk.ping.africa</a>.</p>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">API Token (Bearer)</label>
                <input type="password" value={smsSettingsForm.apiToken} onChange={e => setSmsSettingsForm(p => ({ ...p, apiToken: e.target.value }))} placeholder="Paste your API token" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Sender ID</label>
                <input type="text" value={smsSettingsForm.senderId} onChange={e => setSmsSettingsForm(p => ({ ...p, senderId: e.target.value.slice(0, 11) }))} placeholder="e.g., SchoolSMS" maxLength={11} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[11px] text-slate-400 mt-1">Max 11 chars. Must be registered with Ping Africa.</p>
              </div>
              <button onClick={() => { saveSmsSettings(smsSettingsForm); setShowSmsSettings(false); setSuccess('SMS settings saved!'); setError(null); setTimeout(() => setSuccess(null), 3000); }} disabled={!smsSettingsForm.apiToken.trim()} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
