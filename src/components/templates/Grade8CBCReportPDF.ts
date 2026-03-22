/**
 * Grade 8 CBC Report Card PDF Generator (Enhanced Template)
 * Generates CBC-aligned assessment reports matching the reference image
 */

import jsPDF from 'jspdf';
import type { StudentReportData, SchoolInfo } from './utils/reportTypes';
import { getCBCRating } from './utils/reportUtils';
import { loadImageAsBase64 } from './utils/imageUtils';

interface GenerateTemplate2Options {
  doc: jsPDF;
  studentData: StudentReportData;
  schoolInfo: SchoolInfo | null;
  selectedTerm: string;
  selectedYear?: string;
  isNewPage?: boolean;
  /** Pre-fetched logo base64 data — avoids re-fetching for every student */
  logoBase64?: string | null;
}

export const generateTemplate2PDF = async ({
  doc,
  studentData,
  schoolInfo,
  selectedTerm,
  selectedYear,
  isNewPage = false,
  logoBase64: preloadedLogo
}: GenerateTemplate2Options): Promise<void> => {
  if (isNewPage) {
    doc.addPage();
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = 10;

  const centerText = (text: string, yPos: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // === HEADER SECTION WITH LOGO ON RIGHT ===
  const logoSize = 18;
  const logoX = pageWidth - margin - logoSize;
  const logoY = y;
  
  // Load and add logo (supports JPG, PNG, JPEG)
  // Use pre-fetched logo if available, otherwise fetch on-the-fly (fallback)
  let logoData = preloadedLogo ?? null;
  if (!logoData) {
    let logoUrl = schoolInfo?.logo_url || studentData.school_info?.logo_url;
    if (logoUrl && logoUrl.includes('185.181.10.160:8000/media/school_logos/Screenshot_2026-01-24_08_17_15_PlOmrtG.png')) {
      logoUrl = '/api/proxy-logo';
    }
    if (logoUrl) {
      try { logoData = await loadImageAsBase64(logoUrl); } catch { /* continue without logo */ }
    }
  }
  if (logoData) {
    try {
      const format = logoData.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoData, format, logoX, logoY, logoSize, logoSize);
    } catch {
      // Logo failed to render - continue without it
    }
  }

  // School Name (centered, accounting for logo space)
  const headerWidth = pageWidth - 2 * margin - logoSize - 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const schoolName = schoolInfo?.school_name || 'SCHOOL NAME';
  const schoolNameWidth = doc.getTextWidth(schoolName);
  doc.text(schoolName, margin + (headerWidth - schoolNameWidth) / 2, y + 4);
  y += 9;

  // Address line
  if (schoolInfo?.address) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const addressWidth = doc.getTextWidth(schoolInfo.address);
    doc.text(schoolInfo.address, margin + (headerWidth - addressWidth) / 2, y);
    y += 4;
  }

  // Phone and Email on same line
  if (schoolInfo?.phone_number) {
    doc.setFontSize(8);
    const phoneText = schoolInfo.email ? `${schoolInfo.phone_number}  |  ${schoolInfo.email}` : schoolInfo.phone_number;
    const phoneWidth = doc.getTextWidth(phoneText);
    doc.text(phoneText, margin + (headerWidth - phoneWidth) / 2, y);
    y += 4;
  }

  // Motto (italic, centered)
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

  // Original stamp (top right corner below logo area)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - margin - 22, y - 8, 22, 7);
  doc.text('ORIGINAL', pageWidth - margin - 20, y - 3);

  // Header Title
  doc.setFillColor(200, 200, 200);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setDrawColor(0);
  doc.rect(margin, y, pageWidth - 2 * margin, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  centerText('GRADE EIGHT', y + 5);
  y += 9;

  // Term info
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, pageWidth - 2 * margin, 6, 'F');
  doc.rect(margin, y, pageWidth - 2 * margin, 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  centerText(`TERM ${selectedTerm} ${selectedYear || ''} SUMMATIVE ASSESSMENT REPORT`, y + 4.5);
  y += 9;

  // Student Info Row - Optimized layout
  const tableWidth = pageWidth - 2 * margin;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text("Learner's Name:", margin, y);
  doc.setFont('helvetica', 'normal');
  const studentName = studentData.student.full_name || '';
  doc.text(studentName, margin + 28, y);
  
  // Draw underline for name
  doc.setLineWidth(0.3);
  doc.line(margin + 28, y + 1, margin + 90, y + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Adm No:', margin + 95, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.admission_number || '', margin + 112, y);
  doc.line(margin + 112, y + 1, margin + 140, y + 1);

  doc.setFont('helvetica', 'bold');
  doc.text('Class:', margin + 145, y);
  doc.setFont('helvetica', 'normal');
  doc.text(studentData.student.current_class || 'Grade 8', margin + 158, y);
  
  y += 8;

  // Assessment Table - Match template2.html structure exactly
  const ratingHeaders = ['EE', 'ME', 'AE', 'BE'];
  const ratingPoints = ['(4)', '(3)', '(2)', '(1)'];
  
  // Calculate optimal column widths - wider subject column like template2.html (22%)
  const subjectColWidth = tableWidth * 0.22;
  const ratingColWidth = (tableWidth - subjectColWidth) / 12; // 12 rating columns (4 per test x 3 tests)
  const testGroupWidth = ratingColWidth * 4;
  const numTests = 3;
  const testNames = ['FIRST TEST', 'SECOND TEST', 'THIRD TEST'];

  // Table header Row 1 - SUBJECT spanning 2 rows, Test names
  doc.setFillColor(224, 224, 224);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  
  // Subject header cell (spans 2 rows)
  doc.rect(margin, y, subjectColWidth, 12, 'F');
  doc.rect(margin, y, subjectColWidth, 12);
  
  // Test headers (FIRST TEST, SECOND TEST, THIRD TEST)
  doc.setFillColor(240, 240, 240);
  for (let t = 0; t < numTests; t++) {
    const testX = margin + subjectColWidth + t * testGroupWidth;
    doc.rect(testX, y, testGroupWidth, 6, 'F');
    doc.rect(testX, y, testGroupWidth, 6);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Subject header text
  doc.text('SUBJECT', margin + subjectColWidth / 2 - 12, y + 7);
  
  // Test headers centered
  for (let t = 0; t < numTests; t++) {
    const testX = margin + subjectColWidth + t * testGroupWidth;
    const testNameWidth = doc.getTextWidth(testNames[t]);
    doc.text(testNames[t], testX + (testGroupWidth - testNameWidth) / 2, y + 4);
  }

  y += 6;

  // Rating sub-headers row (EE(4), ME(3), AE(2), BE(1)) under each test
  doc.setFillColor(224, 224, 224);
  for (let t = 0; t < numTests; t++) {
    const groupX = margin + subjectColWidth + t * testGroupWidth;
    for (let r = 0; r < 4; r++) {
      const cellX = groupX + r * ratingColWidth;
      doc.rect(cellX, y, ratingColWidth, 6, 'F');
      doc.rect(cellX, y, ratingColWidth, 6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      // Rating letter
      const ratingText = ratingHeaders[r];
      const ratingWidth = doc.getTextWidth(ratingText);
      doc.text(ratingText, cellX + (ratingColWidth - ratingWidth) / 2, y + 3);
      // Points below
      doc.setFontSize(6);
      const pointsText = ratingPoints[r];
      const pointsWidth = doc.getTextWidth(pointsText);
      doc.text(pointsText, cellX + (ratingColWidth - pointsWidth) / 2, y + 5.5);
    }
  }
  
  y += 6;

  // Subject rows - match template2.html layout
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const rowHeight = 6;

  studentData.results.forEach((result) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 15;
    }

    // Subject name cell
    doc.rect(margin, y, subjectColWidth, rowHeight);
    const subjectName = result.subject_name || '';
    const isOptional = subjectName.toLowerCase().includes('optional') || 
                       ['computer', 'home science', 'performing', 'visual', 'french'].some(s => 
                         subjectName.toLowerCase().includes(s));
    
    if (isOptional) {
      doc.setFont('helvetica', 'italic');
    }
    doc.text(subjectName.length > 22 ? subjectName.substring(0, 20) + '..' : subjectName, margin + 2, y + 4);
    doc.setFont('helvetica', 'normal');

    // Only show checkmarks if the subject has marks (marks_obtained > 0)
    const hasMarks = result.marks_obtained > 0;
    
    // Calculate rating for this subject based on marks percentage
    const percentage = result.total_marks > 0 ? (result.marks_obtained / result.total_marks) * 100 : 0;
    const rating = getCBCRating(percentage);

    // Rating checkmarks for all three tests - only if subject has marks
    const testRatings = result.test_ratings || [rating, rating, rating];

    for (let t = 0; t < numTests; t++) {
      const groupX = margin + subjectColWidth + t * testGroupWidth;
      
      for (let r = 0; r < 4; r++) {
        const cellX = groupX + r * ratingColWidth;
        doc.rect(cellX, y, ratingColWidth, rowHeight);
        
        // Only add checkmark if subject has marks and this is the correct rating column
        if (hasMarks) {
          const currentRating = Array.isArray(testRatings) && testRatings[t] ? testRatings[t] : rating;
          if (currentRating && r === currentRating.column) {
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 255); // Blue checkmark like template2.html
            doc.text('✓', cellX + ratingColWidth / 2 - 2, y + 4.5);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
          }
        }
      }
    }

    y += rowHeight;
  });

  // Average Score row
  doc.setFillColor(232, 232, 232);
  doc.rect(margin, y, subjectColWidth, rowHeight, 'F');
  doc.rect(margin, y, subjectColWidth, rowHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AVERAGE SCORE', margin + 2, y + 4);

  // Only calculate and show average if there are subjects with marks
  const subjectsWithMarks = studentData.results.filter(r => r.marks_obtained > 0);
  const hasAnyMarks = subjectsWithMarks.length > 0;
  const avgPercentage = studentData.overall.average || 0;
  const avgRating = getCBCRating(avgPercentage);

  for (let t = 0; t < numTests; t++) {
    const groupX = margin + subjectColWidth + t * testGroupWidth;
    for (let r = 0; r < 4; r++) {
      const cellX = groupX + r * ratingColWidth;
      doc.rect(cellX, y, ratingColWidth, rowHeight);
      
      // Only show average rating checkmark if there are subjects with marks
      if (hasAnyMarks && r === avgRating.column) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 255);
        doc.text('✓', cellX + ratingColWidth / 2 - 2, y + 4.5);
        doc.setTextColor(0, 0, 0);
      }
    }
  }
  
  y += rowHeight + 5;

  // Rating Legend
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, tableWidth, 8, 'F');
  doc.rect(margin, y, tableWidth, 8);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const legendText = 'RATING KEY: EE = Exceeds Expectation (75-100%)  |  ME = Meets Expectation (50-74%)  |  AE = Approaching Expectation (25-49%)  |  BE = Below Expectation (0-24%)';
  const legendWidth = doc.getTextWidth(legendText);
  doc.text(legendText, margin + (tableWidth - legendWidth) / 2, y + 5.5);
  
  y += 11;

  // Remarks Section
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, y, tableWidth, 5, 'F');
  doc.rect(margin, y, tableWidth, 5);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  centerText("FACILITATOR'S REMARKS", y + 3.5);
  y += 6;

  // Remarks box
  const remarksBoxHeight = 18;
  doc.rect(margin, y, tableWidth, remarksBoxHeight);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  const remarkText = studentData.facilitator_remark || 'Good progress in all learning areas. Continue working hard!';
  doc.text(remarkText, margin + 3, y + 5);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Core competencies, achievements, PCIs development and Values remarks:', margin + 3, y + 10);
  
  y += remarksBoxHeight + 4;

  // Signatures Section - Compact grid layout
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const signColWidth = tableWidth / 3;
  const signRowHeight = 12;

  // Draw signature boxes
  doc.rect(margin, y, signColWidth, signRowHeight);
  doc.rect(margin + signColWidth, y, signColWidth, signRowHeight);
  doc.rect(margin + signColWidth * 2, y, signColWidth, signRowHeight);

  doc.text("Facilitator's Sign:", margin + 2, y + 4);
  doc.line(margin + 28, y + 4, margin + signColWidth - 5, y + 4);
  doc.text('Date:', margin + 2, y + 9);
  doc.line(margin + 12, y + 9, margin + signColWidth - 5, y + 9);

  doc.text("Head Teacher's Sign:", margin + signColWidth + 2, y + 4);
  doc.line(margin + signColWidth + 32, y + 4, margin + signColWidth * 2 - 5, y + 4);
  doc.text('Date:', margin + signColWidth + 2, y + 9);
  doc.line(margin + signColWidth + 12, y + 9, margin + signColWidth * 2 - 5, y + 9);

  doc.text("Parent/Guardian Sign:", margin + signColWidth * 2 + 2, y + 4);
  doc.line(margin + signColWidth * 2 + 35, y + 4, margin + tableWidth - 5, y + 4);
  doc.text('Date:', margin + signColWidth * 2 + 2, y + 9);
  doc.line(margin + signColWidth * 2 + 12, y + 9, margin + tableWidth - 5, y + 9);

  y += signRowHeight + 4;

  // Dates Section - Compact layout
  doc.rect(margin, y, tableWidth, 8);
  doc.setFontSize(7);
  const datesX1 = margin + 3;
  const datesX2 = margin + tableWidth / 3;
  const datesX3 = margin + tableWidth * 2 / 3;
  
  doc.text('OPENING DATE: ______________', datesX1, y + 5);
  doc.text('CLOSING DATE: ______________', datesX2, y + 5);
  doc.text('NEXT TERM: ______________', datesX3, y + 5);

  y += 12;

  // Footer - Position
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  centerText(`POSITION: ${studentData.overall.position || '-'} / ${studentData.overall.out_of || '-'}`, y);
  
  y += 6;

  // School motto at bottom
  if (schoolInfo?.motto) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    centerText(`motto: ${schoolInfo.motto}`, y);
  }
};

export default generateTemplate2PDF;