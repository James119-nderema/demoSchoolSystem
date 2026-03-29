import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useParentAuth } from '../authentication/contexts/ParentAuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export default function ParentLogin() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useParentAuth();

  const previewImages = {
    dashboard: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    payment: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80',
    analytics: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    invoice: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirect to parent dashboard
        navigate('/parent/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex bg-blue-600 text-white p-10 xl:p-14 flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-3">School Management System</h2>
            <p className="text-blue-100">Track attendance, fees, results, and communication in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src={previewImages.dashboard} alt="School dashboard" className="rounded-xl object-cover h-36 w-full" />
            <img src={previewImages.payment} alt="Payment history" className="rounded-xl object-cover h-36 w-full" />
            <img src={previewImages.analytics} alt="School analytics" className="rounded-xl object-cover h-36 w-full" />
            <img src={previewImages.invoice} alt="Fee invoices" className="rounded-xl object-cover h-36 w-full" />
          </div>
          <p className="text-xs text-blue-100">Parents can securely view student updates from school records.</p>
        </div>

        <div className="flex items-center justify-center py-10 px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-7">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">Parent Login</h2>
              <p className="mt-2 text-center text-sm text-gray-500">Access your child's school information</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/parent/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Register here
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link to="/parent/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                  Back to Home
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-6 border-t pt-6">
            <div className="bg-blue-50 rounded-md p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Note:</p>
                <p>Your account must be verified by the school administration before you can log in. If you've just registered, please wait for verification or contact your school.</p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
