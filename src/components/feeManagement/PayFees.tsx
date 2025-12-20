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
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank_transfer',
    description: 'Pay via direct bank transfer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
        <rect x="4" y="14" width="40" height="28" rx="3" fill="#7C3AED"/>
        <rect x="8" y="18" width="32" height="4" fill="#A78BFA"/>
        <path d="M12 28h6v8h-6v-8zm9 0h6v8h-6v-8zm9 0h6v8h-6v-8z" fill="white"/>
        <path d="M24 6l16 8H8l16-8z" fill="#7C3AED"/>
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pay School Fees</h1>
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
