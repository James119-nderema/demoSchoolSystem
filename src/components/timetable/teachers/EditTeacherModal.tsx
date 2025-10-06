import { useState, useEffect } from 'react';
import type { Teacher } from '../../../types/teacher';

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: { full_name: string }) => Promise<void>;
  teacher: Teacher | null;
}

export default function EditTeacherModal({ isOpen, onClose, onSubmit, teacher }: EditTeacherModalProps) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.full_name);
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    setErrors({});
    setLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(teacher.id, {
        full_name: fullName.trim(),
      });
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Teacher</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Auto-generated)
            </label>
            <input
              type="text"
              value={teacher.email}
              readOnly
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`block w-full px-3 py-2 border ${
                errors.full_name ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter teacher's full name"
              disabled={loading}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Phone Number (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Auto-generated)
            </label>
            <input
              type="text"
              value={teacher.phone_number || 'N/A'}
              readOnly
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
