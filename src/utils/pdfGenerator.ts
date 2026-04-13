import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportsData } from '../components/generalFiles/reports/ReportsDashboard';
import { getGrade, type GradeDefinition } from './gradingUtils';

interface Filters {
  term: string;
  academicYear: string;
  examType: string;
}

export const generateReportsPDF = (reportsData: ReportsData, filters: Filters, gradeScale?: GradeDefinition[]): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Helper function to add centered title
  const addTitle = (text: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titleWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - titleWidth) / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  // Add report header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const schoolName = "School Management System";
  const headerWidth = doc.getTextWidth(schoolName);
  doc.text(schoolName, (pageWidth - headerWidth) / 2, 15);

  // Add filter information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const filterInfo = [
    `Term: ${filters.term || 'All Terms'}`,
    `Academic Year: ${filters.academicYear || 'All Years'}`,
    `Exam Type: ${filters.examType || 'All Exams'}`,
  ];
  doc.text(filterInfo, 14, 25);

  let currentY = 40;

  // Generate Top Students Table
  if (reportsData.top_students_per_class?.length) {
    reportsData.top_students_per_class.forEach((classData) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      addTitle(`Top Students - ${classData.class_name} (${classData.stream} Stream)`, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Position', 'Student Name', 'Average', 'Total', 'Stream']],
        body: classData.students.map(student => [
          student.position,
          student.student_name,
          `${student.average?.toFixed(2)}%`,
          student.total,
          student.stream
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 40 }
        }
      });

      const lastTable = (doc as any).lastAutoTable;
      currentY = lastTable ? lastTable.finalY + 15 : currentY + 50;
    });
  }

  // Generate Subject Champions Table
  if (reportsData.subject_champions?.length) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    reportsData.subject_champions.forEach((classData) => {
      addTitle(`Subject Champions - ${classData.class_name} (${classData.stream} Stream)`, currentY);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Student Name', 'Stream', 'Marks', 'Subject']],
        body: classData.champions.map(champion => [
          champion.student_name,
          champion.stream,
          champion.marks,
          champion.subject
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      const lastTable = (doc as any).lastAutoTable;
      currentY = lastTable ? lastTable.finalY + 15 : currentY + 50;

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    });
  }

  // Generate Stream Rankings Table
  if (reportsData.stream_rankings?.length) {
    reportsData.stream_rankings.forEach((classData) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      addTitle(`Stream Rankings - ${classData.class_level}`, currentY);
      doc.setFontSize(8);
      doc.text(`Class Average: ${classData.class_average?.toFixed(2)}% | Position: #${classData.class_position}`, 14, currentY + 5);
      currentY += 10;

      autoTable(doc, {
        startY: currentY,
        head: [['Position', 'Class & Stream', 'Average', 'Students', 'Grade']],
        body: classData.streams.map(stream => [
          stream.position,
          `${stream.class_name} (${stream.stream})`,
          `${stream.average?.toFixed(2)}%`,
          stream.total_students,
          gradeScale && gradeScale.length > 0 ? getGrade(stream.average || 0, gradeScale) : 'N/A'
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      const lastTable = (doc as any).lastAutoTable;
      currentY = lastTable ? lastTable.finalY + 15 : currentY + 50;
    });
  }

  // Save the PDF
  doc.save('academic-reports.pdf');
};