// FeeInformation.tsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

const FeeInformation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('information');

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payment') {
      setActiveTab('payment');
    } else {
      setActiveTab('information');
    }
  }, [searchParams]);

  const handlePayFeesClick = () => {
    navigate('/parent/fees?tab=payment');
  };

  const handleBackToInfo = () => {
    navigate('/parent/fees');
  };

  // Extract the payment content from FeePayment component
  const FeePaymentContent = () => {
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);

    const paymentInstructions: { [key: string]: string[] } = {
      'Pesalink': [
        'Log in to your mobile banking, USSD or internet banking platform',
        'Select PesaLink from the main menu',
        'Choose Send to Account',
        'Enter the Account Number: 1311863427',
        'Select the Receiving Bank: KCB BANK',
        'Enter the amount to pay: 300.00',
        'Enter the Bill Reference / Narration: AQJDNDZQX',
        'Complete the transaction on your bank\'s platform',
        'Return to the eCitizen platform and click the \'Complete\' button to finish the process',
      ],
      'M-PESA': [
        'Instructions for M-PESA payment:',
        '1. Go to your M-PESA Menu',
        '2. Select "Lipa na M-PESA"',
        '3. Select "Pay Bill"',
        '4. Enter Business Number: 878900',
        '5. Enter Account Number: Your Registration Number',
        '6. Enter Amount: 300.00',
        '7. Enter your M-PESA PIN',
        '8. Confirm the transaction.',
        'Note: This is a manual process. We are working on integrating M-Pesa Daraja for a seamless experience.'
      ],
      'Airtel Money': [
        'Instructions for Airtel Money payment:',
        '1. Dial *334#',
        '2. Select "Pay Bill"',
        '3. Enter Business Number: 878900',
        '4. Enter Account Number: Your Registration Number',
        '5. Enter Amount: 300.00',
        '6. Enter your Airtel Money PIN',
        '7. Confirm the transaction.',
      ],
      'Kenya Commercial Bank': [
        'Instructions for Kenya Commercial Bank payment.',
        'Step 1: Go to your KCB mobile banking or branch.',
        'Step 2: Use the pay bill option or make a direct deposit.',
        'Step 3: Fill in your student number as the account number.',
      ],
      'EQUITY BANK': [
        'Instructions for EQUITY BANK payment.',
        'Step 1: Use your Equity Bank mobile or online banking.',
        'Step 2: Navigate to the payments or transfers section.',
        'Step 3: Use the pay bill option and enter the provided details.',
      ],
      'Debit/Credit/Prepaid Card': [
        'Instructions for Debit/Credit/Prepaid Card payment.',
        'Step 1: Click on the "Pay Now" button on the portal.',
        'Step 2: You will be redirected to a secure payment gateway.',
        'Step 3: Enter your card details and complete the transaction.',
      ],
    };

    const paymentModes = Object.keys(paymentInstructions);

    const handleSelectMode = (mode: string) => {
      setSelectedMode(mode);
      setShowModal(true);
    };

    const closeModal = () => {
      setShowModal(false);
      setSelectedMode(null);
    };

    const renderModal = () => {
      if (!showModal || !selectedMode) return null;

      const instructions = paymentInstructions[selectedMode];

      return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-96 max-h-screen overflow-y-auto rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl leading-6 font-medium text-gray-900">
                {selectedMode.toUpperCase()} PAYMENT INSTRUCTIONS
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p className="mb-2"><strong>Service:</strong> SCHOOL FEES</p>
              <p className="mb-4"><strong>Application Number:</strong> AQJDNDZQX</p>
              <hr className="border-gray-200" />
              <ol className="list-decimal list-inside space-y-2 mt-4">
                {instructions.map((step, index) => (
                  <li key={index} className="text-gray-700">
                    {step}
                  </li>
                ))}
              </ol>
              <hr className="border-gray-200 mt-4" />
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {paymentModes.map((mode) => (
            <button
              key={mode}
              onClick={() => handleSelectMode(mode)}
              className={`
                p-4 rounded-lg border-2 text-center transition-colors duration-200
                ${selectedMode === mode
                  ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md'
                  : 'border-gray-300 hover:border-blue-400 bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="font-medium">{mode}</span>
            </button>
          ))}
        </div>
        {renderModal()}
      </>
    );
  };

  if (activeTab === 'payment') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={handleBackToInfo}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Fee Information
          </button>
          <h1 className="text-2xl font-bold">Pay Fees</h1>
        </div>
        
        {/* Render the FeePayment component with custom styling */}
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Select Payment Mode</h2>
            <FeePaymentContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fee Information</h1>
      
      {/* Fee Information Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Current Academic Year Fees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Tuition Fee
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $500.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Dec 31, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Activity Fee
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $50.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Dec 31, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Library Fee
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $25.00
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Dec 31, 2025
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Payment Summary</h3>
        <div className="flex justify-between items-center mb-4">
          <span className="text-blue-800">Total Outstanding:</span>
          <span className="text-2xl font-bold text-blue-900">$575.00</span>
        </div>
        <button
          onClick={handlePayFeesClick}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          Pay Fees Now
        </button>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Payment History</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center">No previous payments found.</p>
        </div>
      </div>
    </div>
  );
};

export default FeeInformation;
