import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer } from 'lucide-react';
import { ReportsAPI } from '../../../services/baseUrl';

interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface StudentInfo {
  name: string;
  admission_number: string;
  class: string;
  stream: string;
}

interface ExamInfo {
  term: string;
  academic_year: string;
  exam_type: string;
}

interface Subject {
  subject: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
}

interface Summary {
  total_marks_obtained: number;
  total_possible_marks: number;
  overall_percentage: number;
  overall_grade: string;
  total_subjects: number;
  position: number;
  total_students: number;
}

interface ReportData {
  school_info: SchoolInfo;
  student_info: StudentInfo;
  exam_info: ExamInfo;
  subjects: Subject[];
  summary: Summary;
}

interface StudentReportTemplateProps {
  studentId?: string;
  term?: string;
  academicYear?: string;
  examType?: string;
  onClose?: () => void;
}

const StudentReportTemplate: React.FC<StudentReportTemplateProps> = ({
  studentId,
  term = '1',
  academicYear = '2024-2025',
  examType = 'exam_1',
  onClose
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Hide after 3 seconds
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        term,
        academic_year: academicYear,
        exam_type: examType
      };

      if (studentId) {
        params.student_id = studentId;
      }

      // Determine user type based on available tokens
      const staffToken = localStorage.getItem('staff_access_token');
      const parentToken = localStorage.getItem('parent_access_token');
      const userType = parentToken ? 'parent' : 'staff';

      if (!staffToken && !parentToken) {
        setError('No authentication token found');
        return;
      }

      const data = await ReportsAPI.getStudentReportData(params, userType);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current || !reportData) return;

    setIsDownloading(true);
    
    try {
      // Capture the element exactly as it appears on desktop with high quality
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High quality capture
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        foreignObjectRendering: false,
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 dimensions in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Calculate scaling to fit the content width to page width with small margins
      const margin = 10; // 10mm margin on each side
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Scale based on width to maintain desktop appearance
      const scaledWidth = availableWidth;
      const scaledHeight = (canvas.height / canvas.width) * scaledWidth;
      
      // Check if content fits on one page
      if (scaledHeight <= availableHeight) {
        // Fits on one page - add with margins
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', margin, margin, scaledWidth, scaledHeight);
      } else {
        // Content is too tall - scale to fit height instead
        const heightBasedWidth = (canvas.width / canvas.height) * availableHeight;
        const xOffset = (pdfWidth - heightBasedWidth) / 2;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xOffset, margin, heightBasedWidth, availableHeight);
      }

      // Clean up canvas to free memory
      canvas.width = 0;
      canvas.height = 0;

      const filename = `${reportData.student_info.name}_${reportData.exam_info.term}_${reportData.exam_info.academic_year}_Report.pdf`;
      pdf.save(filename);
      
      // Show success message
      showToast('PDF downloaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const printReport = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Student Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .no-print { display: none !important; }
                @media print {
                  body { margin: 0; }
                  .page-break { page-break-before: always; }
                }
              </style>
            </head>
            <body>
              ${reportRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  React.useEffect(() => {
    fetchReportData();
  }, [studentId, term, academicYear, examType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
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
            onClick={fetchReportData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No report data available</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .report-container {
            width: 800px !important; /* Fixed desktop width */
            min-width: 800px;
            transform-origin: top left;
            transition: transform 0.3s ease;
          }
          
          /* Scale down proportionally on smaller screens */
          @media screen and (max-width: 850px) {
            .report-container {
              transform: scale(0.9);
            }
          }
          
          @media screen and (max-width: 750px) {
            .report-container {
              transform: scale(0.8);
            }
          }
          
          @media screen and (max-width: 650px) {
            .report-container {
              transform: scale(0.7);
            }
          }
          
          @media screen and (max-width: 550px) {
            .report-container {
              transform: scale(0.6);
            }
          }
          
          @media screen and (max-width: 450px) {
            .report-container {
              transform: scale(0.5);
            }
          }
          
          @media screen and (max-width: 400px) {
            .report-container {
              transform: scale(0.45);
            }
          }
          
          /* Adjust container to prevent overflow */
          .report-wrapper {
            overflow-x: auto;
            width: 100%;
          }
          
          @media print {
            .report-container {
              width: 100% !important;
              transform: none !important;
              margin: 0 !important;
              padding: 20mm !important;
            }
          }
          
          /* Ensure tables maintain their structure */
          .report-container table {
            width: 100% !important;
            table-layout: fixed;
          }
        `}
      </style>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gray-50 py-8">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-6 px-4 no-print">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Academic Report</h1>
          <div className="flex space-x-3">
            <button
              onClick={printReport}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={generatePDF}
              disabled={isDownloading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDownloading 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-wrapper max-w-full mx-auto bg-white shadow-lg overflow-x-auto">
        <div ref={reportRef} className="p-8 report-container" style={{
          width: '800px',
          backgroundColor: 'white',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
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
                {reportData.subjects.map((subject, index) => (
                  <tr key={index}>
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

          {/* Class Teacher Comments */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">CLASS TEACHER'S COMMENTS:</h3>
            <div className="border border-black h-20 p-2">
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

          {/* Principal Comments */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">PRINCIPAL'S COMMENTS:</h3>
            <div className="border border-black h-20 p-2">
              <p className="text-sm italic">
                Good work overall. Continue striving for excellence.
              </p>
            </div>
          </div>

          {/* Next Term */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mb-2"><strong>NEXT TERM BEGINS:</strong> ________________</p>
              <p className="mb-2"><strong>SCHOOL FEES:</strong> ________________</p>
            </div>
            <div>
              <p className="mb-2"><strong>CLASS TEACHER:</strong> ________________</p>
              <p className="mb-2"><strong>SIGNATURE:</strong> ________________</p>
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
      </div>
    </>
  );
};

export default StudentReportTemplate;
