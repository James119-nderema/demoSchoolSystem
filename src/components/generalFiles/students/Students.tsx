import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { APIService, API_ENDPOINTS } from '../../../services/baseUrl';
import AddStudentModal from './modals/AddStudentModal';
import UploadStudentModal from './modals/UploadStudentModal';
import DownloadStudentModal from './modals/DownloadStudentModal';

interface Student {
  id: number;
  upi_no?: string;
  assessment_no?: string;
  surname: string;
  first_name: string;
  other_names?: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  birth_entry_no?: string;
  disability?: string;
  admission_number: string;
  class: string;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email?: string;
  address: string;
  status: string;
  date_added: string;
  date_updated: string;
  added_by: string;
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

export default function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [admissionNumberFilter, setAdmissionNumberFilter] = useState('');
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Debounce refs for search
  const searchTimeoutRef = useRef<number | null>(null);
  const admissionTimeoutRef = useRef<number | null>(null);

  // Initialize from URL parameters and fetch data
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const classFilter = searchParams.get('class') || '';
    const admissionFilter = searchParams.get('admission') || '';
    
    setCurrentPage(page);
    setSearchTerm(search);
    setSelectedClass(classFilter);
    setAdmissionNumberFilter(admissionFilter);
    
    // Fetch students with initial parameters
    fetchStudentsWithParams(page, search, classFilter, admissionFilter, true);
  }, []);

  useEffect(() => {
    // Fetch when page changes (but not on initial load)
    if (currentPage !== parseInt(searchParams.get('page') || '1') || 
        searchTerm !== (searchParams.get('search') || '') ||
        selectedClass !== (searchParams.get('class') || '') ||
        admissionNumberFilter !== (searchParams.get('admission') || '')) {
      fetchStudents(currentPage);
    }
  }, [currentPage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (admissionTimeoutRef.current) {
        clearTimeout(admissionTimeoutRef.current);
      }
    };
  }, []);

  const updateUrlParams = (page: number, _search: string, classFilter: string, _admission: string) => {
    const params = new URLSearchParams();
    // Only add page parameter if it's not page 1 (default)
    if (page > 1) params.set('page', page.toString());
    // Only add class filter to URL (not search and admission for smooth searching)
    if (classFilter) params.set('class', classFilter);
    
    // If no parameters, clear the URL search params
    if (params.toString() === '') {
      setSearchParams({});
    } else {
      setSearchParams(params);
    }
  };

  const fetchStudentsWithParams = async (page: number, search: string, classFilter: string, admission: string, isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      
      // Determine user type based on current route/auth context
      const isSchoolRoute = window.location.pathname.startsWith('/school');
      const userType = isSchoolRoute ? 'school' : 'staff';
      
      // Check if we have the required token
      const requiredToken = userType === 'school' ? 'access_token' : 'staff_access_token';
      const tokenValue = localStorage.getItem(requiredToken);
      
      if (!tokenValue) {
        throw new Error(`Missing authentication token: ${requiredToken}. Please log in again.`);
      }
      
      // Build query parameters
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize.toString(),
      };
      
      if (search) params.search = search;
      if (classFilter) params.class = classFilter;
      if (admission) params.admission_number = admission;
      
      console.log('Fetching students with params:', params);
      const data = await APIService.get(API_ENDPOINTS.STUDENTS, params, userType);
      console.log('Students API response:', data);
      
      // Handle different response formats
      let studentsData: Student[] = [];
      let count = 0;
      
      if (data.results) {
        // Paginated response
        studentsData = data.results;
        count = data.count || 0;
      } else if (Array.isArray(data)) {
        // Direct array response
        studentsData = data;
        count = data.length;
      } else {
        console.error('Unexpected API response format:', data);
      }
      
      setStudents(studentsData);
      setTotalCount(count);
      setTotalPages(Math.ceil(count / pageSize));
      
      console.log('Students set:', studentsData.length, 'Total count:', count);
      
      // Update URL parameters
      updateUrlParams(page, search, classFilter, admission);
      
      // If no filters are applied, use the total count from pagination response
      // Otherwise, fetch filtered statistics
      if (!search && !classFilter && !admission) {
        // No filters - use basic stats from the main response
        setStats({
          total: count,
          active: studentsData.filter(s => s.status === 'active').length,
          inactive: studentsData.filter(s => s.status === 'inactive').length,
          maleStudents: studentsData.filter(s => s.gender?.toLowerCase() === 'male').length,
          femaleStudents: studentsData.filter(s => s.gender?.toLowerCase() === 'female').length
        });
      } else {
        // Filters applied - fetch filtered statistics
        await fetchFilteredStats(search, classFilter, admission, userType);
      }
      
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchStudents = async (page: number = 1, isInitialLoad: boolean = false) => {
    await fetchStudentsWithParams(page, searchTerm, selectedClass, admissionNumberFilter, isInitialLoad);
  };

  const fetchFilteredStats = async (search: string, classFilter: string, admission: string, userType: 'school' | 'staff' | 'parent') => {
    try {
      // For getting accurate stats, we need to fetch more data to calculate gender/status breakdowns
      // But for total count, we can use the count from pagination
      const statsParams: Record<string, string> = {
        page_size: '500', // Get enough records to calculate accurate stats
      };
      
      if (search) statsParams.search = search;
      if (classFilter) statsParams.class = classFilter;
      if (admission) statsParams.admission_number = admission;
      
      const statsData = await APIService.get(API_ENDPOINTS.STUDENTS, statsParams, userType);
      console.log('Stats API response:', statsData);
      
      let filteredStudents: Student[] = [];
      let totalFilteredCount = 0;
      
      if (statsData.results) {
        filteredStudents = statsData.results;
        totalFilteredCount = statsData.count || filteredStudents.length; // Use count from pagination
      } else if (Array.isArray(statsData)) {
        filteredStudents = statsData;
        totalFilteredCount = filteredStudents.length;
      }
      
      // Calculate stats from filtered results
      const newStats = {
        total: totalFilteredCount,
        active: filteredStudents.filter(s => s.status === 'active').length,
        inactive: filteredStudents.filter(s => s.status === 'inactive').length,
        maleStudents: filteredStudents.filter(s => s.gender?.toLowerCase() === 'male').length,
        femaleStudents: filteredStudents.filter(s => s.gender?.toLowerCase() === 'female').length
      };
      
      setStats(newStats);
      
      // Update allStudents for class filter dropdown
      setAllStudents(filteredStudents);
      
      console.log('Calculated stats:', newStats);
      
    } catch (statsError) {
      console.error('Error fetching filtered stats:', statsError);
      // Fallback to basic stats from current page
      setStats({
        total: totalCount,
        active: 0,
        inactive: 0,
        maleStudents: 0,
        femaleStudents: 0
      });
    }
  };

  // Debounced fetch function
  const debouncedFetch = useCallback((searchValue: string, classValue: string, admissionValue: string) => {    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchStudentsWithParams(1, searchValue, classValue, admissionValue, false);
    }, 500); // 500ms debounce delay
  }, []);

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Trigger debounced fetch with current filters
    debouncedFetch(value, selectedClass, admissionNumberFilter);
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    // Class filter triggers immediate fetch (no debounce needed)
    setCurrentPage(1);
    fetchStudentsWithParams(1, searchTerm, value, admissionNumberFilter, false);
  };

  const handleAdmissionNumberChange = (value: string) => {
    setAdmissionNumberFilter(value);
    // Trigger debounced fetch with current filters
    debouncedFetch(searchTerm, selectedClass, value);
  };

  const clearFilters = () => {
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (admissionTimeoutRef.current) {
      clearTimeout(admissionTimeoutRef.current);
    }
    
    setSearchTerm('');
    setSelectedClass('');
    setAdmissionNumberFilter('');
    setCurrentPage(1);
    // Clear URL parameters completely when clearing filters
    setSearchParams({});
    // Immediately fetch data with no filters
    fetchStudentsWithParams(1, '', '', '', false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(page, searchTerm, selectedClass, admissionNumberFilter);
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
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
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNumber === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Get unique classes for filter dropdown from all students
  const uniqueClasses = Array.from(new Set([
    ...allStudents.map(s => s.class).filter(Boolean)
  ])).sort();

  // Calculate stats from filtered results (get all pages with current filters)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maleStudents: 0,
    femaleStudents: 0
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Prepare the data, converting empty strings to null for optional fields
      const studentData = {
        ...formData,
        upi_no: formData.upi_no || null,
        assessment_no: formData.assessment_no || null,
        other_names: formData.other_names || null,
        birth_entry_no: formData.birth_entry_no || null,
        disability: formData.disability || null,
        parent_guardian_email: formData.parent_guardian_email || null,
        full_name: `${formData.surname} ${formData.first_name} ${formData.other_names}`.trim()
      };
      
      // Use appropriate user type based on route
      const isSchoolRoute = window.location.pathname.startsWith('/school');
      const userType = isSchoolRoute ? 'school' : 'staff';
      
      await APIService.post(API_ENDPOINTS.STUDENTS, studentData, userType);
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
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');
    
    if (!uploadFile) {
      setError('Please select a file');
      setIsUploading(false);
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', uploadFile);

    try {
      setUploadProgress('Uploading and processing file...');
      
      // Use appropriate user type based on route
      const isSchoolRoute = window.location.pathname.startsWith('/school');
      const userType = isSchoolRoute ? 'school' : 'staff';
      
      // Check if we have the required token
      const requiredToken = userType === 'school' ? 'access_token' : 'staff_access_token';
      const tokenValue = localStorage.getItem(requiredToken);
      
      if (!tokenValue) {
        throw new Error(`Missing authentication token: ${requiredToken}. Please log in again.`);
      }
      
      const result = await APIService.fetch('/api/students/bulk_upload/', {
        method: 'POST',
        body: formDataUpload,
      }, userType);
      setUploadProgress(`Successfully uploaded ${result.created_count} students. ${result.error_count} errors.`);
      setShowUploadModal(false);
      setUploadFile(null);
      fetchStudents();
    } catch (err: any) {
      
      // Try to get more detailed error information
      let errorMessage = 'Upload failed';
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(`Upload failed: ${errorMessage}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading students...</div>
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
                Manage student records and admissions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowDownloadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Upload File
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Students</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Male Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.maleStudents}</p>
              </div>
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Female Students</p>
                <p className="text-2xl font-bold text-pink-600">{stats.femaleStudents}</p>
              </div>
              <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Pagination */}
        {renderPagination()}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name or Admission Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Class
              </label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="admission-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Admission Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="admission-filter"
                  value={admissionNumberFilter}
                  onChange={(e) => handleAdmissionNumberChange(e.target.value)}
                  placeholder="Enter admission number..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {students.length} of {totalCount} students
              {(searchTerm || selectedClass || admissionNumberFilter) && ' (filtered)'}
            </p>
            {(searchTerm || selectedClass || admissionNumberFilter) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading students...
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      {loading 
                        ? "Loading students..."
                        : totalCount === 0 
                          ? "No students found. Add some students to get started."
                          : "No students match the current filters."
                      }
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.surname}, {student.first_name} {student.other_names}
                          </div>
                          <div className="text-xs text-gray-400">
                            Gender: {student.gender} | DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Adm: {student.admission_number}</div>
                        {student.upi_no && <div className="text-sm text-gray-500">UPI: {student.upi_no}</div>}
                        {student.assessment_no && <div className="text-sm text-gray-500">Assessment: {student.assessment_no}</div>}
                        {student.birth_entry_no && <div className="text-xs text-gray-400">Birth Entry: {student.birth_entry_no}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Class: {student.class}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : student.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : student.status === 'graduated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                        {student.disability && (
                          <div className="text-xs text-orange-600 mt-1">
                            Disability: {student.disability}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.parent_guardian_name}</div>
                        <div className="text-sm text-gray-500">{student.parent_guardian_phone}</div>
                        {student.parent_guardian_email && (
                          <div className="text-xs text-gray-400">{student.parent_guardian_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.date_added).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
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
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
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
      />

      {/* Upload Student Modal */}
      <UploadStudentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        onSubmit={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Download Student Modal */}
      <DownloadStudentModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        students={students}
        allStudents={allStudents}
      />
    </div>
  );
}
