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

interface BreakInfo {
  afterSlotIndex: number;
  durationMinutes: number;
  type: 'SHORT BREAK' | 'LONG BREAK' | 'LUNCH BREAK';
}

// Helper function to parse time string to minutes since midnight
const parseTimeToMinutes = (timeStr: string): number => {
  const cleanTime = timeStr.trim().toUpperCase();
  let hours = 0;
  let minutes = 0;
  
  const isPM = cleanTime.includes('PM');
  const isAM = cleanTime.includes('AM');
  const timeOnly = cleanTime.replace(/\s*(AM|PM)\s*/i, '');
  
  const parts = timeOnly.split(':');
  hours = parseInt(parts[0], 10);
  minutes = parseInt(parts[1] || '0', 10);
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

// Calculate breaks between time slots
const calculateBreaks = (timeslots: TimeSlot[]): BreakInfo[] => {
  if (timeslots.length < 2) return [];
  
  const gaps: { afterSlotIndex: number; durationMinutes: number }[] = [];
  
  for (let i = 0; i < timeslots.length - 1; i++) {
    const currentEndTime = parseTimeToMinutes(timeslots[i].end_time);
    const nextStartTime = parseTimeToMinutes(timeslots[i + 1].start_time);
    const gap = nextStartTime - currentEndTime;
    
    if (gap > 2) {
      gaps.push({ afterSlotIndex: i, durationMinutes: gap });
    }
  }
  
  if (gaps.length === 0) return [];
  
  const sortedGaps = [...gaps].sort((a, b) => a.durationMinutes - b.durationMinutes);
  
  const breaks: BreakInfo[] = gaps.map(gap => {
    const rank = sortedGaps.findIndex(g => 
      g.afterSlotIndex === gap.afterSlotIndex && g.durationMinutes === gap.durationMinutes
    );
    
    let breakType: 'SHORT BREAK' | 'LONG BREAK' | 'LUNCH BREAK';
    if (sortedGaps.length === 1) {
      if (gap.durationMinutes <= 15) {
        breakType = 'SHORT BREAK';
      } else if (gap.durationMinutes <= 30) {
        breakType = 'LONG BREAK';
      } else {
        breakType = 'LUNCH BREAK';
      }
    } else if (sortedGaps.length === 2) {
      breakType = rank === 0 ? 'SHORT BREAK' : 'LUNCH BREAK';
    } else {
      if (rank < sortedGaps.length / 3) {
        breakType = 'SHORT BREAK';
      } else if (rank < (sortedGaps.length * 2) / 3) {
        breakType = 'LONG BREAK';
      } else {
        breakType = 'LUNCH BREAK';
      }
    }
    
    return {
      afterSlotIndex: gap.afterSlotIndex,
      durationMinutes: gap.durationMinutes,
      type: breakType
    };
  });
  
  return breaks;
};

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
  
  // Calculate breaks
  const breaks = calculateBreaks(timeslots);
  
  // Build headers with break columns
  const headers: string[] = ['Day'];
  for (let i = 0; i < timeslots.length; i++) {
    headers.push(`${timeslots[i].start_time}\n${timeslots[i].end_time}`);
    const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
    if (breakAfterThis) {
      headers.push(''); // Empty header for break column
    }
  }
  
  // Prepare table data with break columns
  const tableData: any[] = [];
  
  DAYS.forEach((day, dayIndex) => {
    const rowData: any[] = [day];
    
    for (let i = 0; i < timeslots.length; i++) {
      const entries = teacher.schedule[day]?.[timeslots[i].time_slot] || [];
      
      if (entries.length === 0) {
        rowData.push('-');
      } else if (entries.length === 1) {
        rowData.push(`${entries[0].subject}\n(${entries[0].class})`);
      } else {
        // Multiple entries (block subjects)
        const text = entries.map(e => `${e.subject} (${e.class})`).join('\n');
        rowData.push(text);
      }
      
      // Add break cell if needed
      const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
      if (breakAfterThis) {
        if (dayIndex === 0) {
          // First row gets the merged cell with break text
          const breakText = breakAfterThis.type.split(' ').join('\n');
          rowData.push({
            content: breakText,
            rowSpan: DAYS.length,
            styles: {
              fillColor: breakAfterThis.type === 'LUNCH BREAK' ? [255, 243, 205] : 
                         breakAfterThis.type === 'LONG BREAK' ? [219, 234, 254] : 
                         [220, 252, 231],
              textColor: breakAfterThis.type === 'LUNCH BREAK' ? [146, 64, 14] : 
                         breakAfterThis.type === 'LONG BREAK' ? [30, 64, 175] : 
                         [22, 101, 52],
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              fontSize: 7,
              cellWidth: 12,
            }
          });
        }
        // Other rows skip the merged cell
      }
    }
    
    tableData.push(rowData);
  });
  
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
  
  // Calculate breaks once (same for all teachers)
  const breaks = calculateBreaks(timeslots);
  
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
    
    // Build headers with break columns
    const headers: string[] = ['Day'];
    for (let i = 0; i < timeslots.length; i++) {
      headers.push(`${timeslots[i].start_time}\n${timeslots[i].end_time}`);
      const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
      if (breakAfterThis) {
        headers.push(''); // Empty header for break column
      }
    }
    
    // Prepare table data with break columns
    const tableData: any[] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const rowData: any[] = [day];
      
      for (let i = 0; i < timeslots.length; i++) {
        const entries = teacher.schedule[day]?.[timeslots[i].time_slot] || [];
        
        if (entries.length === 0) {
          rowData.push('-');
        } else if (entries.length === 1) {
          rowData.push(`${entries[0].subject}\n(${entries[0].class})`);
        } else {
          const text = entries.map(e => `${e.subject} (${e.class})`).join('\n');
          rowData.push(text);
        }
        
        // Add break cell if needed
        const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
        if (breakAfterThis) {
          if (dayIndex === 0) {
            // First row gets the merged cell with break text
            const breakText = breakAfterThis.type.split(' ').join('\n');
            rowData.push({
              content: breakText,
              rowSpan: DAYS.length,
              styles: {
                fillColor: breakAfterThis.type === 'LUNCH BREAK' ? [255, 243, 205] : 
                           breakAfterThis.type === 'LONG BREAK' ? [219, 234, 254] : 
                           [220, 252, 231],
                textColor: breakAfterThis.type === 'LUNCH BREAK' ? [146, 64, 14] : 
                           breakAfterThis.type === 'LONG BREAK' ? [30, 64, 175] : 
                           [22, 101, 52],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 6,
                cellWidth: 10,
              }
            });
          }
          // Other rows skip the merged cell
        }
      }
      
      tableData.push(rowData);
    });
    
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
