import React, { useState, useEffect } from 'react';

interface ClassOption {
  id: string;
  class_name: string;
}

interface Staff {
  id: string;
  phone_number: string;
  role: string;
  full_name: string;
  assigned_class_id?: string;
  assigned_class_name?: string;
  is_active: boolean;
  created_at: string;
}

interface EditStaffModalProps {
  isOpen: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSubmit: (staffId: string, data: { 
    phone_number: string;
    role: string;
    assigned_class?: string;
  }) => Promise<void>;
  roleOptions: { value: string; label: string }[];
  classOptions?: ClassOption[];
  isLoading?: boolean;
}

export default function EditStaffModal({
  isOpen,
  staff,
  onClose,
  onSubmit,
  roleOptions,
  classOptions = [],
  isLoading = false
}: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    phone_number: '',
    role: 'TEACHER',
    assigned_class: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (staff) {
      setFormData({
        phone_number: staff.phone_number || '',
        role: staff.role,
        assigned_class: staff.assigned_class_id || ''
      });
    }
    setErrors({});
  }, [staff, isOpen]);

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
    
    if (!staff || !validateForm()) {
      return;
    }

    try {
      const submitData: { phone_number: string; role: string; assigned_class?: string } = {
        phone_number: formData.phone_number,
        role: formData.role
      };
      
      if (formData.role === 'CLASS_TEACHER' && formData.assigned_class) {
        submitData.assigned_class = formData.assigned_class;
      }
      
      await onSubmit(staff.id, submitData);
      setErrors({});
    } catch (error) {
      console.error('Failed to update staff:', error);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Staff Member</h2>
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
