/**
 * MessagingPage Component
 * 
 * A dedicated page for sending SMS messages to parents.
 * Visible only to Director of Studies.
 * Features:
 * - Normal text messages
 * - Individual exam result templates
 * - Whole term result templates (all exams)
 * - Bulk SMS capabilities
 */

import React, { useState, useEffect } from 'react';
import { 
  sendBulkSms, 
  isSmsConfigured,
  type SmsMessage
} from '../../services/smsService';
import { DataAPI, MarksAPI, ReportsAPI } from '../../services/baseUrl';

interface StudentOption {
  id: number | string;
  full_name: string;
  admission_number: string;
  assessment_no?: string;
  current_class?: string;
  current_class_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_name?: string;
}

interface ClassOption {
  id: number | string;
  name: string;
  class_name?: string;
}

interface ExamType {
  value: string;
  label: string;
}

interface SubjectResult {
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  percentage?: number;
  points?: number;
  remarks?: string;
}

interface StudentResult {
  student: StudentOption;
  results: SubjectResult[];
  average: number;
  grade: string;
  position: number;
  totalStudents: number;
  examType: string;
  totalMarks?: number;
  overallRemarks?: string;
}

interface SchoolInfo {
  name: string;
  phone: string;
  email: string;
  motto: string;
  principal_name?: string;
}

type MessageTemplateType = 'custom' | 'individual_exam' | 'term_summary';

const MessagingPage: React.FC = () => {
  // State for classes and students
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for term/year/exam selection
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  
  // Exam types - fetched from API
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  
  // State for message template
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplateType>('custom');
  const [customMessage, setCustomMessage] = useState<string>('');
  
  // State for student results
  const [studentResults, setStudentResults] = useState<Map<string, StudentResult>>(new Map());
  
  // State for school info
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  
  // State for sending SMS
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsResults, setSmsResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
  
  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate year options
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i;
    return year.toString();
  });

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(search) ||
      student.admission_number?.toLowerCase().includes(search) ||
      student.assessment_no?.toLowerCase().includes(search)
    );
  });

  // Load initial data
  useEffect(() => {
    fetchClasses();
    fetchDropdownData();
  }, []);

  // Once classes are loaded, fetch all students if "All Classes" is selected
  useEffect(() => {
    if (classes.length > 0 && selectedClass === 'all') {
      fetchAllStudents();
    }
  }, [classes]);

  // Fetch students when class changes
  useEffect(() => {
    if (selectedClass === 'all') {
      fetchAllStudents();
    } else if (selectedClass) {
      fetchStudentsWithParentInfo(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass]);

  // Fetch results when exam parameters change
  useEffect(() => {
    if (selectedClass && selectedClass !== 'all' && selectedTerm && selectedYear && messageTemplate !== 'custom') {
      fetchStudentResults();
    }
  }, [selectedClass, selectedTerm, selectedYear, selectedExamType, messageTemplate]);

  const fetchClasses = async () => {
    try {
      const response = await DataAPI.getClasses({ show_all: 'true' });
      const raw = response.results || response || [];
      const classesData: ClassOption[] = raw.map((c: any) => ({
        id: c.id,
        name: c.class_name || c.name || 'Unknown',
        class_name: c.class_name,
      }));
      setClasses(classesData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes');
    }
  };

  const fetchDropdownData = async () => {
    try {
      const response = await MarksAPI.getDropdownData();
      if (response.exam_types) {
        setExamTypes(response.exam_types);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      // Set default exam types if API fails
      setExamTypes([
        { value: 'exam_1', label: 'Exam 1' },
        { value: 'exam_2', label: 'Exam 2' },
        { value: 'exam_3', label: 'Exam 3' },
      ]);
    }
  };

  const fetchStudentsWithParentInfo = async (classId: string) => {
    try {
      setLoading(true);
      const response = await MarksAPI.getClassStudents(classId);
      const studentsData: StudentOption[] = (response.students || []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        admission_number: s.admission_number,
        current_class: s.current_class,
        assessment_no: s.assessment_no || '',
        parent_guardian_phone: s.parent_guardian_phone || '',
        parent_guardian_name: s.parent_guardian_name || '',
      }));
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      // Fetch students from every class in parallel
      const promises = classes.map(cls =>
        MarksAPI.getClassStudents(cls.id.toString()).catch(() => ({ students: [] }))
      );
      const responses = await Promise.all(promises);
      const allStudents: StudentOption[] = [];
      const seen = new Set<string>();
      for (const response of responses) {
        for (const s of (response.students || [])) {
          const key = s.id?.toString();
          if (key && !seen.has(key)) {
            seen.add(key);
            allStudents.push({
              id: s.id,
              full_name: s.full_name,
              admission_number: s.admission_number,
              current_class: s.current_class,
              assessment_no: s.assessment_no || '',
              parent_guardian_phone: s.parent_guardian_phone || '',
              parent_guardian_name: s.parent_guardian_name || '',
            });
          }
        }
      }
      allStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(allStudents);
    } catch (err) {
      console.error('Error fetching all students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentResults = async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) return;
    
    setLoading(true);
    const resultsMap = new Map<string, StudentResult>();
    
    try {
      // Determine which exam types to fetch
      const examsToFetch = messageTemplate === 'term_summary' 
        ? examTypes.map(e => e.value)  // All exam types for term summary
        : selectedExamType 
          ? [selectedExamType]  // Single exam type
          : [];
      
      if (examsToFetch.length === 0) {
        setStudentResults(resultsMap);
        return;
      }

      // Use bulk-report-data endpoint: ONE request per exam type instead of per-student
      for (const examType of examsToFetch) {
        try {
          const response = await ReportsAPI.getBulkReportData({
            class_id: selectedClass,
            term: selectedTerm,
            academic_year: selectedYear,
            exam_type: examType,
          });

          if (!response || !response.reports) continue;

          // Store school info from first report
          if (response.reports.length > 0 && !schoolInfo) {
            const info = response.reports[0].school_info;
            if (info) {
              setSchoolInfo({
                name: info.name,
                phone: info.phone || '',
                email: info.email || '',
                motto: info.motto || '',
                principal_name: '',
              });
            }
          }

          for (const report of response.reports) {
            // Match report to a student from our loaded list by admission number
            const matchedStudent = students.find(
              s => s.full_name === report.student_info?.name ||
                   s.admission_number === report.student_info?.admission_number
            );
            if (!matchedStudent) continue;

            const studentId = matchedStudent.id.toString();
            const subjectResults: SubjectResult[] = (report.subjects || []).map((r: any) => ({
              subject_name: r.subject || r.subject_name,
              marks_obtained: r.marks_obtained,
              total_marks: r.total_marks || 100,
              percentage: r.percentage || 0,
              grade: r.grade,
              points: r.points || 0,
              remarks: r.remarks || '',
            }));

            if (subjectResults.length === 0) continue;

            const existing = resultsMap.get(studentId);
            const allResults = existing ? [...existing.results, ...subjectResults] : subjectResults;
            const totalMarks = allResults.reduce((sum, r) => sum + r.marks_obtained, 0);
            const totalPossible = allResults.reduce((sum, r) => sum + r.total_marks, 0);
            const average = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;

            resultsMap.set(studentId, {
              student: matchedStudent,
              results: allResults,
              average,
              grade: report.summary?.overall_grade || getGradeFromAverage(average),
              position: report.summary?.position || 0,
              totalStudents: report.summary?.total_students || students.length,
              examType: messageTemplate === 'term_summary' ? 'Term Summary' : selectedExamType,
              totalMarks,
              overallRemarks: report.summary?.overall_remarks || '',
            });
          }
        } catch {
          // Continue if no results for this exam type
        }
      }
      
      // Re-calculate positions if not provided by backend
      const sortedResults = Array.from(resultsMap.entries())
        .sort((a, b) => b[1].average - a[1].average);
      
      sortedResults.forEach(([id, result], index) => {
        // Only override if backend didn't provide position
        if (result.position === 0) {
          result.position = index + 1;
        }
        resultsMap.set(id, result);
      });
      
      setStudentResults(resultsMap);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch student results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeFromAverage = (average: number): string => {
    if (average >= 80) return 'A';
    if (average >= 75) return 'A-';
    if (average >= 70) return 'B+';
    if (average >= 65) return 'B';
    if (average >= 60) return 'B-';
    if (average >= 55) return 'C+';
    if (average >= 50) return 'C';
    if (average >= 45) return 'C-';
    if (average >= 40) return 'D+';
    if (average >= 35) return 'D';
    if (average >= 30) return 'D-';
    return 'E';
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    // Select from filtered students with valid phone numbers
    const validStudents = filteredStudents.filter(s => s.parent_guardian_phone);
    setSelectedStudents(validStudents.map(s => s.id.toString()));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const generateMessage = (student: StudentOption): string => {
    const studentResult = studentResults.get(student.id.toString());
    const school = schoolInfo;
    
    if (messageTemplate === 'custom') {
      // Replace placeholders in custom message
      let message = customMessage;
      message = message.replace(/{studentName}/g, student.full_name);
      message = message.replace(/{parentName}/g, student.parent_guardian_name || 'Parent');
      message = message.replace(/{admissionNumber}/g, student.admission_number);
      message = message.replace(/{className}/g, student.current_class_name || student.current_class || '');
      message = message.replace(/{schoolName}/g, school?.name || 'School');
      message = message.replace(/{schoolPhone}/g, school?.phone || '');
      message = message.replace(/{schoolEmail}/g, school?.email || '');
      return message;
    }
    
    if (!studentResult) {
      return `Dear Parent/Guardian,

Greetings from ${school?.name || 'the School'}.

Results for ${student.full_name} are not yet available. Please check back later or contact the school for more information.

Phone: ${school?.phone || 'N/A'}
Email: ${school?.email || 'N/A'}

${school?.name || 'School Administration'}`;
    }
    
    // Build subject results table (limit to keep SMS reasonable)
    const subjectsTable = studentResult.results
      .slice(0, 8) // Limit to 8 subjects
      .map(r => `${r.subject_name}: ${r.marks_obtained} (${r.grade})`)
      .join('\n');
    
    // Calculate total marks
    const totalMarks = studentResult.totalMarks || studentResult.results.reduce((sum, r) => sum + r.marks_obtained, 0);
    
    // Get exam type display name
    const examTypeDisplay = selectedExamType 
      ? selectedExamType.replace('_', ' ').toUpperCase()
      : 'EXAM';
    
    if (messageTemplate === 'individual_exam') {
      return `Dear Parent/Guardian,

Greetings from ${school?.name || 'School'}.

Academic results for Term ${selectedTerm}, ${selectedYear} (${examTypeDisplay}) have been released.

STUDENT DETAILS
Name: ${student.full_name}
Adm No: ${student.admission_number}
Class: ${student.current_class_name || student.current_class || 'N/A'}

ACADEMIC RESULTS
${subjectsTable}

Total Marks: ${totalMarks}
Mean Score: ${studentResult.average.toFixed(1)}%
Grade: ${studentResult.grade}
Position: ${studentResult.position} of ${studentResult.totalStudents}
Remarks: ${studentResult.overallRemarks || 'Keep working hard!'}

For clarification, contact:
Phone: ${school?.phone || 'N/A'}
Email: ${school?.email || 'N/A'}

Thank you for your continued support.

${school?.principal_name || 'School Administration'}
${school?.name || ''}
${school?.motto || ''}`;
    }
    
    if (messageTemplate === 'term_summary') {
      return `Dear Parent/Guardian,

Greetings from ${school?.name || 'School'}.

Term ${selectedTerm}, ${selectedYear} academic results summary:

STUDENT DETAILS
Name: ${student.full_name}
Adm No: ${student.admission_number}
Class: ${student.current_class_name || student.current_class || 'N/A'}

PERFORMANCE SUMMARY
${subjectsTable}

Total Marks: ${totalMarks}
Mean Score: ${studentResult.average.toFixed(1)}%
Overall Grade: ${studentResult.grade}
Class Position: ${studentResult.position} of ${studentResult.totalStudents}
Remarks: ${studentResult.overallRemarks || 'Good progress. Keep it up!'}

For complete report card, please visit the school or parent portal.

Contact us:
Phone: ${school?.phone || 'N/A'}
Email: ${school?.email || 'N/A'}

Thank you for your partnership in your child's education.

${school?.principal_name || 'School Administration'}
${school?.name || ''}
${school?.motto || ''}`;
    }
    
    return '';
  };

  const handleSendSms = async () => {
    if (!isSmsConfigured()) {
      setError('SMS is not configured. Please contact your administrator to set up environment variables.');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (messageTemplate === 'custom' && !customMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    if (messageTemplate === 'individual_exam' && !selectedExamType) {
      setError('Please select an exam type');
      return;
    }

    setIsSending(true);
    setSmsProgress(0);
    setSmsResults({ success: 0, failed: 0, errors: [] });

    try {
      const messages: SmsMessage[] = [];

      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id.toString() === studentId);
        if (!student || !student.parent_guardian_phone) continue;

        const message = generateMessage(student);
        
        messages.push({
          recipient: {
            phoneNumber: student.parent_guardian_phone,
            studentName: student.full_name,
            studentId: student.id.toString(),
            parentName: student.parent_guardian_name
          },
          message
        });
      }

      if (messages.length === 0) {
        setError('No valid phone numbers found for selected students');
        setIsSending(false);
        return;
      }

      const results = await sendBulkSms(messages, (current, total) => {
        setSmsProgress(Math.round((current / total) * 100));
      });

      setSmsResults({
        success: results.totalSent,
        failed: results.totalFailed,
        errors: results.results.filter(r => !r.success).map(r => 
          `${r.recipient.studentName}: ${r.error}`
        )
      });

      if (results.totalSent > 0) {
        setSuccess(`Successfully sent ${results.totalSent} SMS messages!`);
      }

      if (results.totalFailed > 0) {
        setError(`Failed to send ${results.totalFailed} messages`);
      }

    } catch (err) {
      console.error('Error sending SMS:', err);
      setError('Failed to send SMS messages');
    } finally {
      setIsSending(false);
      setSmsProgress(100);
    }
  };

  const getSelectedClassName = () => {
    const cls = classes.find(c => c.id.toString() === selectedClass);
    return cls?.name || 'All Classes';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMS Messaging</h1>
          <p className="mt-2 text-gray-600">
            Send SMS messages to parents about student results and announcements
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={messageTemplate === 'term_summary'}
                  >
                    <option value="">Select Exam Type</option>
                    {examTypes.map((exam) => (
                      <option key={exam.value} value={exam.value}>{exam.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Message Template Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Template</h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="template"
                    value="custom"
                    checked={messageTemplate === 'custom'}
                    onChange={(e) => setMessageTemplate(e.target.value as MessageTemplateType)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Custom Message</span>
                    <p className="text-sm text-gray-500">Write your own message</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="template"
                    value="individual_exam"
                    checked={messageTemplate === 'individual_exam'}
                    onChange={(e) => setMessageTemplate(e.target.value as MessageTemplateType)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Individual Exam Results</span>
                    <p className="text-sm text-gray-500">Send results for a specific exam</p>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="template"
                    value="term_summary"
                    checked={messageTemplate === 'term_summary'}
                    onChange={(e) => setMessageTemplate(e.target.value as MessageTemplateType)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Term Summary</span>
                    <p className="text-sm text-gray-500">Combined results for all exams in the term</p>
                  </div>
                </label>
              </div>

              {messageTemplate === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your message here. Use placeholders:
{studentName} - Student's full name
{parentName} - Parent's name
{admissionNumber} - Admission number
{className} - Class name"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Available placeholders: {'{studentName}'}, {'{parentName}'}, {'{admissionNumber}'}, {'{className}'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Student Selection and Send */}
          <div className="lg:col-span-2 space-y-6">
            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Select Students</h2>
                      <p className="text-sm text-gray-500">
                        {selectedClass 
                          ? `${filteredStudents.length} of ${students.length} students in ${getSelectedClassName()}` 
                          : 'Select a class to view students'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllStudents}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllStudents}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  
                  {/* Search Filter */}
                  {selectedClass && students.length > 0 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, admission number, or assessment number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {!selectedClass 
                      ? 'Select a class to view students'
                      : searchTerm 
                        ? 'No students match your search' 
                        : 'No students found'}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.filter(s => s.parent_guardian_phone).length && selectedStudents.length > 0}
                            onChange={(e) => e.target.checked ? selectAllStudents() : deselectAllStudents()}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adm No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent Phone
                        </th>
                        {messageTemplate !== 'custom' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((student) => {
                        const result = studentResults.get(student.id.toString());
                        const hasPhone = !!student.parent_guardian_phone;
                        
                        return (
                          <tr 
                            key={student.id} 
                            className={`hover:bg-gray-50 ${!hasPhone ? 'opacity-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id.toString())}
                                onChange={() => toggleStudentSelection(student.id.toString())}
                                disabled={!hasPhone}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{student.full_name}</div>
                              {student.assessment_no && (
                                <div className="text-xs text-gray-400">Assessment: {student.assessment_no}</div>
                              )}
                              {student.parent_guardian_name && (
                                <div className="text-sm text-gray-500">Parent: {student.parent_guardian_name}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{student.admission_number}</td>
                            <td className="px-6 py-4">
                              {hasPhone ? (
                                <span className="text-green-600">{student.parent_guardian_phone}</span>
                              ) : (
                                <span className="text-red-500">No phone</span>
                              )}
                            </td>
                            {messageTemplate !== 'custom' && (
                              <td className="px-6 py-4">
                                {result ? (
                                  <span className="font-medium text-gray-900">
                                    {result.average.toFixed(1)}% ({result.grade})
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No data</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Send SMS Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Send SMS</h2>
                  <p className="text-sm text-gray-500">
                    {selectedStudents.length} student(s) selected
                  </p>
                </div>
                <button
                  onClick={handleSendSms}
                  disabled={isSending || selectedStudents.length === 0 || !isSmsConfigured()}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isSending || selectedStudents.length === 0 || !isSmsConfigured()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send SMS
                    </>
                  )}
                </button>
              </div>

              {isSending && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Sending messages...</span>
                    <span>{smsProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${smsProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {(smsResults.success > 0 || smsResults.failed > 0) && !isSending && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Results</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {smsResults.success} Sent
                    </div>
                    <div className="flex items-center text-red-600">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {smsResults.failed} Failed
                    </div>
                  </div>
                  
                  {smsResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                      <ul className="text-sm text-red-500 list-disc list-inside max-h-32 overflow-y-auto">
                        {smsResults.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Preview */}
            {selectedStudents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Preview</h2>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700">
                  {students.find(s => s.id.toString() === selectedStudents[0]) && 
                    generateMessage(students.find(s => s.id.toString() === selectedStudents[0])!)}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Preview for first selected student. Each message will be personalized.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
