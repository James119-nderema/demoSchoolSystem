/**
 * High School Report Card PDF Generator (Matching Reference Image)
 * Generates comprehensive high school report cards matching the uploaded image format
 */

import jsPDF from 'jspdf';
import type { StudentReportData, SchoolInfo, SubjectResult } from './utils/reportTypes';
import { getGrade, getGradePoints, getRemarks } from './utils/reportUtils';

interface ProgressData {
  form: string;
  marks: number;
  points: number;
  mean_grade: string;
  out_of: number;
}

interface GenerateEnhancedOptions {
  doc: jsPDF;
  studentData: StudentReportData & {
    results: SubjectResult[];
    progress_report?: ProgressData[];
    exam_types?: string[]; // e.g., ['EXAM1', 'EXAM2', 'EXAM3', 'EXAM4']
  };
  schoolInfo: SchoolInfo | null;
  selectedTerm: string;
  selectedYear: string;
  isNewPage?: boolean;
}

// Helper function to load image as base64
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const generateTemplate1PDF = async ({
  doc,
  studentData,
  schoolInfo,
  selectedTerm,
  selectedYear,
  isNewPage = false
}: GenerateEnhancedOptions): Promise<void> => {
  if (isNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 10;

  // Helper functions
  const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // === HEADER SECTION WITH LOGO ON LEFT (Matching Original Image) ===
  const logoWidth = 28;
  const logoHeight = 32;
  const logoX = margin;
  const logoY = y;
  
  // Draw logo placeholder box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(logoX, logoY, logoWidth, logoHeight);
  
  // Load and add logo (supports JPG, PNG, JPEG)
  let logoUrl = schoolInfo?.logo_url || studentData.school_info?.logo_url;
  // Proxy PythonAnywhere logo through Vercel to bypass CORS
  if (logoUrl && logoUrl.includes('pythonanywhere.com/media/school_logos/Screenshot_2026-01-24_08_17_15_PlOmrtG.png')) {
    logoUrl = '/api/proxy-logo';
  }
  if (logoUrl) {
    try {
      const logoData = await loadImageAsBase64(logoUrl);
      if (logoData) {
        // Auto-detect image format from data URI
        const format = logoData.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(logoData, format, logoX + 2, logoY + 2, logoWidth - 4, logoHeight - 8);
      }
    } catch {
      // Logo failed to load - continue without it
    }
  }
  
  // Add logo text below (use school abbreviation or leave empty)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  // Generate logo text from school name if not provided
  const generateLogoText = (schoolName: string | undefined): string => {
    if (!schoolName) return '';
    // Create abbreviation from school name (first letters of words)
    const words = schoolName.split(' ').filter(w => w.length > 0);
    if (words.length <= 2) return schoolName.toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };
  const logoText = schoolInfo?.school_name ? generateLogoText(schoolInfo.school_name) : '';
  if (logoText) {
    const logoTextWidth = doc.getTextWidth(logoText);
    doc.text(logoText, logoX + (logoWidth - logoTextWidth) / 2, logoY + logoHeight - 2);
  }

  // School Header (centered, to the right of logo)
  const headerStartX = logoX + logoWidth + 15;
  const headerWidth = pageWidth - headerStartX - margin;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const schoolName = schoolInfo?.school_name?.toUpperCase() || '';
  if (schoolName) {
    const schoolNameWidth = doc.getTextWidth(schoolName);
    doc.text(schoolName, headerStartX + (headerWidth - schoolNameWidth) / 2, y + 6);
  }
  y += 10;

  if (schoolInfo?.address) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const addressText = schoolInfo.address.toUpperCase();
    const addressWidth = doc.getTextWidth(addressText);
    doc.text(addressText, headerStartX + (headerWidth - addressWidth) / 2, y);
    y += 5;
  }

  if (schoolInfo?.phone_number) {
    doc.setFontSize(9);
    const phoneText = schoolInfo.phone_number;
    const phoneWidth = doc.getTextWidth(phoneText);
    doc.text(phoneText, headerStartX + (headerWidth - phoneWidth) / 2, y);
    y += 5;
  }

  if (schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const mottoText = schoolInfo.motto;
    const mottoWidth = doc.getTextWidth(mottoText);
    doc.text(mottoText, headerStartX + (headerWidth - mottoWidth) / 2, y);
    doc.setFont('helvetica', 'normal');
  }
  
  // Ensure y is past the logo
  y = Math.max(y, logoY + logoHeight + 5);

  // Term Info Bar (Gray background with border)
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - 2 * margin, 8);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  centerText(`TERM ${selectedTerm}        ${selectedYear}        REPORT FORM`, y + 5.5);
  y += 10;

  // Calculate summary values from results
  const calculateSummary = () => {
    const subjectsWithMarks = studentData.results.filter(r => r.marks_obtained > 0 && r.total_marks > 0);
    if (subjectsWithMarks.length === 0) {
      return { totalPercentage: 0, totalPoints: 0, mean: 0, meanGrade: '-' };
    }
    
    let totalPercentage = 0;
    let totalPoints = 0;
    
    subjectsWithMarks.forEach(result => {
      const percentage = result.percentage ?? ((result.marks_obtained / result.total_marks) * 100);
      // Use points from grading app (backend) if available, otherwise calculate
      const points = result.points ?? getGradePoints(result.grade || getGrade(percentage));
      totalPercentage += percentage;
      totalPoints += points;
    });
    
    const mean = totalPercentage / subjectsWithMarks.length;
    // Use overall grade from backend if available
    const meanGrade = studentData.overall?.grade || getGrade(mean);
    
    return { totalPercentage, totalPoints, mean, meanGrade };
  };
  
  const summary = calculateSummary();

  // Student Info Box - Matching original image layout
  const infoBoxHeight = 28;
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - 2 * margin, infoBoxHeight);
  
  doc.setFontSize(8);
  const infoStartY = y + 5;
  
  // Row 1: ADM NO, NAME, GRADE
  doc.setFont('helvetica', 'bold');
  doc.text('ADM NO:', margin + 3, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.admission_number || '', margin + 17, infoStartY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', margin + 75, infoStartY);
  doc.setFont('helvetica', 'normal');
  const fullName = studentData.student.full_name || '';
  doc.text(fullName, margin + 85, infoStartY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('GRADE:', pageWidth - margin - 45, infoStartY);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.current_class || '', pageWidth - margin - 30, infoStartY);


  // Row 2: TOTAL MARKS, POINTS, MG
  const row2Y = infoStartY + 7;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL MARKS:', margin + 3, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(Math.round(summary.totalPercentage).toString(), margin + 28, row2Y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('POINTS:', margin + 75, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.totalPoints.toString(), margin + 90, row2Y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('MG:', pageWidth - margin - 45, row2Y);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.meanGrade, pageWidth - margin - 37, row2Y);

  // Row 3: MMARK, POS BY STREAM, OVERALL POS
  const row3Y = infoStartY + 14;
  doc.setFont('helvetica', 'bold');
  doc.text('MMARK:', margin + 3, row3Y);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.mean.toFixed(2), margin + 17, row3Y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('POS BY STREAM:', margin + 75, row3Y);
  doc.setFont('helvetica', 'normal');
  const streamPos = studentData.overall.stream_position || studentData.overall.position || '-';
  const streamOutOf = studentData.overall.stream_out_of || studentData.overall.out_of || '-';
  doc.text(`${streamPos}/${streamOutOf}`, margin + 100, row3Y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('OVERALL POS:', pageWidth - margin - 45, row3Y);
  doc.setFont('helvetica', 'normal');
  const overallPos = studentData.overall.position || '-';
  const overallOutOf = studentData.overall.out_of || '-';
  doc.text(`${overallPos}/${overallOutOf}`, pageWidth - margin - 17, row3Y);
  
  y += infoBoxHeight + 5;

  // Subjects Table - Matching original image format
  const examTypes = studentData.exam_types || ['EXAM1', 'EXAM2', 'EXAM3', 'EXAM4'];
  const tableWidth = pageWidth - 2 * margin;
  
  // Column widths matching original image
  const codeColWidth = 12;
  const subjectColWidth = 32;
  const examColWidth = 18;
  const avgColWidth = 18;
  const ptsColWidth = 10;
  const posColWidth = 12;
  const remarksColWidth = 42;
 
  
  const colWidths = [
    codeColWidth, 
    subjectColWidth, 
    ...examTypes.map(() => examColWidth),
    avgColWidth,
    ptsColWidth, posColWidth, remarksColWidth
  ];
  
  const baseHeaders = ['CODE', 'SUBJECT'];
  const examHeaders = examTypes;
  const endHeaders = ['AVG', 'PTS', 'POS', 'REMARKS'];
  const tableHeaders = [...baseHeaders, ...examHeaders, ...endHeaders];
  
  let tableX = margin;

  // Table header with gray background
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, y, tableWidth, 7, 'F');
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, tableWidth, 7);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  tableHeaders.forEach((header, i) => {
    const cellWidth = colWidths[i];
    const headerText = header.length > 10 ? header.substring(0, 9) + '..' : header;
    const textWidth = doc.getTextWidth(headerText);
    doc.text(headerText, tableX + (cellWidth - textWidth) / 2, y + 4.5);
    tableX += cellWidth;
  });

  y += 7;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  studentData.results.forEach((result, _index) => {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 15;
    }

    // Draw row border
    doc.rect(margin, y, tableWidth, 6);
    
    // Draw vertical lines
    let lineX = margin;
    colWidths.forEach(width => {
      lineX += width;
      doc.line(lineX, y, lineX, y + 6);
    });

    tableX = margin;
    // Calculate percentage as average of all exam results if available
    let percentage: number;
    if (result.exam_results && result.exam_results.length > 0) {
      const totalMarks = result.exam_results.reduce((sum, er) => sum + (er.marks || 0), 0);
      percentage = totalMarks / result.exam_results.length;
    } else {
      percentage = result.percentage ?? ((result.marks_obtained / result.total_marks) * 100);
    }
    const grade = result.grade || getGrade(percentage);
    // Use points from grading app (backend), fallback to calculated
    const points = result.points ?? getGradePoints(grade);
    // Use remarks from grading app (backend), fallback to calculated
    const remarks = result.remarks || getRemarks(percentage);

    // Build row data
    const rowData: string[] = [
      result.subject_code || '',
      result.subject_name?.length > 16 ? result.subject_name.substring(0, 14) + '..' : (result.subject_name || '')
    ];

    // Add exam results - show the marks with grade for each exam type from exam_results array
    examTypes.forEach((examType) => {
      // Normalize exam type for comparison - remove all non-alphanumeric chars and convert to uppercase
      const normalizeExamName = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const normalizedExamType = normalizeExamName(examType);
      
      // Look for matching exam result in the subject's exam_results array
      const examResult = result.exam_results?.find(er => {
        const normalizedErName = normalizeExamName(er.exam_name || '');
        return normalizedErName === normalizedExamType;
      });
      
      if (examResult && examResult.marks !== undefined && examResult.marks !== null) {
        // Show the marks with grade from the matching exam result
        const examGrade = examResult.grade || getGrade(examResult.marks);
        rowData.push(`${Math.round(examResult.marks)}${examGrade}`);
      } else {
        rowData.push('-');
      }
    });

    // Add final columns with points from grading app
    // Use subject_position for class rank in this subject
    rowData.push(
      `${Math.round(percentage)}${grade}`,
      points.toString(),
      result.subject_position?.toString() || '-',
      remarks.length > 20 ? remarks.substring(0, 18) + '..' : remarks,
    );

    rowData.forEach((data, i) => {
      const cellWidth = colWidths[i];
      const textWidth = doc.getTextWidth(data);
      
      // Left align code and subject, center others
      if (i === 0 || i === 1) {
        doc.text(data, tableX + 2, y + 4);
      } else {
        doc.text(data, tableX + (cellWidth - textWidth) / 2, y + 4);
      }
      tableX += cellWidth;
    });

    y += 6;
  });

  y += 5;


  // Performance Per Subject Per Exam Section
  if (examTypes.length >= 1) {
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, tableWidth, 7, 'F');
    doc.rect(margin, y, tableWidth, 7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    centerText('PERFORMANCE PER SUBJECT PER EXAM', y + 5);
    y += 9;

    // Create performance table - subjects as columns, exam types as rows
    const subjectNames = studentData.results.map(r => r.subject_name);
    
    // Skip this section if no subjects
    if (subjectNames.length === 0) {
      y += 5;
    } else {
      const perfRowHeight = 6;
      
      // Column widths - reduced to fit all columns
      const examColWidth = 14; // Exam type column
      const summaryColWidth = 8; // CP, MG, MPt columns (at the end only)
      const numSummary = 4; // CP, MG, MPt, OP - only at the last row
      
      // Calculate subject column width based on available space
      const fixedEndWidth = summaryColWidth * numSummary; // Summary at end
      const availableForSubjects = tableWidth - examColWidth - fixedEndWidth;
      const subjectColWidth = Math.max(12, Math.floor(availableForSubjects / subjectNames.length));
      
      const position = studentData.overall?.position || 0;
      const outOf = studentData.overall?.out_of || 0;
      
      // Build header row - Exam Type, Subject names..., CP, MG, MPt, OP
      const headers = ['EXAM', ...subjectNames.map(n => n.length > 6 ? n.substring(0, 5) + '.' : n), 'CP', 'MG', 'MPt', 'OP'];
      const colWidths = [
        examColWidth,
        ...subjectNames.map(() => subjectColWidth),
        summaryColWidth, summaryColWidth, summaryColWidth, summaryColWidth
      ];
      
      // Adjust last subject column width to fill remaining space
      const totalUsed = colWidths.reduce((sum, w) => sum + w, 0);
      if (totalUsed < tableWidth && colWidths.length > 2) {
        colWidths[colWidths.length - 5] += (tableWidth - totalUsed); // Add extra to last subject column
      }
      
      // Draw header row
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, y, tableWidth, perfRowHeight, 'F');
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      
      let perfX = margin;
      headers.forEach((header, idx) => {
        const colW = colWidths[idx] || summaryColWidth;
        doc.rect(perfX, y, colW, perfRowHeight);
        if (header) {
          const textWidth = doc.getTextWidth(header);
          doc.text(header, perfX + (colW - textWidth) / 2, y + 4);
        }
        perfX += colW;
      });
      y += perfRowHeight;
      
      // Draw data rows - one row per exam type
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      
      for (let examIdx = 0; examIdx < examTypes.length; examIdx++) {
        const examType = examTypes[examIdx];
        
        // Build subject data for this specific exam type from exam_results array
        // Normalize exam type for comparison - remove all non-alphanumeric chars and convert to uppercase
        const normalizeExamName = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const normalizedExamType = normalizeExamName(examType);
        
        let examTotalPoints = 0;
        let examSubjectCount = 0;
        let examTotalMarks = 0;
        
        const subjectData = studentData.results.map(r => {
          // Find the matching exam result for this subject and exam type
          const examResult = r.exam_results?.find(er => {
            const normalizedErName = normalizeExamName(er.exam_name || '');
            return normalizedErName === normalizedExamType;
          });
          
          if (examResult && examResult.marks !== undefined && examResult.marks !== null) {
            // Get grade from grading app based on marks
            const examGrade = examResult.grade || getGrade(examResult.marks);
            // Get points from grading app based on grade (same as main table)
            const examPoints = getGradePoints(examGrade);
            examTotalPoints += examPoints;
            examTotalMarks += examResult.marks;
            examSubjectCount++;
            return `${Math.round(examResult.marks)} ${examGrade}`;
          }
          return '--';
        });
        
        // Calculate summary values for this specific exam type using grading app
        // MPt = Mean Points = Total Points / Number of Subjects (same formula as main table)
        const examMeanPoints = examSubjectCount > 0 ? examTotalPoints / examSubjectCount : 0;
        // Calculate average marks for this exam type
        const examAvgMarks = examSubjectCount > 0 ? examTotalMarks / examSubjectCount : 0;
        // MG = Mean Grade = Grade from grading app based on average marks
        const examMeanGrade = examSubjectCount > 0 ? getGrade(examAvgMarks) : '--';
        // CP = Class Position for this exam type (use overall position as fallback)
        const classPosition = position || '-';
        // OP = Overall Position (out of total students)
        const overallPosition = outOf > 0 ? `${position}/${outOf}` : '-';
        
        // Build row data with CP, MG, MPt, OP for each exam type row (each row is independent)
        const rowData: string[] = [
          examType.replace('_', ' ').toUpperCase().substring(0, 8),
          ...subjectData,
          // Summary columns for each row
          classPosition.toString(), // CP = Class Position for this exam
          examMeanGrade, // MG = Mean Grade (grade of average marks) for this exam
          examMeanPoints.toFixed(1), // MPt = Mean Points (average of subject points) for this exam
          overallPosition // OP = Overall Position for this exam
        ];
        
        // Draw data row
        perfX = margin;
        rowData.forEach((data, idx) => {
          const colW = colWidths[idx] || summaryColWidth;
          doc.rect(perfX, y, colW, perfRowHeight);
          if (data) {
            const textWidth = doc.getTextWidth(data);
            doc.text(data, perfX + (colW - textWidth) / 2, y + 4);
          }
          perfX += colW;
        });
        y += perfRowHeight;
      }
      
      y += 5;
    }
  }

  // Remarks Section
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, tableWidth, 7, 'F');
  doc.rect(margin, y, tableWidth, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  centerText('REMARKS', y + 5);
  y += 9;

  // Class Teacher Remarks
  doc.rect(margin, y, tableWidth, 12);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, 35, 12, 'F');
  doc.rect(margin, y, 35, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ClassTeacher', margin + 3, y + 7);
  doc.setFont('helvetica', 'italic');
  // Use overall remarks from grading app
  const classTeacherRemark = studentData.class_teacher_remark || studentData.overall?.overall_remarks || '';
  doc.text(classTeacherRemark, margin + 40, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  // Use class teacher name from backend (public_tenant app)
  const classTeacherName = studentData.class_teacher_name || schoolInfo?.class_teacher_name || '';
  if (classTeacherName) {
    doc.text(classTeacherName, pageWidth - margin - 55, y + 7);
  }
  y += 13;

  // Principal Remarks
  doc.rect(margin, y, tableWidth, 12);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, 35, 12, 'F');
  doc.rect(margin, y, 35, 12);
  doc.setFont('helvetica', 'bold');
  doc.text('Principal', margin + 3, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.text(studentData.principal_remark || '', margin + 40, y + 7);
  doc.setFont('helvetica', 'normal');
  // Use principal name from school info
  const principalName = schoolInfo?.principal_name || '';
  if (principalName) {
    doc.text(principalName, pageWidth - margin - 50, y + 7);
  }
  y += 15;

  // Footer Section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Fees Arrears:', margin, y);
  doc.text('Next term fees:', margin + 80, y);
  doc.text('Total fees expected:', pageWidth - margin - 55, y);
  y += 8;
  
  // Dates row
  doc.text('Closing Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.closing_date || '', margin + 28, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Opening Date:', pageWidth - margin - 55, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.opening_date || '', pageWidth - margin - 25, y);
  y += 8;

  // Print date and motto
  doc.setFontSize(7);
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const printDateText = `Printed on  ${studentData.print_date || currentDate}`;
  const printDateWidth = doc.getTextWidth(printDateText);
  doc.text(printDateText, (pageWidth - printDateWidth) / 2, y);
  y += 6;

  if (schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const mottoText = `motto: ${schoolInfo.motto}`;
    const mottoWidth = doc.getTextWidth(mottoText);
    doc.text(mottoText, (pageWidth - mottoWidth) / 2, y);
  }
  
  // Form number at bottom right - only show if available
  if (studentData.form_number) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(studentData.form_number, pageWidth - margin - 15, pageHeight - 10);
  }
};

export default generateTemplate1PDF;
