import React, { useState, useEffect } from 'react';
import type { Subject, SubjectCreateData } from '../../../types/subjects';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectCreateData) => Promise<void>;
  editingSubject?: Subject | null;
  isLoading?: boolean;
}

export default function AddSubjectModal({
  isOpen,
  onClose,
  onSubmit,
  editingSubject,
  isLoading = false
}: AddSubjectModalProps) {
  const [formData, setFormData] = useState<SubjectCreateData>({
    subject_name: '',
    abbreviation: '',
    subject_code: '',
    description: '',
    is_double: false,
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingSubject) {
      setFormData({
        subject_name: editingSubject.subject_name,
        abbreviation: editingSubject.abbreviation || '',
        subject_code: editingSubject.subject_code || '',
        description: editingSubject.description || '',
        is_double: editingSubject.is_double ?? false,
        is_active: editingSubject.is_active
      });
    } else {
      setFormData({
        subject_name: '',
        abbreviation: '',
        subject_code: '',
        description: '',
        is_double: false,
        is_active: true
      });
    }
    setErrors({});
  }, [editingSubject, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject_name.trim()) {
      newErrors.subject_name = 'Subject name is required';
    }

    // Subject code is now optional but validate if provided
    if (formData.subject_code && formData.subject_code.trim() && formData.subject_code.length > 20) {
      newErrors.subject_code = 'Subject code must be 20 characters or less';
    }

    if (formData.abbreviation && formData.abbreviation.trim() && formData.abbreviation.length > 10) {
      newErrors.abbreviation = 'Abbreviation must be 10 characters or less';
    }

    if (formData.subject_name.length > 100) {
      newErrors.subject_name = 'Subject name must be 100 characters or less';
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
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit subject:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="subject_name" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject_name"
                name="subject_name"
                value={formData.subject_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter subject name"
                disabled={isLoading}
              />
              {errors.subject_name && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="abbreviation" className="block text-sm font-medium text-gray-700 mb-1">
                Abbreviation <span className="text-gray-500">(Optional - used in timetable)</span>
              </label>
              <input
                type="text"
                id="abbreviation"
                name="abbreviation"
                value={formData.abbreviation || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.abbreviation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., MATH, ENG, SCI"
                maxLength={10}
                disabled={isLoading}
              />
              {errors.abbreviation && (
                <p className="mt-1 text-sm text-red-600">{errors.abbreviation}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject_code" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="subject_code"
                name="subject_code"
                value={formData.subject_code || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject_code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter subject code (e.g., MATH101)"
                disabled={isLoading}
              />
              {errors.subject_code && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_code}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subject description (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_double"
                name="is_double"
                checked={formData.is_double}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="is_double" className="ml-2 block text-sm text-gray-700">
                Double Period
              </label>
              <span className="ml-2 text-xs text-gray-500">(Schedule in consecutive time slots)</span>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active Subject
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
