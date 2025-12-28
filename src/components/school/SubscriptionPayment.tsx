import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Phone, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/environment';

interface PackageInfo {
  name: string;
  displayName: string;
  billingCycle: 'TERM' | 'YEAR';
  amount: number;
}

interface RegistrationData {
  name: string;
  school_email: string;
  password: string;
  motto: string;
  school_address: string;
  school_type: string;
  curriculum: string;
  telephone: string;
  country: string;
  website?: string;
  logo?: File | null;
}

interface LocationState {
  package?: PackageInfo;
  schoolEmail?: string;
  fromRegistration?: boolean;
  registrationData?: RegistrationData;
}

export default function SubscriptionPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Get package info from navigation state
  const packageInfo = state?.package;
  const schoolEmail = state?.schoolEmail;
  const fromRegistration = state?.fromRegistration;
  
  // Get registration data from navigation state or sessionStorage
  const registrationData = state?.registrationData || 
    (sessionStorage.getItem('pendingSchoolRegistration') 
      ? JSON.parse(sessionStorage.getItem('pendingSchoolRegistration')!) 
      : null);

  // State for school creation after payment
  const [creatingSchool, setCreatingSchool] = useState(false);

  useEffect(() => {
    // Redirect if no package selected
    if (!packageInfo) {
      navigate('/pricing');
    }
    // If from registration but no registration data, redirect to register
    if (fromRegistration && !registrationData) {
      navigate('/register-school');
    }
  }, [packageInfo, navigate, fromRegistration, registrationData]);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Create school after successful payment
  const createSchoolAccount = async (mpesaReceipt: string): Promise<boolean> => {
    if (!registrationData || !packageInfo) {
      setError('Missing registration data. Please try again.');
      return false;
    }

    setCreatingSchool(true);
    setStatusMessage('Creating your school account...');

    try {
      // Prepare form data for school registration
      const formData = new FormData();
      formData.append('name', registrationData.name);
      formData.append('school_email', registrationData.school_email);
      formData.append('password', registrationData.password);
      formData.append('motto', registrationData.motto || '');
      formData.append('school_address', registrationData.school_address);
      formData.append('school_type', registrationData.school_type);
      formData.append('curriculum', registrationData.curriculum);
      formData.append('telephone', registrationData.telephone);
      formData.append('country', registrationData.country);
      if (registrationData.website) {
        formData.append('website', registrationData.website);
      }
      
      // Add subscription info
      formData.append('package_name', packageInfo.name);
      formData.append('billing_cycle', packageInfo.billingCycle);
      formData.append('payment_status', 'PAID');
      formData.append('subscription_amount', packageInfo.amount.toString());
      formData.append('mpesa_receipt_number', mpesaReceipt);

      const response = await fetch(`${API_BASE_URL}/api/schools/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create school account');
      }

      // Clear pending registration from sessionStorage
      sessionStorage.removeItem('pendingSchoolRegistration');
      
      setStatusMessage('School account created successfully! Redirecting to login...');
      return true;
    } catch (err: any) {
      console.error('School creation failed:', err);
      setError(err.message || 'Failed to create school account. Please contact support.');
      return false;
    } finally {
      setCreatingSchool(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!phoneNumber) {
      setError('Please enter your M-Pesa phone number');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(0|254|\+254)?[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Please enter a valid Safaricom phone number');
      return;
    }

    setLoading(true);
    setError('');
    setPaymentStatus('pending');

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/initiate-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          package_name: packageInfo?.name,
          billing_cycle: packageInfo?.billingCycle,
          school_email: schoolEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setCheckoutRequestId(data.checkout_request_id);
      setStatusMessage('Please check your phone and enter your M-Pesa PIN to complete the payment.');
      
      // Start polling for payment status
      startPolling(data.checkout_request_id);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (checkoutId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions/check-status/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_request_id: checkoutId,
          }),
        });

        const data = await response.json();

        if (data.status === 'SUCCESS') {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentStatus('success');
          setStatusMessage('Payment successful! Setting up your account...');
          
          // Handle post-payment actions
          if (fromRegistration && registrationData) {
            // Create the school account with registration data
            const schoolCreated = await createSchoolAccount(data.mpesa_receipt || '');
            if (schoolCreated) {
              setTimeout(() => {
                navigate('/login', { 
                  state: { 
                    message: 'School registered successfully! Please login to continue.',
                    email: registrationData.school_email
                  } 
                });
              }, 2000);
            } else {
              // Keep payment success but show error for school creation
              setPaymentStatus('success');
              setStatusMessage('Payment successful but there was an issue creating your account. Please contact support with your M-Pesa receipt: ' + (data.mpesa_receipt || 'N/A'));
            }
          } else {
            setStatusMessage('Payment successful! Your subscription is now active.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentStatus('failed');
          setStatusMessage('Payment failed. Please try again.');
        }
      } catch (err) {
        console.error('Status check failed:', err);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === 'pending') {
        setStatusMessage('Payment verification timeout. Please check your M-Pesa statement.');
      }
    }, 120000);
  };

  const handleCheckStatus = async () => {
    if (!checkoutRequestId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/check-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_request_id: checkoutRequestId,
        }),
      });

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setPaymentStatus('success');
        setStatusMessage('Payment successful! Setting up your account...');
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        // Handle post-payment actions
        if (fromRegistration && registrationData) {
          // Create the school account with registration data
          const schoolCreated = await createSchoolAccount(data.mpesa_receipt || '');
          if (schoolCreated) {
            setTimeout(() => {
              navigate('/login', { 
                state: { 
                  message: 'School registered successfully! Please login to continue.',
                  email: registrationData.school_email
                } 
              });
            }, 2000);
          } else {
            // Keep payment success but show error for school creation
            setPaymentStatus('success');
            setStatusMessage('Payment successful but there was an issue creating your account. Please contact support with your M-Pesa receipt: ' + (data.mpesa_receipt || 'N/A'));
          }
        } else {
          setStatusMessage('Payment successful! Your subscription is now active.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else if (data.status === 'FAILED') {
        setPaymentStatus('failed');
        setStatusMessage('Payment failed. Please try again.');
      } else {
        setStatusMessage('Payment is still being processed. Please wait...');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  if (!packageInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Pricing
        </button>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Complete Your Subscription</h1>
            <p className="text-indigo-200">Pay securely via M-Pesa</p>
          </div>

          {/* Package Summary */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Package:</span>
                <span className="font-semibold text-gray-800">{packageInfo.displayName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-semibold text-gray-800">
                  {packageInfo.billingCycle === 'TERM' ? 'Per Term' : 'Per Year'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  KSh {packageInfo.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-6">
            {paymentStatus === 'idle' && (
              <>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
                
                {/* M-Pesa Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <Phone className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">M-Pesa Payment</h3>
                      <p className="text-sm text-green-700">
                        You will receive an STK push notification on your phone to complete the payment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712345678"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Safaricom number registered for M-Pesa
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Initiating Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay KSh {packageInfo.amount.toLocaleString()}
                    </>
                  )}
                </button>
              </>
            )}

            {paymentStatus === 'pending' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="animate-spin text-yellow-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Payment In Progress
                </h3>
                <p className="text-gray-600 mb-6">{statusMessage}</p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Tip:</strong> Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                  </p>
                </div>

                <button
                  onClick={handleCheckStatus}
                  disabled={loading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Checking...
                    </>
                  ) : (
                    'Check Payment Status'
                  )}
                </button>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="text-center py-8">
                <div className={`w-16 h-16 ${creatingSchool ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {creatingSchool ? (
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  ) : (
                    <CheckCircle className="text-green-600" size={32} />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {creatingSchool ? 'Creating Your School Account...' : 'Payment Successful!'}
                </h3>
                <p className="text-gray-600 mb-4">{statusMessage}</p>
                {!creatingSchool && !error && (
                  <p className="text-sm text-gray-500">
                    {fromRegistration ? 'Redirecting to login...' : 'Redirecting...'}
                  </p>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Payment Failed
                </h3>
                <p className="text-gray-600 mb-6">{statusMessage}</p>
                
                <button
                  onClick={() => {
                    setPaymentStatus('idle');
                    setError('');
                    setCheckoutRequestId(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">
              🔒 Your payment is secured with M-Pesa encryption. We do not store your PIN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
