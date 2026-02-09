import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarksAPI, APIService, API_ENDPOINTS } from '../../../services/baseUrl';
import jsPDF from 'jspdf';

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  current_class: string;
}

interface Class {
  id: string;
  class_name: string;
  class_code: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
}

interface DropdownData {
  classes: Class[];
  subjects: Subject[];
  exam_types: { value: string; label: string }[];
  terms: { value: string; label: string }[];
}

interface TemplateSubject {
  id: string;
  name: string;
  code: string;
}

interface TemplateStudent {
  assessment_no: string;
  full_name: string;
  student_id: string;
  [key: string]: string; // For dynamic subject columns
}

interface TemplateData {
  teacher_id: string;
  teacher_name: string;
  class_id: string;
  class_name: string;
  class_code: string;
  subjects: TemplateSubject[];
  students: TemplateStudent[];
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

// interface StudentMark {
//   student_id: number;
//   marks: number;
// }

const InputMarks: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentMarks, setStudentMarks] = useState<{ [key: string]: number }>({});
  
  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherForDownload, setSelectedTeacherForDownload] = useState<string>('');
  const [selectedClassForDownload, setSelectedClassForDownload] = useState<string>('');
  
  // Form state
  const [selectedClass, setSelectedClass] = useState<string | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<string | ''>('');
  const [examType, setExamType] = useState<string>('');
  const [term, setTerm] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState<string>('2026');

  // Generate academic year options (current year and a few years back)
  const currentYear = new Date().getFullYear();
  const academicYearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
      fetchClassSubjects();
    } else {
      setStudents([]);
      setAvailableSubjects([]);
      setStudentMarks({});
    }
    // Reset selected subject when class changes
    setSelectedSubject('');
  }, [selectedClass]);

  const fetchDropdownData = async () => {
    try {
      const data = await MarksAPI.getDropdownData();
      setDropdownData(data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError('Failed to fetch dropdown data');
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const data = await MarksAPI.getClassStudents(selectedClass);
      setStudents(data.students);
      // Initialize marks for all students
      const initialMarks: { [key: string]: number } = {};
      data.students.forEach((student: Student) => {
        initialMarks[student.id] = 0;
      });
      setStudentMarks(initialMarks);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const fetchClassSubjects = async () => {
    if (!selectedClass) return;
    
    try {
      const data = await MarksAPI.getClassSubjects(selectedClass);
      setAvailableSubjects(data.subjects);
    } catch (err) {
      console.error('Error fetching subjects for class:', err);
      setError('Failed to fetch subjects for selected class');
    }
  };

  // Check if user is Director of Studies or Administrative Staff (school admin)
  const checkUserRole = () => {
    const staffInfo = localStorage.getItem('staff_info');
    if (staffInfo) {
      const parsed = JSON.parse(staffInfo);
      return parsed.role === 'DIRECTOR_OF_STUDIES' || parsed.role === 'ADMINISTRATIVE_STAFF';
    }
    // School admin logged in via school login
    const schoolInfo = localStorage.getItem('school_info');
    if (schoolInfo) {
      return true;
    }
    return false;
  };

  // Fetch available teachers for download (Director only)
  const fetchAvailableTeachers = async () => {
    try {
      const response = await APIService.get(API_ENDPOINTS.INPUT_MARKS.AVAILABLE_TEACHERS, undefined, 'staff');
      if (response.success) {
        setAvailableTeachers(response.teachers || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  // Open download modal
  const handleOpenDownloadModal = () => {
    const isDOS = checkUserRole();
    setIsDirector(isDOS);
    if (isDOS) {
      fetchAvailableTeachers();
    }
    setSelectedTeacherForDownload('');
    setSelectedClassForDownload('');
    setShowDownloadModal(true);
  };

  // Generate PDF with student marks template
  const handleDownloadTemplate = async () => {
    setDownloadLoading(true);
    setError('');
    
    try {
      const params: Record<string, string> = {};
      if (selectedTeacherForDownload) {
        params.teacher_id = selectedTeacherForDownload;
      }
      if (selectedClassForDownload) {
        params.class_id = selectedClassForDownload;
      }
      
      const response = await APIService.get(API_ENDPOINTS.INPUT_MARKS.MARKS_TEMPLATE, params, 'staff');
      
      if (!response.success || !response.template_data || response.template_data.length === 0) {
        setError('No data available for download. Please ensure you have class-subject assignments.');
        setDownloadLoading(false);
        return;
      }
      
      const templateData: TemplateData[] = response.template_data;
      
      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      
      let isFirstPage = true;
      
      // Generate a page for each class-teacher combination
      for (const data of templateData) {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;
        
        let y = margin;
        
        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Student Marks Template - ${data.class_name}`, pageWidth / 2, y, { align: 'center' });
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Teacher: ${data.teacher_name}`, margin, y);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, y);
        y += 10;
        
        // Calculate column widths
        const assessmentWidth = 25;
        const nameWidth = 45;
        const subjectCount = data.subjects.length;
        const remainingWidth = pageWidth - 2 * margin - assessmentWidth - nameWidth;
        const subjectWidth = Math.min(20, remainingWidth / subjectCount);
        
        // Table header
        doc.setFillColor(200, 200, 200);
        const headerHeight = 8;
        doc.rect(margin, y, pageWidth - 2 * margin, headerHeight, 'F');
        doc.setDrawColor(0);
        doc.rect(margin, y, pageWidth - 2 * margin, headerHeight);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        let x = margin;
        doc.text('Assessment No', x + 2, y + 5);
        x += assessmentWidth;
        doc.line(x, y, x, y + headerHeight);
        
        doc.text('Full Name', x + 2, y + 5);
        x += nameWidth;
        doc.line(x, y, x, y + headerHeight);
        
        // Subject headers
        for (const subj of data.subjects) {
          const subjText = subj.name.length > 8 ? subj.name.substring(0, 8) : subj.name;
          doc.text(subjText, x + 2, y + 5);
          x += subjectWidth;
          doc.line(x, y, x, y + headerHeight);
        }
        
        y += headerHeight;
        
        // Student rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const rowHeight = 6;
        
        for (const student of data.students) {
          // Check if we need a new page
          if (y + rowHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
            
            // Re-draw header on new page
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${data.class_name} - Teacher: ${data.teacher_name}`, margin, y);
            y += 8;
            
            // Re-draw table header
            doc.setFillColor(200, 200, 200);
            doc.rect(margin, y, pageWidth - 2 * margin, headerHeight, 'F');
            doc.rect(margin, y, pageWidth - 2 * margin, headerHeight);
            
            doc.setFontSize(8);
            x = margin;
            doc.text('Assessment No', x + 2, y + 5);
            x += assessmentWidth;
            doc.line(x, y, x, y + headerHeight);
            
            doc.text('Full Name', x + 2, y + 5);
            x += nameWidth;
            doc.line(x, y, x, y + headerHeight);
            
            for (const subj of data.subjects) {
              const subjText = subj.name.length > 8 ? subj.name.substring(0, 8) : subj.name;
              doc.text(subjText, x + 2, y + 5);
              x += subjectWidth;
              doc.line(x, y, x, y + headerHeight);
            }
            
            y += headerHeight;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
          }
          
          // Draw row
          doc.rect(margin, y, pageWidth - 2 * margin, rowHeight);
          
          x = margin;
          doc.text(student.assessment_no.substring(0, 12), x + 2, y + 4);
          x += assessmentWidth;
          doc.line(x, y, x, y + rowHeight);
          
          const displayName = student.full_name.length > 25 ? student.full_name.substring(0, 23) + '..' : student.full_name;
          doc.text(displayName, x + 2, y + 4);
          x += nameWidth;
          doc.line(x, y, x, y + rowHeight);
          
          // Empty cells for marks
          for (let i = 0; i < data.subjects.length; i++) {
            x += subjectWidth;
            doc.line(x, y, x, y + rowHeight);
          }
          
          y += rowHeight;
        }
      }
      
      // Save PDF
      const filename = isDirector && selectedTeacherForDownload 
        ? `Marks_Template_${availableTeachers.find(t => t.id === selectedTeacherForDownload)?.full_name || 'Teacher'}.pdf`
        : 'Marks_Template.pdf';
      doc.save(filename);
      
      setSuccess('Template downloaded successfully!');
      setShowDownloadModal(false);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Error downloading template:', err);
      setError(err.message || 'Failed to download template');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, marks: number) => {
    if (marks < 0) return; // Don't allow negative numbers
    
    if (totalMarks && marks > totalMarks) {
      setError(`Marks cannot exceed total marks (${totalMarks})`);
      return;
    }
    
    setError(''); // Clear error if marks are valid
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: marks
    }));
  };

  const calculatePercentage = (marks: number): string => {
    if (!totalMarks || totalMarks === 0) return '0%';
    return `${((marks / totalMarks) * 100).toFixed(1)}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!selectedClass || !selectedSubject || !examType || !term || !totalMarks) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Check if results already exist for this combination
      try {
        const existingResults = await MarksAPI.checkExistingResults({
          class_id: selectedClass,
          subject_id: selectedSubject,
          exam_type: examType,
          term: term,
          academic_year: academicYear
        });
        
        if (existingResults && existingResults.length > 0) {
          const confirmOverwrite = window.confirm(
            `Results for this class, subject, exam type, and term combination already exist. Do you want to proceed? This may create duplicate entries for some students.`
          );
          
          if (!confirmOverwrite) {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // If check fails, continue with submission but log the error
        console.warn('Could not check for existing results:', err);
      }

      // Prepare results data
      const results = Object.entries(studentMarks).map(([studentId, marks]) => ({
        student_id: studentId,
        marks: marks
      }));

      const submitData = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        exam_type: examType,
        term: term,
        total_marks: totalMarks,
        academic_year: academicYear,
        results: results
      };

      const data = await MarksAPI.bulkInput(submitData);
      setSuccess(`Successfully processed ${data.successful_records} out of ${data.total_records} records`);
      if (data.failed_records > 0) {
        setError(`${data.failed_records} records failed: ${data.errors.join(', ')}`);
      }
      
      // Reset form
      setSelectedClass('');
      setSelectedSubject('');
      setExamType('');
      setTerm('');
      setTotalMarks('');
      setStudents([]);
      setStudentMarks({});
    } catch (err: any) {
      console.error('Bulk input error:', err);
      
      // Handle specific error types
      if (err.response?.status === 409) {
        // Conflict - results already exist
        setError(err.response.data.error || 'Results for this combination have already been uploaded.');
      } else if (err.response?.status === 403) {
        // Forbidden - no permission
        setError(err.response.data.error || 'You do not have permission to input marks for this class-subject combination.');
      } else if (err.response?.data?.error) {
        // Other API errors
        setError(err.response.data.error);
      } else {
        // Network or other errors
        setError('An error occurred while submitting results. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const allMarksEntered = () => {
    return students.length > 0 && Object.keys(studentMarks).length === students.length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/results')}
            className="mb-4 text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Input Student Marks</h1>
              <p className="mt-2 text-gray-600">Enter examination marks for students in bulk</p>
            </div>
            <button
              onClick={handleOpenDownloadModal}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>
        </div>

        {/* Download Template Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDownloadModal(false)}></div>
              </div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Download Student Marks Template
                      </h3>
                      <div className="mt-4 space-y-4">
                        <p className="text-sm text-gray-500">
                          Download a PDF template with student names and columns for each subject you teach.
                        </p>
                        
                        {isDirector && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Teacher (Optional)
                              </label>
                              <select
                                value={selectedTeacherForDownload}
                                onChange={(e) => setSelectedTeacherForDownload(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              >
                                <option value="">All Teachers</option>
                                {availableTeachers.map((teacher) => (
                                  <option key={teacher.id} value={teacher.id}>
                                    {teacher.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Class (Optional)
                          </label>
                          <select
                            value={selectedClassForDownload}
                            onChange={(e) => setSelectedClassForDownload(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">All Classes</option>
                            {dropdownData?.classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.class_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {downloadLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Download PDF'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDownloadModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selection Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Class</option>
                  {dropdownData?.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} ({cls.class_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {!selectedClass ? "Select a class first" : "Select Subject"}
                  </option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name} ({subject.subject_code})
                    </option>
                  ))}
                  {selectedClass && availableSubjects.length === 0 && (
                    <option value="" disabled>
                      No subjects assigned for this class
                    </option>
                  )}
                </select>
              </div>

              {/* Exam Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Exam Type</option>
                  {dropdownData?.exam_types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Term</option>
                  {dropdownData?.terms.map((termOption) => (
                    <option key={termOption.value} value={termOption.value}>
                      {termOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Marks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 100"
                  required
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Marks - Desktop Table / Mobile Cards */}
          {students.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Student Marks ({students.length} students)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Enter marks for each student. Maximum marks: {totalMarks || 'Not set'}
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks Obtained
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Class: {student.current_class}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.admission_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={totalMarks || undefined}
                            value={studentMarks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0"
                          />
                          {totalMarks && (
                            <span className="ml-2 text-sm text-gray-500">
                              / {totalMarks}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {calculatePercentage(studentMarks[student.id] || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {students.map((student, index) => (
                  <div key={student.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                    {/* Student Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {student.full_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {student.admission_number}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {student.current_class}
                      </span>
                    </div>

                    {/* Marks Input Section */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Marks Obtained
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={totalMarks || undefined}
                              value={studentMarks[student.id] || ''}
                              onChange={(e) => handleMarkChange(student.id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium"
                              placeholder="0"
                            />
                            {totalMarks && (
                              <span className="text-sm text-gray-500 font-medium">
                                / {totalMarks}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Percentage
                          </label>
                          <span className="text-lg font-bold text-indigo-600">
                            {calculatePercentage(studentMarks[student.id] || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !allMarksEntered()}
                className={`px-6 py-3 border border-transparent text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading || !allMarksEntered()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Marks'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InputMarks;
