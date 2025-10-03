import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { subjectFrequencyService } from '../../../services/subjectFrequencyService';
import type { SubjectFrequencyBulkCreateData } from '../../../services/subjectFrequencyService';
import { subjectsService } from '../../../services/subjectsService';
import type { Subject } from '../../../types/subjects';

interface AddSubjectFrequencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSubjectFrequencyModal({ isOpen, onClose, onSuccess }: AddSubjectFrequencyModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [classLevel, setClassLevel] = useState<'Primary' | 'Junior Secondary' | 'Senior Secondary'>('Primary');
  const [frequency, setFrequency] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSubjects();
    }
  }, [isOpen]);

  const loadSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      // Load all subjects without pagination (show_all=true to bypass assignment filtering)
      const response = await subjectsService.getSubjects(1, 1000, true);
      
      if (response.success && response.data) {
        setSubjects(response.data.results || []);
      } else {
        console.error('Failed to load subjects:', response);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleToggleSubject = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleToggleAll = () => {
    const filteredSubjects = getFilteredSubjects();
    if (selectedSubjects.size === filteredSubjects.length && filteredSubjects.length > 0) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(filteredSubjects.map(s => s.id)));
    }
  };

  const getFilteredSubjects = () => {
    return subjects.filter(subject =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.subject_code && subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSubjects.size === 0) {
      alert('Please select at least one subject');
      return;
    }

    if (frequency <= 0) {
      alert('Frequency must be a positive number');
      return;
    }

    setIsLoading(true);

    try {
      const data: SubjectFrequencyBulkCreateData = {
        subjects: Array.from(selectedSubjects),
        class_level: classLevel,
        frequency: frequency
      };

      const result = await subjectFrequencyService.bulkCreateSubjectFrequencies(data);

      if (result.success) {
        alert(`Successfully created ${result.created_count} subject frequencies${result.skipped_count > 0 ? `. ${result.skipped_count} already existed.` : ''}`);
        resetForm();
        onSuccess();
      } else {
        alert(result.message || 'Failed to create subject frequencies');
      }
    } catch (error) {
      console.error('Error creating subject frequencies:', error);
      alert('Failed to create subject frequencies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSubjects(new Set());
    setClassLevel('Primary');
    setFrequency(1);
    setSearchTerm('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const filteredSubjects = getFilteredSubjects();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Subject Frequency</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
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
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subjects <span className="text-red-500">*</span>
              </label>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              {isLoadingSubjects ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  {filteredSubjects.length > 0 && (
                    <div className="flex items-center mb-2 pb-2 border-b border-gray-200">
                      <input
                        type="checkbox"
                        id="select-all"
                        checked={selectedSubjects.size === filteredSubjects.length && filteredSubjects.length > 0}
                        onChange={handleToggleAll}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">
                        Select All ({filteredSubjects.length})
                      </label>
                    </div>
                  )}

                  {/* Subject List */}
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {subjects.length === 0 ? 'No subjects available' : 'No subjects match your search'}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredSubjects.map((subject) => (
                          <div key={subject.id} className="p-3 hover:bg-gray-50">
                            <label className="flex items-start cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSubjects.has(subject.id)}
                                onChange={() => handleToggleSubject(subject.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                              />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {subject.subject_name}
                                </div>
                                {subject.subject_code && (
                                  <div className="text-xs text-gray-500">
                                    Code: {subject.subject_code}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Count */}
                  {selectedSubjects.size > 0 && (
                    <div className="mt-2 text-sm text-indigo-600">
                      {selectedSubjects.size} subject{selectedSubjects.size !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedSubjects.size === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
