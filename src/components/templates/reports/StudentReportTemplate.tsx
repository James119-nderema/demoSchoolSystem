import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';
import { ReportsAPI } from '../../../services/baseUrl';

interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string | null;
  motto?: string;
  vision?: string;
  mission?: string;
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
  closing_date?: string;
  opening_date?: string;
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
  templateId?: string;
  onClose?: () => void;
}

const StudentReportTemplate: React.FC<StudentReportTemplateProps> = ({
  studentId,
  term = '1',
  academicYear = '2024-2025',
  examType = 'exam_1',
  templateId: _templateId = 'template1',
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
    if (!reportData) return;

    setIsDownloading(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      let currentY = margin;
      
      // Helper function to add text with automatic line wrapping
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const { fontSize = 10, fontStyle = 'normal', maxWidth = contentWidth, align = 'left' } = options;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        
        if (maxWidth) {
          const lines = pdf.splitTextToSize(text, maxWidth);
          lines.forEach((line: string, index: number) => {
            if (align === 'center') {
              pdf.text(line, pageWidth / 2, y + (index * 5), { align: 'center' });
            } else {
              pdf.text(line, x, y + (index * 5));
            }
          });
          return lines.length * 5; // Return height used
        } else {
          if (align === 'center') {
            pdf.text(text, pageWidth / 2, y, { align: 'center' });
          } else {
            pdf.text(text, x, y);
          }
          return 5; // Return single line height
        }
      };
      
      // Header with logo
      let logoHeight = 0;
      if (reportData.school_info.logo_url) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = () => resolve(logoImg);
            logoImg.onerror = reject;
            logoImg.src = reportData.school_info.logo_url!;
          });
          
          const logoSize = 20; // Logo size in mm
          const logoX = (pageWidth - logoSize) / 2;
          pdf.addImage(logoImg, 'PNG', logoX, currentY, logoSize, logoSize);
          logoHeight = logoSize + 5;
          currentY += logoHeight;
        } catch (error) {
          console.warn('Failed to load logo:', error);
        }
      }
      
      currentY += addText(reportData.school_info.name.toUpperCase(), 0, currentY, { 
        fontSize: 16, fontStyle: 'bold', align: 'center' 
      });
      currentY += addText(reportData.school_info.address || '', 0, currentY, { 
        fontSize: 10, align: 'center' 
      });
      currentY += addText(`TEL: ${reportData.school_info.phone} | EMAIL: ${reportData.school_info.email}`, 0, currentY, { 
        fontSize: 10, align: 'center' 
      });
      if (reportData.school_info.motto) {
        currentY += addText(`MOTTO: ${reportData.school_info.motto}`, 0, currentY, { 
          fontSize: 9, fontStyle: 'italic', align: 'center' 
        });
      }
      currentY += addText('ACADEMIC PROGRESS REPORT', 0, currentY, { 
        fontSize: 14, fontStyle: 'bold', align: 'center' 
      });
      
      // Add line separator
      currentY += 5;
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Student Information
      addText(`NAME: ${reportData.student_info.name.toUpperCase()}`, margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      addText(`TERM: ${reportData.exam_info.term}`, pageWidth / 2, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 8;
      
      addText(`ADM NO: ${reportData.student_info.admission_number}`, margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      addText(`YEAR: ${reportData.exam_info.academic_year}`, pageWidth / 2, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 8;
      
      addText(`CLASS: ${reportData.student_info.class}`, margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      addText(`EXAM: ${reportData.exam_info.exam_type}`, pageWidth / 2, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 15;
      
      // Subjects Table
      const rowHeight = 8;
      const colWidths = [50, 20, 20, 20, 20, 50]; // Column widths
      let tableX = margin;
      
      // Table headers
      const headers = ['SUBJECT', 'MARKS', 'OUT OF', '%', 'GRADE', 'REMARKS'];
      pdf.setFillColor(240, 240, 240);
      pdf.rect(tableX, currentY, contentWidth, rowHeight, 'F');
      
      let currentX = tableX;
      headers.forEach((header, index) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(header, currentX + 2, currentY + 5);
        
        // Draw vertical lines
        if (index < headers.length - 1) {
          pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
        }
        currentX += colWidths[index];
      });
      
      // Draw table border
      pdf.rect(tableX, currentY, contentWidth, rowHeight);
      currentY += rowHeight;
      
      // Table data - Show ALL subjects
      reportData.subjects.forEach((subject: any) => {
        currentX = tableX;
        const rowData = [
          subject.subject,
          subject.marks_obtained.toString(),
          subject.total_marks.toString(),
          subject.percentage.toFixed(1),
          subject.grade,
          subject.percentage >= 80 ? 'EXCELLENT' : 
          subject.percentage >= 70 ? 'VERY GOOD' :
          subject.percentage >= 60 ? 'GOOD' :
          subject.percentage >= 50 ? 'AVERAGE' : 'NEEDS IMPROVEMENT'
        ];
        
        rowData.forEach((data, index) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          if (index === 1 || index === 2 || index === 3 || index === 4) {
            // Center align numbers and grades
            pdf.text(data, currentX + (colWidths[index] / 2), currentY + 5, { align: 'center' });
          } else {
            pdf.text(data, currentX + 2, currentY + 5);
          }
          
          // Draw vertical lines
          if (index < rowData.length - 1) {
            pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
          }
          currentX += colWidths[index];
        });
        
        // Draw row border
        pdf.rect(tableX, currentY, contentWidth, rowHeight);
        currentY += rowHeight;
      });
      
      // Summary row
      pdf.setFillColor(240, 240, 240);
      pdf.rect(tableX, currentY, contentWidth, rowHeight, 'F');
      
      currentX = tableX;
      const summaryData = [
        'TOTAL',
        reportData.summary.total_marks_obtained.toString(),
        reportData.summary.total_possible_marks.toString(),
        reportData.summary.overall_percentage.toFixed(1),
        reportData.summary.overall_grade,
        '-'
      ];
      
      summaryData.forEach((data, index) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        if (index === 1 || index === 2 || index === 3 || index === 4) {
          pdf.text(data, currentX + (colWidths[index] / 2), currentY + 5, { align: 'center' });
        } else {
          pdf.text(data, currentX + 2, currentY + 5);
        }
        
        if (index < summaryData.length - 1) {
          pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
        }
        currentX += colWidths[index];
      });
      
      pdf.rect(tableX, currentY, contentWidth, rowHeight);
      currentY += rowHeight + 15;
      
      // Class Summary
      addText(`POSITION IN CLASS: ${reportData.summary.position} out of ${reportData.summary.total_students}`, margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      addText(`OVERALL GRADE: ${reportData.summary.overall_grade}`, pageWidth / 2, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 8;
      
      addText(`TOTAL SUBJECTS: ${reportData.summary.total_subjects}`, margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      addText(`PERCENTAGE: ${reportData.summary.overall_percentage.toFixed(1)}%`, pageWidth / 2, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 20;
      
      // Comments
      addText('CLASS TEACHER\'S COMMENTS:', margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 8;
      
      const teacherComment = reportData.summary.overall_percentage >= 80 ? 
        'Excellent performance! Keep up the outstanding work.' :
        reportData.summary.overall_percentage >= 70 ?
        'Very good performance. Continue working hard.' :
        reportData.summary.overall_percentage >= 60 ?
        'Good performance. There is room for improvement.' :
        reportData.summary.overall_percentage >= 50 ?
        'Average performance. More effort is needed.' :
        'Performance needs significant improvement. Please seek extra help.';
      
      pdf.rect(margin, currentY, contentWidth, 20);
      currentY += addText(teacherComment, margin + 2, currentY + 5, { fontSize: 9, maxWidth: contentWidth - 4 });
      currentY += 25;
      
      // Principal Comments
      addText('PRINCIPAL\'S COMMENTS:', margin, currentY, { fontSize: 11, fontStyle: 'bold' });
      currentY += 8;
      
      pdf.rect(margin, currentY, contentWidth, 20);
      addText('Good work overall. Continue striving for excellence.', margin + 2, currentY + 5, { fontSize: 9 });
      currentY += 30;
      
      // Footer
      addText(`CLOSING DATE: ${reportData.exam_info.closing_date || '________________'}`, margin, currentY, { fontSize: 10 });
      addText('CLASS TEACHER: ________________', pageWidth / 2, currentY, { fontSize: 10 });
      currentY += 8;
      
      addText(`OPENING DATE: ${reportData.exam_info.opening_date || '________________'}`, margin, currentY, { fontSize: 10 });
      addText('SIGNATURE: ________________', pageWidth / 2, currentY, { fontSize: 10 });
      currentY += 15;
      
      // Generated date
      addText(`Generated on ${new Date().toLocaleDateString()} | School Management System`, 0, pageHeight - 10, { 
        fontSize: 8, align: 'center' 
      });

      const filename = `${reportData.student_info.name}_${reportData.exam_info.term}_${reportData.exam_info.academic_year}_Report.pdf`;
      pdf.save(filename);
      
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
            {reportData.school_info.logo_url && (
              <div className="flex justify-center mb-3">
                <img 
                  src={reportData.school_info.logo_url} 
                  alt="School Logo" 
                  className="w-20 h-20 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <h1 className="text-xl font-bold mb-2">{reportData.school_info.name.toUpperCase()}</h1>
            <p className="text-sm mb-1">{reportData.school_info.address}</p>
            <p className="text-sm">TEL: {reportData.school_info.phone} | EMAIL: {reportData.school_info.email}</p>
            {reportData.school_info.motto && (
              <p className="text-sm italic mt-1">MOTTO: {reportData.school_info.motto}</p>
            )}
            <h2 className="text-lg font-bold mt-4 mb-2">ACADEMIC PROGRESS REPORT</h2>
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
              <p className="mb-2"><strong>CLOSING DATE:</strong> {reportData.exam_info.closing_date || '________________'}</p>
              <p className="mb-2"><strong>OPENING DATE:</strong> {reportData.exam_info.opening_date || '________________'}</p>
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
