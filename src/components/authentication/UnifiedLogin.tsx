import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from './contexts/StaffAuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface LocationState {
  message?: string;
  email?: string;
}

const UnifiedLogin: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: state?.email || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(
    state?.message ? { type: 'success', text: state.message } : null
  );
  const navigate = useNavigate();
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
      const result = await staffLogin(formData.email, formData.password);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Login successful! Redirecting...'
        });
        
        setTimeout(() => {
          if (result.role === 'BURSAR' || result.role === 'ACCOUNTANT') {
            navigate('/finance/dashboard');
          } else if (result.role === 'LIBRARIAN') {
            navigate('/library/dashboard');
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
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Login failed. Please check your credentials.'
      });
    }
    
    setLoading(false);
  };

  const goToRegistration = () => {
    navigate('/register');
  };

  const goToForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Forgot your password?
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={goToRegistration}
                className="font-medium text-indigo-600 hover:text-indigo-800"
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
