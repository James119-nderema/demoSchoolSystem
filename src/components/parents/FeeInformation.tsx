// FeeInformation.tsx
// Tanzania GePG-aware parent fee information page.
// For Tanzania schools: shows GePG control number, payment channel instructions,
// and real-time payment history fetched from the backend.
// For non-Tanzania schools: shows generic payment mode instructions.

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/*interfacgite FeeSummary {
  total_fees: number;
  total_paid: number;
  balance: number;
}*/

interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  invoice_number: string;
  type: 'invoice' | 'payment';
  debit: number | null;
  credit: number | null;
  payment_method?: string;
}

interface PaymentHistoryResponse {
  student_name: string;
  student_id: string;
  history: PaymentHistoryItem[];
  stats: {
    total_invoiced: number;
    total_paid: number;
    total_balance: number;
  };
}

interface GePGTransaction {
  id: string;
  gepg_trx_id: string;
  control_number: string;
  paid_amount: number;
  currency: string;
  payment_channel: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  tran_status: string;
  payment_date: string;
}

interface GePGBillStatus {
  invoice_student_id: string;
  student_name: string;
  admission_number: string;
  bill_reference: string | null;
  control_number: string | null;
  status: string | null;
  bill_amount: number | null;
  total_paid: number;
  balance: number;
  currency: string | null;
  expiry_date: string | null;
  gepg_configured: boolean;
  transactions: GePGTransaction[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getParentToken(): string | null {
  return localStorage.getItem('parent_access_token');
}

function getSchoolCountry(): string {
  try {
    const raw = localStorage.getItem('parent_info');
    if (raw) {
      const info = JSON.parse(raw);
      if (info.school_country) return info.school_country;
    }
  } catch {
    // ignore
  }
  return '';
}

function isTanzania(country: string): boolean {
  return country.toLowerCase().includes('tanzania') || country.toLowerCase() === 'tz';
}

function formatCurrency(amount: number | null, currency?: string): string {
  if (amount === null || amount === undefined) return '-';
  const curr = currency || 'TZS';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function gepgStatusColor(status: string | null): string {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
    case 'ACTIVE': return 'bg-blue-100 text-blue-800';
    case 'PENDING': return 'bg-gray-100 text-gray-700';
    case 'FAILED': return 'bg-red-100 text-red-800';
    case 'EXPIRED': return 'bg-orange-100 text-orange-800';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}

// ---------------------------------------------------------------------------
// GePG Payment Channel Instructions
// TODO: Verify exact menu steps against current official NMB/CRDB/M-Pesa/GePG documentation
// ---------------------------------------------------------------------------

const GEPG_CHANNEL_INSTRUCTIONS: Record<string, { title: string; steps: string[] }> = {
  NMB: {
    title: 'NMB Bank',
    steps: [
      '1. Visit any NMB Bank branch or use the NMB Mobile banking app.',
      '2. Select Government Payments / GePG.',
      '3. Enter Control Number: {control_number}',
      '4. Verify bill details carefully.',
      '5. Enter amount (full or partial if permitted).',
      '6. Confirm and keep your receipt.',
    ],
  },
  CRDB: {
    title: 'CRDB Bank',
    steps: [
      '1. Open CRDB SimBanking app or visit any CRDB branch.',
      '2. Select Pay Bills / Government Payments.',
      '3. Enter Control Number: {control_number}',
      '4. Confirm details and pay.',
      '5. Save your transaction reference.',
    ],
  },
  NBC: {
    title: 'NBC Bank',
    steps: [
      '1. Use NBC Mobile app or visit any NBC branch.',
      '2. Select GePG / Government Payments.',
      '3. Enter Control Number: {control_number}',
      '4. Enter amount and confirm.',
    ],
  },
  'M-Pesa': {
    title: 'M-Pesa',
    steps: [
      '1. Open M-Pesa menu on your phone.',
      '2. Select Lipa / Pay Bill.',
      '3. Select Government (GePG).',
      '4. Enter Control Number: {control_number}',
      '5. Enter amount.',
      '6. Enter your M-Pesa PIN. Do NOT share your PIN with the school.',
    ],
  },
  'Airtel Money': {
    title: 'Airtel Money',
    steps: [
      '1. Dial *150*60# or open the Airtel Money app.',
      '2. Select Pay Bill.',
      '3. Select Government Payments.',
      '4. Enter Control Number: {control_number}',
      '5. Enter amount and PIN. Do NOT share your PIN.',
    ],
  },
  'Other Banks': {
    title: 'Other Banks',
    steps: [
      'Most Tanzania banks support GePG payments.',
      'Ask your bank teller for "GePG / Government Payment".',
      'Provide your Control Number: {control_number}',
    ],
  },
};

// Generic (non-Tanzania) payment instructions
const GENERIC_PAYMENT_MODES: Record<string, string[]> = {
  'M-PESA': [
    '1. Go to your M-PESA Menu',
    '2. Select "Lipa na M-PESA"',
    '3. Select "Pay Bill"',
    '4. Enter Business Number: (contact school for details)',
    '5. Enter Account Number: Your Admission Number',
    '6. Enter the amount',
    '7. Enter your M-PESA PIN',
    '8. Confirm the transaction.',
  ],
  'Airtel Money': [
    '1. Dial *334#',
    '2. Select "Pay Bill"',
    '3. Enter Business Number: (contact school for details)',
    '4. Enter Account Number: Your Admission Number',
    '5. Enter the amount',
    '6. Enter your Airtel Money PIN',
    '7. Confirm the transaction.',
  ],
  'Bank Transfer': [
    'Step 1: Contact the school bursar for bank account details.',
    'Step 2: Make a direct deposit or bank transfer.',
    'Step 3: Use your Admission Number as the reference.',
    'Step 4: Send proof of payment to the school.',
  ],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface GePGControlCardProps {
  billStatus: GePGBillStatus;
  onCopy: (text: string) => void;
  copied: boolean;
}

function GePGControlCard({ billStatus, onCopy, copied }: GePGControlCardProps) {
  const cn = billStatus.control_number;
  const currency = billStatus.currency || 'TZS';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-blue-900">GePG Payment Details</h3>
        {billStatus.status && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${gepgStatusColor(billStatus.status)}`}>
            {billStatus.status}
          </span>
        )}
      </div>

      {cn ? (
        <div className="bg-white border border-blue-300 rounded-lg p-4 mb-3">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Control Number</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono text-blue-900 tracking-widest">{cn}</span>
            <button
              onClick={() => onCopy(cn)}
              title="Copy control number"
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Use this number to pay via any Tanzania bank or mobile money</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-yellow-800">
            {billStatus.gepg_configured
              ? 'Control number is being generated. Please check back shortly.'
              : 'GePG payment is not yet configured for this school. Contact the school office.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Bill Amount</p>
          <p className="font-semibold text-gray-900 text-sm">{formatCurrency(billStatus.bill_amount, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Paid</p>
          <p className="font-semibold text-green-700 text-sm">{formatCurrency(billStatus.total_paid, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Balance</p>
          <p className={`font-semibold text-sm ${billStatus.balance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
            {formatCurrency(billStatus.balance, currency)}
          </p>
        </div>
      </div>

      {billStatus.expiry_date && (
        <p className="text-xs text-gray-500 mt-3 text-right">
          Bill expires: <span className="font-medium">{formatDate(billStatus.expiry_date)}</span>
        </p>
      )}
    </div>
  );
}

interface GePGChannelTabsProps {
  controlNumber: string | null;
}

function GePGChannelTabs({ controlNumber }: GePGChannelTabsProps) {
  const channels = Object.keys(GEPG_CHANNEL_INSTRUCTIONS);
  const [activeChannel, setActiveChannel] = useState(channels[0]);

  const info = GEPG_CHANNEL_INSTRUCTIONS[activeChannel];
  const cn = controlNumber || 'XXXXXXXXXX';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">How to Pay via GePG</h3>
        <p className="text-xs text-gray-500 mt-0.5">Select your bank or mobile money provider</p>
      </div>

      {/* Channel tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
        {channels.map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeChannel === ch
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="p-5">
        <h4 className="font-semibold text-gray-800 mb-3">{info.title}</h4>
        <ol className="space-y-2">
          {info.steps.map((step, i) => (
            <li key={i} className="text-sm text-gray-700">
              {step.replace('{control_number}', cn)}
            </li>
          ))}
        </ol>
        {controlNumber && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-medium text-blue-800">
              Your Control Number: <span className="font-mono text-blue-900 text-base">{controlNumber}</span>
            </p>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 italic">
          {/* TODO: Verify exact menu steps against current official NMB/CRDB/M-Pesa/GePG documentation */}
          Note: Menu steps may vary. Refer to your bank or mobile money app for exact navigation.
        </p>
      </div>
    </div>
  );
}

interface GenericPaymentModesProps {}

function GenericPaymentModes({}: GenericPaymentModesProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modes = Object.keys(GENERIC_PAYMENT_MODES);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">How to Pay</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {modes.map((mode) => (
              <button
                key={mode}
                onClick={() => { setSelectedMode(mode); setShowModal(true); }}
                className="p-4 rounded-lg border-2 border-gray-200 text-center hover:border-blue-400 hover:bg-blue-50 transition"
              >
                <span className="font-medium text-gray-700">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && selectedMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedMode} Instructions</h3>
              <button
                onClick={() => { setShowModal(false); setSelectedMode(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ol className="space-y-2">
              {GENERIC_PAYMENT_MODES[selectedMode].map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const FeeInformation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('information');

  // Data state
  //const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryResponse | null>(null);
  const [gepgBillStatus, setGepgBillStatus] = useState<GePGBillStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [gepgLoading, setGepgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Detect country
  const schoolCountry = getSchoolCountry();
  const showGePG = isTanzania(schoolCountry);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'payment' ? 'payment' : 'information');
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getParentToken();
    if (!token) {
      setError('Not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/finance/parent/fee-summary/`, { headers }),
        axios.get(`${API_BASE_URL}/api/finance/parent/payment-history/`, { headers }),
      ]);

      //setFeeSummary(summaryRes.data);
      setPaymentHistory(historyRes.data);

      // Extract school_country from summary if not in localStorage
      if (!showGePG) {
        const countryFromApi: string = summaryRes.data.school_country || '';
        if (isTanzania(countryFromApi)) {
          // We'd need to re-render — but since hooks can't be conditional,
          // we simply fetch GePG data if the API indicates Tanzania
          void fetchGePGData(historyRes.data, token);
        }
      }
    } catch (err) {
      console.error('Error fetching fee data:', err);
      setError('Failed to load fee information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showGePG]);

  const fetchGePGData = useCallback(async (history: PaymentHistoryResponse | null, token: string) => {
    const hist = history || paymentHistory;
    if (!hist) return;

    // Find the first unpaid invoice_student_id from payment history
    // The history contains invoice records; we need an invoice_student_id for the status API.
    // We attempt to find it from the first 'invoice' type entry with a balance.
    // Since the payment history API doesn't directly return invoice_student_id,
    // we use a best-effort approach: check for gepg bills on the student's invoices
    // by fetching via the fee summary endpoint (which may include invoice_student_ids).
    // For now, we look at invoice entries and try each one.

    // Alternatively: try GET /api/gepg/transactions/ which is available for parents
    try {
      setGepgLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const txnRes = await axios.get(`${API_BASE_URL}/api/gepg/transactions/`, { headers });
      const transactions: GePGTransaction[] = txnRes.data.results || txnRes.data || [];

      if (transactions.length > 0) {
        const firstTxn = transactions[0];
        // Build a synthetic bill status from transactions
        const totalPaid = transactions
          .filter(t => t.tran_status === 'CONFIRMED')
          .reduce((sum, t) => sum + Number(t.paid_amount), 0);

        setGepgBillStatus({
          invoice_student_id: '',
          student_name: hist.student_name,
          admission_number: '',
          bill_reference: null,
          control_number: firstTxn.control_number,
          status: 'PARTIAL',
          bill_amount: hist.stats.total_invoiced,
          total_paid: totalPaid,
          balance: hist.stats.total_invoiced - totalPaid,
          currency: firstTxn.currency,
          expiry_date: null,
          gepg_configured: true,
          transactions,
        });
      } else {
        // No transactions yet — GePG may be configured but no bill created
        setGepgBillStatus({
          invoice_student_id: '',
          student_name: hist.student_name,
          admission_number: '',
          bill_reference: null,
          control_number: null,
          status: null,
          bill_amount: hist.stats.total_invoiced,
          total_paid: hist.stats.total_paid,
          balance: hist.stats.total_balance,
          currency: 'TZS',
          expiry_date: null,
          gepg_configured: false,
          transactions: [],
        });
      }
    } catch {
      // GePG data unavailable — show generic info
      setGepgBillStatus(null);
    } finally {
      setGepgLoading(false);
    }
  }, [paymentHistory]);

  // Refresh status (re-fetches GePG data)
  const handleRefreshStatus = useCallback(() => {
    const token = getParentToken();
    if (token && showGePG) {
      void fetchGePGData(paymentHistory, token);
    } else {
      void fetchData();
    }
  }, [fetchData, fetchGePGData, paymentHistory, showGePG]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // After data loads, fetch GePG data for Tanzania schools
  useEffect(() => {
    if (showGePG && paymentHistory && !gepgLoading) {
      const token = getParentToken();
      if (token) {
        void fetchGePGData(paymentHistory, token);
      }
    }
  }, [showGePG, paymentHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyControlNumber = (cn: string) => {
    navigator.clipboard.writeText(cn).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = cn;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ---------- Render helpers ----------

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const studentName = paymentHistory?.student_name || '';
  const stats = paymentHistory?.stats || { total_invoiced: 0, total_paid: 0, total_balance: 0 };
  const currency = showGePG ? (gepgBillStatus?.currency || 'TZS') : undefined;

  // Payment tab (generic – navigate here)
  if (activeTab === 'payment') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/parent/fees')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Fee Information
        </button>

        <h1 className="text-2xl font-bold mb-6">How to Pay</h1>

        {showGePG ? (
          <>
            {gepgBillStatus && (
              <GePGControlCard
                billStatus={gepgBillStatus}
                onCopy={handleCopyControlNumber}
                copied={copied}
              />
            )}
            <GePGChannelTabs controlNumber={gepgBillStatus?.control_number || null} />
          </>
        ) : (
          <GenericPaymentModes />
        )}
      </div>
    );
  }

  // Default: information tab
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Information</h1>
          {studentName && (
            <p className="text-sm text-gray-600 mt-0.5">
              Student: <span className="font-medium">{studentName}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleRefreshStatus}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Fees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total_invoiced, currency)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.total_paid, currency)}</p>
        </div>
        <div className={`rounded-xl shadow-sm border p-5 ${stats.total_balance > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outstanding</p>
          <p className={`text-2xl font-bold mt-1 ${stats.total_balance > 0 ? 'text-orange-600' : 'text-green-700'}`}>
            {formatCurrency(stats.total_balance, currency)}
          </p>
        </div>
      </div>

      {/* Tanzania: GePG Control Number */}
      {showGePG && (
        <>
          {gepgLoading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 animate-pulse">
              <div className="h-6 bg-blue-200 rounded w-40 mb-3" />
              <div className="h-12 bg-blue-200 rounded w-64" />
            </div>
          ) : gepgBillStatus ? (
            <GePGControlCard
              billStatus={gepgBillStatus}
              onCopy={handleCopyControlNumber}
              copied={copied}
            />
          ) : null}

          <GePGChannelTabs controlNumber={gepgBillStatus?.control_number || null} />
        </>
      )}

      {/* Non-Tanzania: generic payment modes */}
      {!showGePG && (
        <GenericPaymentModes />
      )}

      {/* Pay Fees CTA */}
      {stats.total_balance > 0 && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/parent/fees?tab=payment')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 font-semibold transition"
          >
            View Payment Instructions
          </button>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>

        {!paymentHistory || paymentHistory.history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No payment history yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref / Invoice</th>
                  {showGePG && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.history.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.type === 'invoice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {item.type === 'invoice' ? 'Invoice' : 'Payment'}
                        </span>
                        <span className="truncate max-w-xs">{item.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                      {item.invoice_number}
                    </td>
                    {showGePG && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {item.payment_method === 'gepg' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">GePG</span>
                        ) : item.payment_method ? (
                          <span className="text-gray-500">{item.payment_method.replace('_', ' ')}</span>
                        ) : '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {item.debit ? formatCurrency(item.debit, currency) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {item.credit ? formatCurrency(item.credit, currency) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.type === 'payment' ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Invoice</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tanzania: GePG transaction history */}
      {showGePG && gepgBillStatus && gepgBillStatus.transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">GePG Payment Confirmations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gepgBillStatus.transactions.map((txn, i) => (
                  <tr key={txn.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(txn.payment_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-700">
                      {formatCurrency(Number(txn.paid_amount), txn.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{txn.payment_channel || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">{txn.gepg_trx_id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gepgStatusColor(txn.tran_status)}`}>
                        {txn.tran_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeInformation;
