import React, { useState, useEffect } from 'react';

interface ClassOption {
  id: string;
  class_name: string;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    phone_number: string;
    full_name?: string;
    role: string;
    assigned_class?: string;
    kra_pin?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_code?: string;
    payment_method?: string;
    nhif_number?: string;
    nssf_number?: string;
    department?: string;
  }) => Promise<void>;
  roleOptions: { value: string; label: string }[];
  classOptions?: ClassOption[];
  isLoading?: boolean;
}

export default function AddStaffModal({
  isOpen,
  onClose,
  onSubmit,
  roleOptions,
  classOptions = [],
  isLoading = false
}: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    phone_number: '',
    full_name: '',
    role: 'TEACHER',
    assigned_class: '',
    kra_pin: '',
    bank_name: '',
    bank_account_number: '',
    bank_code: '',
    payment_method: 'mpesa',
    nhif_number: '',
    nssf_number: '',
    department: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset assigned_class when role changes away from CLASS_TEACHER
  useEffect(() => {
    if (formData.role !== 'CLASS_TEACHER') {
      setFormData(prev => ({ ...prev, assigned_class: '' }));
    }
  }, [formData.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Must start with 07 or 01
    if (!phone.startsWith('07') && !phone.startsWith('01')) {
      setErrors(prev => ({ ...prev, phone_number: 'Phone number must start with 07 or 01' }));
      return false;
    }
    // Must be exactly 10 digits
    if (phone.length !== 10) {
      setErrors(prev => ({ ...prev, phone_number: 'Phone number must be exactly 10 digits' }));
      return false;
    }
    // Must contain only digits
    if (!/^\d+$/.test(phone)) {
      setErrors(prev => ({ ...prev, phone_number: 'Phone number must contain only numbers' }));
      return false;
    }
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone_number.trim())) {
      return false; // Error already set in validatePhoneNumber
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    // Validate assigned_class for CLASS_TEACHER
    if (formData.role === 'CLASS_TEACHER' && !formData.assigned_class) {
      newErrors.assigned_class = 'Please select a class for the Class Teacher';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData: {
        phone_number: string;
        full_name?: string;
        role: string;
        assigned_class?: string;
        kra_pin?: string;
        bank_name?: string;
        bank_account_number?: string;
        bank_code?: string;
        payment_method?: string;
        nhif_number?: string;
        nssf_number?: string;
        department?: string;
      } = {
        phone_number: formData.phone_number,
        full_name: formData.full_name.trim() || undefined,
        role: formData.role,
        kra_pin: formData.kra_pin.trim(),
        bank_name: formData.bank_name.trim(),
        bank_account_number: formData.bank_account_number.trim(),
        bank_code: formData.bank_code.trim(),
        payment_method: formData.payment_method,
        nhif_number: formData.nhif_number.trim(),
        nssf_number: formData.nssf_number.trim(),
        department: formData.department.trim()
      };
      
      if (formData.role === 'CLASS_TEACHER' && formData.assigned_class) {
        submitData.assigned_class = formData.assigned_class;
      }
      
      await onSubmit(submitData);
      // Reset form on successful submission
      setFormData({
        phone_number: '',
        full_name: '',
        role: 'TEACHER',
        assigned_class: '',
        kra_pin: '',
        bank_name: '',
        bank_account_number: '',
        bank_code: '',
        payment_method: 'mpesa',
        nhif_number: '',
        nssf_number: '',
        department: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to add staff:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      phone_number: '',
      full_name: '',
      role: 'TEACHER',
      assigned_class: '',
      kra_pin: '',
      bank_name: '',
      bank_account_number: '',
      bank_code: '',
      payment_method: 'mpesa',
      nhif_number: '',
      nssf_number: '',
      department: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Staff Member</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="07XXXXXXXX or 01XXXXXXXX"
              disabled={isLoading}
              maxLength={10}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Must start with 07 or 01 and be exactly 10 digits</p>
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Staff Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
              required
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Show class selector only for CLASS_TEACHER role */}
          {formData.role === 'CLASS_TEACHER' && (
            <div>
              <label htmlFor="assigned_class" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Class *
              </label>
              <select
                id="assigned_class"
                name="assigned_class"
                value={formData.assigned_class}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.assigned_class ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
              >
                <option value="">Select a class...</option>
                {classOptions.map(classItem => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.class_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Each class can only have one class teacher</p>
              {errors.assigned_class && (
                <p className="mt-1 text-sm text-red-600">{errors.assigned_class}</p>
              )}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Optional Payroll Details</h3>
            <p className="text-xs text-gray-500 mb-4">These can be added now or filled later.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kra_pin" className="block text-sm font-medium text-gray-700 mb-2">KRA PIN</label>
                <input id="kra_pin" name="kra_pin" value={formData.kra_pin} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="A123456789Z" />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input id="department" name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="Finance" />
              </div>
              <div>
                <label htmlFor="nhif_number" className="block text-sm font-medium text-gray-700 mb-2">NHIF Number</label>
                <input id="nhif_number" name="nhif_number" value={formData.nhif_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="12345678" />
              </div>
              <div>
                <label htmlFor="nssf_number" className="block text-sm font-medium text-gray-700 mb-2">NSSF Number</label>
                <input id="nssf_number" name="nssf_number" value={formData.nssf_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="12345678" />
              </div>
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="KCB" />
              </div>
              <div>
                <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                <input id="bank_account_number" name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="1234567890" />
              </div>
              <div>
                <label htmlFor="bank_code" className="block text-sm font-medium text-gray-700 mb-2">Bank Code</label>
                <input id="bank_code" name="bank_code" value={formData.bank_code} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} placeholder="01" />
              </div>
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select id="payment_method" name="payment_method" value={formData.payment_method} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}>
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
