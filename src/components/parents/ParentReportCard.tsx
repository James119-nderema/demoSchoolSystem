import React, { useState, useEffect, useRef } from 'react';
import { Download, Calendar, Filter, Loader2, AlertCircle, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

// Interface for API response subject performance
interface SubjectPerformance {
  subject: string;
  marks: number;
  max_marks: number;
  percentage: number;
  grade: string;
}

interface Subject {
  id: number;
  name: string;
  max_score: number;
  score: number;
  grade: string;
  remarks: string;
  position: number | null;
}

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  current_class: string;
  gender: string;
  date_of_birth: string;
  photo: string | null;
}

interface School {
  school_name: string;
  logo: string | null;
  address: string;
  phone_number: string;
  email: string;
  motto: string;
}

interface OverallPerformance {
  total_marks: number;
  average: number;
  position: number | null;
  out_of: number;
  grade: string;
}

interface ProgressTerm {
  term: string;
  year: string;
  average: number;
  position: number;
}

interface ExamPerformance {
  exam_name: string;
  marks: number;
  grade: string;
}

interface Remarks {
  class_teacher: string;
  principal: string;
}

interface ReportData {
  student: Student;
  school: School;
  term: string;
  academic_year: string;
  subjects: Subject[];
  overall_performance: OverallPerformance;
  progress_per_term: ProgressTerm[];
  performance_per_exam: ExamPerformance[];
  remarks: Remarks;
  next_term_begins: string;
}

interface TermOption {
  value: string;
  label: string;
}

interface YearOption {
  value: string;
  label: string;
}

interface SchoolInfo {
  name: string;
  principal_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  motto?: string;
}

const ParentReportCard: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([]);
  const [availableYears, setAvailableYears] = useState<YearOption[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '185.181.10.160:8000';

  // Fetch initial data and options
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch report when term/year changes
  useEffect(() => {
    if (selectedTerm && selectedYear) {
      fetchReportData();
    }
  }, [selectedTerm, selectedYear]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('parent_access_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // First fetch dashboard to get school info
      const dashboardResponse = await fetch(`${API_BASE_URL}/api/parents/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (dashboardResponse.ok) {
        const dashData = await dashboardResponse.json();
        // Store school info for later use
        if (dashData.school) {
          setSchoolInfo(dashData.school);
        }
      }

      // Fetch student analytics to get filter options
      const response = await fetch(`${API_BASE_URL}/api/parents/student_analytics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set available terms from filter_options
        if (data.filter_options?.terms && data.filter_options.terms.length > 0) {
          setAvailableTerms(data.filter_options.terms);
          setSelectedTerm(data.filter_options.terms[0].value);
        } else {
          setAvailableTerms([
            { value: '1', label: 'Term 1' },
            { value: '2', label: 'Term 2' },
            { value: '3', label: 'Term 3' },
          ]);
          setSelectedTerm('1');
        }
        
        // Set available years from filter_options
        if (data.filter_options?.academic_years && data.filter_options.academic_years.length > 0) {
          setAvailableYears(data.filter_options.academic_years);
          setSelectedYear(data.filter_options.academic_years[0].value);
        } else {
          setAvailableYears([
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' },
          ]);
          setSelectedYear('2026');
        }
      } else {
        // Use defaults
        setAvailableTerms([
          { value: '1', label: 'Term 1' },
          { value: '2', label: 'Term 2' },
          { value: '3', label: 'Term 3' },
        ]);
        setAvailableYears([
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' },
        ]);
        setSelectedTerm('1');
        setSelectedYear('2024-2025');
      }
    } catch (err) {
      console.error('Error fetching options:', err);
      // Use defaults
      setAvailableTerms([
        { value: '1', label: 'Term 1' },
        { value: '2', label: 'Term 2' },
        { value: '3', label: 'Term 3' },
      ]);
      setAvailableYears([
            { value: '2024', label: '2024' },
            { value: '2023', label: '2023' },
            { value: '2025', label: '2025' },
            { value: '2026', label: '2026' },
      ]);
      setSelectedTerm('1');
      setSelectedYear('2024-2025');
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('parent_access_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Use student_analytics endpoint with term and academic_year filters
      const response = await fetch(
        `${API_BASE_URL}/api/parents/student_analytics/?term=${selectedTerm}&academic_year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Transform the analytics response to match our ReportData format
        const transformedData: ReportData = {
          student: {
            id: 0,
            full_name: data.student_info?.name || '',
            admission_number: data.student_info?.admission_number || '',
            current_class: data.student_info?.class || '',
            gender: '',
            date_of_birth: '',
            photo: null,
          },
          school: {
            school_name: schoolInfo?.name || data.student_info?.school || '',
            logo: null,
            address: schoolInfo?.address || '',
            phone_number: schoolInfo?.phone_number || '',
            email: schoolInfo?.email || '',
            motto: schoolInfo?.motto || '',
          },
          term: selectedTerm,
          academic_year: selectedYear,
          subjects: (data.subject_performance || []).map((subj: SubjectPerformance, index: number) => ({
            id: index,
            name: subj.subject,
            max_score: subj.max_marks,
            score: subj.marks,
            grade: subj.grade,
            remarks: getSubjectRemark(subj.percentage),
            position: null,
          })),
          overall_performance: {
            total_marks: data.overall_performance?.total_marks || 0,
            average: data.overall_performance?.average_marks || 0,
            position: data.overall_performance?.class_position || null,
            out_of: data.overall_performance?.class_size || 0,
            grade: calculateOverallGrade(data.overall_performance?.average_marks || 0),
          },
          progress_per_term: [],
          performance_per_exam: [],
          remarks: {
            class_teacher: '',
            principal: '',
          },
          next_term_begins: '',
        };
        
        setReportData(transformedData);
      } else if (response.status === 404) {
        setError('No results found for the selected term and year.');
        setReportData(null);
      } else {
        setError('Failed to load report data.');
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get remarks based on percentage
  const getSubjectRemark = (percentage: number): string => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Fair';
    if (percentage >= 40) return 'Pass';
    return 'Needs Improvement';
  };

  // Helper function to calculate overall grade
  const calculateOverallGrade = (average: number): string => {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    return 'F';
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    setIsDownloading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // Helper for centering text
      const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', style);
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, (pageWidth - textWidth) / 2, yPos);
      };

      // School Header
      centerText(reportData.school.school_name || 'School Name', y, 18, 'bold');
      y += 7;
      
      if (reportData.school.address) {
        centerText(reportData.school.address, y, 10);
        y += 5;
      }
      
      // Contact info (phone and email on same line)
      const contactInfo = [
        reportData.school.phone_number ? `Tel: ${reportData.school.phone_number}` : '',
        reportData.school.email ? `Email: ${reportData.school.email}` : ''
      ].filter(Boolean).join('  |  ');
      
      if (contactInfo) {
        centerText(contactInfo, y, 9);
        y += 5;
      }
      
      if (reportData.school.motto) {
        pdf.setFont('helvetica', 'italic');
        centerText(`"${reportData.school.motto}"`, y, 9);
        y += 5;
      }
      
      // Line separator
      y += 2;
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Report Title
      centerText(`TERM ${reportData.term} - ${reportData.academic_year} REPORT CARD`, y, 14, 'bold');
      y += 10;

      // Student Info Box
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, y, pageWidth - 2 * margin, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Student Name:', margin + 3, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.student.full_name || '', margin + 35, y + 6);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Adm No:', pageWidth / 2, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.student.admission_number || '', pageWidth / 2 + 20, y + 6);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Class:', margin + 3, y + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.student.current_class || '', margin + 20, y + 14);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Position:', pageWidth / 2, y + 14);
      pdf.setFont('helvetica', 'normal');
      const posText = reportData.overall_performance.position 
        ? `${reportData.overall_performance.position} out of ${reportData.overall_performance.out_of}`
        : '-';
      pdf.text(posText, pageWidth / 2 + 22, y + 14);
      
      y += 28;

      // Subjects Table
      const tableHeaders = ['Subject', 'Score', 'Max', 'Grade', 'Remarks'];
      const colWidths = [60, 25, 25, 20, 50];
      let tableX = margin;
      
      // Table header
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      pdf.setDrawColor(0);
      pdf.rect(margin, y, pageWidth - 2 * margin, 8);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      tableX = margin;
      tableHeaders.forEach((header, i) => {
        pdf.text(header, tableX + 2, y + 5.5);
        tableX += colWidths[i];
      });
      
      y += 8;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      reportData.subjects.forEach((subject) => {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.rect(margin, y, pageWidth - 2 * margin, 7);
        
        tableX = margin;
        const rowData = [
          subject.name || '',
          subject.score?.toString() || '-',
          subject.max_score?.toString() || '100',
          subject.grade || '-',
          subject.remarks || ''
        ];
        
        rowData.forEach((data, i) => {
          const text = data.length > 20 ? data.substring(0, 18) + '...' : data;
          pdf.text(text, tableX + 2, y + 5);
          tableX += colWidths[i];
        });
        
        y += 7;
      });

      // Summary row
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      pdf.rect(margin, y, pageWidth - 2 * margin, 8);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL / AVERAGE', margin + 2, y + 5.5);
      pdf.text(reportData.overall_performance.total_marks?.toString() || '-', margin + colWidths[0] + 2, y + 5.5);
      pdf.text(reportData.overall_performance.average?.toFixed(1) || '-', margin + colWidths[0] + colWidths[1] + 2, y + 5.5);
      pdf.text(reportData.overall_performance.grade || '-', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 5.5);
      
      y += 15;

      // Grading Scale
      if (y > 240) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Grading Scale:', margin, y);
      y += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const grades = 'A: 80-100 (Excellent)  |  B: 70-79 (Very Good)  |  C: 60-69 (Good)  |  D: 50-59 (Fair)  |  E: 40-49 (Pass)  |  F: 0-39 (Fail)';
      pdf.text(grades, margin, y);
      y += 12;

      // Remarks Section
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Remarks:', margin, y);
      y += 6;
      
      pdf.setDrawColor(0);
      pdf.rect(margin, y, pageWidth - 2 * margin, 15);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Class Teacher:', margin + 2, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.remarks.class_teacher || 'Keep up the good work!', margin + 28, y + 5);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Principal:', margin + 2, y + 11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.remarks.principal || 'Well done. Continue working hard.', margin + 22, y + 11);
      
      y += 22;

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString();
      pdf.text(`Date Issued: ${today}`, margin, y);
      
      if (reportData.next_term_begins) {
        pdf.text(`Next Term Begins: ${reportData.next_term_begins}`, pageWidth - margin - 50, y);
      }

      // Save PDF
      const fileName = `${reportData.student.full_name.replace(/\s+/g, '_')}_Report_Term${selectedTerm}_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading report card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Report Card</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Term Select */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableTerms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableYears.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={!reportData}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={!reportData || isDownloading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h4 className="text-red-800 font-medium">Unable to load report</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Card - Matches template1.html */}
      {reportData && (
        <div className="bg-gray-100 p-4 overflow-auto print:p-0 print:bg-white">
          <div
            ref={reportRef}
            className="report-container bg-white mx-auto shadow-lg print:shadow-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '15mm',
              fontFamily: "'Times New Roman', serif",
            }}
          >
            {/* Header Section */}
            <div className="flex items-start gap-4 mb-3 pb-3 border-b-2 border-black">
              <div 
                className="flex-shrink-0 bg-gray-800 flex items-center justify-center text-white"
                style={{
                  width: '50px',
                  height: '60px',
                  clipPath: 'polygon(0 15%, 50% 0, 100% 15%, 100% 100%, 0 100%)',
                }}
              >
                {reportData.school.logo ? (
                  <img src={reportData.school.logo} alt="School Logo" className="w-8 h-8" />
                ) : (
                  <div className="w-8 h-5 bg-white" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold mb-1">{reportData.school.school_name}</h1>
                {reportData.school.address && (
                  <p className="text-xs mb-0.5">{reportData.school.address}</p>
                )}
                <p className="text-xs mb-0.5">
                  {reportData.school.phone_number && <span>Tel: {reportData.school.phone_number}</span>}
                  {reportData.school.phone_number && reportData.school.email && <span className="mx-2">|</span>}
                  {reportData.school.email && <span>Email: {reportData.school.email}</span>}
                </p>
                {reportData.school.motto && (
                  <p className="text-xs italic mt-1">"{reportData.school.motto}"</p>
                )}
              </div>
            </div>

            {/* Term Info */}
            <div className="flex justify-between bg-gray-300 px-3 py-1.5 my-3 font-bold text-sm">
              <span>TERM {reportData.term} {reportData.academic_year}</span>
              <span>REPORT FORM</span>
              <span>CLASS: {reportData.student.current_class}</span>
            </div>

            {/* Student Info */}
            <div className="border-2 border-black p-2.5 mb-3 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div className="flex gap-1">
                  <span className="font-bold">ADM NO:</span>
                  <span>{reportData.student.admission_number}</span>
                </div>
                <div className="flex gap-1 col-span-2">
                  <span className="font-bold">NAME:</span>
                  <span>{reportData.student.full_name}</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">CLASS:</span>
                  <span>{reportData.student.current_class}</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">TOTAL MARKS:</span>
                  <span>{reportData.overall_performance.total_marks}</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">AVERAGE:</span>
                  <span>{reportData.overall_performance.average.toFixed(2)}</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">GRADE:</span>
                  <span>{reportData.overall_performance.grade}</span>
                </div>
                <div className="flex gap-1">
                  <span className="font-bold">POSITION:</span>
                  <span>{reportData.overall_performance.position || '-'}/{reportData.overall_performance.out_of || '-'}</span>
                </div>
              </div>
            </div>

            {/* Subjects Table */}
            <table className="w-full border-collapse my-2.5 text-[11px]">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border border-black p-1.5 font-bold" style={{ width: '5%' }}>#</th>
                  <th className="border border-black p-1.5 font-bold text-left pl-2" style={{ width: '30%' }}>SUBJECT</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '12%' }}>MAX</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '12%' }}>SCORE</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '10%' }}>GRADE</th>
                  <th className="border border-black p-1.5 font-bold text-left pl-2" style={{ width: '31%' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1.5 text-center">{index + 1}</td>
                    <td className="border border-black p-1.5 text-left pl-2">{subject.name}</td>
                    <td className="border border-black p-1.5 text-center">{subject.max_score}</td>
                    <td className="border border-black p-1.5 text-center">{subject.score}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{subject.grade}</td>
                    <td className="border border-black p-1.5 text-left pl-2">{subject.remarks}</td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="bg-gray-200 font-bold">
                  <td className="border border-black p-1.5 text-center" colSpan={2}>TOTAL</td>
                  <td className="border border-black p-1.5 text-center">{reportData.subjects.length * 100}</td>
                  <td className="border border-black p-1.5 text-center">{reportData.overall_performance.total_marks}</td>
                  <td className="border border-black p-1.5 text-center">{reportData.overall_performance.grade}</td>
                  <td className="border border-black p-1.5 text-center">
                    Average: {reportData.overall_performance.average.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Grading Scale */}
            <div className="my-4 text-[10px]">
              <div className="font-bold mb-1">GRADING SCALE:</div>
              <div className="flex flex-wrap gap-3">
                <span><b>A:</b> 80-100 (Excellent)</span>
                <span><b>B:</b> 70-79 (Very Good)</span>
                <span><b>C:</b> 60-69 (Good)</span>
                <span><b>D:</b> 50-59 (Fair)</span>
                <span><b>E:</b> 40-49 (Pass)</span>
                <span><b>F:</b> 0-39 (Fail)</span>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="bg-gray-300 font-bold text-center py-1.5 my-2.5 border border-black text-xs">
              REMARKS
            </div>
            
            <div className="my-2.5">
              <div className="flex border border-black mb-2 text-xs">
                <div className="w-28 bg-gray-300 p-2 font-bold">Class Teacher</div>
                <div className="flex-1 p-2 italic">{reportData.remarks.class_teacher || 'Good performance. Keep working hard!'}</div>
              </div>
              
              <div className="flex border border-black text-xs">
                <div className="w-28 bg-gray-300 p-2 font-bold">Principal</div>
                <div className="flex-1 p-2 italic">{reportData.remarks.principal || 'Well done. Continue to excel!'}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-4 pt-2.5 border-t border-black text-[10px]">
              <span><strong>Next Term Begins:</strong> {reportData.next_term_begins || '___________'}</span>
              <span><strong>Date Issued:</strong> {new Date().toLocaleDateString()}</span>
            </div>

            <div className="text-center mt-3 text-[9px] italic">
              {reportData.school.motto || 'Excellence Through Education'}
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && !reportData && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Available</h3>
          <p className="text-gray-600">
            Select a different term or year to view results.
          </p>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-container, .report-container * {
            visibility: visible;
          }
          .report-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 15mm;
            box-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ParentReportCard;
