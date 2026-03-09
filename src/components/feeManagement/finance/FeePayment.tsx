import { useState } from 'react';

export default function App() {
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
    'Standard Chartered Bank': [
      'Instructions for Standard Chartered Bank payment.',
      'Step 1: Go to your bank app.',
      'Step 2: Select "Pay Bill" option.',
      'Step 3: Enter the business number and account number.',
    ],
    'Pesaflow Direct': [
      'Instructions for Pesaflow Direct payment.',
      'Step 1: Navigate to Pesaflow Direct on your device.',
      'Step 2: Follow the prompts to complete payment.',
    ],
    'SBM Bank': [
      'Instructions for SBM Bank payment.',
      'Step 1: Log in to your SBM account.',
      'Step 2: Transfer the fee amount.',
      'Step 3: Use the provided reference number.',
    ],
    'EcoBank': [
      'Instructions for EcoBank payment.',
      'Step 1: Open the EcoBank mobile app.',
      'Step 2: Go to the payments section.',
      'Step 3: Enter the required details and confirm.',
    ],
    'Sidian bank': [
      'Instructions for Sidian Bank payment.',
      'Step 1: Access your Sidian online banking.',
      'Step 2: Process a transfer to the specified university account.',
    ],
    'Absa Bank': [
      'Instructions for Absa Bank payment.',
      'Step 1: Go to your Absa banking platform.',
      'Step 2: Initiate a fund transfer.',
      'Step 3: Provide the necessary fee details and reference.',
    ],
    'Pesawise': [
      'Instructions for Pesawise payment.',
      'Step 1: Access your Pesawise dashboard.',
      'Step 2: Make a payment to the university.',
      'Step 3: Confirm transaction and get receipt.',
    ],
    'Consolidated Bank': [
      'Instructions for Consolidated Bank payment.',
      'Step 1: Log into your Consolidated Bank account.',
      'Step 2: Follow the payment instructions to pay university fees.',
    ],
    'Access Bank (KES)': [
      'Instructions for Access Bank (KES) payment.',
      'Step 1: Use your Access Bank mobile or online banking.',
      'Step 2: Pay the fee amount and use the provided account details.',
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
    'Diamond Trust Bank': [
      'Instructions for Diamond Trust Bank payment.',
      'Step 1: Log in to your DTB mobile or online banking.',
      'Step 2: Initiate a payment transfer.',
      'Step 3: Provide the school\'s account details and your student ID.',
    ],
    'Co-operative Bank (KES)': [
      'Instructions for Co-operative Bank payment.',
      'Step 1: Go to your Co-op Bank account.',
      'Step 2: Select the bill payment option.',
      'Step 3: Enter the business number and account details.',
    ],
    'Family Bank': [
      'Instructions for Family Bank payment.',
      'Step 1: Access the Family Bank mobile app.',
      'Step 2: Choose the pay bill function.',
      'Step 3: Enter the required details for the school fees.',
    ],
    'I&M Bank': [
      'Instructions for I&M Bank payment.',
      'Step 1: Log in to your I&M Bank portal.',
      'Step 2: Make a direct transfer to the university account.',
      'Step 3: Use your student ID as the reference.',
    ],
    'National Bank': [
      'Instructions for National Bank payment.',
      'Step 1: Use the National Bank mobile or online platform.',
      'Step 2: Go to the payment section and fill in the details.',
    ],
    'RTGS': [
      'Instructions for RTGS payment.',
      'Step 1: Visit your bank branch or use online banking for a large transfer.',
      'Step 2: Provide the necessary RTGS form with the school\'s bank details.',
      'Step 3: The transfer will be processed in real-time.',
    ],
    'Kenya Commercial Bank': [
      'Instructions for Kenya Commercial Bank payment.',
      'Step 1: Go to your KCB mobile banking or branch.',
      'Step 2: Use the pay bill option or make a direct deposit.',
      'Step 3: Fill in your student number as the account number.',
    ],
    'Stanbic Bank': [
      'Instructions for Stanbic Bank payment.',
      'Step 1: Log in to your Stanbic account.',
      'Step 2: Go to the payments section to pay the school fees.',
    ],
    'JamboPay': [
      'Instructions for JamboPay payment.',
      'Step 1: Log in to your JamboPay account.',
      'Step 2: Select the bill you want to pay and enter the amount.',
      'Step 3: Use the provided reference number to complete the payment.',
    ],
    'TKash': [
      'Instructions for TKash payment.',
      'Step 1: Go to your Telkom T-Kash menu by dialing *160#',
      'Step 2: Select "Pay Bill" option.',
      'Step 3: Enter the business number and account details.',
      'Step 4: Confirm the transaction with your T-Kash PIN.',
    ],
    'NCBA Bank': [
      'Instructions for NCBA Bank payment.',
      'Step 1: Log in to your NCBA Bank mobile app or online banking.',
      'Step 2: Use the Lipa na M-Pesa business number or direct bank transfer.',
    ],
    'EQUITY BANK': [
      'Instructions for EQUITY BANK payment.',
      'Step 1: Use your Equity Bank mobile or online banking.',
      'Step 2: Navigate to the payments or transfers section.',
      'Step 3: Use the pay bill option and enter the provided details.',
    ],
    'PostaPay': [
      'Instructions for PostaPay payment.',
      'Step 1: Visit the nearest PostaPay agent or branch.',
      'Step 2: Inform them you wish to pay school fees and provide the details.',
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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
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
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Select Payment Mode</h2>
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
        </div>
      </div>
      {renderModal()}
    </div>
  );
}
