/**
 * PDF generation utility for class borrowing records
 * Uses jsPDF + jspdf-autotable to generate a borrowing register PDF
 * Header: Subject, Book Name, Class
 * Body: Student Admission #, Full Name, Book Copy ID
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClassBorrowingAssignment } from '../types';

interface ClassBorrowingPDFData {
  subject: string;
  bookTitle: string;
  bookAuthor: string;
  className: string;
  teacherName: string;
  dueDate: string;
  issueDate: string;
  assignments: ClassBorrowingAssignment[];
  schoolName?: string;
}

export function generateClassBorrowingPDF(data: ClassBorrowingPDFData): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ─── Header ─────────────────────────────────────────────────────────────
  // School name
  if (data.schoolName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.schoolName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  }

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOK BORROWING REGISTER', pageWidth / 2, data.schoolName ? 26 : 18, { align: 'center' });

  // Divider line
  const headerBaseY = data.schoolName ? 30 : 22;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(margin, headerBaseY, pageWidth - margin, headerBaseY);

  // Book / Class info block
  let infoY = headerBaseY + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftCol = margin;
  const rightCol = pageWidth / 2 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Subject:', leftCol, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.subject, leftCol + 22, infoY);

  doc.setFont('helvetica', 'bold');
  doc.text('Class:', rightCol, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.className, rightCol + 18, infoY);

  infoY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Book:', leftCol, infoY);
  doc.setFont('helvetica', 'normal');
  // Truncate long titles
  const maxTitleWidth = pageWidth / 2 - margin - 22;
  const titleLines = doc.splitTextToSize(data.bookTitle, maxTitleWidth);
  doc.text(titleLines[0] + (titleLines.length > 1 ? '...' : ''), leftCol + 22, infoY);

  doc.setFont('helvetica', 'bold');
  doc.text('Author:', rightCol, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.bookAuthor || '—', rightCol + 18, infoY);

  infoY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Teacher:', leftCol, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.teacherName, leftCol + 22, infoY);

  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', rightCol, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.dueDate, rightCol + 22, infoY);

  infoY += 4;

  // Divider
  doc.setLineWidth(0.3);
  doc.line(margin, infoY, pageWidth - margin, infoY);

  // ─── Table ──────────────────────────────────────────────────────────────
  const tableData = data.assignments.map((a, idx) => [
    String(idx + 1),
    a.admission_number,
    a.student_name,
    a.copy_uid,
    '', // Signature column
  ]);

  autoTable(doc, {
    startY: infoY + 3,
    head: [['#', 'Admission No.', 'Student Name', 'Book Copy ID', 'Signature']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 32 },
      2: { cellWidth: 55 },
      3: { halign: 'center', cellWidth: 38 },
      4: { cellWidth: 38 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // ─── Footer ─────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable?.finalY || infoY + 20;
  const footerY = finalY + 12;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Issued: ${data.issueDate} | Total: ${data.assignments.length} student(s) | Generated on ${new Date().toLocaleDateString('en-GB')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  // Teacher signature line
  if (footerY + 20 < doc.internal.pageSize.getHeight() - 10) {
    const sigY = footerY + 16;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Teacher's Signature: _________________________", leftCol, sigY);
    doc.text('Date: _______________', rightCol + 10, sigY);
  }

  // ─── Save ───────────────────────────────────────────────────────────────
  const filename = `Borrowing_${data.className.replace(/\s+/g, '_')}_${data.bookTitle.substring(0, 20).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}


// ═══════════════════════════════════════════════════════════════════════════════
// Borrowing Report PDF — downloadable list of borrowed books
// Supports class filter, shows teacher name for class-issued books
// ═══════════════════════════════════════════════════════════════════════════════

interface BorrowingReportRow {
  bookTitle: string;
  bookISBN: string;
  copyUid: string;
  memberName: string;
  admissionNumber: string;
  memberGrade: string;
  issueDate: string;
  dueDate: string;
  status: string;
  teacherName: string;   // extracted from notes for class borrowings
  isClassBorrowing: boolean;
}

interface BorrowingReportPDFData {
  rows: BorrowingReportRow[];
  filterClass?: string;
  filterStatus?: string;
  schoolName?: string;
}

/** Parse a borrowing notes field to extract class borrowing metadata */
export function parseBorrowingNotes(notes: string): { isClass: boolean; className: string; teacher: string; subject: string } {
  if (!notes || !notes.startsWith('Class borrowing:')) {
    return { isClass: false, className: '', teacher: '', subject: '' };
  }
  // Pattern: "Class borrowing: Grade 7 | Subject: English | Teacher: John Doe"
  const classMatch = notes.match(/Class borrowing:\s*([^|]+)/);
  const subjectMatch = notes.match(/Subject:\s*([^|]+)/);
  const teacherMatch = notes.match(/Teacher:\s*([^|]+)/);
  return {
    isClass: true,
    className: classMatch ? classMatch[1].trim() : '',
    teacher: teacherMatch ? teacherMatch[1].trim() : '',
    subject: subjectMatch ? subjectMatch[1].trim() : '',
  };
}

export function generateBorrowingReportPDF(data: BorrowingReportPDFData): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ─── Header ─────────────────────────────────────────────────────────────
  if (data.schoolName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(data.schoolName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const titleY = data.schoolName ? 24 : 16;
  doc.text('LIBRARY BORROWING REPORT', pageWidth / 2, titleY, { align: 'center' });

  // Subtitle with filter info
  let subtitle = `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  if (data.filterClass) subtitle += ` | Class: ${data.filterClass}`;
  if (data.filterStatus) subtitle += ` | Status: ${data.filterStatus}`;
  subtitle += ` | Total: ${data.rows.length} record(s)`;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, pageWidth / 2, titleY + 6, { align: 'center' });

  // Divider
  const dividerY = titleY + 9;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);

  // ─── Table ──────────────────────────────────────────────────────────────
  const hasClassBorrowings = data.rows.some(r => r.isClassBorrowing);

  const headers = ['#', 'Book Title', 'Copy ID', 'Student / Member', 'Adm No.', 'Class'];
  if (hasClassBorrowings) headers.push('Teacher');
  headers.push('Issue Date', 'Due Date', 'Status');

  const tableData = data.rows.map((r, idx) => {
    const row = [
      String(idx + 1),
      r.bookTitle.length > 35 ? r.bookTitle.substring(0, 35) + '...' : r.bookTitle,
      r.copyUid || '—',
      r.memberName,
      r.admissionNumber || '—',
      r.memberGrade || '—',
    ];
    if (hasClassBorrowings) row.push(r.teacherName || '—');
    row.push(r.issueDate, r.dueDate, r.status);
    return row;
  });

  autoTable(doc, {
    startY: dividerY + 3,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [55, 65, 81],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: hasClassBorrowings ? 50 : 55 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: hasClassBorrowings ? 38 : 45 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: function (hookData) {
      // Color status column
      const statusColIdx = hasClassBorrowings ? 9 : 8;
      if (hookData.section === 'body' && hookData.column.index === statusColIdx) {
        const val = String(hookData.cell.raw).toLowerCase();
        if (val === 'overdue') {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = 'bold';
        } else if (val === 'active' || val === 'renewed') {
          hookData.cell.styles.textColor = [37, 99, 235];
        } else if (val === 'returned') {
          hookData.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });

  // ─── Footer ─────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable?.finalY || dividerY + 20;
  const footerY = Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Library Borrowing Report — ${data.rows.length} record(s) — Generated on ${new Date().toLocaleString('en-GB')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  // ─── Save ───────────────────────────────────────────────────────────────
  const classTag = data.filterClass ? `_${data.filterClass.replace(/\s+/g, '_')}` : '';
  const filename = `Borrowing_Report${classTag}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
