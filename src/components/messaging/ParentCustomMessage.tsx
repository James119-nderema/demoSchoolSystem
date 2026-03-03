/**
 * ParentCustomMessage — Write custom message → select students whose parents receive → send
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataAPI, MarksAPI, SmsCreditsAPI } from '../../services/baseUrl';
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
import type { StudentOption, ClassOption } from './types';

const ParentCustomMessage: React.FC = () => {
  const navigate = useNavigate();
  const { creditBalance, creditStats, packages, pricePerSms, fetchBalance } = useSmsCredits();

  const [step, setStep] = useState<'compose' | 'select'>('compose');
  const [customMessage, setCustomMessage] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    DataAPI.getClasses({ show_all: 'true' }).then(res => {
      const raw = res.results || res || [];
      setClasses(raw.map((c: any) => ({ id: c.id, name: c.class_name || c.name || 'Unknown', class_name: c.class_name })));
    }).catch(() => setError('Failed to fetch classes'));
  }, []);

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

  const filteredStudents = students.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.admission_number?.toLowerCase().includes(q);
  });

  const toggleStudent = (id: string) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedStudents(filteredStudents.filter(s => s.parent_guardian_phone).map(s => s.id.toString()));
  const deselectAll = () => setSelectedStudents([]);

  const handleSend = async () => {
    if (!isSmsConfigured()) { setError('SMS not configured.'); setShowSettings(true); return; }
    if (selectedStudents.length === 0) { setError('Select at least one student'); return; }
    if (!customMessage.trim()) { setError('Enter a message'); return; }
    if (creditBalance.remaining_credits < selectedStudents.length) { setError(`Insufficient credits. Need ${selectedStudents.length}, have ${creditBalance.remaining_credits}.`); return; }

    setIsSending(true); setSmsProgress(0);
    try {
      const messages: SmsMessage[] = [];
      for (const sid of selectedStudents) {
        const student = students.find(s => s.id.toString() === sid);
        if (!student?.parent_guardian_phone) continue;
        const msg = customMessage
          .replace(/{studentName}/g, student.full_name)
          .replace(/{parentName}/g, student.parent_guardian_name || 'Parent')
          .replace(/{admissionNumber}/g, student.admission_number)
          .replace(/{className}/g, student.current_class || '');
        messages.push({ recipient: { phoneNumber: student.parent_guardian_phone, studentName: student.full_name, studentId: student.id.toString(), parentName: student.parent_guardian_name }, message: msg });
      }
      if (messages.length === 0) { setError('No valid phone numbers'); setIsSending(false); return; }

      const results = await sendBulkSms(messages, (c: number, t: number) => setSmsProgress(Math.round((c / t) * 100)));
      try { await SmsCreditsAPI.recordUsage({ recipient_count: messages.length, successful_count: results.totalSent, failed_count: results.totalFailed, message_type: 'custom' }); fetchBalance(); } catch {}
      if (results.totalSent > 0) setSuccess(`Successfully sent ${results.totalSent} SMS!`);
      if (results.totalFailed > 0) setError(`Failed to send ${results.totalFailed} messages`);
    } catch { setError('Failed to send SMS'); } finally { setIsSending(false); setSmsProgress(100); }
  };

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
              <div className="p-2 bg-purple-50 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Custom Parent Message</h1>
                <p className="text-xs text-slate-400">Step {step === 'compose' ? '1: Write message' : '2: Select students'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && <Notification type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <Notification type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <CreditStatsBar creditBalance={creditBalance} creditStats={creditStats} onTopUp={() => setShowTopUp(true)} />

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('compose')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${step === 'compose' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">1</span>Write Message
          </button>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <button onClick={() => { if (customMessage.trim()) setStep('select'); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${step === 'select' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${step === 'select' ? 'bg-purple-600 text-white' : 'bg-slate-300 text-white'}`}>2</span>Select Students
          </button>
        </div>

        {step === 'compose' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Write your message to parents</h3>
            <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} rows={6} className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500" placeholder={"Dear {parentName},\n\nYour message here...\n\nPlaceholders: {studentName}, {parentName}, {admissionNumber}, {className}"} />
            <p className="text-xs text-slate-400 mt-2">{customMessage.length} characters</p>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { if (customMessage.trim()) setStep('select'); else setError('Write a message first'); }} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 flex items-center gap-2">
                Next: Select Students <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Class filter */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudents([]); }} className="text-sm text-slate-700 px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>
            </div>
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Select Students (parents will receive the SMS)</h3>
                <p className="text-[11px] text-slate-400">{filteredStudents.length} students · {selectedStudents.length} selected</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={selectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Select All</button>
                <button onClick={deselectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Clear</button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by name or adm number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600" /></div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">No students found</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredStudents.map(s => {
                    const hasPhone = !!s.parent_guardian_phone;
                    return (
                      <div key={s.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 ${!hasPhone ? 'opacity-40' : ''}`}>
                        <input type="checkbox" checked={selectedStudents.includes(s.id.toString())} onChange={() => toggleStudent(s.id.toString())} disabled={!hasPhone} className="w-4 h-4 text-purple-600 rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{s.full_name}</p>
                          <p className="text-xs text-slate-400">Adm: {s.admission_number} · {s.current_class || 'N/A'}</p>
                        </div>
                        <span className="text-xs text-slate-400">{hasPhone ? s.parent_guardian_phone : <span className="text-red-400">No phone</span>}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send bar */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{selectedStudents.length} parent{selectedStudents.length !== 1 ? 's' : ''} will receive SMS</p>
                  <p className="text-[11px] text-slate-400">Cost: {selectedStudents.length} SMS · {creditBalance.remaining_credits.toLocaleString()} credits remaining</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('compose')} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">← Back</button>
                  <button onClick={handleSend} disabled={isSending || selectedStudents.length === 0} className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${isSending || selectedStudents.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'}`}>
                    {isSending ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Sending...</> : 'Send SMS'}
                  </button>
                </div>
              </div>
              {isSending && <div className="mt-3"><div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${smsProgress}%` }} /></div></div>}
            </div>
          </div>
        )}
      </div>

      <TopUpModal show={showTopUp} onClose={() => setShowTopUp(false)} packages={packages} pricePerSms={pricePerSms} onCreditsPurchased={fetchBalance} />
      <SmsSettingsModal show={showSettings} onClose={() => setShowSettings(false)} onSaved={() => setSuccess('SMS settings saved!')} />
    </div>
  );
};

export default ParentCustomMessage;
