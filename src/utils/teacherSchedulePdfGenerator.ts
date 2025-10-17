import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ScheduleEntry {
  subject: string;
  subject_id: number;
  class: string;
  class_id: number;
  start_time: string;
  end_time: string;
  time_slot: string;
  block_identifier: string | null;
  is_block: boolean;
}

interface TeacherSchedule {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  schedule: {
    [day: string]: {
      [time_slot: string]: ScheduleEntry[];
    };
  };
}

interface TimeSlot {
  time_slot: string;
  start_time: string;
  end_time: string;
  label: string;
}

/**
 * Generate PDF for a single teacher's schedule
 */
export const generateSingleTeacherPDF = (
  teacher: TeacherSchedule,
  timeslots: TimeSlot[]
): void => {
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(16);
  doc.text(`Timetable - ${teacher.teacher_name}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Email: ${teacher.teacher_email}`, 14, 22);
  
  // Prepare table data
  const tableData: any[] = [];
  
  DAYS.forEach(day => {
    const rowData: any[] = [day];
    
    timeslots.forEach(timeslot => {
      const entries = teacher.schedule[day]?.[timeslot.time_slot] || [];
      
      if (entries.length === 0) {
        rowData.push('-');
      } else if (entries.length === 1) {
        rowData.push(`${entries[0].subject}\n(${entries[0].class})`);
      } else {
        // Multiple entries (block subjects)
        const text = entries.map(e => `${e.subject} (${e.class})`).join('\n');
        rowData.push(text);
      }
    });
    
    tableData.push(rowData);
  });
  
  // Table headers
  const headers = [
    'Day',
    ...timeslots.map(ts => `${ts.start_time}\n${ts.end_time}`)
  ];
  
  // Calculate row height to occupy 60% of page
  const pageHeight = doc.internal.pageSize.height;
  const startY = 28;
  const bottomMargin = 10;
  const availableHeight = pageHeight - startY - bottomMargin;
  const rowHeight = (availableHeight * 0.6) / DAYS.length; // 60% of available height
  
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0], // Dark black borders
      lineWidth: 0.5, // Thicker border lines
      minCellHeight: rowHeight, // Fill page height
      valign: 'middle', // Center content vertically
      halign: 'center', // Center content horizontally
      textColor: [0, 0, 0], // Black text
      fillColor: [255, 255, 255], // White background
    },
    headStyles: {
      fillColor: [255, 255, 255], // White background
      textColor: [0, 0, 0], // Black text
      fontStyle: 'bold',
      lineColor: [0, 0, 0], // Dark borders for header
      lineWidth: 0.5,
      minCellHeight: 12, // Fixed header height
      halign: 'center', // Center header text
      valign: 'middle', // Center header vertically
    },
    columnStyles: {
      0: { 
        cellWidth: 25, 
        fontStyle: 'bold', 
        halign: 'center', // Center day names
        textColor: [0, 0, 0], // Black text
        fillColor: [255, 255, 255], // White background
      },
    },
    margin: { left: 10, right: 10, top: startY, bottom: bottomMargin }, // Use more of the page
    tableWidth: 'auto', // Fill available width
  });
  
  // Save the PDF
  const filename = `timetable_${teacher.teacher_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generate PDF for all teachers' schedules
 */
export const generateAllTeachersPDF = (
  teachers: TeacherSchedule[],
  timeslots: TimeSlot[]
): void => {
  const doc = new jsPDF('landscape');
  let currentY = 15;
  
  teachers.forEach((teacher, index) => {
    // Add new page if not first teacher
    if (index > 0) {
      doc.addPage();
      currentY = 15;
    }
    
    // Add title
    doc.setFontSize(14);
    doc.text(`${teacher.teacher_name}`, 14, currentY);
    doc.setFontSize(9);
    doc.text(`${teacher.teacher_email}`, 14, currentY + 6);
    
    // Prepare table data
    const tableData: any[] = [];
    
    DAYS.forEach(day => {
      const rowData: any[] = [day];
      
      timeslots.forEach(timeslot => {
        const entries = teacher.schedule[day]?.[timeslot.time_slot] || [];
        
        if (entries.length === 0) {
          rowData.push('-');
        } else if (entries.length === 1) {
          rowData.push(`${entries[0].subject}\n(${entries[0].class})`);
        } else {
          const text = entries.map(e => `${e.subject} (${e.class})`).join('\n');
          rowData.push(text);
        }
      });
      
      tableData.push(rowData);
    });
    
    // Table headers
    const headers = [
      'Day',
      ...timeslots.map(ts => `${ts.start_time}\n${ts.end_time}`)
    ];
    
    // Calculate row height to occupy 60% of page
    const pageHeight = doc.internal.pageSize.height;
    const startTableY = currentY + 20;
    const bottomMargin = 50;
    const availableHeight = pageHeight - startTableY - bottomMargin;
    const rowHeight = (availableHeight * 0.6) / DAYS.length; // 60% of available height
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: startTableY,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [0, 0, 0], // Dark black borders
        lineWidth: 0.5, // Thicker border lines
        minCellHeight: rowHeight, // Fill page height
        valign: 'middle', // Center content vertically
        halign: 'center', // Center content horizontally
        textColor: [0, 0, 0], // Black text
        fillColor: [255, 255, 255], // White background
      },
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0], // Black text
        fontStyle: 'bold',
        lineColor: [0, 0, 0], // Dark borders for header
        lineWidth: 0.5,
        minCellHeight: 10, // Fixed header height
        halign: 'center', // Center header text
        valign: 'middle', // Center header vertically
      },
      columnStyles: {
        0: { 
          cellWidth: 22, 
          fontStyle: 'bold', 
          halign: 'center', // Center day names
          textColor: [0, 0, 0], // Black text
          fillColor: [255, 255, 255], // White background
        },
      },
      margin: { left: 10, right: 10, top: startTableY, bottom: bottomMargin }, // Use more of the page
      tableWidth: 'auto', // Fill available width
    });
  });
  
  doc.save('all_teachers_timetables.pdf');
};
