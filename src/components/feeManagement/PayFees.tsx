import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

interface FeeSummary {
  total_fees: number;
  total_paid: number;
  balance: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank_transfer';
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    type: 'mobile_money',
    description: 'Pay via Safaricom M-Pesa',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#4CAF50"/>
        <path d="M24 12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.523 0-10-4.477-10-10s4.477-10 10-10 10 4.477 10 10-4.477 10-10 10z" fill="white"/>
        <path d="M28 20h-8v8h8v-8z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    type: 'mobile_money',
    description: 'Pay via Airtel Money',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#ED1C24"/>
        <path d="M16 18h16v12H16V18z" fill="white"/>
        <path d="M20 22h8v4h-8v-4z" fill="#ED1C24"/>
      </svg>
    ),
  },
  {
    id: 'tkash',
    name: 'T-Kash',
    type: 'mobile_money',
    description: 'Pay via Telkom T-Kash',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#0066B3"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">T</text>
      </svg>
    ),
  },
  {
    id: 'equity_bank',
    name: 'Equity Bank',
    type: 'bank_transfer',
    description: 'Pay via Equity Bank',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#F97316"/>
        <path d="M14 16h20v16H14V16z" fill="white"/>
        <path d="M18 20h12v2H18v-2zm0 4h12v2H18v-2zm0 4h8v2h-8v-2z" fill="#F97316"/>
      </svg>
    ),
  },
  {
    id: 'kcb_bank',
    name: 'KCB Bank',
    type: 'bank_transfer',
    description: 'Pay via KCB Bank',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#0D9488"/>
        <text x="24" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">KCB</text>
      </svg>
    ),
  },
  {
    id: 'cooperative_bank',
    name: 'Co-operative Bank',
    type: 'bank_transfer',
    description: 'Pay via Co-operative Bank',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#4F46E5"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">COOP</text>
      </svg>
    ),
  },
  {
    id: 'absa_bank',
    name: 'ABSA Bank',
    type: 'bank_transfer',
    description: 'Pay via ABSA Bank',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#EC4899"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ABSA</text>
      </svg>
    ),
  },
  {
    id: 'stanbic_bank',
    name: 'Stanbic Bank',
    type: 'bank_transfer',
    description: 'Pay via Stanbic Bank',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#0891B2"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">STANBIC</text>
      </svg>
    ),
  },
  {
    id: 'standard_chartered',
    name: 'Standard Chartered',
    type: 'bank_transfer',
    description: 'Pay via Standard Chartered',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#059669"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">SCB</text>
      </svg>
    ),
  },
  {
    id: 'dtb_bank',
    name: 'DTB Bank',
    type: 'bank_transfer',
    description: 'Pay via Diamond Trust Bank',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#D97706"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">DTB</text>
      </svg>
    ),
  },
  {
    id: 'ncba_bank',
    name: 'NCBA Bank',
    type: 'bank_transfer',
    description: 'Pay via NCBA Bank',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#7C3AED"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">NCBA</text>
      </svg>
    ),
  },
  {
    id: 'family_bank',
    name: 'Family Bank',
    type: 'bank_transfer',
    description: 'Pay via Family Bank',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#E11D48"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">FAMILY</text>
      </svg>
    ),
  },
  {
    id: 'im_bank',
    name: 'I&M Bank',
    type: 'bank_transfer',
    description: 'Pay via I&M Bank',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#0284C7"/>
        <text x="24" y="28" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">I&amp;M</text>
      </svg>
    ),
  },
];

export default function PayFees() {
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeSummary();
  }, []);

  const fetchFeeSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('parent_access_token');
      const response = await axios.get(`${API_BASE_URL}/api/finance/parent/fee-summary/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeeSummary(response.data);
    } catch (err) {
      console.error('Error fetching fee summary:', err);
      // Set default values if API fails
      setFeeSummary({ total_fees: 0, total_paid: 0, balance: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const mobileMoneyMethods = paymentMethods.filter(m => m.type === 'mobile_money');
  const bankMethods = paymentMethods.filter(m => m.type === 'bank_transfer');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm sm:text-base text-gray-600 mt-1">Choose your preferred payment method</p>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 sm:p-6 text-white mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">Outstanding Balance</p>
            {loading ? (
              <div className="h-8 w-32 bg-white/20 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {formatCurrency(feeSummary?.balance || 0)}
              </p>
            )}
          </div>
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center sm:text-right">
              <p className="text-blue-100 text-xs">Total Fees</p>
              {loading ? (
                <div className="h-5 w-20 bg-white/20 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-lg font-semibold">{formatCurrency(feeSummary?.total_fees || 0)}</p>
              )}
            </div>
            <div className="text-center sm:text-right">
              <p className="text-blue-100 text-xs">Total Paid</p>
              {loading ? (
                <div className="h-5 w-20 bg-white/20 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-lg font-semibold">{formatCurrency(feeSummary?.total_paid || 0)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Money Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Mobile Money</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobileMoneyMethods.map((method) => (
            <Link
              key={method.id}
              to={`/parent/pay-fees/${method.id}`}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${method.bgColor}`}
            >
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold ${method.color}`}>{method.name}</h3>
                <p className="text-sm text-gray-500 truncate">{method.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Bank Transfer Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Bank Transfer</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankMethods.map((method) => (
            <Link
              key={method.id}
              to={`/parent/pay-fees/${method.id}`}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${method.bgColor}`}
            >
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold ${method.color}`}>{method.name}</h3>
                <p className="text-sm text-gray-500 truncate">{method.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Need Help?</h3>
            <p className="text-sm text-gray-600 mt-1">
              If you have any questions about payments, please contact the school bursar or 
              call the school office. Keep your transaction codes safe for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
