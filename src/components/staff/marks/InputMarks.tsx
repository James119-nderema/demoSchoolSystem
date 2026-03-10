import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarksAPI, APIService, API_ENDPOINTS } from '../../../services/baseUrl';
import jsPDF from 'jspdf';
import BulkUploadMarksModal from './BulkUploadMarksModal';

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
  class_id: string;
  class_name: string;
  class_code: string;
  subjects: TemplateSubject[];
  students: TemplateStudent[];
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
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
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

  // --- Auto-save draft helpers ---
  const DRAFT_KEY = 'inputMarks_draft';

  const saveDraft = (overrides: Record<string, any> = {}) => {
    try {
      const draft = {
        selectedClass: overrides.selectedClass ?? selectedClass,
        selectedSubject: overrides.selectedSubject ?? selectedSubject,
        examType: overrides.examType ?? examType,
        term: overrides.term ?? term,
        totalMarks: overrides.totalMarks ?? totalMarks,
        academicYear: overrides.academicYear ?? academicYear,
        studentMarks: overrides.studentMarks ?? studentMarks,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore quota errors */ }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
  };

  // --- Restore draft on mount ---
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    // Restore saved draft if available
    const draft = loadDraft();
    if (draft) {
      if (draft.selectedClass) setSelectedClass(draft.selectedClass);
      if (draft.selectedSubject) setSelectedSubject(draft.selectedSubject);
      if (draft.examType) setExamType(draft.examType);
      if (draft.term) setTerm(draft.term);
      if (draft.totalMarks) setTotalMarks(draft.totalMarks);
      if (draft.academicYear) setAcademicYear(draft.academicYear);
      if (draft.studentMarks) setStudentMarks(draft.studentMarks);
      setDraftRestored(true);
    }
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
    // Only reset subject on manual class change, not on draft restore
    if (!draftRestored) {
      setSelectedSubject('');
    } else {
      setDraftRestored(false);
    }
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
      // Initialize marks, merging any saved draft values
      const draft = loadDraft();
      const savedMarks = draft?.studentMarks || {};
      const initialMarks: { [key: string]: number } = {};
      data.students.forEach((student: Student) => {
        initialMarks[student.id] = savedMarks[student.id] ?? 0;
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

  // Open download modal
  const handleOpenDownloadModal = () => {
    setSelectedClassForDownload('');
    setShowDownloadModal(true);
  };

  // Generate PDF with student marks template (organized by class, 10 subject columns)
  const handleDownloadTemplate = async () => {
    setDownloadLoading(true);
    setError('');
    
    try {
      const params: Record<string, string> = {};
      if (selectedClassForDownload) {
        params.class_id = selectedClassForDownload;
      }
      
      const response = await APIService.get(API_ENDPOINTS.INPUT_MARKS.MARKS_TEMPLATE, params, 'staff');
      
      if (!response.success || !response.template_data || response.template_data.length === 0) {
        setError('No data available for download. Please ensure there are class-subject assignments.');
        setDownloadLoading(false);
        return;
      }
      
      const templateData: TemplateData[] = response.template_data;
      
      // Create PDF - landscape A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      
      let isFirstPage = true;
      
      for (const data of templateData) {
        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;
        
        let y = margin;
        
        // Header
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Student Marks Template - ${data.class_name}`, pageWidth / 2, y, { align: 'center' });
        y += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
        doc.text(`Students: ${data.students.length}  |  Subjects: ${data.subjects.length}`, pageWidth - margin, y, { align: 'right' });
        y += 8;
        
        // Column layout: # | Adm No | Full Name | up to 10 subjects
        const numWidth = 8;
        const admWidth = 22;
        const nameWidth = 40;
        const subjectCount = Math.min(data.subjects.length, 10);
        const remainingWidth = pageWidth - 2 * margin - numWidth - admWidth - nameWidth;
        const subjectWidth = remainingWidth / subjectCount;
        const tableWidth = numWidth + admWidth + nameWidth + subjectCount * subjectWidth;
        
        const drawHeader = (yPos: number): number => {
          const headerHeight = 8;
          doc.setDrawColor(50);
          doc.rect(margin, yPos, tableWidth, headerHeight);
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          
          let x = margin;
          // #
          doc.text('#', x + numWidth / 2, yPos + 5.5, { align: 'center' });
          x += numWidth;
          doc.line(x, yPos, x, yPos + headerHeight);
          
          // Adm No
          doc.text('Adm No', x + 2, yPos + 5.5);
          x += admWidth;
          doc.line(x, yPos, x, yPos + headerHeight);
          
          // Full Name
          doc.text('Full Name', x + 2, yPos + 5.5);
          x += nameWidth;
          doc.line(x, yPos, x, yPos + headerHeight);
          
          // Subject headers - empty (just draw column dividers)
          for (let i = 0; i < Math.min(data.subjects.length, 10); i++) {
            x += subjectWidth;
            doc.line(x, yPos, x, yPos + headerHeight);
          }
          
          doc.setFont('helvetica', 'normal');
          return yPos + headerHeight;
        };
        
        y = drawHeader(y);
        
        // Student rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const rowHeight = 6;
        
        data.students.forEach((student, idx) => {
          // Check page break
          if (y + rowHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
            
            // Re-draw mini header
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${data.class_name} (continued)`, margin, y);
            y += 6;
            y = drawHeader(y);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
          }
          
          doc.setDrawColor(180);
          doc.rect(margin, y, tableWidth, rowHeight);
          
          let x = margin;
          
          // Row number
          doc.text(String(idx + 1), x + numWidth / 2, y + 4, { align: 'center' });
          x += numWidth;
          doc.line(x, y, x, y + rowHeight);
          
          // Admission number
          const admText = student.assessment_no.length > 14 ? student.assessment_no.substring(0, 13) + '.' : student.assessment_no;
          doc.text(admText, x + 2, y + 4);
          x += admWidth;
          doc.line(x, y, x, y + rowHeight);
          
          // Full name
          const displayName = student.full_name.length > 28 ? student.full_name.substring(0, 26) + '..' : student.full_name;
          doc.text(displayName, x + 2, y + 4);
          x += nameWidth;
          doc.line(x, y, x, y + rowHeight);
          
          // Empty subject cells
          for (let i = 0; i < subjectCount; i++) {
            x += subjectWidth;
            doc.line(x, y, x, y + rowHeight);
          }
          
          y += rowHeight;
        });
      }
      
      // Save PDF
      const selectedClassName = dropdownData?.classes.find(c => c.id === selectedClassForDownload)?.class_name;
      const filename = selectedClassName
        ? `Marks_Template_${selectedClassName}.pdf`
        : 'Marks_Template_All_Classes.pdf';
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
    setStudentMarks(prev => {
      const updated = { ...prev, [studentId]: marks };
      saveDraft({ studentMarks: updated });
      return updated;
    });
  };

  // Auto-save form fields whenever they change
  useEffect(() => {
    if (selectedClass || selectedSubject || examType || term || totalMarks) {
      saveDraft();
    }
  }, [selectedClass, selectedSubject, examType, term, totalMarks, academicYear]);

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

      // Prepare results data - only include students with marks > 0
      const results = Object.entries(studentMarks)
        .filter(([_, marks]) => marks > 0)
        .map(([studentId, marks]) => ({
          student_id: studentId,
          marks: marks
        }));

      if (results.length === 0) {
        setError('Please enter marks for at least one student');
        setLoading(false);
        return;
      }

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
      let successMsg = `Successfully uploaded marks for ${data.successful_records} student(s).`;
      if (data.skipped_records > 0) {
        successMsg += ` ${data.skipped_records} student(s) skipped (already have marks): ${data.skipped_students?.join(', ')}.`;
      }
      setSuccess(successMsg);
      if (data.failed_records > 0) {
        setError(`${data.failed_records} records failed: ${data.errors.join(', ')}`);
      }
      
      // Clear saved draft and reset form
      clearDraft();
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
        // Conflict - all students already have marks
        const skippedNames = err.response.data.skipped_students?.join(', ');
        setError(err.response.data.error + (skippedNames ? ` (${skippedNames})` : ''));
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
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload from Excel
              </button>
              <button
                onClick={handleOpenDownloadModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template
              </button>
            </div>
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
                          Download a PDF template organized by class with up to 10 subject columns per page.
                        </p>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Class
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

        {/* Bulk Upload Modal */}
        <BulkUploadMarksModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          dropdownData={dropdownData}
        />

        {/* Alert Messages */}
        {/* Draft restored banner */}
        {students.length > 0 && Object.values(studentMarks).some(m => m > 0) && !success && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <span className="text-sm text-amber-800">
                You have unsaved marks in progress. They are auto-saved and will persist if you refresh.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setSelectedClass('');
                setSelectedSubject('');
                setExamType('');
                setTerm('');
                setTotalMarks('');
                setStudents([]);
                setStudentMarks({});
              }}
              className="ml-4 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md flex-shrink-0"
            >
              Discard Draft
            </button>
          </div>
        )}

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
