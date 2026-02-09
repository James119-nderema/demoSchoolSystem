import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';

type UserType = 'school_admin' | 'staff' | null;

interface LocationState {
  userType?: UserType;
}

// School Admin Registration Form Data
interface SchoolFormData {
  school_name: string;
  principal_name: string;
  phone_number: string;
  email: string;
  school_domain: string;
  password: string;
  confirmPassword: string;
  address: string;
  motto: string;
}

// Staff Registration Form Data
interface StaffFormData {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
}

const UnifiedRegister: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  const [selectedUserType, setSelectedUserType] = useState<UserType>(state?.userType || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // School form data
  const [schoolFormData, setSchoolFormData] = useState<SchoolFormData>({
    school_name: '',
    principal_name: '',
    phone_number: '',
    email: '',
    school_domain: '',
    password: '',
    confirmPassword: '',
    address: '',
    motto: ''
  });

  // Staff form data
  const [staffFormData, setStaffFormData] = useState<StaffFormData>({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: ''
  });

  const handleSchoolInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSchoolFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateSchoolForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!schoolFormData.school_name.trim()) {
      newErrors.school_name = 'School name is required';
    }
    if (!schoolFormData.principal_name.trim()) {
      newErrors.principal_name = 'Principal name is required';
    }
    if (!schoolFormData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^(0|254|\+254)?[17]\d{8}$/.test(schoolFormData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }
    if (!schoolFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolFormData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!schoolFormData.password) {
      newErrors.password = 'Password is required';
    } else if (schoolFormData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (schoolFormData.password !== schoolFormData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStaffFullName = (name: string): boolean => {
    const words = name.trim().split(/\s+/);
    return words.length >= 2 && words.every(word => word.length > 0);
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSchoolForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Register school directly without subscription
      const registrationData = {
        name: schoolFormData.school_name,
        school_email: schoolFormData.email,
        password: schoolFormData.password,
        telephone: schoolFormData.phone_number,
        principal_name: schoolFormData.principal_name,
        school_address: schoolFormData.address,
        website: schoolFormData.school_domain,
        motto: schoolFormData.motto,
        payment_status: 'PENDING'
      };

      await axios.post(`${API_BASE_URL}/api/schools/`, registrationData);
      
      setMessage({
        type: 'success',
        text: 'School registered successfully! Redirecting to login...'
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login to continue.',
            email: schoolFormData.email,
            userType: 'school_admin'
          } 
        });
      }, 2000);

    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
    
    setLoading(false);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!validateStaffFullName(staffFormData.full_name)) {
      setMessage({
        type: 'error',
        text: 'Please provide your full name (first and last name).'
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/staff/auth/register/`, staffFormData);
      
      setMessage({
        type: 'success',
        text: response.data.message
      });

      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login to continue.',
            userType: 'staff'
          } 
        });
      }, 2000);

    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
    
    setLoading(false);
  };

  const goToLogin = () => {
    navigate('/login', { state: { userType: selectedUserType } });
  };

  // User type selection screen
  if (!selectedUserType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Select your account type to get started</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">Register School</h3>
                  <p className="text-sm text-gray-500">Create a new school account</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">Staff Registration</h3>
                  <p className="text-sm text-gray-500">Register as a staff member</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 ml-auto group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // School Admin Registration Form
  if (selectedUserType === 'school_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8">
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
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your School</h1>
              <p className="text-gray-600">Create your school management account</p>
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

            <form onSubmit={handleSchoolSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    name="school_name"
                    value={schoolFormData.school_name}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.school_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter school name"
                  />
                  {errors.school_name && <p className="text-red-500 text-xs mt-1">{errors.school_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal Name *
                  </label>
                  <input
                    type="text"
                    name="principal_name"
                    value={schoolFormData.principal_name}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.principal_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter principal name"
                  />
                  {errors.principal_name && <p className="text-red-500 text-xs mt-1">{errors.principal_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={schoolFormData.email}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={schoolFormData.phone_number}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.phone_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 0712345678"
                  />
                  {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={schoolFormData.password}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Min 8 characters"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={schoolFormData.confirmPassword}
                    onChange={handleSchoolInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={schoolFormData.address}
                    onChange={handleSchoolInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter school address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    name="school_domain"
                    value={schoolFormData.school_domain}
                    onChange={handleSchoolInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="www.yourschool.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Motto
                  </label>
                  <input
                    type="text"
                    name="motto"
                    value={schoolFormData.motto}
                    onChange={handleSchoolInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter school motto"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Register School'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={goToLogin}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Registration</h1>
          <p className="text-gray-600">Create your staff account</p>
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

        <form onSubmit={handleStaffSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={staffFormData.full_name}
              onChange={handleStaffInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your first and last name"
            />
            <p className="text-xs text-gray-500 mt-1">Please enter both first and last name</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={staffFormData.email}
              onChange={handleStaffInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
            <p className="text-xs text-gray-500 mt-1">Must be registered by your school</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={staffFormData.phone_number}
              onChange={handleStaffInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 0712345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={staffFormData.password}
              onChange={handleStaffInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirm_password"
              value={staffFormData.confirm_password}
              onChange={handleStaffInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Registering...
              </div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={goToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRegister;
