import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authentication/contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface LocationState {
  message?: string;
  email?: string;
}

const SchoolLogin: React.FC = () => {
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
  const { login } = useAuth();
  
  // Clear location state after reading it
  useEffect(() => {
    if (state?.message) {
      // Replace history state to prevent message showing again on refresh
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

    const success = await login(formData.email, formData.password);
    
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
    
    setLoading(false);
  };

  const goToRegistration = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Login</h1>
          <p className="text-gray-600">Access your school management dashboard</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your school email"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={goToRegistration}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Register your school
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchoolLogin;
