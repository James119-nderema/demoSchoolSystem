import { useState } from 'react';
import { X } from 'lucide-react';
import { subjectFrequencyService } from '../../../services/subjectFrequencyService';
import type { SubjectFrequency, SubjectFrequencyCreateData } from '../../../services/subjectFrequencyService';

interface EditSubjectFrequencyModalProps {
  isOpen: boolean;
  frequency: SubjectFrequency;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSubjectFrequencyModal({ isOpen, frequency, onClose, onSuccess }: EditSubjectFrequencyModalProps) {
  const [classLevel, setClassLevel] = useState<'Primary' | 'Junior Secondary' | 'Senior Secondary'>(frequency.class_level);
  const [frequencyValue, setFrequencyValue] = useState<number>(frequency.frequency);
  const [isActive, setIsActive] = useState<boolean>(frequency.is_active);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (frequencyValue <= 0) {
      alert('Frequency must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      const data: Partial<SubjectFrequencyCreateData> = {
        class_level: classLevel,
        frequency: frequencyValue,
        is_active: isActive
      };

      const result = await subjectFrequencyService.updateSubjectFrequency(frequency.id, data);

      if (result.success) {
        alert('Subject frequency updated successfully');
        onSuccess();
      } else {
        alert(result.message || 'Failed to update subject frequency');
      }
    } catch (error) {
      console.error('Error updating subject frequency:', error);
      alert('Failed to update subject frequency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Subject Frequency</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Subject Info (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                {frequency.subject_name}
                {frequency.subject_code && ` (${frequency.subject_code})`}
              </div>
            </div>

            {/* Class Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Level <span className="text-red-500">*</span>
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="Primary">Primary</option>
                <option value="Junior Secondary">Junior Secondary</option>
                <option value="Senior Secondary">Senior Secondary</option>
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency (times per week) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
