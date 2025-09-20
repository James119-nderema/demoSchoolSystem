import React, { useState, useEffect } from 'react';
import { StudentReportTemplate, BulkReportTemplate } from '../templates';
import { FileText, Calendar, BookOpen, Users } from 'lucide-react';
import { DataAPI } from '../../services/baseUrl';

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  student_class: string;
}

const ReportsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState<string>('exam_1');
  const [showReport, setShowReport] = useState(false);
  const [showBulkReport, setShowBulkReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'staff' | 'parent'>('staff');

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
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await DataAPI.getStudents();
      setStudents(data.results || data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (userType === 'staff' && !selectedStudent) {
      alert('Please select a student');
      return;
    }
    setShowReport(true);
  };

  const handleCloseReport = () => {
    setShowReport(false);
  };

  const handleGenerateBulkReport = () => {
    setShowBulkReport(true);
  };

  const handleCloseBulkReport = () => {
    setShowBulkReport(false);
  };

  if (showReport) {
    return (
      <StudentReportTemplate
        studentId={userType === 'staff' ? selectedStudent : undefined}
        term={selectedTerm}
        academicYear={selectedAcademicYear}
        examType={selectedExamType}
        onClose={handleCloseReport}
      />
    );
  }

  if (showBulkReport) {
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
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Select Student</span>
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id.toString()}>
                      {student.full_name} - {student.admission_number}
                    </option>
                  ))}
                </select>
                {loading && (
                  <p className="text-sm text-gray-500">Loading students...</p>
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
