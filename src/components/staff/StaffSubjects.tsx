import React, { useState, useEffect } from 'react';
import { APIService, DataAPI } from '../../services/baseUrl';
import { BookOpen, Search, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import AddSubjectModal from '../generalFiles/subjects/AddSubjectModal';
import type { SubjectCreateData } from '../../types/subjects';

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string;
  date_created: string | null;
  is_double: boolean;
  is_active: boolean;
}

const StaffSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  // Permissions
  const { canAddSubjects, canEditSubjects, canDeleteSubjects } = usePermissions();

  useEffect(() => {
    fetchSubjects();
  }, [currentPage, searchTerm]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await APIService.get('/api/staff/subjects/', params, 'staff');
      
      if (response.results) {
        setSubjects(response.results);
        setTotalCount(response.count || 0);
      } else {
        setSubjects(response || []);
        setTotalCount(response?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (data: SubjectCreateData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingSubject) {
        await DataAPI.updateSubject(editingSubject.id, data);
        setSuccessMessage('Subject updated successfully!');
      } else {
        await DataAPI.createSubject(data);
        setSuccessMessage('Subject added successfully!');
      }
      setShowAddModal(false);
      setEditingSubject(null);
      fetchSubjects();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving subject:', err);
      setError(err.message || 'Failed to save subject. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setShowAddModal(true);
  };

  const handleDeleteClick = (subject: Subject) => {
    setDeletingSubject(subject);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubject) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await DataAPI.deleteSubject(deletingSubject.id);
      setSuccessMessage('Subject deleted successfully!');
      setShowDeleteConfirm(false);
      setDeletingSubject(null);
      fetchSubjects();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      setError(err.message || 'Failed to delete subject. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subjects</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">View all available subjects</p>
            </div>
            
            {/* Add Subject button for Director of Studies */}
            {canAddSubjects() && (
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Subject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div className="max-w-none">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            {/* Search and Info Bar */}
            <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {totalCount} subject{totalCount !== 1 ? 's' : ''} found
                  </span>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Table - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No subjects have been added yet.'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Double Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {(canEditSubjects() || canDeleteSubjects()) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {subject.subject_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{subject.subject_code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {subject.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subject.is_double 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {subject.is_double ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(subject.date_created)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subject.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subject.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {(canEditSubjects() || canDeleteSubjects()) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {canEditSubjects() && (
                                <button
                                  onClick={() => handleEditSubject(subject)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  title="Edit subject"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </button>
                              )}
                              {canDeleteSubjects() && (
                                <button
                                  onClick={() => handleDeleteClick(subject)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  title="Delete subject"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No subjects have been added yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{subject.subject_name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Code: {subject.subject_code}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subject.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subject.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {subject.description && (
                        <p className="mt-2 text-xs text-gray-600 line-clamp-2">{subject.description}</p>
                      )}
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          subject.is_double 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {subject.is_double ? 'Double Period' : 'Single Period'}
                        </span>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {formatDate(subject.date_created)}
                        </div>
                      </div>
                      {(canEditSubjects() || canDeleteSubjects()) && (
                        <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-gray-100">
                          {canEditSubjects() && (
                            <button
                              onClick={() => handleEditSubject(subject)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                          )}
                          {canDeleteSubjects() && (
                            <button
                              onClick={() => handleDeleteClick(subject)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add/Edit Subject Modal */}
      <AddSubjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSubject(null);
        }}
        onSubmit={handleAddSubject}
        editingSubject={editingSubject ? {
          id: editingSubject.id,
          school_id: '',
          school_name: '',
          subject_name: editingSubject.subject_name,
          subject_code: editingSubject.subject_code,
          description: editingSubject.description,
          is_double: editingSubject.is_double ?? false,
          is_active: editingSubject.is_active,
          created_at: '',
          updated_at: ''
        } : undefined}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Subject</h3>
              <p className="text-sm text-gray-600 text-center mb-1">
                Are you sure you want to delete <span className="font-semibold">{deletingSubject.subject_name}</span>?
              </p>
              <p className="text-xs text-red-500 text-center mb-6">
                This action cannot be undone. All associated data (timetable entries, marks, etc.) may also be affected.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingSubject(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSubjects;
