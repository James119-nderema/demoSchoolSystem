import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Eye, FileText, Users, User, School, Loader2, Check, ChevronRight, MessageCircle, Send, Phone, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import { APIService, DataAPI, MarksAPI, API_ENDPOINTS } from '../../services/baseUrl';
import { generateTemplate1PDF } from './HighSchoolReportPDF';
import { generateTemplate2PDF } from './Grade8CBCReportPDF';
import { getRemarks } from './utils/reportUtils';
import { 
  sendBulkSms, 
  generateResultMessage, 
  saveSmsSettings, 
  getSmsSettings, 
  isSmsConfigured,
  type SmsMessage,
  type StudentResultData 
} from '../../services/smsService';
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
const transformBackendToFrontend = (backendData: BackendStudentReport, examType?: string): StudentReportData => {
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
      subject_code: subj.subject_code || subj.subject.substring(0, 3).toUpperCase(),
      marks_obtained: subj.marks_obtained,
      total_marks: subj.total_marks,
      percentage: subj.percentage,
      grade: subj.grade,
      points: subj.points || 0,
      remarks: subj.remarks || getRemarks(subj.percentage),
      subject_position: subj.subject_position || 0,
      exam_results: examType ? [{
        exam_name: examType,
        marks: subj.percentage,
        grade: subj.grade
      }] : undefined
    })),
    overall: {
      total_marks: backendData.summary.total_marks_obtained,
      average: backendData.summary.overall_percentage,
      grade: backendData.summary.overall_grade,
      position: backendData.summary.position,
      out_of: backendData.summary.total_students || 0,
      class_average: backendData.summary.class_average,
      total_points: backendData.summary.total_points || 0,
      overall_remarks: backendData.summary.overall_remarks || ''
    },
    school_info: backendData.school_info,
    exam_info: backendData.exam_info,
    class_teacher_name: backendData.class_teacher_name
  };
};

// Combine multiple exam type reports into one with merged exam_results
const combineReportsForStudent = (reports: StudentReportData[], examTypes: string[]): StudentReportData | null => {
  if (reports.length === 0) return null;
  
  // Use the first report as base
  const baseReport = { ...reports[0] };
  
  // Create a map of subject results by subject name
  const subjectMap = new Map<string, typeof baseReport.results[0]>();
  
  // Initialize with first report's subjects
  baseReport.results.forEach(result => {
    subjectMap.set(result.subject_name, { ...result, exam_results: [] });
  });
  
  // Merge exam results from all reports
  reports.forEach((report, reportIdx) => {
    const examType = report.exam_info?.exam_type || examTypes[reportIdx] || `exam_${reportIdx + 1}`;
    
    report.results.forEach(result => {
      const existing = subjectMap.get(result.subject_name);
      if (existing) {
        // Add this exam's result to the subject's exam_results array
        if (!existing.exam_results) {
          existing.exam_results = [];
        }
        existing.exam_results.push({
          exam_name: examType,
          marks: result.percentage ?? ((result.marks_obtained / result.total_marks) * 100),
          grade: result.grade
        });
      } else {
        // New subject found in later report
        subjectMap.set(result.subject_name, {
          ...result,
          exam_results: [{
            exam_name: examType,
            marks: result.percentage ?? ((result.marks_obtained / result.total_marks) * 100),
            grade: result.grade
          }]
        });
      }
    });
  });
  
  // Calculate average marks across all exams for each subject
  subjectMap.forEach((subject, _name) => {
    if (subject.exam_results && subject.exam_results.length > 0) {
      const totalMarks = subject.exam_results.reduce((sum, er) => sum + er.marks, 0);
      const avgPercentage = totalMarks / subject.exam_results.length;
      subject.percentage = avgPercentage;
      subject.marks_obtained = avgPercentage; // Use percentage as marks for average
    }
  });
  
  // Convert map back to array
  baseReport.results = Array.from(subjectMap.values());
  
  // Set exam_types on the report
  (baseReport as StudentReportData & { exam_types?: string[] }).exam_types = examTypes;
  
  return baseReport;
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Closing and Opening date states for report card
  const [closingDate, setClosingDate] = useState<string>('');
  const [openingDate, setOpeningDate] = useState<string>('');

  // Messaging states
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [_messagingMode, _setMessagingMode] = useState<'individual' | 'class' | 'all'>('individual');
  const [selectedStudentsForSms, setSelectedStudentsForSms] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsResults, setSmsResults] = useState<{success: number; failed: number; errors: string[]}>({ success: 0, failed: 0, errors: [] });
  const [showSmsResults, setShowSmsResults] = useState(false);
  const [showSmsSettings, setShowSmsSettings] = useState(false);
  const [smsSettingsForm, setSmsSettingsForm] = useState({
    userId: '',
    apiKey: '',
    senderId: 'SchoolMaster'
  });
  const [studentsWithResults, setStudentsWithResults] = useState<Array<{
    student: StudentOption;
    results: StudentReportData | null;
    parentPhone: string;
  }>>([]);

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
      // Set defaults matching backend EXAM_TYPE_CHOICES
      setExamTypes([
        { value: 'exam_1', label: 'Exam 1' },
        { value: 'exam_2', label: 'Exam 2' },
        { value: 'exam_3', label: 'Exam 3' }
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
          // Transform backend response to frontend format with exam type
          const report = transformBackendToFrontend(response as BackendStudentReport, examType);
          // Add exam type info to report for labeling
          if (report.exam_info) {
            report.exam_info.exam_type = examType;
          }
          allReports.push(report);
        } catch (err) {
          console.warn(`No data found for exam type: ${examType}`);
        }
      }
      
      // Combine all reports into one with merged exam_results per subject
      if (allReports.length > 0) {
        const combinedReport = combineReportsForStudent(allReports, selectedExamTypes);
        return combinedReport ? [combinedReport] : [];
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching student report data:', err);
      return [];
    }
  };

  const fetchBulkReportData = async (classId?: string): Promise<StudentReportData[]> => {
    try {
      console.log('fetchBulkReportData called with:', { classId, selectedExamTypes, selectedTerm, selectedYear });
      
      if (selectedExamTypes.length === 0) {
        console.warn('No exam types selected');
        return [];
      }
      
      // Create a map to group reports by student admission number
      const studentReportsMap = new Map<string, StudentReportData[]>();
      
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
          console.log('Fetching bulk report data with params:', params);
          const response = await APIService.get(API_ENDPOINTS.REPORTS.BULK_REPORT_DATA, params, 'staff');
          console.log('Bulk report API response:', response);
          
          // Transform backend response array to frontend format
          const reports = response.reports || response.students || [];
          console.log('Reports array length:', reports.length);
          
          reports.forEach((report: BackendStudentReport) => {
            try {
              const transformed = transformBackendToFrontend(report, examType);
              // Add exam type info for labeling
              if (transformed.exam_info) {
                transformed.exam_info.exam_type = examType;
              }
              
              // Group by admission number
              const admNo = transformed.student.admission_number;
              if (!studentReportsMap.has(admNo)) {
                studentReportsMap.set(admNo, []);
              }
              studentReportsMap.get(admNo)!.push(transformed);
            } catch (transformErr) {
              console.error('Error transforming report:', transformErr, report);
            }
          });
        } catch (err) {
          console.warn(`No data found for exam type: ${examType}`, err);
        }
      }
      
      // Combine reports for each student
      const combinedReports: StudentReportData[] = [];
      studentReportsMap.forEach((reports, _admNo) => {
        const combined = combineReportsForStudent(reports, selectedExamTypes);
        if (combined) {
          combinedReports.push(combined);
        }
      });
      
      console.log('Total combined reports to generate:', combinedReports.length);
      return combinedReports;
    } catch (err) {
      console.error('Error fetching bulk report data:', err);
      return [];
    }
  };

  // Load SMS settings on mount
  useEffect(() => {
    const savedSettings = getSmsSettings();
    if (savedSettings) {
      setSmsSettingsForm(savedSettings);
    }
  }, []);

  // Handle SMS settings save
  const handleSaveSmsSettings = () => {
    saveSmsSettings(smsSettingsForm);
    setShowSmsSettings(false);
    setSuccess('SMS settings saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Fetch students with parent phone for SMS
  const fetchStudentsWithParentInfo = async (classId?: string) => {
    try {
      setLoading(true);
      let studentsData: StudentOption[] = [];
      
      if (classId) {
        const response = await MarksAPI.getClassStudents(classId);
        studentsData = response.students || [];
      } else {
        // Fetch all students
        const response = await DataAPI.getStudents();
        studentsData = response.results || response || [];
      }
      
      // Get results for each student and extract parent phone
      const studentsWithData: Array<{
        student: StudentOption;
        results: StudentReportData | null;
        parentPhone: string;
      }> = [];

      for (const student of studentsData) {
        try {
          // Fetch full student details to get parent phone
          const studentDetails = await APIService.get(`/api/students/${student.id}/`, undefined, 'staff');
          const parentPhone = studentDetails.parent_guardian_phone || '';
          
          // Fetch results for this student
          let results: StudentReportData | null = null;
          if (selectedExamTypes.length > 0 && selectedTerm && selectedYear) {
            const reportData = await fetchStudentReportData(student.id.toString());
            if (reportData.length > 0) {
              results = reportData[0];
            }
          }
          
          studentsWithData.push({
            student: {
              ...student,
              parent_guardian_phone: parentPhone,
              parent_guardian_name: studentDetails.parent_guardian_name || ''
            },
            results,
            parentPhone
          });
        } catch (err) {
          console.warn(`Could not fetch details for student ${student.id}`);
          studentsWithData.push({
            student,
            results: null,
            parentPhone: ''
          });
        }
      }
      
      setStudentsWithResults(studentsWithData);
      return studentsWithData;
    } catch (err) {
      console.error('Error fetching students with parent info:', err);
      setError('Failed to fetch student information');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Toggle student selection for SMS
  const toggleStudentForSms = (studentId: string) => {
    setSelectedStudentsForSms(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students for SMS
  const selectAllStudentsForSms = () => {
    const validStudents = studentsWithResults.filter(s => s.parentPhone);
    setSelectedStudentsForSms(validStudents.map(s => s.student.id.toString()));
  };

  // Deselect all students
  const deselectAllStudentsForSms = () => {
    setSelectedStudentsForSms([]);
  };

  // Handle sending SMS to selected students
  const handleSendSms = async () => {
    if (!isSmsConfigured()) {
      setError('Please configure SMS settings first');
      setShowSmsSettings(true);
      return;
    }

    if (selectedStudentsForSms.length === 0) {
      setError('Please select at least one student to send SMS');
      return;
    }

    setIsSendingSms(true);
    setSmsProgress(0);
    setSmsResults({ success: 0, failed: 0, errors: [] });

    try {
      const messages: SmsMessage[] = [];

      for (const studentId of selectedStudentsForSms) {
        const studentData = studentsWithResults.find(s => s.student.id.toString() === studentId);
        if (!studentData || !studentData.parentPhone) continue;

        // Generate message
        let message = customMessage;
        if (!message && studentData.results) {
          const resultData: StudentResultData = {
            studentName: studentData.student.full_name,
            admissionNumber: studentData.student.admission_number || '',
            className: studentData.results.student.current_class || '',
            term: selectedTerm,
            year: selectedYear,
            examType: selectedExamTypes.join(', '),
            totalMarks: studentData.results.overall.total_marks,
            average: studentData.results.overall.average,
            grade: studentData.results.overall.grade,
            position: studentData.results.overall.position,
            totalStudents: studentData.results.overall.out_of
          };
          message = generateResultMessage(resultData);
        } else if (!message) {
          message = `Dear Parent, ${studentData.student.full_name}'s results for Term ${selectedTerm} ${selectedYear} are now available. Please visit the school or parent portal for details. - SchoolMaster Pro`;
        }

        messages.push({
          recipient: {
            phoneNumber: studentData.parentPhone,
            studentName: studentData.student.full_name,
            studentId: studentId,
            parentName: (studentData.student as any).parent_guardian_name
          },
          message
        });
      }

      // Send bulk SMS
      const result = await sendBulkSms(messages, (current, total) => {
        setSmsProgress(Math.round((current / total) * 100));
      });

      setSmsResults({
        success: result.totalSent,
        failed: result.totalFailed,
        errors: result.results.filter(r => !r.success).map(r => `${r.recipient.studentName}: ${r.error}`)
      });
      setShowSmsResults(true);
      
      if (result.totalSent > 0) {
        setSuccess(`Successfully sent ${result.totalSent} SMS message(s)`);
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
      setError('Failed to send SMS messages');
    } finally {
      setIsSendingSms(false);
    }
  };

  // Open messaging modal
  const handleOpenMessaging = async () => {
    if (selectedExamTypes.length === 0 || !selectedTerm || !selectedYear) {
      setError('Please select exam type, term, and year first');
      return;
    }
    setShowDownloadOptions(false);
    setShowMessagingModal(true);
    
    // Fetch students with parent info
    await fetchStudentsWithParentInfo(selectedClass || undefined);
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
    setShowMessagingModal(false);
    setShowSmsSettings(false);
    setShowSmsResults(false);
    setError(null);
    setSuccess(null);
  };

  // Handle "Use This" button
  const handleUseTemplate = () => {
    setShowPreview(false);
    
    // For template1 (High School), auto-select all exam types
    if (selectedTemplate?.id === 'template1') {
      // Auto-select all available exam types for template1
      setSelectedExamTypes(examTypes.map(e => e.value));
    }
    
    setShowExamSelection(true);
  };

  // Check if exam type selection should be hidden (template1 auto-selects all)
  const isTemplate1Selected = selectedTemplate?.id === 'template1';

  // Handle exam selection next
  const handleExamSelectionNext = () => {
    // For template1, exam types are auto-selected
    if (isTemplate1Selected && (!selectedTerm || !selectedYear)) {
      setError('Please select term and year');
      return;
    }
    if (!isTemplate1Selected && (selectedExamTypes.length === 0 || !selectedTerm || !selectedYear)) {
      setError('Please select at least one exam type, term, and year');
      return;
    }
    setShowExamSelection(false);
    setShowDownloadOptions(true);
  };

  // Main PDF generation function
  const generatePDF = async (studentsData: StudentReportData[], filename: string) => {
    console.log('generatePDF called with:', { studentCount: studentsData.length, filename });
    
    if (studentsData.length === 0) {
      console.error('No student data to generate PDF');
      setError('No student data available to generate PDF');
      return;
    }
    
    setIsGenerating(true);
    setDownloadProgress(0);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const isTemplate1 = selectedTemplate?.id === 'template1';
      console.log('Using template:', isTemplate1 ? 'template1' : 'template2');

      for (let i = 0; i < studentsData.length; i++) {
        const studentData = {
          ...studentsData[i],
          // Inject closing and opening dates chosen by the user
          closing_date: closingDate ? new Date(closingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          opening_date: openingDate ? new Date(openingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        };
        const isNewPage = i > 0;
        
        console.log(`Generating PDF for student ${i + 1}/${studentsData.length}:`, studentData.student.full_name);

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

      console.log('Saving PDF:', filename);
      doc.save(filename);
      setSuccess(`Successfully generated ${studentsData.length} report card(s)`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

    console.log('handleClassDownload called for class:', selectedClass);
    setLoading(true);
    try {
      const studentsData = await fetchBulkReportData(selectedClass);
      console.log('studentsData received:', studentsData.length, 'students');
      
      if (studentsData.length > 0) {
        const className = classes.find(c => c.id === selectedClass)?.class_name || 'Class';
        const examTypesLabel = selectedExamTypes.join('_');
        await generatePDF(studentsData, `${className}_Report_Cards_Term${selectedTerm}_${selectedYear}_${examTypesLabel}.pdf`);
      } else {
        setError('No report data found for this class. Please ensure students have results for the selected term, year, and exam type.');
      }
    } catch (err) {
      console.error('handleClassDownload error:', err);
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

  // Year options - Generate years like InputMarks component
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

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
              {/* Exam Type - Multi-select checkboxes (hidden for template1) */}
              {!isTemplate1Selected && (
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
              )}

              {/* Info message for template1 */}
              {isTemplate1Selected && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">High School Report:</span> All available exam types for the selected term will be automatically included in the Performance Per Subject Per Exam table.
                  </p>
                </div>
              )}

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

              {/* Closing and Opening Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Date</label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Select closing date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Opening Date</label>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Select opening date"
                  />
                </div>
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

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">or notify parents</span>
                </div>
              </div>

              {/* Send SMS to Parents */}
              <button
                onClick={handleOpenMessaging}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
              >
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Send SMS to Parents</h3>
                  <p className="text-sm text-gray-600">Notify parents about student results via SMS</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
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
      {(loading || isGenerating) && !showStudentSelection && !showClassSelection && !showDownloadOptions && !showMessagingModal && (
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

      {/* SMS Messaging Modal */}
      {showMessagingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Send SMS to Parents</h2>
                  <p className="text-sm text-gray-600">
                    Term {selectedTerm} • {selectedYear} • {selectedExamTypes.map(et => examTypes.find(e => e.value === et)?.label).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSmsSettings(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
                  title="SMS Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowMessagingModal(false);
                    setShowDownloadOptions(true);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* SMS Configuration Warning */}
              {!isSmsConfigured() && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">SMS Not Configured</p>
                    <p className="text-sm text-yellow-700">
                      Please configure your Hostpinnacles SMS API credentials to send messages.
                    </p>
                    <button
                      onClick={() => setShowSmsSettings(true)}
                      className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                    >
                      Configure SMS Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Class Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Class</label>
                <div className="flex gap-3">
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentsForSms([]);
                      if (e.target.value) {
                        fetchStudentsWithParentInfo(e.target.value);
                      } else {
                        fetchStudentsWithParentInfo();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Message */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Message <span className="text-gray-500 font-normal">(optional - leave empty to use default)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter a custom message or leave empty to auto-generate from results. Use placeholders: {studentName}, {admissionNumber}, {className}, {term}, {year}, {average}, {grade}, {position}"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-24 resize-none"
                />
              </div>

              {/* Student Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Select Students ({selectedStudentsForSms.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllStudentsForSms}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Select All with Phone
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllStudentsForSms}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading students...</span>
                  </div>
                ) : studentsWithResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students found. Please check your filters.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 w-10">
                            <input
                              type="checkbox"
                              checked={selectedStudentsForSms.length === studentsWithResults.filter(s => s.parentPhone).length && selectedStudentsForSms.length > 0}
                              onChange={(e) => e.target.checked ? selectAllStudentsForSms() : deselectAllStudentsForSms()}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Student</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Class</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Parent Phone</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsWithResults.map((item) => (
                          <tr
                            key={item.student.id}
                            className={`border-t border-gray-100 ${!item.parentPhone ? 'bg-gray-50 opacity-60' : 'hover:bg-orange-50'}`}
                          >
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={selectedStudentsForSms.includes(item.student.id.toString())}
                                onChange={() => toggleStudentForSms(item.student.id.toString())}
                                disabled={!item.parentPhone}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="font-medium text-gray-800">{item.student.full_name}</div>
                              <div className="text-xs text-gray-500">{item.student.admission_number}</div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {item.results?.student.current_class || '-'}
                            </td>
                            <td className="px-4 py-2">
                              {item.parentPhone ? (
                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                  <Phone className="w-3 h-3" />
                                  {item.parentPhone}
                                </div>
                              ) : (
                                <span className="text-xs text-red-500">No phone</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {item.results ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {item.results.overall.average.toFixed(1)}% - {item.results.overall.grade}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">No results</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <div className="mt-6">
                <button
                  onClick={handleSendSms}
                  disabled={isSendingSms || selectedStudentsForSms.length === 0 || !isSmsConfigured()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSendingSms ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending... {smsProgress}%
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send SMS to {selectedStudentsForSms.length} Parent(s)
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isSendingSms && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${smsProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Settings Modal */}
      {showSmsSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">SMS Settings</h2>
              </div>
              <button
                onClick={() => setShowSmsSettings(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Configure your Hostpinnacles SMS API credentials to enable SMS notifications.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
                <input
                  type="text"
                  value={smsSettingsForm.userId}
                  onChange={(e) => setSmsSettingsForm(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="Enter your Hostpinnacles User ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">API Key / Password</label>
                <input
                  type="password"
                  value={smsSettingsForm.apiKey}
                  onChange={(e) => setSmsSettingsForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API Key"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sender ID</label>
                <input
                  type="text"
                  value={smsSettingsForm.senderId}
                  onChange={(e) => setSmsSettingsForm(prev => ({ ...prev, senderId: e.target.value }))}
                  placeholder="e.g., SchoolMaster"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Must be registered with Hostpinnacles</p>
              </div>

              <button
                onClick={handleSaveSmsSettings}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Results Modal */}
      {showSmsResults && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">SMS Results</h2>
              </div>
              <button
                onClick={() => {
                  setShowSmsResults(false);
                  setShowMessagingModal(false);
                  setSelectedStudentsForSms([]);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{smsResults.success}</div>
                  <div className="text-sm text-green-700">Sent Successfully</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{smsResults.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {smsResults.errors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Failed Messages:</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-auto">
                    {smsResults.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowSmsResults(false);
                  setShowMessagingModal(false);
                  setSelectedStudentsForSms([]);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
