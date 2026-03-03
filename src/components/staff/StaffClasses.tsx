import React, { useState, useEffect } from 'react';
import { APIService, DataAPI } from '../../services/baseUrl';
import { School, Search, Users, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import AddClassModal from '../generalFiles/classes/AddClassModal';
import type { CreateClassData } from '../../types/class';

interface ClassItem {
  id: number;
  class_name: string;
  class_code: string;
  student_count?: number;
  date_created?: string | null;
  created_at?: string | null;
  is_active: boolean;
  description?: string;
  capacity?: number;
}

const StaffClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  // Permissions
  const { canAddClasses, canEditClasses, canDeleteClasses } = usePermissions();

  useEffect(() => {
    fetchClasses();
  }, [currentPage, searchTerm]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await APIService.get('/api/staff/classes/', params, 'staff');
      
      if (response.results) {
        setClasses(response.results);
        setTotalCount(response.count || 0);
      } else {
        setClasses(response || []);
        setTotalCount(response?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (data: CreateClassData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingClass) {
        await DataAPI.updateClass(editingClass.id, data);
        setSuccessMessage('Class updated successfully!');
      } else {
        await DataAPI.createClass(data);
        setSuccessMessage('Class added successfully!');
      }
      setShowAddModal(false);
      setEditingClass(null);
      fetchClasses();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving class:', err);
      setError(err.message || 'Failed to save class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClass = async (cls: ClassItem) => {
    try {
      setError('');
      // Fetch full class details from API to get all saved fields
      const classDetail = await DataAPI.getClass(cls.id);
      setEditingClass({
        ...cls,
        class_name: classDetail.class_name || cls.class_name,
        class_code: classDetail.class_code || cls.class_code || '',
        description: classDetail.description || '',
        capacity: classDetail.capacity || 30,
        is_active: classDetail.is_active ?? cls.is_active,
      });
      setShowAddModal(true);
    } catch (err: any) {
      console.error('Error fetching class details:', err);
      // Fallback to using list data if detail fetch fails
      setEditingClass(cls);
      setShowAddModal(true);
    }
  };

  const handleDeleteClick = (cls: ClassItem) => {
    setDeletingClass(cls);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await DataAPI.deleteClass(deletingClass.id);
      setSuccessMessage('Class deleted successfully!');
      setShowDeleteConfirm(false);
      setDeletingClass(null);
      fetchClasses();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting class:', err);
      setError(err.message || 'Failed to delete class. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string | null | undefined) => {
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Classes</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">View all available classes</p>
            </div>
            
            {/* Add Class button for Director of Studies */}
            {canAddClasses() && (
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Class
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
                  <School className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {totalCount} class{totalCount !== 1 ? 'es' : ''} found
                  </span>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search classes..."
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
              ) : classes.length === 0 ? (
                <div className="text-center py-12">
                  <School className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No classes have been added yet.'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {(canEditClasses() || canDeleteClasses()) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classes.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <School className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {classItem.class_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {classItem.class_code || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Users className="h-4 w-4 mr-1 text-gray-400" />
                            {classItem.student_count ?? 0} student{(classItem.student_count ?? 0) !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(classItem.date_created || classItem.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            classItem.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {classItem.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {(canEditClasses() || canDeleteClasses()) && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {canEditClasses() && (
                                <button
                                  onClick={() => handleEditClass(classItem)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  title="Edit class"
                                >
                                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </button>
                              )}
                              {canDeleteClasses() && (
                                <button
                                  onClick={() => handleDeleteClick(classItem)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  title="Delete class"
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
              ) : classes.length === 0 ? (
                <div className="text-center py-12">
                  <School className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No classes have been added yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <School className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{classItem.class_name}</h3>
                            <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {classItem.class_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {classItem.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {classItem.student_count ?? 0} student{(classItem.student_count ?? 0) !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(classItem.date_created || classItem.created_at)}
                        </div>
                      </div>
                      {(canEditClasses() || canDeleteClasses()) && (
                        <div className="mt-3 flex items-center space-x-2 pt-2 border-t border-gray-100">
                          {canEditClasses() && (
                            <button
                              onClick={() => handleEditClass(classItem)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                          )}
                          {canDeleteClasses() && (
                            <button
                              onClick={() => handleDeleteClick(classItem)}
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
      
      {/* Add/Edit Class Modal */}
      <AddClassModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingClass(null);
        }}
        onSubmit={handleAddClass}
        isLoading={isSubmitting}
        initialData={editingClass ? {
          class_name: editingClass.class_name,
          class_code: editingClass.class_code || '',
          description: editingClass.description || '',
          capacity: editingClass.capacity || 0,
          is_active: editingClass.is_active,
        } : undefined}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Class</h3>
              <p className="text-sm text-gray-600 text-center mb-1">
                Are you sure you want to delete <span className="font-semibold">{deletingClass.class_name}</span>?
              </p>
              <p className="text-xs text-red-500 text-center mb-6">
                This action cannot be undone. All associated data (students, timetable entries, etc.) may also be affected.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingClass(null);
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
                  {isDeleting ? 'Deleting...' : 'Delete Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffClasses;
