import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIService, API_ENDPOINTS, DataAPI, SmsCreditsAPI } from '../../services/baseUrl';
import { usePermissions } from '../../hooks/usePermissions';
import AddStudentModal from '../generalFiles/students/modals/AddStudentModal';
import UploadStudentModal from '../generalFiles/students/modals/UploadStudentModal';
import { sendBulkSms } from '../../services/smsService';
import type { SmsMessage } from '../../services/smsService';

interface Student {
  id: number;
  photo?: string | null;
  photo_url?: string | null;
  upi_no?: string;
  assessment_no?: string;
  surname?: string;
  first_name?: string;
  other_names?: string;
  full_name: string;
  admission_number: string;
  admission_class: string;
  current_class: string;
  class_field?: string;
  class?: string;
  date_of_birth: string;
  birth_entry_no?: string;
  disability?: string;
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

type PortalRecipientMode = 'individual' | 'class' | 'school';

const StaffStudents: React.FC = () => {
  const navigate = useNavigate();
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPortalInfoModal, setShowPortalInfoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDefaultPhoto, setUploadDefaultPhoto] = useState<File | null>(null);
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [studentPhotoPreview, setStudentPhotoPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isSendingPortalInfo, setIsSendingPortalInfo] = useState(false);
  const [isLoadingPortalRecipients, setIsLoadingPortalRecipients] = useState(false);
  const [portalRecipientMode, setPortalRecipientMode] = useState<PortalRecipientMode>('individual');
  const [portalSearchTerm, setPortalSearchTerm] = useState('');
  const [portalSelectedClass, setPortalSelectedClass] = useState('');
  const [portalSelectedStudentId, setPortalSelectedStudentId] = useState('');
  const [portalStudents, setPortalStudents] = useState<Student[]>([]);
  const [portalResult, setPortalResult] = useState<string>('');
  
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
  const { canAddStudents, canUploadStudents, canViewAllStudents, canEditStudents, canDeleteStudents } = usePermissions();

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm, selectedClass, selectedStatus]);

  useEffect(() => {
    return () => {
      if (studentPhotoPreview) {
        URL.revokeObjectURL(studentPhotoPreview);
      }
    };
  }, [studentPhotoPreview]);

  const clearStudentPhotoState = () => {
    if (studentPhotoPreview) {
      URL.revokeObjectURL(studentPhotoPreview);
    }
    setStudentPhoto(null);
    setStudentPhotoPreview('');
  };

  const buildStudentFormPayload = () => {
    const payload = new FormData();
    payload.append('upi_no', formData.upi_no || '');
    payload.append('assessment_no', formData.assessment_no || '');
    payload.append('surname', formData.surname || '');
    payload.append('first_name', formData.first_name || '');
    payload.append('other_names', formData.other_names || '');
    payload.append('gender', formData.gender || '');
    payload.append('date_of_birth', formData.date_of_birth || '');
    payload.append('birth_entry_no', formData.birth_entry_no || '');
    payload.append('disability', formData.disability || '');
    payload.append('admission_number', formData.admission_number || '');
    payload.append('class_field', formData.class || '');
    payload.append('parent_guardian_name', formData.parent_guardian_name || '');
    payload.append('parent_guardian_phone', formData.parent_guardian_phone || '');
    payload.append('parent_guardian_email', formData.parent_guardian_email || '');
    payload.append('address', formData.address || '');
    payload.append('status', formData.status || 'active');
    if (studentPhoto) {
      payload.append('photo', studentPhoto);
    }
    return payload;
  };

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
      const payload = buildStudentFormPayload();
      await DataAPI.createStudent(payload);
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
      clearStudentPhotoState();
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
      if (uploadDefaultPhoto) {
        formData.append('default_photo', uploadDefaultPhoto);
      }
      
      const result = await DataAPI.bulkUploadStudents(formData, (progress) => {
        setUploadProgress(`Uploading... ${progress}%`);
      });
      
      // Build success message with classes created info
      let successMessage = `Successfully uploaded ${result.created_count || 0} students.`;
      if (result.classes_created_count && result.classes_created_count > 0) {
        successMessage += ` ${result.classes_created_count} new class(es) created.`;
      }
      if (result.error_count && result.error_count > 0) {
        successMessage += ` ${result.error_count} error(s).`;
      }
      
      setSuccessMessage(successMessage);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDefaultPhoto(null);
      setUploadProgress('');
      fetchStudents();
      setTimeout(() => setSuccessMessage(''), 5000);
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

  const getStudentClass = (student: Student) => (
    student.current_class || student.admission_class || student.class_field || student.class || ''
  );

  const portalClasses = [...new Set(portalStudents.map(getStudentClass).filter(Boolean))].sort();

  const getPortalSearchMatches = () => {
    const query = portalSearchTerm.trim().toLowerCase();
    return portalStudents.filter(student => {
      const matchesMode = portalRecipientMode === 'school'
        || (portalRecipientMode === 'class' && getStudentClass(student) === portalSelectedClass)
        || portalRecipientMode === 'individual';

      if (!matchesMode) return false;
      if (!query) return true;

      return (
        student.full_name?.toLowerCase().includes(query) ||
        student.admission_number?.toLowerCase().includes(query)
      );
    });
  };

  const getPortalRecipients = () => {
    if (portalRecipientMode === 'individual') {
      return portalStudents.filter(student => student.id.toString() === portalSelectedStudentId);
    }

    return getPortalSearchMatches();
  };

  const openPortalInfoModal = async () => {
    setShowPortalInfoModal(true);
    setPortalRecipientMode('individual');
    setPortalSearchTerm('');
    setPortalSelectedClass('');
    setPortalSelectedStudentId('');
    setPortalResult('');
    setError('');
    setIsLoadingPortalRecipients(true);

    try {
      const allRows: Student[] = [];
      const pageLimit = 200;
      let page = 1;
      let totalAvailable: number | null = null;

      while (true) {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageLimit.toString(),
          status: 'active',
        });

        if (canViewAllStudents()) {
          params.append('view_all', 'true');
        }

        const response = await APIService.get(`/api/students/?${params.toString()}`, undefined, 'staff');
        const rows: Student[] = response?.results ? response.results : (Array.isArray(response) ? response : []);

        if (typeof response?.count === 'number') {
          totalAvailable = response.count;
        }

        allRows.push(...rows);

        if (!response?.results || rows.length === 0) break;
        if (totalAvailable !== null && allRows.length >= totalAvailable) break;
        if (rows.length < pageLimit && !response?.next) break;

        page += 1;
      }

      setPortalStudents(allRows);
      if (allRows.length > 0) {
        setPortalSelectedStudentId(allRows[0].id.toString());
      }
    } catch (err: any) {
      console.error('Error loading portal recipients:', err);
      setPortalResult(err.message || 'Failed to load students for portal info.');
      setPortalStudents([]);
    } finally {
      setIsLoadingPortalRecipients(false);
    }
  };

  const closePortalInfoModal = () => {
    if (isSendingPortalInfo) return;
    setShowPortalInfoModal(false);
    setPortalResult('');
  };

  const handleSendPortalInfo = async () => {
    const recipients = getPortalRecipients();
    const messages: SmsMessage[] = recipients
      .filter(student => student.parent_guardian_phone)
      .map(student => ({
        recipient: {
          phoneNumber: student.parent_guardian_phone,
          studentName: student.full_name,
          studentId: student.id.toString(),
          parentName: student.parent_guardian_name || undefined,
        },
        message: `Dear Parent/Guardian, to register or access the parent portal for ${student.full_name}, use Student Name: ${student.full_name} and Admission No: ${student.admission_number} exactly as registered in the school system.`,
      }));

    if (messages.length === 0) {
      setPortalResult('No parent phone numbers found for the selected students.');
      return;
    }

    setIsSendingPortalInfo(true);
    setError('');
    setSuccessMessage('');
    setPortalResult('');

    try {
      const result = await sendBulkSms(messages);
      try {
        await SmsCreditsAPI.recordUsage({
          recipient_count: messages.length,
          successful_count: result.totalSent,
          failed_count: result.totalFailed,
          message_type: 'parent_portal_registration_info',
        });
      } catch {
        // Keep the visible result focused on SMS delivery.
      }
      const message = `Sent ${result.totalSent} parent portal info message(s). Failed: ${result.totalFailed}.`;
      setPortalResult(message);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setPortalResult(err.message || 'Failed to send parent portal information.');
    } finally {
      setIsSendingPortalInfo(false);
    }
  };

  // Edit student handler
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    clearStudentPhotoState();
    setFormData({
      upi_no: student.upi_no || '',
      assessment_no: student.assessment_no || '',
      surname: student.surname || student.full_name?.split(' ')[0] || '',
      first_name: student.first_name || student.full_name?.split(' ').slice(1).join(' ') || '',
      other_names: student.other_names || '',
      gender: student.gender || '',
      date_of_birth: student.date_of_birth || '',
      birth_entry_no: student.birth_entry_no || '',
      disability: student.disability || '',
      admission_number: student.admission_number || '',
      class: student.class_field || student.class || student.current_class || '',
      parent_guardian_name: student.parent_guardian_name || '',
      parent_guardian_phone: student.parent_guardian_phone || '',
      parent_guardian_email: student.parent_guardian_email || '',
      address: student.address || '',
      status: student.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const studentData = buildStudentFormPayload();
      
      await APIService.put(`${API_ENDPOINTS.STUDENTS}${selectedStudent.id}/`, studentData, 'staff');
      
      setShowEditModal(false);
      setSelectedStudent(null);
      setFormData({
        upi_no: '', assessment_no: '', surname: '', first_name: '', other_names: '',
        gender: '', date_of_birth: '', birth_entry_no: '', disability: '',
        admission_number: '', class: '', parent_guardian_name: '',
        parent_guardian_phone: '', parent_guardian_email: '', address: '', status: 'active'
      });
      clearStudentPhotoState();
      
      await fetchStudents();
      setSuccessMessage('Student updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await APIService.delete(`${API_ENDPOINTS.STUDENTS}${selectedStudent.id}/`, 'staff');
      
      setShowDeleteModal(false);
      setSelectedStudent(null);
      
      await fetchStudents();
      setSuccessMessage('Student deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

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
            {(canAddStudents() || canUploadStudents() || filteredStudents.length > 0) && (
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
                {filteredStudents.length > 0 && (
                  <button
                    onClick={openPortalInfoModal}
                    disabled={isLoadingPortalRecipients}
                    className="inline-flex items-center px-4 py-2 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                  >
                    {isLoadingPortalRecipients ? (
                      <span className="-ml-1 mr-2 h-5 w-5 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                    ) : (
                      <svg className="-ml-1 mr-2 h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    Send Portal Info
                  </button>
                )}
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

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                  {(canEditStudents() || canDeleteStudents()) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
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
                    <tr key={student.id} onClick={() => navigate(`/students/${student.id}`)} className="hover:bg-indigo-50/50 cursor-pointer transition-colors">
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
                      {(canEditStudents() || canDeleteStudents()) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {canEditStudents() && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                title="Edit student"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDeleteStudents() && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(student); }}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Delete student"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
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
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">
                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{student.full_name}</h3>
                          <p className="text-xs text-gray-500">Adm: {student.admission_number}</p>
                        </div>
                      </div>
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
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Class: </span>
                        <span className="font-medium text-gray-900">{student.current_class || student.admission_class}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Age: </span>
                        <span className="text-gray-900">{student.age ? `${student.age} yrs` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender: </span>
                        <span className="text-gray-900 capitalize">{student.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Guardian: </span>
                        <span className="text-gray-900">{student.parent_guardian_name || 'N/A'}</span>
                      </div>
                    </div>
                    {student.parent_guardian_phone && (
                      <div className="mt-2 text-xs text-gray-500">
                        📞 {student.parent_guardian_phone}
                      </div>
                    )}
                    {(canEditStudents() || canDeleteStudents()) && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
                        {canEditStudents() && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
                          >
                            <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}
                        {canDeleteStudents() && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(student); }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                          >
                            <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      
      {/* Parent Portal Info Modal */}
      {showPortalInfoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closePortalInfoModal} />
            <div className="relative w-full max-w-3xl overflow-hidden bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Send Parent Portal Info</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose recipients, then send the student name and admission number parents should use.</p>
                </div>
                <button
                  onClick={closePortalInfoModal}
                  disabled={isSendingPortalInfo}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['individual', 'class', 'school'] as PortalRecipientMode[]).map(mode => (
                    <label key={mode} className={`border rounded-lg p-3 cursor-pointer ${portalRecipientMode === mode ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                      <input
                        type="radio"
                        name="portalRecipientMode"
                        value={mode}
                        checked={portalRecipientMode === mode}
                        onChange={() => {
                          setPortalRecipientMode(mode);
                          setPortalResult('');
                        }}
                        className="mr-2 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {mode === 'individual' ? 'Individual Student' : mode === 'class' ? 'Class' : 'Whole School'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or admission no</label>
                    <input
                      type="text"
                      value={portalSearchTerm}
                      onChange={(e) => setPortalSearchTerm(e.target.value)}
                      placeholder="Type student name or admission number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {portalRecipientMode === 'class' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <select
                        value={portalSelectedClass}
                        onChange={(e) => setPortalSelectedClass(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select class</option>
                        {portalClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isLoadingPortalRecipients ? (
                  <div className="py-10 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  (() => {
                    const visibleRows = getPortalSearchMatches();
                    const recipients = getPortalRecipients();
                    const reachableCount = recipients.filter(student => student.parent_guardian_phone).length;
                    const missingCount = recipients.length - reachableCount;

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Selected</p>
                            <p className="text-lg font-semibold text-gray-900">{recipients.length}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-700">Ready to send</p>
                            <p className="text-lg font-semibold text-green-900">{reachableCount}</p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs text-amber-700">Missing phone</p>
                            <p className="text-lg font-semibold text-amber-900">{missingCount}</p>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                          {visibleRows.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">No students match this selection.</div>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  {portalRecipientMode === 'individual' && <th className="px-4 py-2"></th>}
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Phone</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {visibleRows.slice(0, 100).map(student => (
                                  <tr key={student.id}>
                                    {portalRecipientMode === 'individual' && (
                                      <td className="px-4 py-3">
                                        <input
                                          type="radio"
                                          name="portalStudent"
                                          checked={portalSelectedStudentId === student.id.toString()}
                                          onChange={() => setPortalSelectedStudentId(student.id.toString())}
                                          className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                      </td>
                                    )}
                                    <td className="px-4 py-3 text-sm">
                                      <p className="font-medium text-gray-900">{student.full_name}</p>
                                      <p className="text-gray-500">{student.admission_number}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{getStudentClass(student) || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{student.parent_guardian_phone || 'Missing'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        {visibleRows.length > 100 && (
                          <p className="text-xs text-gray-500">Showing first 100 matching students. Narrow the search to pick an individual student faster.</p>
                        )}
                      </>
                    );
                  })()
                )}

                {portalResult && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
                    {portalResult}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closePortalInfoModal}
                  disabled={isSendingPortalInfo}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendPortalInfo}
                  disabled={
                    isSendingPortalInfo ||
                    isLoadingPortalRecipients ||
                    (portalRecipientMode === 'individual' && !portalSelectedStudentId) ||
                    (portalRecipientMode === 'class' && !portalSelectedClass) ||
                    getPortalRecipients().filter(student => student.parent_guardian_phone).length === 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSendingPortalInfo && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          clearStudentPhotoState();
        }}
        formData={formData}
        setFormData={setFormData}
        studentPhoto={studentPhoto}
        setStudentPhoto={setStudentPhoto}
        studentPhotoPreview={studentPhotoPreview}
        setStudentPhotoPreview={setStudentPhotoPreview}
        onSubmit={handleAddStudent}
        isSubmitting={isSubmitting}
        title="Add New Student"
      />
      
      {/* Upload Students Modal */}
      <UploadStudentModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadDefaultPhoto(null);
        }}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        defaultPhoto={uploadDefaultPhoto}
        setDefaultPhoto={setUploadDefaultPhoto}
        onSubmit={handleUploadStudents}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Edit Student Modal */}
      <AddStudentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
          clearStudentPhotoState();
        }}
        formData={formData}
        setFormData={setFormData}
        studentPhoto={studentPhoto}
        setStudentPhoto={setStudentPhoto}
        studentPhotoPreview={studentPhotoPreview}
        setStudentPhotoPreview={setStudentPhotoPreview}
        existingPhotoUrl={selectedStudent?.photo_url || null}
        onSubmit={handleUpdateStudent}
        isSubmitting={isSubmitting}
        title="Edit Student"
        isEditMode={true}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }} />
            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Student</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete <span className="font-semibold">{selectedStudent.full_name}</span>? 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setSelectedStudent(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffStudents;
