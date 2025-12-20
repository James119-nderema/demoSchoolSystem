import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../authentication/contexts/StaffAuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const StaffLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();
  const { login } = useStaffAuth();

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
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Login successful! Redirecting...'
        });
        
        // Redirect based on role
        setTimeout(() => {
          // Bursar and Accountant go to finance dashboard
          if (result.role === 'BURSAR' || result.role === 'ACCOUNTANT') {
            navigate('/staff/finance/dashboard');
          } else {
            navigate('/staff/dashboard');
          }
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: 'Login failed. Please check your credentials.'
        });
      }

    } catch (error: unknown) {
      const errorMessage = 'Login failed. Please check your credentials.';
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
    
    setLoading(false);
  };

  const goToRegistration = () => {
    navigate('/staff/register');
  };

  const goToForgotPassword = () => {
    navigate('/staff/forgot-password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Login</h1>
          <p className="text-gray-600">Access your staff dashboard</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <button
              onClick={goToForgotPassword}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Forgot your password?
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={goToRegistration}
                className="text-blue-600 hover:text-blue-500 font-medium"
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

export default StaffLogin;
