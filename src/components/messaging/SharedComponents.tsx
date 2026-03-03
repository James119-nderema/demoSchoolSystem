/**
 * Shared SMS UI components — Credit bar, Top-up modal, Settings modal, Notifications
 */
import React, { useState, useCallback, useEffect } from 'react';
import { SmsCreditsAPI } from '../../services/baseUrl';
import {
  saveSmsSettings,
  getSmsSettings,
} from '../../services/smsService';
import type { CreditBalance, CreditStats, TopUpPackage } from './types';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   useSmsCredits — shared hook
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function useSmsCredits() {
  const [creditBalance, setCreditBalance] = useState<CreditBalance>({ total_credits: 5000, used_credits: 0, remaining_credits: 5000 });
  const [creditStats, setCreditStats] = useState<CreditStats>({ total_sent: 0, total_failed: 0, total_sessions: 0 });
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [pricePerSms, setPricePerSms] = useState(0.25);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await SmsCreditsAPI.getBalance();
      if (res.balance) setCreditBalance(res.balance);
      if (res.stats) setCreditStats(res.stats);
      if (res.packages) setPackages(res.packages);
      if (res.price_per_sms) setPricePerSms(parseFloat(res.price_per_sms));
    } catch { /* defaults */ }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return { creditBalance, creditStats, packages, pricePerSms, fetchBalance };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CreditStatsBar
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const CreditStatsBar: React.FC<{
  creditBalance: CreditBalance;
  creditStats: CreditStats;
  onTopUp: () => void;
}> = ({ creditBalance, creditStats, onTopUp }) => {
  const creditPct = creditBalance.total_credits > 0 ? Math.round((creditBalance.remaining_credits / creditBalance.total_credits) * 100) : 0;
  const barColor = creditPct > 50 ? 'bg-emerald-500' : creditPct > 20 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Remaining</span>
        <p className="text-xl font-bold text-slate-800 mt-1">{creditBalance.remaining_credits.toLocaleString()}</p>
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span>{creditPct}%</span><span>{creditBalance.total_credits.toLocaleString()} total</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1"><div className={`h-1 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${creditPct}%` }} /></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sent</span>
        <p className="text-xl font-bold text-slate-800 mt-1">{creditStats.total_sent.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">Delivered</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Failed</span>
        <p className="text-xl font-bold text-slate-800 mt-1">{creditStats.total_failed.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">Failures</p>
      </div>
      <button onClick={onTopUp} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-left hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200/50">
        <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Top Up</span>
        <p className="text-xl font-bold text-white mt-1">Buy SMS</p>
        <p className="text-[10px] text-indigo-200">From KSH 0.25/SMS</p>
      </button>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TopUpModal
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const TopUpModal: React.FC<{
  show: boolean;
  onClose: () => void;
  packages: TopUpPackage[];
  pricePerSms: number;
  onCreditsPurchased: () => void;
}> = ({ show, onClose, packages, pricePerSms, onCreditsPurchased }) => {
  const [step, setStep] = useState<'package' | 'payment' | 'mpesa' | 'bank' | 'processing' | 'done'>('package');
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);
  const [customSmsCount, setCustomSmsCount] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [bankTransactionId, setBankTransactionId] = useState('');
  const [currentTopUpId, setCurrentTopUpId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (show) { setStep('package'); setSelectedPackage(null); setCustomSmsCount(''); setMpesaPhone(''); setSelectedBank(''); setBankTransactionId(''); setBankDetails(null); setError(null); setSuccess(null); }
  }, [show]);

  if (!show) return null;
  const computeCustomAmount = () => { const n = parseInt(customSmsCount); return isNaN(n) || n <= 0 ? 0 : Math.ceil(n * pricePerSms); };

  const handleSelectPackage = (pkg: TopUpPackage) => { setSelectedPackage(pkg); setStep('payment'); };
  const handleSelectCustom = () => {
    const n = parseInt(customSmsCount);
    if (isNaN(n) || n <= 0) { setError('Enter a valid SMS count'); return; }
    setSelectedPackage({ sms_count: n, amount: computeCustomAmount(), label: `${n.toLocaleString()} SMS` });
    setStep('payment');
  };

  const handlePaymentMethodSelect = async (method: 'MPESA' | 'BANK') => {
    if (method === 'MPESA') setStep('mpesa');
    else {
      try { const res = await SmsCreditsAPI.getBankDetails(); setBankDetails(res.banks || {}); } catch { /* empty */ }
      setStep('bank');
    }
  };

  const handleMpesaPay = async () => {
    if (!mpesaPhone.trim() || !selectedPackage) return;
    setProcessing(true);
    try {
      const res = await SmsCreditsAPI.initiateTopUp({ sms_count: selectedPackage.sms_count, amount: selectedPackage.amount, payment_method: 'MPESA', mpesa_phone: mpesaPhone });
      setCurrentTopUpId(res.topup?.id || '');
      setStep('processing');
      setSuccess('STK push sent. Complete payment on your phone.');
      const poll = setInterval(async () => {
        try {
          const st = await SmsCreditsAPI.checkTopUpStatus(res.topup?.id);
          if (st.topup?.status === 'SUCCESS') { clearInterval(poll); setStep('done'); onCreditsPurchased(); setSuccess(`${selectedPackage.sms_count.toLocaleString()} SMS credits added!`); }
          else if (st.topup?.status === 'FAILED') { clearInterval(poll); setStep('done'); setError(st.topup?.status_message || 'Payment failed'); }
        } catch { /* keep polling */ }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120000);
    } catch (e: any) { setError(e?.message || 'M-Pesa payment failed'); } finally { setProcessing(false); }
  };

  const handleBankSubmit = async () => {
    if (!bankTransactionId.trim() || !selectedPackage) return;
    setProcessing(true);
    try {
      if (!currentTopUpId) {
        const res = await SmsCreditsAPI.initiateTopUp({ sms_count: selectedPackage.sms_count, amount: selectedPackage.amount, payment_method: 'BANK', bank_name: selectedBank });
        setCurrentTopUpId(res.topup?.id || '');
        await SmsCreditsAPI.verifyBankTransfer({ topup_id: res.topup?.id, bank_transaction_id: bankTransactionId });
      } else {
        await SmsCreditsAPI.verifyBankTransfer({ topup_id: currentTopUpId, bank_transaction_id: bankTransactionId });
      }
      setStep('done');
      setSuccess('Transaction ID submitted for verification. Credits will be added once confirmed.');
    } catch (e: any) { setError(e?.message || 'Failed to submit'); } finally { setProcessing(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Buy SMS Credits</h2>
            <p className="text-xs text-slate-400">
              {step === 'package' && 'Choose a package'}{step === 'payment' && 'Select payment method'}
              {step === 'mpesa' && 'M-Pesa payment'}{step === 'bank' && 'Bank transfer'}
              {step === 'processing' && 'Processing payment'}{step === 'done' && 'Complete'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm">{success}</div>}

          {step === 'package' && (
            <>
              <div className="space-y-2">
                {packages.map(pkg => (
                  <button key={pkg.sms_count} onClick={() => handleSelectPackage(pkg)} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left">
                    <div><p className="text-sm font-semibold text-slate-700">{pkg.label}</p><p className="text-xs text-slate-400">KSH {pkg.amount.toLocaleString()}</p></div>
                    <div className="text-right"><p className="text-lg font-bold text-indigo-600">KSH {pkg.amount.toLocaleString()}</p><p className="text-[11px] text-slate-400">KSH {(pkg.amount / pkg.sms_count).toFixed(2)}/SMS</p></div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Custom Amount</p>
                <div className="flex gap-2">
                  <input type="number" value={customSmsCount} onChange={e => setCustomSmsCount(e.target.value)} placeholder="Number of SMS" className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={handleSelectCustom} disabled={!customSmsCount || parseInt(customSmsCount) <= 0} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400">Buy</button>
                </div>
                {customSmsCount && parseInt(customSmsCount) > 0 && <p className="text-xs text-slate-400 mt-1">Cost: KSH {computeCustomAmount().toLocaleString()}</p>}
              </div>
            </>
          )}

          {step === 'payment' && selectedPackage && (
            <>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-sm text-indigo-600 font-medium">{selectedPackage.label}</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">KSH {selectedPackage.amount.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handlePaymentMethodSelect('MPESA')} className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50/50 transition-all">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                  <span className="text-sm font-semibold text-slate-700">M-Pesa</span>
                </button>
                <button onClick={() => handlePaymentMethodSelect('BANK')} className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                  <span className="text-sm font-semibold text-slate-700">Bank Transfer</span>
                </button>
              </div>
              <button onClick={() => setStep('package')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-2">← Back</button>
            </>
          )}

          {step === 'mpesa' && selectedPackage && (
            <>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-600 font-medium">M-Pesa — KSH {selectedPackage.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone Number</label>
                <input type="tel" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} placeholder="e.g. 0712345678" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500" />
              </div>
              <button onClick={handleMpesaPay} disabled={processing || !mpesaPhone.trim()} className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2">
                {processing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Processing...</> : 'Pay with M-Pesa'}
              </button>
              <button onClick={() => setStep('payment')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">← Back</button>
            </>
          )}

          {step === 'bank' && selectedPackage && (
            <>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">Bank Transfer — KSH {selectedPackage.amount.toLocaleString()}</p>
              </div>
              <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">Choose a bank...</option>
                {bankDetails && Object.entries(bankDetails).map(([key, info]: [string, any]) => (<option key={key} value={key}>{info.name}</option>))}
              </select>
              {selectedBank && bankDetails?.[selectedBank] && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Account:</span><span className="font-medium">{bankDetails[selectedBank].account_number}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Name:</span><span className="font-medium">{bankDetails[selectedBank].account_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Amount:</span><span className="font-bold text-indigo-600">KSH {selectedPackage.amount.toLocaleString()}</span></div>
                </div>
              )}
              <input type="text" value={bankTransactionId} onChange={e => setBankTransactionId(e.target.value)} placeholder="Bank transaction reference" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg" />
              <button onClick={handleBankSubmit} disabled={processing || !bankTransactionId.trim() || !selectedBank} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2">
                {processing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Submitting...</> : 'Submit for Verification'}
              </button>
              <button onClick={() => setStep('payment')} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">← Back</button>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700">Processing your payment...</p>
              <p className="text-xs text-slate-400 mt-1">Complete the M-Pesa payment on your phone</p>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Request Submitted!</p>
              <button onClick={() => { onClose(); onCreditsPurchased(); }} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SmsSettingsModal
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const SmsSettingsModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ show, onClose, onSaved }) => {
  const saved = getSmsSettings();
  const [form, setForm] = useState({ apiToken: saved?.apiToken || '', senderId: saved?.senderId || '' });

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Ping Africa SMS Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">Configure your <span className="font-semibold text-slate-700">Ping Africa</span> API credentials.</p>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">API Token (Bearer)</label>
            <input type="password" value={form.apiToken} onChange={e => setForm(p => ({ ...p, apiToken: e.target.value }))} placeholder="Paste your API token" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Sender ID</label>
            <input type="text" value={form.senderId} onChange={e => setForm(p => ({ ...p, senderId: e.target.value.slice(0, 11) }))} placeholder="e.g., SchoolSMS" maxLength={11} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={() => { saveSmsSettings(form); onClose(); onSaved(); }} disabled={!form.apiToken.trim()} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Notification bar
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const Notification: React.FC<{ type: 'error' | 'success'; message: string; onDismiss: () => void }> = ({ type, message, onDismiss }) => {
  const isError = type === 'error';
  return (
    <div className={`${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} border px-4 py-3 rounded-xl flex justify-between items-center`}>
      <span className="text-sm">{message}</span>
      <button onClick={onDismiss} className={`${isError ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-emerald-600'}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

// Shared PageHeader component
export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  backTo?: string;
  onSettingsClick?: () => void;
}> = ({ title, subtitle, backTo, onSettingsClick }) => {
  // We rely on the caller to wrap with useNavigate
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {backTo && (
              <a href={backTo} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </a>
            )}
            <div className="p-2 bg-indigo-50 rounded-xl">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{title}</h1>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {onSettingsClick && (
            <button onClick={onSettingsClick} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="SMS Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
