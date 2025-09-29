import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudentReportTemplate, BulkReportTemplate } from '../templates';
import { FileText, Calendar, BookOpen, Users, Search, ChevronDown, X } from 'lucide-react';
import { APIService, API_ENDPOINTS } from '../../services/baseUrl';


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

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState<string>('exam_1');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'staff' | 'parent'>('staff');

  // Searchable dropdown states
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  // Get report type from URL parameters
  const reportType = searchParams.get('type') || '';
  const studentIdFromUrl = searchParams.get('studentId') || '';
  const termFromUrl = searchParams.get('term') || '1';
  const academicYearFromUrl = searchParams.get('academicYear') || '2024-2025';
  const examTypeFromUrl = searchParams.get('examType') || 'exam_1';

  // Validate report type
  const isValidReportType = reportType === 'single' || reportType === 'bulk' || reportType === '';
  const validReportType = isValidReportType ? reportType : '';

  useEffect(() => {
    // Determine user type based on token
    const staffToken = localStorage.getItem('staff_access_token');
    const parentToken = localStorage.getItem('parent_access_token');
    
    if (parentToken) {
      setUserType('parent');
    } else if (staffToken) {
      setUserType('staff');
      fetchStudents();
    }

    // Initialize form with URL parameters if they exist
    if (studentIdFromUrl) {
      setSelectedStudent(studentIdFromUrl);
    }
    if (termFromUrl !== '1') {
      setSelectedTerm(termFromUrl);
    }
    if (academicYearFromUrl !== '2024-2025') {
      setSelectedAcademicYear(academicYearFromUrl);
    }
    if (examTypeFromUrl !== 'exam_1') {
      setSelectedExamType(examTypeFromUrl);
    }
  }, [studentIdFromUrl, termFromUrl, academicYearFromUrl, examTypeFromUrl]);

  // Filter students based on search query
  useEffect(() => {
    if (studentSearchQuery.trim() === '') {
      // Show all students when no search query
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(studentSearchQuery.toLowerCase())
      );
      // Show all filtered results
      setFilteredStudents(filtered);
    }
  }, [students, studentSearchQuery]);

  // Update search query when a student is selected
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      const student = students.find(s => s.id.toString() === selectedStudent);
      if (student) {
        setStudentSearchQuery(`${student.full_name} - ${student.admission_number}`);
      }
    } else {
      setStudentSearchQuery('');
    }
  }, [selectedStudent, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Check authentication token
      const token = localStorage.getItem('staff_access_token');
      
      if (!token) {
        setStudents([]);
        return;
      }
      
      // Fetch ALL students by handling pagination
      let allStudents: Student[] = [];
      let nextUrl = APIService.getUrl(`${API_ENDPOINTS.STUDENTS}?page_size=1000`);
      let pageCount = 0;
      
      while (nextUrl && pageCount < 20) { // Safety limit to prevent infinite loops
        pageCount++;
        
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add students from this page
        if (data.results && Array.isArray(data.results)) {
          allStudents = [...allStudents, ...data.results];
        }
        
        // Check if there are more pages
        nextUrl = data.next;
        
        // If total count is known and we have all students, break
        if (data.count && allStudents.length >= data.count) {
          break;
        }
      }
      
      setStudents(allStudents);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (userType === 'staff' && !selectedStudent) {
      alert('Please select a student');
      return;
    }
    // Set URL parameters for single report
    const params = new URLSearchParams();
    params.set('type', 'single');
    if (userType === 'staff' && selectedStudent) {
      params.set('studentId', selectedStudent);
    }
    params.set('term', selectedTerm);
    params.set('academicYear', selectedAcademicYear);
    params.set('examType', selectedExamType);
    setSearchParams(params);
  };

  const handleCloseReport = () => {
    // Clear URL parameters
    setSearchParams({});
  };

  const handleGenerateBulkReport = () => {
    // Set URL parameters for bulk report
    const params = new URLSearchParams();
    params.set('type', 'bulk');
    setSearchParams(params);
  };

  const handleCloseBulkReport = () => {
    // Clear URL parameters
    setSearchParams({});
  };

  // Handle student search input
  const handleStudentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setStudentSearchQuery(query);
    setIsStudentDropdownOpen(true);
    
    // Clear selected student if input doesn't match exactly
    if (selectedStudent) {
      const student = students.find(s => s.id.toString() === selectedStudent);
      if (!student || `${student.full_name} - ${student.admission_number}` !== query) {
        setSelectedStudent('');
      }
    }
  };

  // Handle student selection from dropdown
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student.id.toString());
    const displayText = `${student.full_name} - ${student.admission_number}`;
    setStudentSearchQuery(displayText);
    setIsStudentDropdownOpen(false);
  };

  // Handle input focus
  const handleStudentInputFocus = () => {
    setIsStudentDropdownOpen(true);
  };

  // Handle input blur (with delay to allow for clicks on dropdown items)
  const handleStudentInputBlur = () => {
    // Longer delay to ensure click events can fire
    setTimeout(() => setIsStudentDropdownOpen(false), 300);
  };

  // Handle keyboard navigation
  const handleStudentInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsStudentDropdownOpen(false);
    } else if (e.key === 'ArrowDown' && !isStudentDropdownOpen) {
      setIsStudentDropdownOpen(true);
    }
  };

  // Clear student selection
  const handleClearStudent = () => {
    setSelectedStudent('');
    setStudentSearchQuery('');
    setIsStudentDropdownOpen(false);
  };

  if (validReportType === 'single') {
    return (
      <StudentReportTemplate
        studentId={userType === 'staff' ? (studentIdFromUrl || selectedStudent) : undefined}
        term={termFromUrl}
        academicYear={academicYearFromUrl}
        examType={examTypeFromUrl}
        onClose={handleCloseReport}
      />
    );
  }

  if (validReportType === 'bulk') {
    return (
      <BulkReportTemplate onClose={handleCloseBulkReport} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Student Academic Reports</h1>
          </div>
          <p className="text-gray-600">
            Generate and download comprehensive academic progress reports for students.
          </p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Student Selection (for staff only) */}
            {userType === 'staff' && (
              <div className="space-y-2 relative">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Select Student</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={handleStudentSearchChange}
                      onFocus={handleStudentInputFocus}
                      onBlur={handleStudentInputBlur}
                      onKeyDown={handleStudentInputKeyDown}
                      placeholder="Type student name or admission number..."
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      autoComplete="off"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      {selectedStudent && (
                        <button
                          onClick={handleClearStudent}
                          className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Dropdown menu */}
                  {isStudentDropdownOpen && !loading && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudents.length > 0 ? (
                        <>
                          {filteredStudents.map((student) => (
                            <div
                              key={student.id}
                              onClick={() => handleStudentSelect(student)}
                              onMouseDown={(e) => e.preventDefault()} // Prevent blur event
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900">
                                {student.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.admission_number} • {student.current_class || 'No class'}
                              </div>
                            </div>
                          ))}
                        </>
                      ) : studentSearchQuery ? (
                        <div className="px-3 py-3 text-gray-500 text-sm">
                          No students found matching "{studentSearchQuery}"
                        </div>
                      ) : (
                        <div className="px-3 py-3 text-gray-500 text-sm">
                          Type to search for students...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isStudentDropdownOpen && loading && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                      <div className="flex items-center space-x-2 text-gray-500 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading students...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {loading && (
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span>Loading students...</span>
                  </div>
                )}
                {!loading && students.length === 0 && (
                  <p className="text-sm text-amber-600">No students found. Please add students first.</p>
                )}
                {!loading && students.length > 0 && !selectedStudent && (
                  <p className="text-sm text-blue-600">{students.length} students loaded. Click to search.</p>
                )}
                {selectedStudent && !loading && (
                  <p className="text-sm text-green-600 flex items-center space-x-1">
                    <span>✓</span>
                    <span>Student selected</span>
                  </p>
                )}
              </div>
            )}

            {/* Term Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Term</span>
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>
            </div>

            {/* Academic Year Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Academic Year</span>
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            {/* Exam Type Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <BookOpen className="w-4 h-4" />
                <span>Exam Type</span>
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="exam_1">Exam 1</option>
                <option value="exam_2">Exam 2</option>
                <option value="exam_3">Exam 3</option>
              </select>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={handleGenerateReport}
              disabled={userType === 'staff' && !selectedStudent}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                (userType === 'staff' && !selectedStudent)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Generate Single Report</span>
            </button>
            
            {userType === 'staff' && (
              <button
                onClick={handleGenerateBulkReport}
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Generate Bulk Reports</span>
              </button>
            )}
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Features</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Comprehensive subject-wise performance</li>
              <li>• Overall grade and percentage calculations</li>
              <li>• Class position and ranking</li>
              <li>• Teacher comments section</li>
              <li>• Professional PDF format</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Export Options</h3>
            <ul className="text-green-800 space-y-1 text-sm">
              <li>• Download single or bulk PDF files</li>
              <li>• Generate all student reports at once</li>
              <li>• Print directly from browser</li>
              <li>• Share with parents and guardians</li>
              <li>• Archive for school records</li>
              <li>• Automatic validation for missing data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
