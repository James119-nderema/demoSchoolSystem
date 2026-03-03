/**
 * StaffMessage — Write custom message → select staff → send
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataAPI, SmsCreditsAPI } from '../../services/baseUrl';
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
import type { StaffOption } from './types';

const StaffMessage: React.FC = () => {
  const navigate = useNavigate();
  const { creditBalance, creditStats, packages, pricePerSms, fetchBalance } = useSmsCredits();

  const [step, setStep] = useState<'compose' | 'select'>('compose');
  const [customMessage, setCustomMessage] = useState('');
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const res = await DataAPI.getStaff({ page_size: '500' });
        const raw = res.results || res || [];
        setStaff(raw.filter((s: any) => s.is_active !== false).map((s: any) => {
          // Handle both separate first/last name and combined full_name
          let firstName = s.first_name || '';
          let lastName = s.last_name || '';
          if (!firstName && s.full_name) {
            const parts = s.full_name.trim().split(/\s+/);
            firstName = parts[0] || '';
            lastName = parts.slice(1).join(' ') || '';
          }
          return {
            id: s.id?.toString(),
            first_name: firstName,
            last_name: lastName,
            phone_number: s.phone_number || '',
            email: s.email || '',
            role: s.role || 'TEACHER',
            is_active: s.is_active !== false,
          };
        }));
      } catch { setError('Failed to fetch staff'); }
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(q) || s.phone_number.includes(q) || s.email?.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  const toggleStaff = (id: string) => setSelectedStaff(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedStaff(filteredStaff.filter(s => s.phone_number).map(s => s.id));
  const deselectAll = () => setSelectedStaff([]);

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = { TEACHER: 'Teacher', CLASS_TEACHER: 'Class Teacher', HOD: 'HOD', DIRECTOR_OF_STUDIES: 'D.O.S', BURSAR: 'Bursar', ADMINISTRATIVE_STAFF: 'Admin' };
    return map[role] || role;
  };

  const handleSend = async () => {
    if (!isSmsConfigured()) { setError('SMS not configured. Click Settings to add your API token.'); setShowSettings(true); return; }
    if (selectedStaff.length === 0) { setError('Select at least one staff member'); return; }
    if (!customMessage.trim()) { setError('Enter a message'); return; }
    if (creditBalance.remaining_credits < selectedStaff.length) { setError(`Insufficient credits. Need ${selectedStaff.length}, have ${creditBalance.remaining_credits}.`); return; }

    setIsSending(true);
    setSmsProgress(0);
    try {
      const messages: SmsMessage[] = [];
      for (const sid of selectedStaff) {
        const member = staff.find(s => s.id === sid);
        if (!member?.phone_number) continue;
        const personalised = customMessage
          .replace(/{staffName}/g, `${member.first_name} ${member.last_name}`.trim())
          .replace(/{firstName}/g, member.first_name)
          .replace(/{lastName}/g, member.last_name)
          .replace(/{role}/g, getRoleLabel(member.role));
        messages.push({
          recipient: { phoneNumber: member.phone_number, studentName: `${member.first_name} ${member.last_name}`, studentId: member.id, parentName: '' },
          message: personalised,
        });
      }
      if (messages.length === 0) { setError('No valid phone numbers'); setIsSending(false); return; }

      const results = await sendBulkSms(messages, (c: number, t: number) => setSmsProgress(Math.round((c / t) * 100)));
      try {
        await SmsCreditsAPI.recordUsage({ recipient_count: messages.length, successful_count: results.totalSent, failed_count: results.totalFailed, message_type: 'staff_custom' });
        fetchBalance();
      } catch { /* non-critical */ }

      if (results.totalSent > 0) setSuccess(`Successfully sent ${results.totalSent} SMS to staff!`);
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
              <button onClick={() => navigate('/messaging')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="p-2 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Message Staff</h1>
                <p className="text-xs text-slate-400">Step {step === 'compose' ? '1: Write message' : '2: Select recipients'}</p>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="SMS Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && <Notification type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <Notification type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <CreditStatsBar creditBalance={creditBalance} creditStats={creditStats} onTopUp={() => setShowTopUp(true)} />

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <button onClick={() => setStep('compose')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === 'compose' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
            Write Message
          </button>
          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <button onClick={() => { if (customMessage.trim()) setStep('select'); else setError('Write a message first'); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${step === 'select' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${step === 'select' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'}`}>2</span>
            Select Staff
          </button>
        </div>

        {/* STEP 1: Compose */}
        {step === 'compose' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Write your message</h3>
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              rows={6}
              className="w-full text-sm px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={"Write your message here...\n\nPlaceholders: {staffName}, {firstName}, {lastName}, {role}"}
            />
            <p className="text-xs text-slate-400 mt-2">{customMessage.length} characters · ~{Math.ceil(customMessage.length / 160) || 1} SMS per recipient</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { if (customMessage.trim()) setStep('select'); else setError('Write a message first'); }}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2"
              >
                Next: Select Staff
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select staff */}
        {step === 'select' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Select Staff Recipients</h3>
                <p className="text-[11px] text-slate-400">{filteredStaff.length} staff members · {selectedStaff.length} selected</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={selectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Select All</button>
                <button onClick={deselectAll} className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Clear</button>
              </div>
            </div>
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search staff by name, phone, or role..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" /></div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">No staff found</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredStaff.map(s => {
                    const hasPhone = !!s.phone_number;
                    return (
                      <div key={s.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!hasPhone ? 'opacity-40' : ''}`}>
                        <input type="checkbox" checked={selectedStaff.includes(s.id)} onChange={() => toggleStaff(s.id)} disabled={!hasPhone} className="w-4 h-4 text-blue-600 rounded" />
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-slate-400">{hasPhone ? s.phone_number : 'No phone'}</p>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{getRoleLabel(s.role)}</span>
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
                  <p className="text-sm font-semibold text-slate-700">{selectedStaff.length} recipient{selectedStaff.length !== 1 ? 's' : ''} selected</p>
                  <p className="text-[11px] text-slate-400">Cost: {selectedStaff.length} SMS · {creditBalance.remaining_credits.toLocaleString()} credits remaining</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('compose')} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">← Back</button>
                  <button onClick={handleSend} disabled={isSending || selectedStaff.length === 0} className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${isSending || selectedStaff.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200/50'}`}>
                    {isSending ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Sending...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Send SMS</>}
                  </button>
                </div>
              </div>
              {isSending && (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${smsProgress}%` }} /></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TopUpModal show={showTopUp} onClose={() => setShowTopUp(false)} packages={packages} pricePerSms={pricePerSms} onCreditsPurchased={fetchBalance} />
      <SmsSettingsModal show={showSettings} onClose={() => setShowSettings(false)} onSaved={() => setSuccess('SMS settings saved!')} />
    </div>
  );
};

export default StaffMessage;
