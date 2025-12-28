import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';

interface PricingTier {
  name: string;
  packageKey: string; // Backend package key
  description: string;
  termPrice: number;
  yearPrice: number;
  features: string[];
  notIncluded?: string[];
  recommended?: boolean;
  color: string;
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
  schoolEmail?: string;
  fromRegistration?: boolean;
  registrationData?: RegistrationData;
}

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [billingCycle, setBillingCycle] = useState<'term' | 'year'>('term');
  
  // Get registration data from navigation state or sessionStorage
  const registrationData = state?.registrationData || 
    (sessionStorage.getItem('pendingSchoolRegistration') 
      ? JSON.parse(sessionStorage.getItem('pendingSchoolRegistration')!) 
      : null);
  const fromRegistration = state?.fromRegistration || !!registrationData;

  const pricingTiers: PricingTier[] = [
    {
      name: 'Timetable Only',
      packageKey: 'TIMETABLE_ONLY',
      description: 'Perfect for schools starting with automated scheduling',
      termPrice: 1000,
      yearPrice:3000,
      color: 'blue',
      features: [
        'Automated timetable generation',
        'Class scheduling',
        'Teacher assignment',
        'Block subject support',
        'Priority subject scheduling',
        'PDF export & printing',
        'Basic support'
      ],
      notIncluded: [
        'Student results management',
        'Fees management',
        'Analytics & reports'
      ]
    },
    {
      name: 'Timetable + Results',
      packageKey: 'TIMETABLE_RESULTS',
      description: 'Complete academic management solution',
      termPrice: 15000,
      yearPrice: 40000,
      color: 'purple',
      recommended: true,
      features: [
        'Everything in Timetable Only',
        'Student results entry & management',
        'Grade calculation & ranking',
        'Performance analytics',
        'Report card generation',
        'Subject-wise analysis',
        'Class performance reports',
        'Student progress tracking',
        'Bulk import/export',
        'Priority support'
      ]
    },
    {
      name: 'Fees Management',
      packageKey: 'FEES_MANAGEMENT',
      description: 'Streamline your school financial operations',
      termPrice: 15000,
      yearPrice: 40000,
      color: 'green',
      features: [
        'Fee structure configuration',
        'Student fee tracking',
        'Payment recording',
        'Balance management',
        'Fee statements generation',
        'Payment history',
        'Defaulters reports',
        'Financial summaries',
        'Receipt generation',
        'Priority support'
      ],
      notIncluded: [
        'Timetable generation',
        'Results management'
      ]
    },
    {
      name: 'Complete Package',
      packageKey: 'COMPLETE_PACKAGE',
      description: 'Full school management system',
      termPrice: 1,
      yearPrice: 1,
      color: 'indigo',
      recommended: false,
      features: [
        'Everything in Timetable + Results',
        'Everything in Fees Management',
        'Comprehensive analytics dashboard',
        'Multi-role access (Admin, Teachers, Accountant, etc.)',
        'Parent portal access',
        'Email notifications',
        'Data backup & security',
        'Custom reports',
        'Dedicated support',
        'Training & onboarding',
        'Priority feature requests'
      ]
    }
  ];

  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'term' ? tier.termPrice : tier.yearPrice;
  };

  const handleSelectPackage = (tier: PricingTier) => {
    const packageInfo = {
      name: tier.packageKey,
      displayName: tier.name,
      billingCycle: billingCycle === 'term' ? 'TERM' : 'YEAR',
      amount: getPrice(tier),
    };
    
    navigate('/subscription-payment', {
      state: {
        package: packageInfo,
        schoolEmail: registrationData?.school_email || state?.schoolEmail,
        fromRegistration: fromRegistration,
        registrationData: registrationData,
      }
    });
  };

  const getSavings = (tier: PricingTier) => {
    const termTotal = tier.termPrice * 3; // 3 terms per year
    const yearPrice = tier.yearPrice;
    return termTotal - yearPrice;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your school's needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-lg ${billingCycle === 'term' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Per Term
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'term' ? 'year' : 'term')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                billingCycle === 'year' ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'year' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'year' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Per Year
            </span>
            {billingCycle === 'year' && (
              <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Save up to KSh 5,000
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                tier.recommended ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              {tier.recommended && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  RECOMMENDED
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6 h-12">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      {getPrice(tier).toLocaleString()}
                    </span>
                    <span className="ml-2 text-xl text-gray-600">KSh</span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    per {billingCycle === 'term' ? 'term' : 'year'}
                  </p>
                  {billingCycle === 'year' && getSavings(tier) > 0 && (
                    <p className="text-green-600 text-sm font-medium mt-2">
                      Save KSh {getSavings(tier).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPackage(tier)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors mb-8 flex items-center justify-center gap-2 bg-${tier.color}-600 hover:bg-${tier.color}-700`}
                  style={{
                    backgroundColor: tier.recommended ? '#4F46E5' : 
                      tier.color === 'blue' ? '#2563EB' :
                      tier.color === 'purple' ? '#7C3AED' :
                      tier.color === 'green' ? '#059669' : '#4F46E5'
                  }}
                >
                  Get Started
                  <ArrowRight size={20} />
                </button>

                {/* Features */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-900 uppercase">Features Included:</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.notIncluded && tier.notIncluded.length > 0 && (
                    <>
                      <p className="text-sm font-semibold text-gray-900 uppercase mt-6">Not Included:</p>
                      <ul className="space-y-3">
                        {tier.notIncluded.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <X className="text-gray-400 flex-shrink-0 mt-0.5" size={20} />
                            <span className="text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, credits will be applied to your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept M-Pesa, bank transfers, and credit/debit cards. Payment instructions will be provided upon registration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! We offer a 14-day free trial on all plans. No credit card required. Experience all features before committing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Do you offer discounts for multiple schools?
              </h3>
              <p className="text-gray-600">
                Yes, we offer volume discounts for educational groups managing multiple schools. Contact us for custom pricing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-600">
                You can export all your data before canceling. We retain your data for 30 days after cancellation in case you change your mind.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Is training and support included?
              </h3>
              <p className="text-gray-600">
                All plans include email support. Complete Package includes dedicated support, training sessions, and onboarding assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-indigo-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl mb-6 text-indigo-100">
            Contact us for enterprise pricing or custom feature requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@schoolmaster.co.ke"
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Email Us
            </a>
            <a
              href="tel:+254706394482"
              className="px-8 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition-colors"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
