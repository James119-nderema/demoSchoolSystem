/**
 * MessagingHub — First page: Two cards (Staff, Parent) + Credit stats + Top-up
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmsCreditsAPI } from '../../services/baseUrl';
import { isSmsConfigured } from '../../services/smsService';
import {
  useSmsCredits,
  CreditStatsBar,
  TopUpModal,
  SmsSettingsModal,
  Notification,
} from './SharedComponents';

const MessagingHub: React.FC = () => {
  const navigate = useNavigate();
  const { creditBalance, creditStats, packages, pricePerSms, fetchBalance } = useSmsCredits();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // History state
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'topup-history'>('home');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topUpHistory, setTopUpHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'history') {
      SmsCreditsAPI.getTransactions({ limit: '50', offset: '0' }).then(r => setTransactions(r.transactions || [])).catch(() => {});
    }
    if (activeTab === 'topup-history') {
      SmsCreditsAPI.getTopUpHistory({ limit: '50', offset: '0' }).then(r => setTopUpHistory(r.topups || [])).catch(() => {});
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="SMS Settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notifications */}
        {error && <Notification type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <Notification type="success" message={success} onDismiss={() => setSuccess(null)} />}

        {/* SMS Config Warning */}
        {!isSmsConfigured() && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <div className="flex-1"><p className="text-sm font-medium text-amber-800">SMS Not Configured</p><p className="text-xs text-amber-600">Configure your Ping Africa API token to start sending messages.</p></div>
            <button onClick={() => setShowSettings(true)} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium">Configure</button>
          </div>
        )}

        {/* Credit Stats */}
        <CreditStatsBar creditBalance={creditBalance} creditStats={creditStats} onTopUp={() => setShowTopUp(true)} />

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { key: 'home' as const, label: 'Send Message' },
              { key: 'history' as const, label: 'SMS History' },
              { key: 'topup-history' as const, label: 'Top-Up History' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'home' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Who do you want to message?</h2>
              <p className="text-sm text-slate-400 mb-6">Choose the recipient type to get started</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                {/* Staff Card */}
                <button
                  onClick={() => navigate('/messaging/staff')}
                  className="group relative bg-white rounded-2xl border-2 border-slate-200 p-6 text-left hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Staff</h3>
                      <p className="text-sm text-slate-400">Send messages to staff members</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Write a custom message and select which staff members should receive it.</p>
                  <div className="absolute top-6 right-6 text-slate-300 group-hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>

                {/* Parent Card */}
                <button
                  onClick={() => navigate('/messaging/parent')}
                  className="group relative bg-white rounded-2xl border-2 border-slate-200 p-6 text-left hover:border-emerald-400 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Parents</h3>
                      <p className="text-sm text-slate-400">Send messages to parents/guardians</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Custom messages, exam results, or term summaries sent to parents via their students.</p>
                  <div className="absolute top-6 right-6 text-slate-300 group-hover:text-emerald-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* SMS History */}
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
                          <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Top-Up History */}
          {activeTab === 'topup-history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Top-Up History</h3>
                <button onClick={() => setShowTopUp(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">+ Buy SMS Credits</button>
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

      {/* Modals */}
      <TopUpModal show={showTopUp} onClose={() => setShowTopUp(false)} packages={packages} pricePerSms={pricePerSms} onCreditsPurchased={fetchBalance} />
      <SmsSettingsModal show={showSettings} onClose={() => setShowSettings(false)} onSaved={() => setSuccess('SMS settings saved!')} />
    </div>
  );
};

export default MessagingHub;
