/**
 * ParentTermSummary — Filter class/term (no exam type) → preview → select students → send
 * Fetches ALL exam types for the selected term and combines them.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataAPI, MarksAPI, ReportsAPI, SmsCreditsAPI } from '../../services/baseUrl';
import {
  sendBulkSms,
  isSmsConfigured,
  type SmsMessage,
} from '../../services/smsService';
import {
  useSmsCredits,
  CreditStatsBar,
  TopUpModal,
  SmsSettingsModal,
  Notification,
} from './SharedComponents';
import type { StudentOption, ClassOption, ExamType, SubjectResult, StudentResult, SchoolInfo } from './types';
import { gradeFromAvg } from './types';

const ParentTermSummary: React.FC = () => {
  const navigate = useNavigate();
  const { creditBalance, creditStats, packages, pricePerSms, fetchBalance } = useSmsCredits();

  const [step, setStep] = useState<'filter' | 'select'>('filter');

  /* ── Filters ── */
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const yearOptions = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  /* ── Data ── */
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentResults, setStudentResults] = useState<Map<string, StudentResult>>(new Map());
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  /* ── UI ── */
  const [loading, setLoading] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ── Fetch classes + exam types ── */
  useEffect(() => {
    Promise.all([
      DataAPI.getClasses({ show_all: 'true' }),
      MarksAPI.getDropdownData(),
    ]).then(([classRes, ddRes]) => {
      const raw = classRes.results || classRes || [];
      setClasses(raw.map((c: any) => ({ id: c.id, name: c.class_name || c.name || 'Unknown', class_name: c.class_name })));
      if (ddRes.exam_types) setExamTypes(ddRes.exam_types);
    }).catch(() => setError('Failed to load data'));
  }, []);

  /* ── Fetch students ── */
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        if (selectedClass === 'all') {
          const promises = classes.map(cls => MarksAPI.getClassStudents(cls.id.toString()).catch(() => ({ students: [] })));
          const responses = await Promise.all(promises);
          const all: StudentOption[] = [];
          const seen = new Set<string>();
          for (const r of responses) {
            for (const s of (r.students || [])) {
              const key = s.id?.toString();
              if (key && !seen.has(key)) { seen.add(key); all.push({ id: s.id, full_name: s.full_name, admission_number: s.admission_number, current_class: s.current_class, parent_guardian_phone: s.parent_guardian_phone || '', parent_guardian_name: s.parent_guardian_name || '' }); }
            }
          }
          all.sort((a, b) => a.full_name.localeCompare(b.full_name));
          setStudents(all);
        } else if (selectedClass) {
          const res = await MarksAPI.getClassStudents(selectedClass);
          setStudents((res.students || []).map((s: any) => ({ id: s.id, full_name: s.full_name, admission_number: s.admission_number, current_class: s.current_class, parent_guardian_phone: s.parent_guardian_phone || '', parent_guardian_name: s.parent_guardian_name || '' })));
        }
      } catch { setError('Failed to fetch students'); }
      setLoading(false);
    };
    if (classes.length > 0 || selectedClass !== 'all') fetchStudents();
  }, [selectedClass, classes]);

  /* ── Fetch ALL exam types results (term summary) ── */
  const fetchResults = useCallback(async () => {
    if (!selectedTerm || !selectedYear || examTypes.length === 0) return;
    setFetchingResults(true);
    const resultsMap = new Map<string, StudentResult>();
    try {
      const classIds = selectedClass === 'all' ? classes.map(c => c.id.toString()) : selectedClass ? [selectedClass] : [];
      for (const classId of classIds) {
        for (const examType of examTypes) {
          try {
            const response = await ReportsAPI.getBulkReportData({ class_id: classId, term: selectedTerm, academic_year: selectedYear, exam_type: examType.value });
            if (!response?.reports) continue;
            if (response.reports.length > 0 && !schoolInfo) {
              const info = response.reports[0].school_info;
              if (info) setSchoolInfo({ name: info.name, phone: info.phone || '', email: info.email || '', motto: info.motto || '' });
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
              resultsMap.set(sid, {
                student: matched, results: allR, average: avg,
                grade: report.summary?.overall_grade || gradeFromAvg(avg),
                position: report.summary?.position || 0,
                totalStudents: report.summary?.total_students || students.length,
                examType: 'Term Summary', totalMarks: totalM,
                overallRemarks: report.summary?.overall_remarks || '',
              });
            }
          } catch { /* continue */ }
        }
      }
      const sorted = Array.from(resultsMap.entries()).sort((a, b) => b[1].average - a[1].average);
      sorted.forEach(([id, r], i) => { if (r.position === 0) r.position = i + 1; resultsMap.set(id, r); });
      setStudentResults(resultsMap);
    } catch { setError('Failed to fetch results'); }
    setFetchingResults(false);
  }, [selectedClass, selectedTerm, selectedYear, examTypes, classes, students, schoolInfo]);

  /* Auto-fetch results */
  useEffect(() => {
    if (selectedTerm && selectedYear && students.length > 0 && examTypes.length > 0) fetchResults();
  }, [selectedTerm, selectedYear, students, examTypes]);

  /* ── Generate message ── */
  const generateMessage = (student: StudentOption): string => {
    const r = studentResults.get(student.id.toString());
    const sch = schoolInfo;
    if (!r) return `Dear Parent/Guardian,\n\nTerm summary for ${student.full_name} is not yet available.\n\n${sch?.name || 'School Administration'}`;
    const subTable = r.results.slice(0, 10).map(s => `${s.subject_name}: ${s.marks_obtained} (${s.grade})`).join('\n');
    const totalM = r.totalMarks || r.results.reduce((s, x) => s + x.marks_obtained, 0);
    return `Dear Parent/Guardian,\n\nGreetings from ${sch?.name || 'School'}.\n\nTerm ${selectedTerm}, ${selectedYear} Summary:\n\nName: ${student.full_name}\nAdm: ${student.admission_number}\n\n${subTable}\n\nTotal: ${totalM} | Mean: ${r.average.toFixed(1)}% | Grade: ${r.grade}\nPosition: ${r.position} of ${r.totalStudents}\n\n${sch?.name || ''}`;
  };

  const filteredStudents = students.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.admission_number?.toLowerCase().includes(q);
  });

  const toggleStudent = (id: string) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedStudents(filteredStudents.filter(s => s.parent_guardian_phone).map(s => s.id.toString()));
  const deselectAll = () => setSelectedStudents([]);

  /* ── Send ── */
  const handleSend = async () => {
    if (!isSmsConfigured()) { setError('SMS not configured.'); setShowSettings(true); return; }
    if (selectedStudents.length === 0) { setError('Select at least one student'); return; }
    if (creditBalance.remaining_credits < selectedStudents.length) { setError(`Insufficient credits. Need ${selectedStudents.length}, have ${creditBalance.remaining_credits}.`); return; }
    setIsSending(true); setSmsProgress(0);
    try {
      const messages: SmsMessage[] = [];
      for (const sid of selectedStudents) {
        const student = students.find(s => s.id.toString() === sid);
        if (!student?.parent_guardian_phone) continue;
        messages.push({ recipient: { phoneNumber: student.parent_guardian_phone, studentName: student.full_name, studentId: student.id.toString(), parentName: student.parent_guardian_name }, message: generateMessage(student) });
      }
      if (messages.length === 0) { setError('No valid phone numbers'); setIsSending(false); return; }
      const results = await sendBulkSms(messages, (c: number, t: number) => setSmsProgress(Math.round((c / t) * 100)));
      try { await SmsCreditsAPI.recordUsage({ recipient_count: messages.length, successful_count: results.totalSent, failed_count: results.totalFailed, message_type: 'term_summary' }); fetchBalance(); } catch {}
      if (results.totalSent > 0) setSuccess(`Successfully sent ${results.totalSent} SMS!`);
      if (results.totalFailed > 0) setError(`Failed to send ${results.totalFailed} messages`);
    } catch { setError('Failed to send SMS'); } finally { setIsSending(false); setSmsProgress(100); }
  };

  /* ── Preview ── */
  const previewMessage = studentResults.size > 0
    ? generateMessage(students.find(s => studentResults.has(s.id.toString())) || students[0])
    : `Dear Parent/Guardian,\n\nGreetings from ${schoolInfo?.name || 'School'}.\n\nTerm ${selectedTerm}, ${selectedYear} Summary:\n\nName: [Student Name]\nAdm: [Admission No]\n\n[Subject]: [Marks] ([Grade])\n...\n\nTotal: [X] | Mean: [X]% | Grade: [X]\nPosition: [X] of [X]\n\n${schoolInfo?.name || 'School'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/messaging/parent')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="p-2 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Term Summary SMS</h1>
                <p className="text-xs text-slate-400">Step {step === 'filter' ? '1: Filter & preview' : '2: Select students'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && <Notification type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <Notification type="success" message={success} onDismiss={() => setSuccess(null)} />}
        <CreditStatsBar creditBalance={creditBalance} creditStats={creditStats} onTopUp={() => setShowTopUp(true)} />

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('filter')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${step === 'filter' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">1</span>Filters & Template
          </button>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <button onClick={() => setStep('select')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${step === 'select' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${step === 'select' ? 'bg-amber-600 text-white' : 'bg-slate-300 text-white'}`}>2</span>Select Students
          </button>
        </div>

        {step === 'filter' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </h3>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Class</label>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudents([]); }} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white">
                  <option value="all">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Academic Year</label>
                  <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Term</label>
                  <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white">
                    <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
                  </select>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
                ℹ Term summary combines <strong>all exam types</strong> ({examTypes.length} exams) into one report.
              </div>
              {fetchingResults && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-amber-600" />
                  Fetching results for all exams...
                </div>
              )}
              {studentResults.size > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-700">
                  ✓ Found results for <strong>{studentResults.size}</strong> of {students.length} students
                </div>
              )}
            </div>

            {/* Template preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Message Preview
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed max-h-[340px] overflow-y-auto">
                {previewMessage}
              </div>
              <p className="text-[11px] text-slate-400">Each student gets a personalized term summary with results from all exams.</p>
              <div className="flex justify-end">
                <button onClick={() => setStep('select')} className="px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 flex items-center gap-2">
                  Next: Select Students <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Select Students (parents will receive term summary)</h3>
                <p className="text-[11px] text-slate-400">{filteredStudents.length} students · {selectedStudents.length} selected · {studentResults.size} have results</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={selectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Select All</button>
                <button onClick={deselectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Clear</button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by name or adm number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600" /></div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">No students found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left w-10"><input type="checkbox" checked={selectedStudents.length === filteredStudents.filter(s => s.parent_guardian_phone).length && selectedStudents.length > 0} onChange={e => e.target.checked ? selectAll() : deselectAll()} className="w-3.5 h-3.5 text-amber-600 rounded" /></th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Student</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Adm No</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase hidden sm:table-cell">Phone</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map(s => {
                      const res = studentResults.get(s.id.toString());
                      const hasPhone = !!s.parent_guardian_phone;
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50 ${!hasPhone ? 'opacity-40' : ''}`}>
                          <td className="px-4 py-2.5"><input type="checkbox" checked={selectedStudents.includes(s.id.toString())} onChange={() => toggleStudent(s.id.toString())} disabled={!hasPhone} className="w-3.5 h-3.5 text-amber-600 rounded" /></td>
                          <td className="px-4 py-2.5">
                            <p className="text-sm font-medium text-slate-700">{s.full_name}</p>
                            <p className="text-xs text-slate-400 sm:hidden">{s.admission_number}</p>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-500 hidden sm:table-cell">{s.admission_number}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">{hasPhone ? s.parent_guardian_phone : <span className="text-red-400">No phone</span>}</td>
                          <td className="px-4 py-2.5">
                            {res ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${res.average >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {res.average.toFixed(0)}% <span className="text-[10px] opacity-60">{res.grade}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Send bar */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{selectedStudents.length} parent{selectedStudents.length !== 1 ? 's' : ''} will receive term summary</p>
                  <p className="text-[11px] text-slate-400">Cost: {selectedStudents.length} SMS · {creditBalance.remaining_credits.toLocaleString()} credits remaining</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('filter')} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">← Back</button>
                  <button onClick={handleSend} disabled={isSending || selectedStudents.length === 0} className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${isSending || selectedStudents.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-amber-600 text-white hover:bg-amber-700 shadow-md'}`}>
                    {isSending ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Sending...</> : 'Send Summary'}
                  </button>
                </div>
              </div>
              {isSending && <div className="mt-3"><div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${smsProgress}%` }} /></div></div>}
            </div>
          </div>
        )}
      </div>

      <TopUpModal show={showTopUp} onClose={() => setShowTopUp(false)} packages={packages} pricePerSms={pricePerSms} onCreditsPurchased={fetchBalance} />
      <SmsSettingsModal show={showSettings} onClose={() => setShowSettings(false)} onSaved={() => setSuccess('SMS settings saved!')} />
    </div>
  );
};

export default ParentTermSummary;
