// Report Card PDF Generation Service
// Uses jsPDF to generate report cards from templates

import jsPDF from 'jspdf';

// Interfaces
export interface SchoolInfo {
  id: number;
  school_name: string;
  principal_name: string;
  phone_number: string;
  email: string;
  address: string;
  motto: string;
  vision: string;
  mission: string;
  logo_url: string | null;
}

export interface SubjectResult {
  subject_name: string;
  subject_code: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  remarks: string;
  position?: number;
  teacher_initials?: string;
}

export interface StudentReportData {
  student: {
    id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    gender?: string;
    kcpe_marks?: number;
  };
  results: SubjectResult[];
  overall: {
    total_marks: number;
    average: number;
    grade: string;
    position: number;
    out_of: number;
  };
}

export interface GeneratePDFOptions {
  templateType: 'high-school' | 'grade-8' | 'primary';
  term: string;
  year: string;
  examType: string;
  schoolInfo: SchoolInfo | null;
}

// Grade calculation utilities
export const getGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'A-';
  if (percentage >= 70) return 'B+';
  if (percentage >= 65) return 'B';
  if (percentage >= 60) return 'B-';
  if (percentage >= 55) return 'C+';
  if (percentage >= 50) return 'C';
  if (percentage >= 45) return 'C-';
  if (percentage >= 40) return 'D+';
  if (percentage >= 35) return 'D';
  if (percentage >= 30) return 'D-';
  return 'E';
};

export const getGradePoints = (grade: string): number => {
  const gradePoints: Record<string, number> = {
    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
    'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
  };
  return gradePoints[grade] || 0;
};

export const getRemarks = (percentage: number): string => {
  if (percentage >= 80) return 'Excellent, Keep up';
  if (percentage >= 70) return 'Good, can do better';
  if (percentage >= 60) return 'Satisfactory, aim higher';
  if (percentage >= 50) return 'Can do better, aim high';
  if (percentage >= 40) return 'Put in More Effort';
  return 'Needs Improvement';
};

export const getCBCRating = (percentage: number): { rating: string; column: number } => {
  if (percentage >= 75) return { rating: 'EE', column: 0 }; // Exceeding Expectation
  if (percentage >= 50) return { rating: 'ME', column: 1 }; // Meeting Expectation
  if (percentage >= 25) return { rating: 'AE', column: 2 }; // Approaching Expectation
  return { rating: 'BE', column: 3 }; // Below Expectation
};

// Convert image URL to base64 for PDF embedding
export const loadImageAsBase64 = async (url: string): Promise<string | null> => {
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

// High School Template PDF Generation
export const generateHighSchoolPDF = async (
  doc: jsPDF,
  studentData: StudentReportData,
  options: GeneratePDFOptions,
  isNewPage: boolean = false
): Promise<void> => {
  if (isNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 15;

  // Helper functions
  const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // Add school logo if available
  if (options.schoolInfo?.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(options.schoolInfo.logo_url);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, y, 18, 20);
      }
    } catch {
      // Draw placeholder rectangle if logo fails to load
      doc.setFillColor(51, 51, 51);
      doc.rect(margin, y, 18, 20, 'F');
    }
  }

  // School Header
  centerText(options.schoolInfo?.school_name || 'SCHOOL NAME', y + 5, 18, 'bold');
  y += 10;

  if (options.schoolInfo?.address) {
    centerText(options.schoolInfo.address, y, 10);
    y += 5;
  }

  if (options.schoolInfo?.phone_number) {
    centerText(`Tel: ${options.schoolInfo.phone_number}`, y, 9);
    y += 5;
  }

  if (options.schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    centerText(options.schoolInfo.motto, y, 9);
    doc.setFont('helvetica', 'normal');
    y += 5;
  }

  // Separator line
  y += 2;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Term Info Bar
  doc.setFillColor(224, 224, 224);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TERM ${options.term} ${options.year}`, margin + 5, y + 5.5);
  doc.text('REPORT FORM', pageWidth / 2 - 15, y + 5.5);
  doc.text(`CLASS: ${studentData.student.current_class}`, pageWidth - margin - 50, y + 5.5);
  y += 12;

  // Student Info Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, pageWidth - 2 * margin, 22);
  
  doc.setFontSize(9);
  const infoY1 = y + 6;
  const infoY2 = y + 14;
  const col1 = margin + 3;
  const col2 = pageWidth / 4;
  const col3 = pageWidth / 2;
  const col4 = (pageWidth / 4) * 3;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('ADM NO:', col1, infoY1);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.admission_number || '', col1 + 20, infoY1);

  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', col2, infoY1);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.full_name || '', col2 + 15, infoY1);

  doc.setFont('helvetica', 'bold');
  doc.text('MEAN GRADE:', col4, infoY1);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.overall.grade || '', col4 + 28, infoY1);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL MARKS:', col1, infoY2);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.overall.total_marks?.toString() || '', col1 + 28, infoY2);

  doc.setFont('helvetica', 'bold');
  doc.text('AVERAGE:', col2, infoY2);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.overall.average?.toFixed(2) || '', col2 + 22, infoY2);

  doc.setFont('helvetica', 'bold');
  doc.text('POSITION:', col3, infoY2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${studentData.overall.position || '-'}/${studentData.overall.out_of || '-'}`, col3 + 22, infoY2);

  y += 26;

  // Subjects Table
  const tableHeaders = ['CODE', 'SUBJECT', 'MARKS', 'GR', 'PTS', 'POS', 'REMARKS', 'INIT'];
  const colWidths = [15, 45, 20, 12, 12, 15, 50, 15];
  let tableX = margin;

  // Table header
  doc.setFillColor(208, 208, 208);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setDrawColor(0);
  doc.rect(margin, y, pageWidth - 2 * margin, 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  tableHeaders.forEach((header, i) => {
    doc.text(header, tableX + 2, y + 5);
    tableX += colWidths[i];
  });

  y += 7;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  studentData.results.forEach((result, index) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 15;
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
    }
    doc.rect(margin, y, pageWidth - 2 * margin, 6);

    tableX = margin;
    const percentage = (result.marks_obtained / result.total_marks) * 100;
    const grade = result.grade || getGrade(percentage);
    const points = getGradePoints(grade);
    const remarks = result.remarks || getRemarks(percentage);

    const rowData = [
      result.subject_code || '',
      result.subject_name || '',
      `${result.marks_obtained}/${result.total_marks}`,
      grade,
      points.toString(),
      result.position?.toString() || '-',
      remarks,
      result.teacher_initials || ''
    ];

    rowData.forEach((data, i) => {
      const textToShow = data.length > 15 && i === 6 ? data.substring(0, 14) + '...' : data;
      doc.text(textToShow, tableX + 2, y + 4);
      tableX += colWidths[i];
    });

    y += 6;
  });

  y += 5;

  // Remarks Section
  doc.setFillColor(224, 224, 224);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.rect(margin, y, pageWidth - 2 * margin, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REMARKS', pageWidth / 2 - 12, y + 5);
  y += 10;

  // Class Teacher Remarks
  doc.rect(margin, y, pageWidth - 2 * margin, 12);
  doc.setFillColor(224, 224, 224);
  doc.rect(margin, y, 35, 12, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Teacher:', margin + 2, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.text('Good performance, keep it up', margin + 40, y + 7);
  y += 14;

  // Principal Remarks
  doc.rect(margin, y, pageWidth - 2 * margin, 12);
  doc.setFillColor(224, 224, 224);
  doc.rect(margin, y, 35, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Principal:', margin + 2, y + 7);
  doc.setFont('helvetica', 'italic');
  doc.text('Satisfactory, aim higher', margin + 40, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(options.schoolInfo?.principal_name || 'Principal', pageWidth - margin - 50, y + 7);
  y += 18;

  // Footer
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fees Arrears: ___________', margin, y);
  doc.text('Next term fees: ___________', pageWidth / 2 - 20, y);
  doc.text('Total fees expected: ___________', pageWidth - margin - 55, y);

  y += 8;
  doc.text('Closing Date: ___________', margin, y);
  doc.text('Opening Date: ___________', pageWidth - margin - 45, y);

  // Footer motto
  if (options.schoolInfo?.motto) {
    y += 8;
    doc.setFont('helvetica', 'italic');
    centerText(`motto: ${options.schoolInfo.motto}`, y, 8);
  }
};

// Grade 8 CBC Template PDF Generation
export const generateGrade8PDF = async (
  doc: jsPDF,
  studentData: StudentReportData,
  options: GeneratePDFOptions,
  isNewPage: boolean = false
): Promise<void> => {
  if (isNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // Original stamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 45, y, 30, 10);
  doc.text('ORIGINAL', pageWidth - 42, y + 7);

  // Add school logo if available
  if (options.schoolInfo?.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(options.schoolInfo.logo_url);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, y, 18, 20);
      }
    } catch {
      // Skip logo if error
    }
  }

  // Header
  centerText('GRADE EIGHT', y + 5, 18, 'bold');
  y += 12;
  centerText(`TERM ${options.term} SUMMATIVE ASSESSMENT REPORT`, y, 12, 'bold');
  y += 12;

  // Student Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Learner's Name:", margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.full_name || '', margin + 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('School:', pageWidth / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(options.schoolInfo?.school_name || '', pageWidth / 2 + 30, y);
  y += 10;

  // Assessment Table
  const ratingHeaders = ['EE (4)', 'ME (3)', 'AE (2)', 'BE (1)'];
  const subjectColWidth = 50;
  const ratingColWidth = 12;
  const testGroupWidth = ratingColWidth * 4;

  // Table header row 1
  doc.setFillColor(224, 224, 224);
  doc.rect(margin, y, subjectColWidth, 14, 'F');
  doc.rect(margin + subjectColWidth, y, testGroupWidth, 7, 'F');
  doc.rect(margin + subjectColWidth + testGroupWidth, y, testGroupWidth, 7, 'F');
  doc.rect(margin + subjectColWidth + testGroupWidth * 2, y, testGroupWidth, 7, 'F');
  
  doc.setDrawColor(0);
  doc.rect(margin, y, subjectColWidth, 14);
  doc.rect(margin + subjectColWidth, y, testGroupWidth, 7);
  doc.rect(margin + subjectColWidth + testGroupWidth, y, testGroupWidth, 7);
  doc.rect(margin + subjectColWidth + testGroupWidth * 2, y, testGroupWidth, 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBJECT', margin + 5, y + 8);
  doc.text('FIRST TEST', margin + subjectColWidth + 12, y + 5);
  doc.text('SECOND TEST', margin + subjectColWidth + testGroupWidth + 8, y + 5);
  doc.text('THIRD TEST', margin + subjectColWidth + testGroupWidth * 2 + 10, y + 5);

  y += 7;

  // Rating headers row
  for (let t = 0; t < 3; t++) {
    let x = margin + subjectColWidth + t * testGroupWidth;
    for (let r = 0; r < 4; r++) {
      doc.rect(x + r * ratingColWidth, y, ratingColWidth, 7);
      doc.setFontSize(6);
      doc.text(ratingHeaders[r], x + r * ratingColWidth + 1, y + 5);
    }
  }
  y += 7;

  // Subject rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  studentData.results.forEach((result) => {
    doc.rect(margin, y, subjectColWidth, 7);
    doc.text(result.subject_name || '', margin + 2, y + 5);

    const percentage = (result.marks_obtained / result.total_marks) * 100;
    const rating = getCBCRating(percentage);

    // For simplicity, show rating in third test column only (representing latest assessment)
    for (let t = 0; t < 3; t++) {
      let x = margin + subjectColWidth + t * testGroupWidth;
      for (let r = 0; r < 4; r++) {
        doc.rect(x + r * ratingColWidth, y, ratingColWidth, 7);
        if (t === 2 && r === rating.column) {
          doc.setTextColor(0, 0, 255);
          doc.text('✓', x + r * ratingColWidth + 4, y + 5);
          doc.setTextColor(0, 0, 0);
        }
      }
    }

    y += 7;
  });

  // Average row
  doc.setFillColor(232, 232, 232);
  doc.rect(margin, y, subjectColWidth, 7, 'F');
  doc.rect(margin, y, subjectColWidth, 7);
  doc.setFont('helvetica', 'bold');
  doc.text('AVERAGE SCORE', margin + 2, y + 5);

  const avgPercentage = studentData.overall.average;
  const avgRating = getCBCRating(avgPercentage);

  for (let t = 0; t < 3; t++) {
    let x = margin + subjectColWidth + t * testGroupWidth;
    for (let r = 0; r < 4; r++) {
      doc.rect(x + r * ratingColWidth, y, ratingColWidth, 7);
      if (t === 2 && r === avgRating.column) {
        doc.setTextColor(0, 0, 255);
        doc.text('✓', x + r * ratingColWidth + 4, y + 5);
        doc.setTextColor(0, 0, 0);
      }
    }
  }
  y += 12;

  // Remarks Section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("Facilitator's remarks based on:- core competencies, achievements, PCI's development and Values:-", margin, y);
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setLineWidth(0.3);
  doc.line(margin, y + 4, pageWidth - margin, y + 4);
  doc.text('Good improvement in learning areas. Keep it up!', margin, y + 3);
  y += 15;

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text("Facilitator's Signature:", margin, y);
  doc.line(margin + 45, y, margin + 100, y);
  doc.text('Date:', margin + 105, y);
  doc.line(margin + 115, y, margin + 150, y);
  y += 10;

  doc.text("Head teacher's Signature:", margin, y);
  doc.line(margin + 50, y, margin + 100, y);
  doc.text('Date:', margin + 105, y);
  doc.line(margin + 115, y, margin + 150, y);
  y += 10;

  doc.text("Parent/Guardian's Signature:", margin, y);
  doc.line(margin + 55, y, margin + 100, y);
  doc.text('Date:', margin + 105, y);
  doc.line(margin + 115, y, margin + 150, y);
  y += 15;

  // Dates
  doc.setFont('helvetica', 'bold');
  doc.text('OPENING DATE:', margin, y);
  doc.line(margin + 35, y, margin + 70, y);
  doc.text('CLOSING DATE:', pageWidth / 2, y);
  doc.line(pageWidth / 2 + 35, y, pageWidth / 2 + 70, y);
  y += 8;

  doc.text('NEXT TERM BEGINS ON:', margin, y);
  doc.line(margin + 48, y, margin + 90, y);

  // Footer
  y = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`<< ${studentData.overall.position || '-'} >>`, pageWidth / 2 - 10, y);
  doc.text('GRADE 8', pageWidth - margin - 20, y);
};

// Main function to generate PDF based on template type
export const generateReportCardPDF = async (
  studentsData: StudentReportData[],
  options: GeneratePDFOptions,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  for (let i = 0; i < studentsData.length; i++) {
    const studentData = studentsData[i];
    const isNewPage = i > 0;

    if (options.templateType === 'high-school') {
      await generateHighSchoolPDF(doc, studentData, options, isNewPage);
    } else if (options.templateType === 'grade-8') {
      await generateGrade8PDF(doc, studentData, options, isNewPage);
    } else {
      // Default to high school template
      await generateHighSchoolPDF(doc, studentData, options, isNewPage);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / studentsData.length) * 100));
    }
  }

  doc.save(filename);
};

export default {
  generateReportCardPDF,
  generateHighSchoolPDF,
  generateGrade8PDF,
  getGrade,
  getGradePoints,
  getRemarks,
  getCBCRating,
  loadImageAsBase64
};
