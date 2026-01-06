import React, { useState, useEffect } from 'react';
import { APIService, DataAPI } from '../../services/baseUrl';
import { usePermissions } from '../../hooks/usePermissions';
import AddStudentModal from '../generalFiles/students/modals/AddStudentModal';
import UploadStudentModal from '../generalFiles/students/modals/UploadStudentModal';

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  admission_class: string;
  current_class: string;
  date_of_birth: string;
  gender: string;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email: string;
  address: string;
  status: string;
  date_added: string;
  age: number;
  school_name: string;
}

interface AddStudentFormData {
  upi_no: string;
  assessment_no: string;
  surname: string;
  first_name: string;
  other_names: string;
  gender: string;
  date_of_birth: string;
  birth_entry_no: string;
  disability: string;
  admission_number: string;
  class: string;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email: string;
  address: string;
  status: string;
}

const StaffStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Form data for add student modal
  const [formData, setFormData] = useState<AddStudentFormData>({
    upi_no: '',
    assessment_no: '',
    surname: '',
    first_name: '',
    other_names: '',
    gender: '',
    date_of_birth: '',
    birth_entry_no: '',
    disability: '',
    admission_number: '',
    class: '',
    parent_guardian_name: '',
    parent_guardian_phone: '',
    parent_guardian_email: '',
    address: '',
    status: 'active'
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // Permissions
  const { canAddStudents, canUploadStudents, canViewAllStudents } = usePermissions();

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm, selectedClass, selectedStatus]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedClass) {
        params.append('class', selectedClass);
      }
      if (selectedStatus) {
        params.append('status', selectedStatus);
      }
      
      // Director of Studies and Bursar can view ALL students (not filtered by assigned classes)
      if (canViewAllStudents()) {
        params.append('view_all', 'true');
      }

      const response = await APIService.get(`/api/students/?${params.toString()}`, undefined, 'staff');
      
      if (response) {
        // Handle paginated response
        if (response.results) {
          setStudents(response.results);
          setTotalCount(response.count || 0);
          setTotalPages(Math.ceil((response.count || 0) / pageSize));
        } else {
          // Handle non-paginated response
          setStudents(response);
          setTotalCount(response.length || 0);
          setTotalPages(1);
        }
        setError('');
      } else {
        setError('Failed to fetch students - empty response');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      
      // Check if it's an authentication error
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          setError('Authentication failed. Please login again.');
        } else if (err.status === 403) {
          setError('You do not have permission to view students. Please ensure you have been assigned to classes.');
        } else {
          setError(`Server error: ${err.status}`);
        }
      } else {
        setError('Network error occurred while fetching students');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add student handler
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await DataAPI.createStudent(formData);
      setSuccessMessage('Student added successfully!');
      setShowAddModal(false);
      setFormData({
        upi_no: '',
        assessment_no: '',
        surname: '',
        first_name: '',
        other_names: '',
        gender: '',
        date_of_birth: '',
        birth_entry_no: '',
        disability: '',
        admission_number: '',
        class: '',
        parent_guardian_name: '',
        parent_guardian_phone: '',
        parent_guardian_email: '',
        address: '',
        status: 'active'
      });
      fetchStudents();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload students handler
  const handleUploadStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setUploadProgress('Uploading...');
    
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      await DataAPI.bulkUploadStudents(formData, (progress) => {
        setUploadProgress(`Uploading... ${progress}%`);
      });
      
      setSuccessMessage('Students uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadProgress('');
      fetchStudents();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error uploading students:', err);
      setError(err.message || 'Failed to upload students. Please check the file format.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Since we're using server-side filtering, we don't need to filter again
  const filteredStudents = students;

  // Get unique classes for filter (from current page data)
  const uniqueClasses = [...new Set(students.map(student => student.current_class || student.admission_class))];

  // Handler for search and filter changes
  const handleSearchFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Navigation handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  if (loading && students.length === 0) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-lg text-gray-600 mt-4">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Students</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                View and manage student records for your school
              </p>
            </div>
            
            {/* Add/Upload buttons for Director of Studies and Bursar */}
            {(canAddStudents() || canUploadStudents()) && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
                {canUploadStudents() && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Students
                  </button>
                )}
                {canAddStudents() && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Student
                  </button>
                )}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueClasses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">On Current Page</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {students.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
              <input
                type="text"
                placeholder="Search by name or admission number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearchFilterChange();
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  handleSearchFilterChange();
                }}
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleSearchFilterChange();
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="graduated">Graduated</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('');
                  setSelectedStatus('');
                  setCurrentPage(1);
                  handleSearchFilterChange();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg relative">
          {loading && students.length > 0 && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <div className="text-sm text-gray-600 mt-2">Loading...</div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class & Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {totalCount === 0 
                        ? (
                          <div>
                            <p className="mb-2">No students found in your assigned classes.</p>
                            <p className="text-sm text-gray-400">
                              Please contact your administrator to assign you to classes and subjects.
                            </p>
                          </div>
                        ) 
                        : "No students match your search criteria."
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Admission: {student.admission_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.gender && (
                              <span className="capitalize">{student.gender}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.current_class || student.admission_class}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.age ? `${student.age} years old` : 'Age not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.parent_guardian_name || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.parent_guardian_phone || 'No phone'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.parent_guardian_email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : student.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : student.status === 'graduated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
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
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageSelect(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-gray-500 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          {totalCount > 0 && (
            <span>
              Page {currentPage} of {totalPages} • Total: {totalCount} students
            </span>
          )}
        </div>
      </div>
      
      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddStudent}
        isSubmitting={isSubmitting}
        title="Add New Student"
      />
      
      {/* Upload Students Modal */}
      <UploadStudentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        onSubmit={handleUploadStudents}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};

export default StaffStudents;
