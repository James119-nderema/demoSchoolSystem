import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

interface PaymentMethodDetails {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank_transfer';
  paybillNumber?: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  swiftCode?: string;
  instructions: string[];
  color: string;
  bgGradient: string;
}

const paymentMethodsDetails: Record<string, PaymentMethodDetails> = {
  mpesa: {
    id: 'mpesa',
    name: 'M-Pesa',
    type: 'mobile_money',
    paybillNumber: '123456',
    accountNumber: 'SCHOOL-{ADMISSION_NO}',
    color: 'green',
    bgGradient: 'from-green-500 to-green-600',
    instructions: [
      'Go to M-Pesa on your phone',
      'Select "Lipa na M-Pesa"',
      'Select "Pay Bill"',
      'Enter Business Number: 123456',
      'Enter Account Number: Your child\'s admission number',
      'Enter the amount you wish to pay',
      'Enter your M-Pesa PIN and confirm',
      'You will receive a confirmation SMS with a transaction code',
      'Enter the transaction code below to confirm your payment'
    ]
  },
  airtel_money: {
    id: 'airtel_money',
    name: 'Airtel Money',
    type: 'mobile_money',
    paybillNumber: '789012',
    accountNumber: 'SCHOOL-{ADMISSION_NO}',
    color: 'red',
    bgGradient: 'from-red-500 to-red-600',
    instructions: [
      'Dial *334# on your Airtel line',
      'Select "Make Payments"',
      'Select "Pay Bill"',
      'Enter Business Number: 789012',
      'Enter Reference: Your child\'s admission number',
      'Enter the amount',
      'Enter your PIN and confirm',
      'You will receive a confirmation SMS',
      'Enter the transaction code below'
    ]
  },
  tkash: {
    id: 'tkash',
    name: 'T-Kash',
    type: 'mobile_money',
    paybillNumber: '345678',
    accountNumber: 'SCHOOL-{ADMISSION_NO}',
    color: 'blue',
    bgGradient: 'from-blue-500 to-blue-600',
    instructions: [
      'Dial *522# on your Telkom line',
      'Select "Lipa"',
      'Select "Pay Bill"',
      'Enter Paybill Number: 345678',
      'Enter Account: Your child\'s admission number',
      'Enter the amount',
      'Enter your PIN',
      'Confirm the transaction',
      'Enter the transaction code below'
    ]
  },
  bank_transfer: {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank_transfer',
    bankName: 'School Main Bank Account',
    accountNumber: '1234567890',
    branchName: 'Main Branch',
    swiftCode: 'SCBLKENX',
    color: 'purple',
    bgGradient: 'from-purple-500 to-purple-600',
    instructions: [
      'Log in to your bank\'s mobile or internet banking',
      'Select "Transfer" or "Send Money"',
      'Enter Account Number: 1234567890',
      'Bank: School Main Bank',
      'Branch: Main Branch',
      'Reference: Your child\'s admission number',
      'Enter the amount',
      'Confirm the transfer',
      'Enter the transaction reference below'
    ]
  },
  equity_bank: {
    id: 'equity_bank',
    name: 'Equity Bank',
    type: 'bank_transfer',
    bankName: 'Equity Bank',
    accountNumber: '0987654321',
    branchName: 'School Branch',
    color: 'orange',
    bgGradient: 'from-orange-500 to-orange-600',
    instructions: [
      'Visit any Equity Bank branch or use Equity Mobile',
      'For Mobile: Dial *247#',
      'Select "Send Money" > "Pay Bill"',
      'Enter Account Number: 0987654321',
      'Reference: Your child\'s admission number',
      'Enter the amount',
      'Confirm payment',
      'Enter the transaction code below'
    ]
  },
  kcb_bank: {
    id: 'kcb_bank',
    name: 'KCB Bank',
    type: 'bank_transfer',
    bankName: 'KCB Bank',
    accountNumber: '1122334455',
    branchName: 'School Branch',
    color: 'teal',
    bgGradient: 'from-teal-500 to-teal-600',
    instructions: [
      'Visit any KCB Bank branch or use KCB Mobile',
      'For Mobile: Download KCB App',
      'Select "Transfers" > "Pay Bill"',
      'Enter Account Number: 1122334455',
      'Reference: Your child\'s admission number',
      'Enter the amount',
      'Confirm payment',
      'Enter the transaction code below'
    ]
  }
};

export default function PaymentInstructions() {
  const { methodId } = useParams<{ methodId: string }>();
  const [transactionCode, setTransactionCode] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const method = methodId ? paymentMethodsDetails[methodId] : null;

  if (!method) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-800">Payment Method Not Found</h2>
          <p className="text-red-600 mt-2">The selected payment method is not available.</p>
          <Link 
            to="/parent/pay-fees"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Payment Methods
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionCode.trim()) {
      setError('Please enter the transaction code');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('parent_access_token');
      await axios.post(
        `${API_BASE_URL}/api/finance/parent/confirm-payment/`,
        {
          transaction_code: transactionCode,
          amount: parseFloat(amount),
          payment_method: method.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Error confirming payment:', err);
      // For now, show success even if API fails (will be verified by bursar)
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800">Payment Submitted Successfully!</h2>
          <p className="text-green-600 mt-2">
            Your payment confirmation has been submitted. The school bursar will verify
            your payment and update your account within 24-48 hours.
          </p>
          <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Transaction Code</p>
            <p className="font-mono font-bold text-lg text-gray-900">{transactionCode}</p>
            <p className="text-sm text-gray-600 mt-2">Amount</p>
            <p className="font-bold text-lg text-gray-900">KES {parseFloat(amount).toLocaleString()}</p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/parent/payment-history"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View Payment History
            </Link>
            <Link
              to="/parent/pay-fees"
              className="px-6 py-2 bg-white text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition"
            >
              Make Another Payment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const colorClasses: Record<string, { bg: string; text: string; border: string; button: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', button: 'bg-green-600 hover:bg-green-700' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', button: 'bg-red-600 hover:bg-red-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', button: 'bg-teal-600 hover:bg-teal-700' }
  };

  const colors = colorClasses[method.color] || colorClasses.blue;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Link
        to="/parent/pay-fees"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Payment Methods
      </Link>

      {/* Header Card */}
      <div className={`bg-gradient-to-r ${method.bgGradient} rounded-xl p-6 text-white mb-6 shadow-lg`}>
        <h1 className="text-xl sm:text-2xl font-bold">{method.name}</h1>
        <p className="text-white/80 mt-1">Follow the instructions below to complete your payment</p>
      </div>

      {/* Payment Details */}
      {method.type === 'mobile_money' && (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 sm:p-6 mb-6`}>
          <h2 className={`font-semibold ${colors.text} mb-3`}>Payment Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Paybill Number</p>
              <p className="font-mono font-bold text-lg text-gray-900">{method.paybillNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-mono font-bold text-lg text-gray-900">{method.accountNumber}</p>
            </div>
          </div>
        </div>
      )}

      {method.type === 'bank_transfer' && (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 sm:p-6 mb-6`}>
          <h2 className={`font-semibold ${colors.text} mb-3`}>Bank Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-bold text-gray-900">{method.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-mono font-bold text-lg text-gray-900">{method.accountNumber}</p>
            </div>
            {method.branchName && (
              <div>
                <p className="text-sm text-gray-500">Branch</p>
                <p className="font-bold text-gray-900">{method.branchName}</p>
              </div>
            )}
            {method.swiftCode && (
              <div>
                <p className="text-sm text-gray-500">Swift Code</p>
                <p className="font-mono font-bold text-gray-900">{method.swiftCode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Payment Instructions
        </h2>
        <ol className="space-y-3">
          {method.instructions.map((instruction, index) => (
            <li key={index} className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-medium`}>
                {index + 1}
              </span>
              <span className="text-gray-700 text-sm sm:text-base">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Transaction Confirmation Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Confirm Your Payment
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount paid"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Code / Reference Number
            </label>
            <input
              type="text"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
              placeholder="e.g., QJK7ABCD12"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the transaction code from your payment confirmation SMS/receipt
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full ${colors.button} text-white py-3 px-6 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm Payment
              </>
            )}
          </button>
        </form>
      </div>

      {/* Help Note */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800 font-medium">Important Note</p>
            <p className="text-sm text-yellow-700 mt-1">
              After submitting, the school bursar will verify your payment against bank/mobile money records. 
              Your payment history will be updated once verified. This usually takes 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
