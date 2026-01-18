/**
 * High School Report Card PDF Generator (Enhanced Template)
 * Generates comprehensive high school report cards matching the reference image
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

export const generateTemplate1PDF  = async ({
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
  const margin = 10;
  let y = 10;

  // Helper functions
  const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // === HEADER SECTION WITH LOGO ON TOP RIGHT ===
  const logoSize = 18;
  const logoX = pageWidth - margin - logoSize;
  const logoY = y;
  
  // Load and add logo (JPG format supported)
  if (schoolInfo?.logo_url) {
    try {
      const logoData = await loadImageAsBase64(schoolInfo.logo_url);
      if (logoData) {
        doc.addImage(logoData, 'JPEG', logoX, logoY, logoSize, logoSize);
      }
    } catch {
      // Logo failed to load - continue without it
    }
  }

  // School Header (centered, leaving space for logo on right)
  const headerWidth = pageWidth - 2 * margin - logoSize - 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const schoolName = schoolInfo?.school_name || 'SCHOOL NAME';
  const schoolNameWidth = doc.getTextWidth(schoolName);
  doc.text(schoolName, margin + (headerWidth - schoolNameWidth) / 2, y + 4);
  y += 9;

  if (schoolInfo?.address) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const addressWidth = doc.getTextWidth(schoolInfo.address);
    doc.text(schoolInfo.address, margin + (headerWidth - addressWidth) / 2, y);
    y += 4;
  }

  if (schoolInfo?.phone_number) {
    doc.setFontSize(8);
    const phoneText = schoolInfo.email ? `${schoolInfo.phone_number}  |  ${schoolInfo.email}` : schoolInfo.phone_number;
    const phoneWidth = doc.getTextWidth(phoneText);
    doc.text(phoneText, margin + (headerWidth - phoneWidth) / 2, y);
    y += 4;
  }

  if (schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const mottoWidth = doc.getTextWidth(schoolInfo.motto);
    doc.text(schoolInfo.motto, margin + (headerWidth - mottoWidth) / 2, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
  }
  
  // Ensure y is past the logo
  y = Math.max(y, logoY + logoSize + 2);

  // Term Info Bar
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setDrawColor(0);
  doc.rect(margin, y, pageWidth - 2 * margin, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  centerText(`TERM ${selectedTerm}  ${selectedYear}  REPORT FORM`, y + 5);
  y += 9;

  // Calculate summary values from results:
  // - Total = sum of all subject percentages
  // - Points = sum of all individual subject grade points
  // - Mean = average of the percentages (Total / number of subjects)
  // - Mean Grade = grade based on the mean percentage
  const calculateSummary = () => {
    const subjectsWithMarks = studentData.results.filter(r => r.marks_obtained > 0 && r.total_marks > 0);
    if (subjectsWithMarks.length === 0) {
      return { totalPercentage: 0, totalPoints: 0, mean: 0, meanGrade: '-' };
    }
    
    let totalPercentage = 0;
    let totalPoints = 0;
    
    subjectsWithMarks.forEach(result => {
      const percentage = (result.marks_obtained / result.total_marks) * 100;
      const grade = result.grade || getGrade(percentage);
      const points = getGradePoints(grade);
      totalPercentage += percentage;
      totalPoints += points;
    });
    
    const mean = totalPercentage / subjectsWithMarks.length;
    const meanGrade = getGrade(mean);
    
    return { totalPercentage, totalPoints, mean, meanGrade };
  };
  
  const summary = calculateSummary();

  // Student Info Box - Reorganized layout: ADM NO, NAME, CLASS, STREAM POS, OVERALL POS, POINTS, TOTAL, MEAN, MEAN GRADE
  doc.setLineWidth(0.3);
  doc.rect(margin, y, pageWidth - 2 * margin, 20);
  
  doc.setFontSize(8);
  const infoStartY = y + 5;
  let currentY = infoStartY;
  const col1X = margin + 2;
  const col2X = margin + 65;
  const col3X = margin + 130;

  // Row 1: ADM NO, NAME, CLASS
  doc.setFont('helvetica', 'bold');
  doc.text('ADM NO:', col1X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.admission_number || '', col1X + 18, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', col2X, currentY);
  doc.setFont('helvetica', 'normal');
  const fullName = studentData.student.full_name || '';
  doc.text(fullName.length > 25 ? fullName.substring(0, 23) + '..' : fullName, col2X + 14, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS:', col3X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.current_class || '', col3X + 14, currentY);
  currentY += 6;

  // Row 2: STREAM POS, OVERALL POS, POINTS (sum of grade points), TOTAL (sum of percentages)
  doc.setFont('helvetica', 'bold');
  doc.text('STREAM POS:', col1X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.overall.stream_position?.toString() || '-', col1X + 25, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('O/ALL POS:', col1X + 35, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${studentData.overall.position || '-'}/${studentData.overall.out_of || '-'}`, col1X + 55, currentY);
  
  // POINTS = sum of individual subject grade points
  doc.setFont('helvetica', 'bold');
  doc.text('POINTS:', col2X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.totalPoints.toString(), col2X + 17, currentY);
  
  // TOTAL = sum of all subject percentages (rounded to whole number)
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', col2X + 30, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(Math.round(summary.totalPercentage).toString(), col2X + 45, currentY);
  
  // MEAN = average of percentages (2 decimal places)
  doc.setFont('helvetica', 'bold');
  doc.text('MEAN:', col3X, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.mean.toFixed(2), col3X + 14, currentY);
  
  // MG = Mean Grade (grade of the mean percentage)
  doc.setFont('helvetica', 'bold');
  doc.text('MG:', col3X + 32, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(summary.meanGrade, col3X + 42, currentY);
  
  y += 22;

  // Subjects Table - Show ALL exam columns with calculated marks (rounded to whole numbers)
  const examTypes = studentData.exam_types || ['OPENER', 'MID-TERM', 'END-TERM'];
  const tableWidth = pageWidth - 2 * margin;
  
  // Calculate column widths to fill the A4 page properly
  const codeColWidth = 10;
  const subjectColWidth = 28;
  const grColWidth = 8;
  const ptsColWidth = 8;
  const posColWidth = 10;
  const remarksColWidth = 26;
  const initialsColWidth = 9;
  const fixedWidth = codeColWidth + subjectColWidth + grColWidth + ptsColWidth + posColWidth + remarksColWidth + initialsColWidth;
  const examColWidth = (tableWidth - fixedWidth) / (examTypes.length + 1); // +1 for AVG column
  
  const baseHeaders = ['CODE', 'SUBJECT'];
  const examHeaders = examTypes;
  const endHeaders = ['AVG', 'GR', 'PTS', 'POS', 'REMARKS', 'INIT'];
  const tableHeaders = [...baseHeaders, ...examHeaders, ...endHeaders];
  
  const colWidths = [
    codeColWidth, 
    subjectColWidth, 
    ...examTypes.map(() => examColWidth),
    examColWidth, // AVG column same width as exam columns
    grColWidth, ptsColWidth, posColWidth, remarksColWidth, initialsColWidth
  ];
  
  let tableX = margin;

  // Table header
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, y, tableWidth, 6, 'F');
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, tableWidth, 6);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  tableHeaders.forEach((header, i) => {
    const headerText = header.length > 8 ? header.substring(0, 7) + '..' : header;
    const cellWidth = colWidths[i];
    const textWidth = doc.getTextWidth(headerText);
    doc.text(headerText, tableX + (cellWidth - textWidth) / 2, y + 4);
    tableX += cellWidth;
  });

  y += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  studentData.results.forEach((result, index) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 15;
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, tableWidth, 5, 'F');
    }
    doc.rect(margin, y, tableWidth, 5);

    tableX = margin;
    const percentage = (result.marks_obtained / result.total_marks) * 100;
    const grade = result.grade || getGrade(percentage);
    const points = getGradePoints(grade);
    const remarks = result.remarks || getRemarks(percentage);

    // Build row data with rounded marks
    const rowData: string[] = [
      result.subject_code || '',
      result.subject_name?.length > 14 ? result.subject_name.substring(0, 12) + '..' : (result.subject_name || '')
    ];

    // Add exam results - show marks rounded to whole number for each exam type
    if (result.exam_results && result.exam_results.length > 0) {
      examTypes.forEach(examType => {
        const examResult = result.exam_results?.find(e => e.exam_name === examType);
        rowData.push(examResult ? `${Math.round(examResult.marks)}` : '-');
      });
    } else {
      // Show current marks in first column, dash in others
      examTypes.forEach((_, idx) => {
        if (idx === 0) {
          rowData.push(`${Math.round(result.percentage || 0)}`);
        } else {
          rowData.push('-');
        }
      });
    }

    // Calculate percentage (rounded to 2 decimal places)
    const subjectPercentage = (result.marks_obtained / result.total_marks) * 100;

    // Add final columns - use percentage, not raw marks
    rowData.push(
      subjectPercentage.toFixed(2), // Percentage to 2 decimal places
      grade,
      points.toString(),
      result.position?.toString() || '-',
      remarks.length > 13 ? remarks.substring(0, 11) + '..' : remarks,
      result.teacher_initials || ''
    );

    rowData.forEach((data, i) => {
      const cellWidth = colWidths[i];
      const textWidth = doc.getTextWidth(data);
      // Center all data
      doc.text(data, tableX + (cellWidth - textWidth) / 2, y + 3.5);
      tableX += cellWidth;
    });

    y += 5;
  });

  y += 3;

  // Progress Report Section
  if (studentData.progress_report && studentData.progress_report.length > 0) {
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, tableWidth, 6, 'F');
    doc.rect(margin, y, tableWidth, 6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    centerText('PROGRESS REPORT', y + 4);
    y += 7;

    // Progress table
    const progressHeaders = ['Form', 'MKS', 'PTS', 'MG', 'O.P'];
    const progressColWidth = (tableWidth) / (studentData.progress_report.length * progressHeaders.length);
    
    studentData.progress_report.forEach((progress, idx) => {
      const startX = margin + (idx * progressColWidth * progressHeaders.length);
      
      // Form label
      doc.setFillColor(230, 230, 230);
      doc.rect(startX, y, progressColWidth * progressHeaders.length, 5, 'F');
      doc.rect(startX, y, progressColWidth * progressHeaders.length, 5);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      centerText(progress.form, y + 3.5);
      
      let headerY = y + 6;
      // Headers
      doc.setFontSize(7);
      progressHeaders.forEach((header, hIdx) => {
        const headerX = startX + (hIdx * progressColWidth);
        doc.rect(headerX, headerY, progressColWidth, 4);
        doc.text(header, headerX + 1, headerY + 3);
      });
      
      // Data
      let dataY = headerY + 5;
      doc.setFont('helvetica', 'normal');
      const progressData = [
        progress.form.replace('FORM ', 'F'),
        progress.marks.toString(),
        progress.points.toString(),
        progress.mean_grade,
        progress.out_of.toString()
      ];
      
      progressData.forEach((data, dIdx) => {
        const dataX = startX + (dIdx * progressColWidth);
        doc.rect(dataX, dataY, progressColWidth, 4);
        doc.text(data, dataX + 1, dataY + 3);
      });
    });
    
    y += 20;
  }

  // Performance Per Subject Per Exam Section - LARGER TABLE with calculated percentages
  if (examTypes.length >= 1) {
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, tableWidth, 6, 'F');
    doc.rect(margin, y, tableWidth, 6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    centerText('PERFORMANCE PER SUBJECT PER EXAM', y + 4);
    y += 7;

    // Create larger performance table with all subjects and calculated percentages
    const subjectCodes = studentData.results.map(r => r.subject_code || r.subject_name.substring(0, 3).toUpperCase());
    const perfHeaders = ['TERM', 'EXAM', ...subjectCodes, 'TOTAL', 'AVG', 'GR', 'POS'];
    
    // Calculate column widths to fill the table
    const termColWidth = 12;
    const examNameColWidth = 20;
    const summaryColWidth = 12;
    const numSummary = 4; // TOTAL, AVG, GR, POS
    const remainingWidth = tableWidth - termColWidth - examNameColWidth - (summaryColWidth * numSummary);
    const subjectPerfColWidth = Math.max(10, remainingWidth / subjectCodes.length);
    
    // Recalculate to fit all columns
    const totalNeededWidth = termColWidth + examNameColWidth + (subjectPerfColWidth * subjectCodes.length) + (summaryColWidth * numSummary);
    const scaleFactor = totalNeededWidth > tableWidth ? tableWidth / totalNeededWidth : 1;
    
    const perfColWidths = [
      termColWidth * scaleFactor,
      examNameColWidth * scaleFactor,
      ...subjectCodes.map(() => subjectPerfColWidth * scaleFactor),
      summaryColWidth * scaleFactor,
      summaryColWidth * scaleFactor,
      summaryColWidth * scaleFactor,
      summaryColWidth * scaleFactor
    ];
    
    const perfRowHeight = 6;
    
    // Headers row
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, y, tableWidth, perfRowHeight, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    let perfX = margin;
    perfHeaders.forEach((header, idx) => {
      const colW = perfColWidths[idx];
      doc.rect(perfX, y, colW, perfRowHeight);
      const headerText = header.length > 5 ? header.substring(0, 5) : header;
      const textWidth = doc.getTextWidth(headerText);
      doc.text(headerText, perfX + (colW - textWidth) / 2, y + 4);
      perfX += colW;
    });
    y += perfRowHeight;

    // Data rows - one for each exam type with calculated percentages
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    
    examTypes.forEach((exam, examIdx) => {
      // Alternate row background
      if (examIdx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y, tableWidth, perfRowHeight, 'F');
      }
      
      perfX = margin;
      
      // Term column
      doc.rect(perfX, y, perfColWidths[0], perfRowHeight);
      const termText = `T${selectedTerm}`;
      doc.text(termText, perfX + (perfColWidths[0] - doc.getTextWidth(termText)) / 2, y + 4);
      perfX += perfColWidths[0];
      
      // Exam name column
      doc.rect(perfX, y, perfColWidths[1], perfRowHeight);
      const examName = exam.length > 10 ? exam.substring(0, 10) : exam;
      doc.text(examName, perfX + 1, y + 4);
      perfX += perfColWidths[1];
      
      // Subject percentage columns - calculate from exam_results or use current marks
      let totalMarks = 0;
      let totalPossible = 0;
      
      studentData.results.forEach((result, sIdx) => {
        const colW = perfColWidths[2 + sIdx];
        doc.rect(perfX, y, colW, perfRowHeight);
        
        let marks = 0;
        let outOf = result.total_marks || 100;
        
        if (result.exam_results && result.exam_results.length > 0) {
          const examResult = result.exam_results.find(e => e.exam_name === exam);
          if (examResult) {
            marks = examResult.marks;
          }
        } else if (examIdx === 0) {
          // Use current marks for first exam if no exam_results
          marks = result.marks_obtained;
        }
        
        totalMarks += marks;
        totalPossible += outOf;
        
        // Calculate percentage and display
        const pct = outOf > 0 ? (marks / outOf * 100) : 0;
        const pctText = marks > 0 ? `${Math.round(pct)}` : '-';
        const textWidth = doc.getTextWidth(pctText);
        doc.text(pctText, perfX + (colW - textWidth) / 2, y + 4);
        perfX += colW;
      });
      
      // Summary columns
      const avg = totalPossible > 0 ? (totalMarks / studentData.results.length) : 0;
      const avgPct = totalPossible > 0 ? (totalMarks / totalPossible * 100) : 0;
      const avgGrade = getGrade(avgPct);
      
      // TOTAL
      doc.rect(perfX, y, perfColWidths[perfColWidths.length - 4], perfRowHeight);
      const totalText = `${Math.round(totalMarks)}`;
      doc.text(totalText, perfX + (perfColWidths[perfColWidths.length - 4] - doc.getTextWidth(totalText)) / 2, y + 4);
      perfX += perfColWidths[perfColWidths.length - 4];
      
      // AVG (2 decimal places)
      doc.rect(perfX, y, perfColWidths[perfColWidths.length - 3], perfRowHeight);
      const avgText = avg > 0 ? avg.toFixed(2) : '-';
      doc.text(avgText, perfX + (perfColWidths[perfColWidths.length - 3] - doc.getTextWidth(avgText)) / 2, y + 4);
      perfX += perfColWidths[perfColWidths.length - 3];
      
      // GRADE
      doc.rect(perfX, y, perfColWidths[perfColWidths.length - 2], perfRowHeight);
      doc.text(avgGrade, perfX + (perfColWidths[perfColWidths.length - 2] - doc.getTextWidth(avgGrade)) / 2, y + 4);
      perfX += perfColWidths[perfColWidths.length - 2];
      
      // POS
      doc.rect(perfX, y, perfColWidths[perfColWidths.length - 1], perfRowHeight);
      const posText = examIdx === examTypes.length - 1 ? (studentData.overall.position?.toString() || '-') : '-';
      doc.text(posText, perfX + (perfColWidths[perfColWidths.length - 1] - doc.getTextWidth(posText)) / 2, y + 4);
      
      y += perfRowHeight;
    });
    
    y += 3;
  }

  // Remarks Section
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, tableWidth, 6, 'F');
  doc.rect(margin, y, tableWidth, 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  centerText('REMARKS', y + 4);
  y += 7;

  // Class Teacher Remarks
  doc.rect(margin, y, tableWidth, 10);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, 30, 10, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ClassTeacher', margin + 2, y + 6);
  doc.setFont('helvetica', 'italic');
  doc.text(studentData.class_teacher_remark || 'Good performance', margin + 35, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo?.class_teacher_name || '', pageWidth - margin - 50, y + 6);
  y += 11;

  // Principal Remarks
  doc.rect(margin, y, tableWidth, 10);
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, 30, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Principal', margin + 2, y + 6);
  doc.setFont('helvetica', 'italic');
  doc.text(studentData.principal_remark || 'Satisfactory, aim higher', margin + 35, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo?.principal_name || '', pageWidth - margin - 50, y + 6);
  y += 13;

  // Footer
  doc.setFontSize(8);
  doc.text('Fees Arrears:', margin, y);
  doc.text('Next term fees:', pageWidth / 3, y);
  doc.text('Total fees expected:', pageWidth - 60, y);
  y += 6;
  doc.text('Closing Date: __________', margin, y);
  doc.text('Opening Date: __________', pageWidth - 55, y);
  y += 6;

  if (schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    centerText(`motto: ${schoolInfo.motto}`, y);
  }
};

export default generateTemplate1PDF;