import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { Download, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { DataAPI, ReportsAPI } from '../../../services/baseUrl';

// Diagnostic: listen for unhandled promise rejections so we can surface extension errors
if (typeof window !== 'undefined') {
  const _unhandledRejectionHandler = (e: PromiseRejectionEvent) => {
    try {
      console.warn('Unhandled promise rejection captured:', e.reason);
      // If the error message matches the extension connection error, include hint
      if (e.reason && typeof e.reason === 'string' && e.reason.includes('Could not establish connection')) {
        console.warn('This error often comes from a browser extension content script (content-all.js). Try disabling extensions or run in an incognito window to isolate it.');
      }
    } catch (err) {
      console.warn('Error inside unhandledRejection handler', err);
    }
  };
  window.addEventListener('unhandledrejection', _unhandledRejectionHandler);
  // remove listener when page unloads to avoid duplicates during HMR
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('unhandledrejection', _unhandledRejectionHandler);
  });
}
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
  const [progress, setProgress] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const reportRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchClasses();
    
    // Read URL parameters and set initial state
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class_id');
    const term = urlParams.get('term');
    const examType = urlParams.get('exam_type');
    const academicYear = urlParams.get('academic_year');
    
    if (classId) setSelectedClass(classId);
    if (term) setSelectedTerm(term);
    if (examType) setSelectedExamType(examType);
    if (academicYear) setSelectedAcademicYear(academicYear);
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

    // Update URL with current parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('class_id', selectedClass);
    currentUrl.searchParams.set('term', selectedTerm);
    currentUrl.searchParams.set('exam_type', selectedExamType);
    currentUrl.searchParams.set('academic_year', selectedAcademicYear);
    window.history.pushState({}, '', currentUrl.toString());

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

    // Update URL with current parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('class_id', bulkReportData.class_info.class_id.toString());
    currentUrl.searchParams.set('term', bulkReportData.exam_info.term);
    currentUrl.searchParams.set('exam_type', bulkReportData.exam_info.exam_type);
    currentUrl.searchParams.set('academic_year', bulkReportData.exam_info.academic_year);
    window.history.pushState({}, '', currentUrl.toString());

    // Show confirmation for large classes
    const reportCount = bulkReportData.reports.length;
    if (reportCount > 50) {
      const confirmed = window.confirm(
        `You are about to generate ${reportCount} reports. This may take a moment. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCancelRequested(false);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
  const pageHeight = 297; // A4 height in mm
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
      
  const totalReports = bulkReportData.reports.length;
      
      for (let reportIndex = 0; reportIndex < totalReports; reportIndex++) {
        if (cancelRequested) break;
        
        const reportData = bulkReportData.reports[reportIndex];
        setProgress(Math.round((reportIndex / totalReports) * 100));
        
        // Add new page for each report except the first
        if (reportIndex > 0) {
          pdf.addPage();
        }
        
        let currentY = margin;
        
        // Helper function for this report
        const addText = (text: string, x: number, y: number, options: any = {}) => {
          const { fontSize = 10, fontStyle = 'normal', maxWidth = contentWidth, align = 'left' } = options;
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          
          if (maxWidth && align !== 'center') {
            const lines = pdf.splitTextToSize(text, maxWidth);
            lines.forEach((line: string, index: number) => {
              pdf.text(line, x, y + (index * 5));
            });
            return lines.length * 5;
          } else {
            if (align === 'center') {
              pdf.text(text, pageWidth / 2, y, { align: 'center' });
            } else {
              pdf.text(text, x, y);
            }
            return 5;
          }
        };
        
        // Header (compact for bulk) with logo
        let logoHeight = 0;
        if (reportData.school_info.logo_url) {
          try {
            // Fetch logo as base64 data URL
            const toDataURL = (url: string) => new Promise<string>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.onload = function() {
                const reader = new FileReader();
                reader.onloadend = function() {
                  resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(xhr.response);
              };
              xhr.onerror = reject;
              xhr.open('GET', url);
              xhr.responseType = 'blob';
              xhr.send();
            });
            const logoDataUrl = await toDataURL(reportData.school_info.logo_url);
            const logoSize = 15; // Smaller logo for bulk reports
            const logoX = (pageWidth - logoSize) / 2;
            // Detect mime type and choose format for jsPDF
            let imgFormat: any = 'PNG';
            try {
              const mimeMatch = logoDataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,/i);
              if (mimeMatch && mimeMatch[1]) {
                const mime = mimeMatch[1].toLowerCase();
                if (mime.includes('jpeg') || mime.includes('jpg')) imgFormat = 'JPEG';
                else imgFormat = 'PNG';
              }
            } catch (err) {
              imgFormat = 'PNG';
            }
            // Try to add image at top; if it fails, try with a smaller size
            try {
              pdf.addImage(logoDataUrl, imgFormat, logoX, currentY, logoSize, logoSize);
              logoHeight = logoSize + 3;
              currentY += logoHeight;
            } catch (embedErr) {
              console.warn('First attempt to embed logo failed, retrying with smaller size', embedErr);
              const smallSize = Math.max(10, logoSize - 5);
              try {
                pdf.addImage(logoDataUrl, imgFormat, logoX, currentY, smallSize, smallSize);
                logoHeight = smallSize + 3;
                currentY += logoHeight;
              } catch (secondErr) {
                console.warn('Failed to embed logo on retry:', secondErr);
                // leave logoHeight as 0 and continue
              }
            }
          } catch (error) {
            console.warn('Failed to load logo:', error);
          }
        }
        
        currentY += addText(reportData.school_info.name.toUpperCase(), 0, currentY, { 
          fontSize: 12, fontStyle: 'bold', align: 'center' 
        });
        currentY += addText(reportData.school_info.address || '', 0, currentY, { 
          fontSize: 8, align: 'center' 
        });
        // Add phone and email
        const contactLine = `TEL: ${reportData.school_info.phone || ''} | EMAIL: ${reportData.school_info.email || ''}`;
        currentY += addText(contactLine, 0, currentY, { fontSize: 8, align: 'center' });
        if (reportData.school_info.motto) {
          currentY += addText(reportData.school_info.motto, 0, currentY, { 
            fontSize: 7, fontStyle: 'italic', align: 'center' 
          });
        }
        currentY += addText('ACADEMIC PROGRESS REPORT', 0, currentY, { 
          fontSize: 10, fontStyle: 'bold', align: 'center' 
        });
        
        currentY += 5;
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 6;
        
        // Student Information (compact)
        addText(`NAME: ${reportData.student_info.name.toUpperCase()}`, margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        addText(`TERM: ${reportData.exam_info.term}`, pageWidth / 2, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 6;
        
        addText(`ADM NO: ${reportData.student_info.admission_number}`, margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        addText(`YEAR: ${reportData.exam_info.academic_year}`, pageWidth / 2, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 6;
        
        addText(`CLASS: ${reportData.student_info.class}`, margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        addText(`EXAM: ${reportData.exam_info.exam_type}`, pageWidth / 2, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 10;
        
        // Subjects Table
        const rowHeight = 7;
        const colWidths = [45, 18, 18, 18, 18, 43];
        let tableX = margin;
        
        // Table headers
        const headers = ['SUBJECT', 'MARKS', 'OUT OF', '%', 'GRADE', 'REMARKS'];
        pdf.setFillColor(240, 240, 240);
        pdf.rect(tableX, currentY, contentWidth, rowHeight, 'F');
        
        let currentX = tableX;
        headers.forEach((header, index) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.text(header, currentX + 2, currentY + 4.5);
          
          // Draw vertical lines
          if (index < headers.length - 1) {
            pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
          }
          currentX += colWidths[index];
        });
        
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
            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            if (index === 1 || index === 2 || index === 3 || index === 4) {
              pdf.text(data, currentX + (colWidths[index] / 2), currentY + 4.5, { align: 'center' });
            } else {
              pdf.text(data, currentX + 1, currentY + 4.5);
            }
            
            // Draw vertical lines
            if (index < rowData.length - 1) {
              pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
            }
            currentX += colWidths[index];
          });
          
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
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          if (index === 1 || index === 2 || index === 3 || index === 4) {
            pdf.text(data, currentX + (colWidths[index] / 2), currentY + 4.5, { align: 'center' });
          } else {
            pdf.text(data, currentX + 2, currentY + 4.5);
          }
          
          if (index < summaryData.length - 1) {
            pdf.line(currentX + colWidths[index], currentY, currentX + colWidths[index], currentY + rowHeight);
          }
          currentX += colWidths[index];
        });
        
        pdf.rect(tableX, currentY, contentWidth, rowHeight);
        currentY += rowHeight + 10;
        
        // Class Summary
        addText(`POSITION IN CLASS: ${reportData.summary.position} out of ${reportData.summary.total_students}`, margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        addText(`OVERALL GRADE: ${reportData.summary.overall_grade}`, pageWidth / 2, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 6;
        
        addText(`TOTAL SUBJECTS: ${reportData.summary.total_subjects}`, margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        addText(`PERCENTAGE: ${reportData.summary.overall_percentage.toFixed(1)}%`, pageWidth / 2, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 12;
        
        // Class Teacher's Comments
        addText('CLASS TEACHER\'S COMMENTS:', margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 6;
        
        const teacherComment = reportData.summary.overall_percentage >= 80 ? 
          'Excellent performance! Keep up the outstanding work.' :
          reportData.summary.overall_percentage >= 70 ?
          'Very good performance. Continue working hard.' :
          reportData.summary.overall_percentage >= 60 ?
          'Good performance. There is room for improvement.' :
          reportData.summary.overall_percentage >= 50 ?
          'Average performance. More effort is needed.' :
          'Performance needs significant improvement. Please seek extra help.';
        
        pdf.rect(margin, currentY, contentWidth, 15);
        currentY += addText(teacherComment, margin + 2, currentY + 4, { fontSize: 8, maxWidth: contentWidth - 4 });
        currentY += 18;
        
        // Principal's Comments
        addText('PRINCIPAL\'S COMMENTS:', margin, currentY, { fontSize: 10, fontStyle: 'bold' });
        currentY += 6;
        
        pdf.rect(margin, currentY, contentWidth, 15);
        addText('Good work overall. Continue striving for excellence.', margin + 2, currentY + 4, { fontSize: 8 });
        currentY += 20;
        
        // Footer
        addText(`CLOSING DATE: ${reportData.exam_info.closing_date || '________________'}`, margin, currentY, { fontSize: 9 });
        addText('CLASS TEACHER: ________________', pageWidth / 2, currentY, { fontSize: 9 });
        currentY += 6;
        
        addText(`OPENING DATE: ${reportData.exam_info.opening_date || '________________'}`, margin, currentY, { fontSize: 9 });
        addText('SIGNATURE: ________________', pageWidth / 2, currentY, { fontSize: 9 });
        currentY += 12;
        
        // Generated date
        addText(`Generated on ${new Date().toLocaleDateString()} | School Management System`, 0, pageHeight - 10, { 
          fontSize: 7, align: 'center' 
        });
        
        // Small delay every 10 reports
        if (reportIndex % 10 === 0 && reportIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (!cancelRequested) {
        setProgress(100);
        const filename = `${bulkReportData.class_info.class_name}_${bulkReportData.exam_info.term}_${bulkReportData.exam_info.academic_year}_Bulk_Reports.pdf`;
        pdf.save(filename);
      }
      
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      alert(`Error generating bulk PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Try reducing the number of reports or refresh the page.`);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCancelRequested(false);
    }
  };

  const cancelGeneration = () => {
    setCancelRequested(true);
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

            {/* Warning for large classes */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Performance Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Generating bulk PDFs for large classes (30+ students) may take several minutes and use significant memory. 
                    Consider generating reports in smaller batches if you experience issues.
                  </p>
                </div>
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
              margin: 0 0 10mm 0 !important;
              padding: 20mm !important;
              page-break-after: always;
            }
          }
          
          /* Ensure tables maintain their structure */
          .report-container table {
            width: 100% !important;
            table-layout: fixed;
          }
        `}
      </style>
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
              <span>
                {isGenerating 
                  ? `Generating... ${progress}%` 
                  : 'Download All PDFs'
                }
              </span>
            </button>
            
            {/* Cancel button - only shown during generation */}
            {isGenerating && (
              <button
                onClick={cancelGeneration}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <span>Cancel</span>
              </button>
            )}
            
            {/* Progress bar */}
            {isGenerating && (
              <div className="w-full mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">
                    Processing {Math.round((progress / 100) * bulkReportData.reports.length)} of {bulkReportData.reports.length} reports
                  </span>
                  <span className="text-sm text-gray-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {bulkReportData.reports.length > 50 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Large class detected. This may take several minutes and use significant memory.
                  </p>
                )}
              </div>
            )}
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
          <div key={index} className="report-wrapper bg-white shadow-lg mb-8 page-break overflow-x-auto">
            <div ref={el => { reportRefs.current[index] = el; }} className="p-8 report-container" style={{
              width: '800px',
              backgroundColor: 'white',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}>
              {/* Individual Report Template - Same as StudentReportTemplate */}
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

              {/* Principal's Comments */}
              <div className="mb-6">
                <h3 className="font-bold mb-2">PRINCIPAL'S COMMENTS:</h3>
                <div className="border border-black h-20 p-2">
                  <p className="text-sm italic">
                    Good work overall. Continue striving for excellence.
                  </p>
                </div>
              </div>

              {/* Footer Information */}
              <div className="grid grid-cols-2 gap-8 mb-6">
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
        ))}
      </div>
      </div>
    </>
  );
};

export default BulkReportTemplate;
