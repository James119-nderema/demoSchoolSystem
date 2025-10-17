import { useState, useEffect } from 'react';
import { Plus, BookOpen, Filter } from 'lucide-react';
import { subjectFrequencyService } from '../../../services/subjectFrequencyService';
import type { SubjectFrequency as SubjectFrequencyType } from '../../../services/subjectFrequencyService';
import AddSubjectFrequencyModal from './AddSubjectFrequencyModal';
import SubjectFrequencyTable from './SubjectFrequencyTable';

export default function SubjectFrequency() {
  const [frequencies, setFrequencies] = useState<SubjectFrequencyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [classLevelFilter, setClassLevelFilter] = useState<string>('');

  useEffect(() => {
    loadFrequencies();
  }, [currentPage, classLevelFilter]);

  const loadFrequencies = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (classLevelFilter) {
        filters.class_level = classLevelFilter;
      }

      const response = await subjectFrequencyService.getSubjectFrequencies(currentPage, 20, filters);
      
      if (response.success && response.data) {
        setFrequencies(response.data.results || []);
        setTotalCount(response.data.count || 0);
        setTotalPages(Math.ceil((response.data.count || 0) / 20));
      } else {
        console.error('Failed to load subject frequencies:', response.message || 'Unknown error');
        setFrequencies([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load subject frequencies:', error);
      setFrequencies([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    loadFrequencies();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject frequency?')) {
      return;
    }

    try {
      const result = await subjectFrequencyService.deleteSubjectFrequency(id);
      if (result.success) {
        alert('Subject frequency deleted successfully');
        loadFrequencies();
      } else {
        alert(result.message || 'Failed to delete subject frequency');
      }
    } catch (error) {
      console.error('Failed to delete subject frequency:', error);
      alert('Failed to delete subject frequency. Please try again.');
    }
  };

  const handleUpdate = () => {
    loadFrequencies();
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subject Frequency Management</h1>
              <p className="text-gray-600">Manage subject frequency for different class levels</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Subject Frequency
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Class Level:</span>
          </div>
          <select
            value={classLevelFilter}
            onChange={(e) => {
              setClassLevelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Class Levels</option>
            <option value="Primary">Primary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Senior Secondary">Senior Secondary</option>
          </select>
          {classLevelFilter && (
            <button
              onClick={() => setClassLevelFilter('')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <SubjectFrequencyTable
                frequencies={frequencies}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AddSubjectFrequencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
