import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { DataAPI, ReportsAPI } from '../../../services/baseUrl';

interface Class {
  id: number;
  class_name: string;
  class_code: string;
  stream: string;
  grade_level: string;
}

interface StudentWithoutResults {
  id: number;
  name: string;
  admission_number: string;
}

interface BulkReportSummary {
  total_students: number;
  students_with_results: number;
  students_without_results: number;
  students_without_results_list: StudentWithoutResults[];
}

interface BulkReportData {
  reports: any[];
  summary: BulkReportSummary;
  class_info: {
    class_name: string;
    class_id: number;
  };
  exam_info: {
    term: string;
    academic_year: string;
    exam_type: string;
  };
}

interface BulkReportTemplateProps {
  onClose?: () => void;
}

const BulkReportTemplate: React.FC<BulkReportTemplateProps> = ({ onClose }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState<string>('exam_1');
  const [bulkReportData, setBulkReportData] = useState<BulkReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await DataAPI.getClasses();
      setClasses(data.results || data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchBulkReportData = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setLoading(true);
    setError(null);
    setBulkReportData(null);
    
    try {
      const params = {
        class_id: selectedClass,
        term: selectedTerm,
        academic_year: selectedAcademicYear,
        exam_type: selectedExamType
      };

      const data = await ReportsAPI.getBulkReportData(params);
      setBulkReportData(data);
      
      // Initialize refs array
      reportRefs.current = new Array(data.reports.length).fill(null);
      
    } catch (err) {
      console.error('Error fetching bulk report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bulk report data');
    } finally {
      setLoading(false);
    }
  };

  const generateBulkPDF = async () => {
    if (!bulkReportData || bulkReportData.reports.length === 0) return;

    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstReport = true;

      for (let i = 0; i < bulkReportData.reports.length; i++) {
        const reportRef = reportRefs.current[i];
        if (!reportRef) continue;

        const canvas = await html2canvas(reportRef, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        if (!isFirstReport) {
          pdf.addPage();
        }
        isFirstReport = false;

        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      const filename = `${bulkReportData.class_info.class_name}_${bulkReportData.exam_info.term}_${bulkReportData.exam_info.academic_year}_Bulk_Reports.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      alert('Error generating bulk PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bulk report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
          <button
            onClick={fetchBulkReportData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => {setError(null); setBulkReportData(null);}}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  if (!bulkReportData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Bulk Report Cards</h1>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Close
                </button>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Generate report cards for all students in a class at once.
            </p>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bulk Report Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Class Selection */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Select Class</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id.toString()}>
                      {cls.class_name} - Stream {cls.stream}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>

              {/* Academic Year Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>

              {/* Exam Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Exam Type</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exam_1">Exam 1</option>
                  <option value="exam_2">Exam 2</option>
                  <option value="exam_3">Exam 3</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={fetchBulkReportData}
                disabled={!selectedClass}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  !selectedClass
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Generate Bulk Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Action Buttons */}
      <div className="max-w-6xl mx-auto mb-6 px-4 no-print">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Report Cards</h1>
            <p className="text-gray-600">Class: {bulkReportData.class_info.class_name}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {setBulkReportData(null); setError(null);}}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <span>Back to Settings</span>
            </button>
            <button
              onClick={generateBulkPDF}
              disabled={isGenerating || bulkReportData.reports.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isGenerating || bulkReportData.reports.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Download All PDFs'}</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Total Students</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">{bulkReportData.summary.total_students}</p>
          </div>
          
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">With Results</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">{bulkReportData.summary.students_with_results}</p>
          </div>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Without Results</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{bulkReportData.summary.students_without_results}</p>
          </div>
        </div>

        {/* Students without results warning */}
        {bulkReportData.summary.students_without_results > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Students Without Results</h3>
                <p className="text-yellow-800 text-sm mb-2">
                  The following students don't have results for the selected period and won't be included in the PDF:
                </p>
                <ul className="text-yellow-800 text-sm">
                  {bulkReportData.summary.students_without_results_list.map((student) => (
                    <li key={student.id} className="mb-1">
                      • {student.name} ({student.admission_number})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="max-w-6xl mx-auto">
        {bulkReportData.reports.map((reportData, index) => (
          <div key={index} className="bg-white shadow-lg mb-8 page-break">
            <div ref={el => { reportRefs.current[index] = el; }} className="p-8">
              {/* Individual Report Template - Same as StudentReportTemplate */}
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-xl font-bold mb-2">{reportData.school_info.name.toUpperCase()}</h1>
                <p className="text-sm mb-1">{reportData.school_info.address}</p>
                <p className="text-sm">TEL: {reportData.school_info.phone} | EMAIL: {reportData.school_info.email}</p>
                <h2 className="text-lg font-bold mt-4 mb-2">ACADEMIC PROGRESS REPORT FORM 2 - 2024</h2>
              </div>

              {/* Student Information */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="mb-2"><strong>NAME:</strong> {reportData.student_info.name.toUpperCase()}</p>
                  <p className="mb-2"><strong>ADM NO:</strong> {reportData.student_info.admission_number}</p>
                  <p className="mb-2"><strong>CLASS:</strong> {reportData.student_info.class}</p>
                </div>
                <div>
                  <p className="mb-2"><strong>TERM:</strong> {reportData.exam_info.term}</p>
                  <p className="mb-2"><strong>YEAR:</strong> {reportData.exam_info.academic_year}</p>
                  <p className="mb-2"><strong>EXAM:</strong> {reportData.exam_info.exam_type}</p>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="mb-6">
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left">SUBJECT</th>
                      <th className="border border-black p-2 text-center">MARKS</th>
                      <th className="border border-black p-2 text-center">OUT OF</th>
                      <th className="border border-black p-2 text-center">%</th>
                      <th className="border border-black p-2 text-center">GRADE</th>
                      <th className="border border-black p-2 text-center">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.subjects.map((subject: any, subIndex: number) => (
                      <tr key={subIndex}>
                        <td className="border border-black p-2">{subject.subject}</td>
                        <td className="border border-black p-2 text-center">{subject.marks_obtained}</td>
                        <td className="border border-black p-2 text-center">{subject.total_marks}</td>
                        <td className="border border-black p-2 text-center">{subject.percentage.toFixed(1)}</td>
                        <td className="border border-black p-2 text-center font-bold">{subject.grade}</td>
                        <td className="border border-black p-2 text-center">
                          {subject.percentage >= 80 ? 'EXCELLENT' : 
                           subject.percentage >= 70 ? 'VERY GOOD' :
                           subject.percentage >= 60 ? 'GOOD' :
                           subject.percentage >= 50 ? 'AVERAGE' : 'NEEDS IMPROVEMENT'}
                        </td>
                      </tr>
                    ))}
                    {/* Summary Row */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-black p-2">TOTAL</td>
                      <td className="border border-black p-2 text-center">{reportData.summary.total_marks_obtained}</td>
                      <td className="border border-black p-2 text-center">{reportData.summary.total_possible_marks}</td>
                      <td className="border border-black p-2 text-center">{reportData.summary.overall_percentage.toFixed(1)}</td>
                      <td className="border border-black p-2 text-center">{reportData.summary.overall_grade}</td>
                      <td className="border border-black p-2 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Class Summary */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="mb-2"><strong>CLASS AVERAGE:</strong> ____%</p>
                  <p className="mb-2"><strong>POSITION IN CLASS:</strong> {reportData.summary.position} out of {reportData.summary.total_students}</p>
                  <p className="mb-2"><strong>TOTAL SUBJECTS:</strong> {reportData.summary.total_subjects}</p>
                </div>
                <div>
                  <p className="mb-2"><strong>OVERALL GRADE:</strong> {reportData.summary.overall_grade}</p>
                  <p className="mb-2"><strong>PERCENTAGE:</strong> {reportData.summary.overall_percentage.toFixed(1)}%</p>
                </div>
              </div>

              {/* Comments sections - simplified for bulk generation */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">CLASS TEACHER'S COMMENTS:</h3>
                <div className="border border-black h-16 p-2">
                  <p className="text-sm italic">
                    {reportData.summary.overall_percentage >= 80 ? 
                      'Excellent performance! Keep up the outstanding work.' :
                     reportData.summary.overall_percentage >= 70 ?
                      'Very good performance. Continue working hard.' :
                     reportData.summary.overall_percentage >= 60 ?
                      'Good performance. There is room for improvement.' :
                     reportData.summary.overall_percentage >= 50 ?
                      'Average performance. More effort is needed.' :
                      'Performance needs significant improvement. Please seek extra help.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-600">
                  Generated on {new Date().toLocaleDateString()} | School Management System
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BulkReportTemplate;
