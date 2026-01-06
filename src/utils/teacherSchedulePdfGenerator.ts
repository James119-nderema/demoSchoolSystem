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
 * Normalize timeslot string for consistent comparison
 */
const normalizeTimeslot = (timeslot: string): string => {
  const parts = timeslot.replace(/\s+/g, '').split('-');
  if (parts.length !== 2) return timeslot;
  
  const normalizeTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(p => p.replace(/[^0-9]/g, ''));
    return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
  };
  
  return `${normalizeTime(parts[0])}-${normalizeTime(parts[1])}`;
};

/**
 * Extract only timeslots where the teacher has at least one entry across any day
 * This removes empty columns from the PDF
 */
const extractTeacherTimeslots = (teacher: TeacherSchedule): TimeSlot[] => {
  const timeslotMap = new Map<string, TimeSlot>();
  const seenTimeRanges = new Set<string>();
  
  // Go through all days and collect timeslots where teacher has entries
  DAYS.forEach(day => {
    const daySchedule = teacher.schedule[day];
    if (!daySchedule) return;
    
    Object.entries(daySchedule).forEach(([timeSlotKey, entries]) => {
      if (entries && entries.length > 0) {
        const normalizedSlot = normalizeTimeslot(timeSlotKey);
        const entry = entries[0]; // Use first entry for time info
        
        // Create unique key based on actual times to avoid duplicates
        const startTimeNorm = entry.start_time.substring(0, 5);
        const endTimeNorm = entry.end_time.substring(0, 5);
        const timeRangeKey = `${startTimeNorm}-${endTimeNorm}`;
        
        if (!seenTimeRanges.has(timeRangeKey)) {
          seenTimeRanges.add(timeRangeKey);
          timeslotMap.set(normalizedSlot, {
            time_slot: normalizedSlot,
            start_time: entry.start_time,
            end_time: entry.end_time,
            label: `${entry.start_time}-${entry.end_time}`
          });
        }
      }
    });
  });
  
  // Sort by start time
  return Array.from(timeslotMap.values()).sort((a, b) => {
    const aTime = parseTimeToMinutes(a.start_time);
    const bTime = parseTimeToMinutes(b.start_time);
    return aTime - bTime;
  });
};

/**
 * Generate PDF for a single teacher's schedule
 */
export const generateSingleTeacherPDF = (
  teacher: TeacherSchedule,
  _timeslots: TimeSlot[] // Kept for backward compatibility but we extract our own
): void => {
  const doc = new jsPDF('landscape');
  
  // Extract only timeslots where teacher has entries
  const teacherTimeslots = extractTeacherTimeslots(teacher);
  
  if (teacherTimeslots.length === 0) {
    doc.setFontSize(14);
    doc.text(`Timetable - ${teacher.teacher_name}`, 14, 15);
    doc.setFontSize(10);
    doc.text('No schedule entries found for this teacher.', 14, 30);
    const filename = `timetable_${teacher.teacher_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
    return;
  }
  
  // Add title
  doc.setFontSize(16);
  doc.text(`Timetable - ${teacher.teacher_name}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Email: ${teacher.teacher_email}`, 14, 22);
  
  // Calculate breaks from gaps between teacher's timeslots
  const breaks = calculateBreaks(teacherTimeslots);
  
  // Build headers with break columns
  const headers: string[] = ['Day'];
  for (let i = 0; i < teacherTimeslots.length; i++) {
    headers.push(`${teacherTimeslots[i].start_time.substring(0, 5)}\n${teacherTimeslots[i].end_time.substring(0, 5)}`);
    const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
    if (breakAfterThis) {
      headers.push(''); // Empty header for break column
    }
  }
  
  // Prepare table data with break columns
  const tableData: any[] = [];
  
  DAYS.forEach((day, dayIndex) => {
    const rowData: any[] = [day];
    
    for (let i = 0; i < teacherTimeslots.length; i++) {
      // Find entry matching this timeslot (check both exact and normalized)
      let entries: ScheduleEntry[] = [];
      const daySchedule = teacher.schedule[day];
      if (daySchedule) {
        // Try exact match first
        if (daySchedule[teacherTimeslots[i].time_slot]) {
          entries = daySchedule[teacherTimeslots[i].time_slot];
        } else {
          // Try to find by normalized comparison
          for (const [slotKey, slotEntries] of Object.entries(daySchedule)) {
            if (normalizeTimeslot(slotKey) === teacherTimeslots[i].time_slot) {
              entries = slotEntries;
              break;
            }
          }
        }
      }
      
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
          // First row gets the merged cell with break text - one letter per line
          const breakText = breakAfterThis.type.replace(' ', '').split('').join('\n');
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
              cellPadding: 1,
            }
          });
        }
        // Other rows skip the merged cell
      }
    }
    
    tableData.push(rowData);
  });
  
  // Calculate row height to occupy 60% of page (+30px increase)
  const pageHeight = doc.internal.pageSize.height;
  const startY = 28;
  const bottomMargin = 10;
  const availableHeight = pageHeight - startY - bottomMargin;
  const rowHeight = ((availableHeight * 0.6) / DAYS.length) + 6; // +6 points (~30px / 5 rows)
  
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
        fontSize: 10, // Larger font for day names
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
 * Each teacher page only shows timeslots where that teacher has entries
 */
export const generateAllTeachersPDF = (
  teachers: TeacherSchedule[],
  _timeslots: TimeSlot[] // Kept for backward compatibility
): void => {
  const doc = new jsPDF('landscape');
  let currentY = 15;
  
  teachers.forEach((teacher, index) => {
    // Add new page if not first teacher
    if (index > 0) {
      doc.addPage();
      currentY = 15;
    }
    
    // Extract only timeslots where this teacher has entries
    const teacherTimeslots = extractTeacherTimeslots(teacher);
    
    // Add title
    doc.setFontSize(14);
    doc.text(`${teacher.teacher_name}`, 14, currentY);
    doc.setFontSize(9);
    doc.text(`${teacher.teacher_email}`, 14, currentY + 6);
    
    if (teacherTimeslots.length === 0) {
      doc.setFontSize(10);
      doc.text('No schedule entries found for this teacher.', 14, currentY + 20);
      return;
    }
    
    // Calculate breaks from gaps between this teacher's timeslots
    const teacherBreaks = calculateBreaks(teacherTimeslots);
    
    // Build headers with break columns
    const headers: string[] = ['Day'];
    for (let i = 0; i < teacherTimeslots.length; i++) {
      headers.push(`${teacherTimeslots[i].start_time.substring(0, 5)}\n${teacherTimeslots[i].end_time.substring(0, 5)}`);
      const breakAfterThis = teacherBreaks.find(b => b.afterSlotIndex === i);
      if (breakAfterThis) {
        headers.push(''); // Empty header for break column
      }
    }
    
    // Prepare table data with break columns
    const tableData: any[] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const rowData: any[] = [day];
      
      for (let i = 0; i < teacherTimeslots.length; i++) {
        // Find entry matching this timeslot
        let entries: ScheduleEntry[] = [];
        const daySchedule = teacher.schedule[day];
        if (daySchedule) {
          if (daySchedule[teacherTimeslots[i].time_slot]) {
            entries = daySchedule[teacherTimeslots[i].time_slot];
          } else {
            for (const [slotKey, slotEntries] of Object.entries(daySchedule)) {
              if (normalizeTimeslot(slotKey) === teacherTimeslots[i].time_slot) {
                entries = slotEntries;
                break;
              }
            }
          }
        }
        
        if (entries.length === 0) {
          rowData.push('-');
        } else if (entries.length === 1) {
          rowData.push(`${entries[0].subject}\n(${entries[0].class})`);
        } else {
          const text = entries.map(e => `${e.subject} (${e.class})`).join('\n');
          rowData.push(text);
        }
        
        // Add break cell if needed
        const breakAfterThis = teacherBreaks.find(b => b.afterSlotIndex === i);
        if (breakAfterThis) {
          if (dayIndex === 0) {
            // First row gets the merged cell with break text - one letter per line
            const breakText = breakAfterThis.type.replace(' ', '').split('').join('\n');
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
                cellPadding: 1,
              }
            });
          }
          // Other rows skip the merged cell
        }
      }
      
      tableData.push(rowData);
    });
    
    // Calculate row height to occupy 60% of page (+30px increase)
    const pageHeight = doc.internal.pageSize.height;
    const startTableY = currentY + 20;
    const bottomMargin = 50;
    const availableHeight = pageHeight - startTableY - bottomMargin;
    const rowHeight = ((availableHeight * 0.6) / DAYS.length) + 6; // +6 points (~30px / 5 rows)
    
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
          fontSize: 9, // Larger font for day names
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
