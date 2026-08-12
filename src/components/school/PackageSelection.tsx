import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/environment';
import { useStaffAuth } from '../authentication/contexts/StaffAuthContext';
import {
  PACKAGE_LABELS,
  PACKAGE_ORDER,
  PACKAGE_PRICES,
  deriveLegacyPackageName,
  generateAllPackageCombinations,
  normalizePackages,
  type SchoolPackage,
} from '../../config/packageAccess';

interface RegistrationData {
  school_name?: string;
  principal_name?: string;
  phone_number?: string;
  email?: string;
  school_domain?: string;
  password?: string;
  address?: string;
  motto?: string;
  vision?: string;
  mission?: string;
  country?: string;
}

interface LocationState {
  registrationData?: RegistrationData;
  fromRegistration?: boolean;
}

export default function PackageSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: staffLogin } = useStaffAuth();
  const state = (location.state as LocationState) || {};

  const stored = sessionStorage.getItem('pendingSchoolRegistration');
  const registrationData = state.registrationData || (stored ? JSON.parse(stored) : null);

  const [billingCycle, setBillingCycle] = useState<'TERM' | 'YEAR'>('TERM');
  const [submitting, setSubmitting] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<SchoolPackage[]>(
    normalizePackages((registrationData as any)?.selected_packages || []),
  );

  const allCombinations = useMemo(() => generateAllPackageCombinations(), []);

  useEffect(() => {
    if (!registrationData) {
      navigate('/register-school', { replace: true });
    }
  }, [registrationData, navigate]);

  const totalAmount = useMemo(() => {
    return selectedPackages.reduce((sum, pkg) => {
      const price = billingCycle === 'TERM' ? PACKAGE_PRICES[pkg].term : PACKAGE_PRICES[pkg].year;
      return sum + price;
    }, 0);
  }, [selectedPackages, billingCycle]);

  const togglePackage = (pkg: SchoolPackage) => {
    setSelectedPackages(prev => {
      if (prev.includes(pkg)) return prev.filter(p => p !== pkg);
      return [...prev, pkg];
    });
  };

  const base64ToFile = (base64Data: string, fileName: string, mimeType: string) => {
    const parts = base64Data.split(',');
    const byteString = atob(parts[1] || '');
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], fileName, { type: mimeType || 'image/png' });
  };

  const handleContinue = async () => {
    if (!registrationData) {
      navigate('/register-school');
      return;
    }

    if (selectedPackages.length === 0) {
      alert('Please choose at least one package.');
      return;
    }

    const normalizedRegistrationData = {
      ...registrationData,
      selected_packages: selectedPackages,
    };

    sessionStorage.setItem('pendingSchoolRegistration', JSON.stringify(normalizedRegistrationData));

    setSubmitting(true);

    try {
      const parseJsonSafely = async (response: Response) => {
        const responseText = await response.text();
        if (!responseText) return null;
        try {
          return JSON.parse(responseText);
        } catch {
          return null;
        }
      };

      const formData = new FormData();
      formData.append('name', normalizedRegistrationData.school_name || '');
      formData.append('school_email', normalizedRegistrationData.email || '');
      formData.append('password', normalizedRegistrationData.password || '');
      formData.append('motto', normalizedRegistrationData.motto || '');
      formData.append('school_address', normalizedRegistrationData.address || '');
      formData.append('telephone', normalizedRegistrationData.phone_number || '');
      if (normalizedRegistrationData.school_domain) {
        formData.append('website', normalizedRegistrationData.school_domain);
      }
      formData.append('principal_name', normalizedRegistrationData.principal_name || '');
      if (normalizedRegistrationData.country) {
        formData.append('country', normalizedRegistrationData.country);
      }
      formData.append('selected_packages', JSON.stringify(selectedPackages));
      formData.append('package_name', deriveLegacyPackageName(selectedPackages));
      formData.append('billing_cycle', billingCycle);
      formData.append('payment_status', 'PENDING');
      formData.append('subscription_amount', totalAmount.toString());

      const logoBase64 = sessionStorage.getItem('school_logo');
      const logoName = sessionStorage.getItem('school_logo_name') || 'school-logo.png';
      const logoType = sessionStorage.getItem('school_logo_type') || 'image/png';
      if (logoBase64) {
        formData.append('logo', base64ToFile(logoBase64, logoName, logoType));
      }

      const createResponse = await fetch(`${API_BASE_URL}/api/schools/`, {
        method: 'POST',
        body: formData,
      });

      const createData = await parseJsonSafely(createResponse);
      if (!createResponse.ok) {
        throw new Error(
          (createData as any)?.error ||
          (createData as any)?.message ||
          `Failed to create school account (HTTP ${createResponse.status})`
        );
      }

      const loginResult = await staffLogin(
        normalizedRegistrationData.email || '',
        normalizedRegistrationData.password || '',
      );

      if (!loginResult.success) {
        navigate('/login', {
          state: {
            message: 'Registration successful. Please login to continue.',
            email: normalizedRegistrationData.email,
          },
          replace: true,
        });
        return;
      }

      sessionStorage.removeItem('pendingSchoolRegistration');
      sessionStorage.removeItem('school_logo');
      sessionStorage.removeItem('school_logo_name');
      sessionStorage.removeItem('school_logo_type');

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      alert(error?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Step 2: Choose Packages</h1>
          <p className="text-gray-600 mt-2">Choose one or more packages for your school.</p>
          <p className="text-sm text-indigo-600 mt-2">Total possible combinations: {allCombinations.length}</p>
          <p className="text-sm text-green-700 mt-1">No payment required now. You will continue directly to dashboard.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              className={`px-4 py-2 rounded-lg ${billingCycle === 'TERM' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setBillingCycle('TERM')}
            >
              Per Term
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${billingCycle === 'YEAR' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setBillingCycle('YEAR')}
            >
              Per Year
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PACKAGE_ORDER.map(pkg => {
              const checked = selectedPackages.includes(pkg);
              const price = billingCycle === 'TERM' ? PACKAGE_PRICES[pkg].term : PACKAGE_PRICES[pkg].year;
              return (
                <label key={pkg} className={`border rounded-xl p-4 cursor-pointer transition ${checked ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePackage(pkg)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{PACKAGE_LABELS[pkg]}</p>
                      <p className="text-sm text-gray-600">KSh {price.toLocaleString()} / {billingCycle === 'TERM' ? 'term' : 'year'}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        

        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Selected: {selectedPackages.length} package(s)</p>
            <p className="text-xl font-bold text-indigo-700">Total: KSh {totalAmount.toLocaleString()}</p>
          </div>
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {submitting ? 'Setting up account...' : 'Finish and Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
