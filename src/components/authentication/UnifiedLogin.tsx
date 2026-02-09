import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useStaffAuth } from './contexts/StaffAuthContext';

type UserType = 'school_admin' | 'staff' | null;

interface LoginFormData {
  email: string;
  password: string;
}

interface LocationState {
  message?: string;
  email?: string;
  userType?: UserType;
}

const UnifiedLogin: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [selectedUserType, setSelectedUserType] = useState<UserType>(state?.userType || null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: state?.email || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(
    state?.message ? { type: 'success', text: state.message } : null
  );
  const navigate = useNavigate();
  const { login: schoolLogin } = useAuth();
  const { login: staffLogin } = useStaffAuth();

  // Clear location state after reading it
  useEffect(() => {
    if (state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (selectedUserType === 'school_admin') {
        // School admin login - redirect to staff dashboard (they have ADMINISTRATIVE_STAFF role)
        const success = await schoolLogin(formData.email, formData.password);
        
        if (success) {
          setMessage({
            type: 'success',
            text: 'Login successful! Redirecting...'
          });
          
          // Redirect to dashboard (school admins use staff interface)
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          setMessage({
            type: 'error',
            text: 'Login failed. Please check your credentials.'
          });
        }
      } else if (selectedUserType === 'staff') {
        // Staff login
        const result = await staffLogin(formData.email, formData.password);
        
        if (result.success) {
          setMessage({
            type: 'success',
            text: 'Login successful! Redirecting...'
          });
          
          setTimeout(() => {
            if (result.role === 'BURSAR' || result.role === 'ACCOUNTANT') {
              navigate('/finance/dashboard');
            } else {
              navigate('/dashboard');
            }
          }, 1000);
        } else {
          setMessage({
            type: 'error',
            text: 'Login failed. Please check your credentials.'
          });
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Login failed. Please check your credentials.'
      });
    }
    
    setLoading(false);
  };

  const goToRegistration = () => {
    navigate('/register', { state: { userType: selectedUserType } });
  };

  const goToForgotPassword = () => {
    if (selectedUserType === 'school_admin') {
      navigate('/forgot-password');
    } else {
      navigate('/forgot-password');
    }
  };

  // User type selection screen
  if (!selectedUserType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Select your account type to continue</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSelectedUserType('school_admin')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">School Administrator</h3>
                  <p className="text-sm text-gray-500">School owners and administrators</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setSelectedUserType('staff')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Staff Member</h3>
                  <p className="text-sm text-gray-500">Teachers and other school staff</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        {/* Back button */}
        <button
          onClick={() => setSelectedUserType(null)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to selection
        </button>

        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${selectedUserType === 'school_admin' ? 'bg-indigo-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {selectedUserType === 'school_admin' ? (
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedUserType === 'school_admin' ? 'School Admin Login' : 'Staff Login'}
          </h1>
          <p className="text-gray-600">
            {selectedUserType === 'school_admin' 
              ? 'Access your school management dashboard' 
              : 'Access your staff dashboard'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                selectedUserType === 'school_admin' 
                  ? 'focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                selectedUserType === 'school_admin' 
                  ? 'focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              selectedUserType === 'school_admin'
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <button
              onClick={goToForgotPassword}
              className={`text-sm font-medium ${
                selectedUserType === 'school_admin' 
                  ? 'text-indigo-600 hover:text-indigo-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Forgot your password?
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={goToRegistration}
                className={`font-medium ${
                  selectedUserType === 'school_admin' 
                    ? 'text-indigo-600 hover:text-indigo-800' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
