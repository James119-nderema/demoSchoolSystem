import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import staffSubjectService, { type StaffSubject } from '../../../services/staffSubjectService';
import blockSubjectService from '../../../services/blockSubjectService';

interface AddBlockSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBlockSubjectModal: React.FC<AddBlockSubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [subjects, setSubjects] = useState<StaffSubject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      setSelectedSubjects(new Set());
      setError(null);
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await staffSubjectService.getSubjects('', 100);
      setSubjects(response.results);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleCheckboxChange = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleSelectAll = () => {
    const filteredSubjects = getFilteredSubjects();
    if (selectedSubjects.size === filteredSubjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(filteredSubjects.map(s => s.id)));
    }
  };

  const getFilteredSubjects = () => {
    if (!searchTerm) return subjects;
    const lower = searchTerm.toLowerCase();
    return subjects.filter(s => 
      s.subject_name.toLowerCase().includes(lower) ||
      s.subject_code.toLowerCase().includes(lower)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubjects.size < 2) {
      setError('Please select at least 2 subjects to create a block');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await blockSubjectService.createBlock({
        subject_ids: Array.from(selectedSubjects)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating block:', err);
      setError(err.response?.data?.error || 'Failed to create block subject');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSubjects = getFilteredSubjects();
  const allSelected = filteredSubjects.length > 0 && selectedSubjects.size === filteredSubjects.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Block Subject</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          <p>Select subjects that belong to the same block. Block subjects are taught in the same time slot.</p>
          <p className="mt-1">Example: CRE and IRE can be in the same block.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                disabled={loadingSubjects || filteredSubjects.length === 0}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              Select All ({selectedSubjects.size} selected)
            </label>
          </div>

          {loadingSubjects ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No subjects found matching your search' : 'No subjects available'}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {filteredSubjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.has(subject.id)}
                      onChange={() => handleCheckboxChange(subject.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{subject.subject_name}</div>
                      <div className="text-sm text-gray-500">{subject.subject_code}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedSubjects.size < 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Add Block
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBlockSubjectModal;
