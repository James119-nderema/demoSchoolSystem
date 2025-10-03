import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { SubjectFrequency } from '../../../services/subjectFrequencyService';
import EditSubjectFrequencyModal from './EditSubjectFrequencyModal';

interface SubjectFrequencyTableProps {
  frequencies: SubjectFrequency[];
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export default function SubjectFrequencyTable({ frequencies, onDelete, onUpdate }: SubjectFrequencyTableProps) {
  const [editingFrequency, setEditingFrequency] = useState<SubjectFrequency | null>(null);

  const handleEditClick = (frequency: SubjectFrequency) => {
    setEditingFrequency(frequency);
  };

  const handleEditClose = () => {
    setEditingFrequency(null);
  };

  const handleEditSuccess = () => {
    setEditingFrequency(null);
    onUpdate();
  };

  if (frequencies.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No subject frequencies found</p>
        <p className="text-sm mt-2">Click the "Add Subject Frequency" button to create one</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {frequencies.map((frequency) => (
              <tr key={frequency.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {frequency.subject_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {frequency.subject_code || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {frequency.class_level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {frequency.frequency} times/week
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    frequency.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {frequency.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(frequency)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(frequency.id)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingFrequency && (
        <EditSubjectFrequencyModal
          isOpen={!!editingFrequency}
          frequency={editingFrequency}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
