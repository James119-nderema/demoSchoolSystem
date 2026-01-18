import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Eye, FileText, Users, User, School, Loader2, Check, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import { APIService, DataAPI, MarksAPI, API_ENDPOINTS } from '../../services/baseUrl';
import { generateTemplate1PDF } from './HighSchoolReportPDF';
import { generateTemplate2PDF } from './Grade8CBCReportPDF';
import { getRemarks } from './utils/reportUtils';
import type { 
  Template, 
  SchoolInfo, 
  ClassOption, 
  StudentOption, 
  ExamTypeOption, 
  TermOption, 
  StudentReportData, 
  BackendStudentReport 
} from './utils/reportTypes';

// Transform backend data to frontend format
const transformBackendToFrontend = (backendData: BackendStudentReport): StudentReportData => {
  return {
    student: {
      full_name: backendData.student_info.name,
      admission_number: backendData.student_info.admission_number,
      current_class: backendData.student_info.class || backendData.student_info.class_name || '',
      position: backendData.summary.position,
      total_students: backendData.summary.total_students
    },
    results: backendData.subjects.map(subj => ({
      subject_name: subj.subject,
      marks_obtained: subj.marks_obtained,
      total_marks: subj.total_marks,
      percentage: subj.percentage,
      grade: subj.grade,
      remarks: getRemarks(subj.percentage)
    })),
    overall: {
      total_marks: backendData.summary.total_marks_obtained,
      average: backendData.summary.overall_percentage,
      grade: backendData.summary.overall_grade,
      position: backendData.summary.position,
      out_of: backendData.summary.total_students || 0,
      class_average: backendData.summary.class_average
    },
    school_info: backendData.school_info,
    exam_info: backendData.exam_info
  };
};

// Template definitions
const templates: Template[] = [
  {
    id: 'template1',
    name: 'High School Report Form',
    description: 'Comprehensive high school report card with progress tracking and performance analysis',
    file: '/templates/template1.html',
    thumbnail: '/templates/template1.html',
    type: 'high-school'
  },
  {
    id: 'template2',
    name: 'Grade 8 Assessment Report',
    description: 'CBC-aligned assessment report with competency-based ratings (EE, ME, AE, BE)',
    file: '/templates/template2.html',
    thumbnail: '/templates/template2.html',
    type: 'grade-8'
  }
];

const ReportsPage: React.FC = () => {
  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showExamSelection, setShowExamSelection] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showStudentSelection, setShowStudentSelection] = useState(false);
  const [showClassSelection, setShowClassSelection] = useState(false);

  // Data states
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);

  // Selection states - changed to array for multi-select
  const [selectedExamTypes, setSelectedExamTypes] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Toggle exam type selection
  const toggleExamType = (examValue: string) => {
    setSelectedExamTypes(prev => 
      prev.includes(examValue)
        ? prev.filter(e => e !== examValue)
        : [...prev, examValue]
    );
  };

  // Fetch initial data
  useEffect(() => {
    fetchSchoolInfo();
    fetchDropdownData();
    fetchClasses();
  }, []);

  // Fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchSchoolInfo = async () => {
    try {
      // Check if staff or school user
      const staffInfo = localStorage.getItem('staff_info');
      const schoolInfo = localStorage.getItem('school_info');
      
      if (staffInfo) {
        // For staff users, get school info from staff endpoint
        const user = JSON.parse(staffInfo);
        // Use staff endpoint to get school info
        try {
          const response = await APIService.get('/api/staff/school-info/', undefined, 'staff');
          setSchoolInfo(response);
        } catch (staffErr) {
          // Fallback: use staff_info data if available
          console.warn('Could not fetch school info from staff endpoint, using cached data');
          setSchoolInfo({
            id: user.school_id,
            school_name: user.school_name || 'School',
            principal_name: '',
            phone_number: '',
            email: '',
            address: '',
            motto: '',
            vision: '',
            mission: '',
            logo_url: null
          });
        }
      } else if (schoolInfo) {
        // For school users, use school endpoint
        const user = JSON.parse(schoolInfo);
        const schoolId = user.id;
        if (schoolId) {
          const response = await DataAPI.getSchool(schoolId.toString());
          setSchoolInfo(response);
        }
      }
    } catch (err) {
      console.error('Error fetching school info:', err);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const data = await MarksAPI.getDropdownData();
      if (data.exam_types) {
        setExamTypes(data.exam_types);
      }
      if (data.terms) {
        setTerms(data.terms);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      // Set defaults
      setExamTypes([
        { value: 'exam_1', label: 'Exam 1' },
        { value: 'exam_2', label: 'Exam 2' },
        { value: 'cat_1', label: 'CAT 1' },
        { value: 'cat_2', label: 'CAT 2' }
      ]);
      setTerms([
        { value: '1', label: 'Term 1' },
        { value: '2', label: 'Term 2' },
        { value: '3', label: 'Term 3' }
      ]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await DataAPI.getClasses();
      if (response.results) {
        setClasses(response.results);
      } else if (Array.isArray(response)) {
        setClasses(response);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      const response = await MarksAPI.getClassStudents(classId);
      if (response.students) {
        setStudents(response.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchStudentReportData = async (studentId: string): Promise<StudentReportData[]> => {
    try {
      const allReports: StudentReportData[] = [];
      
      // Fetch data for each selected exam type
      for (const examType of selectedExamTypes) {
        const params: Record<string, string> = {
          student_id: studentId,
          term: selectedTerm,
          academic_year: selectedYear,
          exam_type: examType
        };

        try {
          const response = await APIService.get(API_ENDPOINTS.REPORTS.STUDENT_REPORT_DATA, params, 'staff');
          // Transform backend response to frontend format
          const report = transformBackendToFrontend(response as BackendStudentReport);
          // Add exam type info to report for labeling
          if (report.exam_info) {
            report.exam_info.exam_type = examType;
          }
          allReports.push(report);
        } catch (err) {
          console.warn(`No data found for exam type: ${examType}`);
        }
      }
      
      return allReports;
    } catch (err) {
      console.error('Error fetching student report data:', err);
      return [];
    }
  };

  const fetchBulkReportData = async (classId?: string): Promise<StudentReportData[]> => {
    try {
      const allReports: StudentReportData[] = [];
      
      // Fetch data for each selected exam type
      for (const examType of selectedExamTypes) {
        const params: Record<string, string> = {
          term: selectedTerm,
          academic_year: selectedYear,
          exam_type: examType
        };

        if (classId) {
          params.class_id = classId;
        }

        try {
          const response = await APIService.get(API_ENDPOINTS.REPORTS.BULK_REPORT_DATA, params, 'staff');
          // Transform backend response array to frontend format
          const reports = response.reports || response.students || [];
          const transformedReports = reports.map((report: BackendStudentReport) => {
            const transformed = transformBackendToFrontend(report);
            // Add exam type info for labeling
            if (transformed.exam_info) {
              transformed.exam_info.exam_type = examType;
            }
            return transformed;
          });
          allReports.push(...transformedReports);
        } catch (err) {
          console.warn(`No data found for exam type: ${examType}`);
        }
      }
      
      return allReports;
    } catch (err) {
      console.error('Error fetching bulk report data:', err);
      return [];
    }
  };

  // Template preview click handler
  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // Close all modals
  const closeAllModals = () => {
    setShowPreview(false);
    setShowExamSelection(false);
    setShowDownloadOptions(false);
    setShowStudentSelection(false);
    setShowClassSelection(false);
    setError(null);
    setSuccess(null);
  };

  // Handle "Use This" button
  const handleUseTemplate = () => {
    setShowPreview(false);
    setShowExamSelection(true);
  };

  // Handle exam selection next
  const handleExamSelectionNext = () => {
    if (selectedExamTypes.length === 0 || !selectedTerm || !selectedYear) {
      setError('Please select at least one exam type, term, and year');
      return;
    }
    setShowExamSelection(false);
    setShowDownloadOptions(true);
  };

  // Main PDF generation function
  const generatePDF = async (studentsData: StudentReportData[], filename: string) => {
    setIsGenerating(true);
    setDownloadProgress(0);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const isTemplate1 = selectedTemplate?.id === 'template1';

      for (let i = 0; i < studentsData.length; i++) {
        const studentData = studentsData[i];
        const isNewPage = i > 0;

        if (isTemplate1) {
          await generateTemplate1PDF({
            doc,
            studentData,
            schoolInfo,
            selectedTerm,
            selectedYear,
            isNewPage
          });
        } else {
          await generateTemplate2PDF({
            doc,
            studentData,
            schoolInfo,
            selectedTerm,
            selectedYear,
            isNewPage
          });
        }

        setDownloadProgress(Math.round(((i + 1) / studentsData.length) * 100));
      }

      doc.save(filename);
      setSuccess(`Successfully generated ${studentsData.length} report card(s)`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
      setDownloadProgress(0);
    }
  };

  // Download handlers
  const handleIndividualDownload = async () => {
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const studentDataArray = await fetchStudentReportData(selectedStudent);
      if (studentDataArray && studentDataArray.length > 0) {
        const studentName = studentDataArray[0].student.full_name.replace(/\s+/g, '_');
        const examTypesLabel = selectedExamTypes.join('_');
        await generatePDF(studentDataArray, `${studentName}_Report_Card_Term${selectedTerm}_${selectedYear}_${examTypesLabel}.pdf`);
      } else {
        setError('No report data found for this student');
      }
    } catch (err) {
      setError('Failed to fetch student data');
    } finally {
      setLoading(false);
      closeAllModals();
    }
  };

  const handleClassDownload = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    try {
      const studentsData = await fetchBulkReportData(selectedClass);
      if (studentsData.length > 0) {
        const className = classes.find(c => c.id === selectedClass)?.class_name || 'Class';
        const examTypesLabel = selectedExamTypes.join('_');
        await generatePDF(studentsData, `${className}_Report_Cards_Term${selectedTerm}_${selectedYear}_${examTypesLabel}.pdf`);
      } else {
        setError('No report data found for this class');
      }
    } catch (err) {
      setError('Failed to fetch class data');
    } finally {
      setLoading(false);
      closeAllModals();
    }
  };

  const handleDownloadAll = async () => {
    if (classes.length === 0) {
      setError('No classes found. Please add classes first.');
      return;
    }

    setLoading(true);
    try {
      // Fetch reports for all classes
      const allStudentsData: StudentReportData[] = [];
      
      for (const classItem of classes) {
        const classReports = await fetchBulkReportData(classItem.id);
        allStudentsData.push(...classReports);
      }
      
      if (allStudentsData.length > 0) {
        const examTypesLabel = selectedExamTypes.join('_');
        await generatePDF(allStudentsData, `All_Report_Cards_Term${selectedTerm}_${selectedYear}_${examTypesLabel}.pdf`);
      } else {
        setError('No report data found for any class');
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
      closeAllModals();
    }
  };

  // Year options
  const yearOptions = ['2024-2025', '2023-2024', '2022-2023', '2021-2022','2025-2026'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Report Card Templates</h1>
        <p className="text-gray-600 mt-2">
          Select a template to preview and download report cards for your students
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-200"
          >
            {/* Template Preview Thumbnail */}
            <div className="relative h-64 bg-gray-100 overflow-hidden">
              <iframe
                src={template.thumbnail}
                className="w-full h-full transform scale-50 origin-top-left pointer-events-none"
                style={{ width: '200%', height: '200%' }}
                title={template.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  template.type === 'high-school' ? 'bg-blue-600' :
                  template.type === 'grade-8' ? 'bg-green-600' : 'bg-purple-600'
                }`}>
                  {template.type === 'high-school' ? 'High School' :
                   template.type === 'grade-8' ? 'Grade 8 (CBC)' : 'Primary'}
                </span>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="flex items-center text-blue-600 font-medium">
                <Eye className="w-4 h-4 mr-2" />
                Click to Preview
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUseTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Use This Template
                </button>
                <button
                  onClick={closeAllModals}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Template Preview */}
            <div className="flex-1 overflow-auto bg-gray-200 p-4">
              <div className="bg-white mx-auto shadow-xl" style={{ width: '210mm', minHeight: '297mm' }}>
                <iframe
                  ref={iframeRef}
                  src={selectedTemplate.file}
                  className="w-full h-full"
                  style={{ minHeight: '297mm' }}
                  title="Template Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Selection Modal */}
      {showExamSelection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Select Exam Details</h2>
              </div>
              <button
                onClick={closeAllModals}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Exam Type - Multi-select checkboxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Type(s) <span className="text-gray-500 font-normal">(select one or more)</span>
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {examTypes.map((exam) => (
                    <label
                      key={exam.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedExamTypes.includes(exam.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExamTypes.includes(exam.value)}
                        onChange={() => toggleExamType(exam.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium">{exam.label}</span>
                    </label>
                  ))}
                </div>
                {selectedExamTypes.length > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    Selected: {selectedExamTypes.map(et => examTypes.find(e => e.value === et)?.label).join(', ')}
                  </p>
                )}
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => (
                    <option key={term.value} value={term.value}>{term.label}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                onClick={handleExamSelectionNext}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Options Modal */}
      {showDownloadOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Download Report Cards</h2>
                  <p className="text-sm text-gray-600">
                    Term {selectedTerm} • {selectedYear} • {selectedExamTypes.map(et => examTypes.find(e => e.value === et)?.label).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAllModals}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Individual Student Download */}
              <button
                onClick={() => {
                  setShowDownloadOptions(false);
                  setShowStudentSelection(true);
                }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Individual Student</h3>
                  <p className="text-sm text-gray-600">Download report card for a specific student</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </button>

              {/* Class Download */}
              <button
                onClick={() => {
                  setShowDownloadOptions(false);
                  setShowClassSelection(true);
                }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Class Download</h3>
                  <p className="text-sm text-gray-600">Download all report cards for a class</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </button>

              {/* Download All */}
              <button
                onClick={handleDownloadAll}
                disabled={loading || isGenerating}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                  <School className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Download All</h3>
                  <p className="text-sm text-gray-600">Download all student report cards</p>
                </div>
                {(loading || isGenerating) ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                )}
              </button>

              {/* Progress indicator */}
              {isGenerating && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Generating PDFs...</span>
                    <span className="text-sm font-medium text-blue-600">{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Selection Modal */}
      {showStudentSelection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Select Student</h2>
              </div>
              <button
                onClick={() => {
                  setShowStudentSelection(false);
                  setShowDownloadOptions(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedClass || students.length === 0}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedClass ? 'Select a class first' : 
                     students.length === 0 ? 'No students found' : 'Select a student'}
                  </option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                onClick={handleIndividualDownload}
                disabled={!selectedStudent || loading || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {(loading || isGenerating) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Report Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Selection Modal */}
      {showClassSelection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Select Class</h2>
              </div>
              <button
                onClick={() => {
                  setShowClassSelection(false);
                  setShowDownloadOptions(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                onClick={handleClassDownload}
                disabled={!selectedClass || loading || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {(loading || isGenerating) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating... {downloadProgress > 0 && `(${downloadProgress}%)`}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download Class Report Cards
                  </>
                )}
              </button>

              {/* Progress indicator */}
              {isGenerating && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {(loading || isGenerating) && !showStudentSelection && !showClassSelection && !showDownloadOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-gray-800">Generating Report Cards...</p>
            {downloadProgress > 0 && (
              <div className="w-64 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium text-blue-600">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
