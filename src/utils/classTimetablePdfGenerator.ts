import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TimetableByClass, TeacherIndexInfo } from '../types/generatedTimetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TimeSlotInfo {
  time_slot: string;
  start_time: string;
  end_time: string;
}

interface BreakInfo {
  afterSlotIndex: number;
  durationMinutes: number;
  type: 'SHORT BREAK' | 'LONG BREAK' | 'LUNCH BREAK';
}

/**
 * Helper function to parse time string to minutes since midnight
 */
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

/**
 * Calculate breaks between time slots
 */
const calculateBreaks = (timeslots: TimeSlotInfo[]): BreakInfo[] => {
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
 * Extract unique time slots from timetable data and sort them
 */
const extractTimeslots = (timetables: TimetableByClass[]): TimeSlotInfo[] => {
  const timeslotMap = new Map<string, TimeSlotInfo>();
  
  timetables.forEach(classData => {
    Object.values(classData.timetable).forEach(daySchedule => {
      Object.entries(daySchedule).forEach(([timeslot, entry]) => {
        if (!timeslotMap.has(timeslot)) {
          timeslotMap.set(timeslot, {
            time_slot: timeslot,
            start_time: entry.start_time,
            end_time: entry.end_time
          });
        }
      });
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
 * Format time string (HH:MM:SS -> HH:MM)
 */
const formatTime = (time: string): string => {
  return time.substring(0, 5);
};

/**
 * Generate PDF for a single class timetable
 */
export const generateSingleClassPDF = (
  classData: TimetableByClass,
  timeslots: TimeSlotInfo[],
  teachers: TeacherIndexInfo[]
): void => {
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Class Timetable - ${classData.class_name}`, 14, 15);
  
  // Calculate breaks
  const breaks = calculateBreaks(timeslots);
  
  // Build headers with break columns
  const headers: string[] = ['Day'];
  for (let i = 0; i < timeslots.length; i++) {
    headers.push(`${formatTime(timeslots[i].start_time)}\n${formatTime(timeslots[i].end_time)}`);
    const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
    if (breakAfterThis) {
      headers.push(''); // Empty header for break column
    }
  }
  
  // Build teacher index lookup
  const teacherIndexMap = new Map<string, number>();
  teachers.forEach(t => teacherIndexMap.set(t.id, t.index));
  
  // Collect teachers used in this class's timetable
  const teachersInClass = new Set<string>();
  
  // Prepare table data with break columns
  const tableData: any[][] = [];
  
  DAYS.forEach((day, dayIndex) => {
    const rowData: any[] = [day];
    
    for (let i = 0; i < timeslots.length; i++) {
      const entry = classData.timetable[day]?.[timeslots[i].time_slot];
      
      if (entry) {
        const teacherIndex = entry.teacher_index ?? teacherIndexMap.get(entry.teacher_id) ?? 0;
        teachersInClass.add(entry.teacher_id);
        rowData.push(`${entry.subject_name}\n(T${teacherIndex})`);
      } else {
        rowData.push('-');
      }
      
      // Add break cell if needed
      const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
      if (breakAfterThis) {
        if (dayIndex === 0) {
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
      }
    }
    
    tableData.push(rowData);
  });
  
  // Calculate row height
  const pageHeight = doc.internal.pageSize.height;
  const startY = 25;
  const bottomMargin = 40; // Leave room for teacher key
  const availableHeight = pageHeight - startY - bottomMargin;
  const rowHeight = (availableHeight * 0.6) / DAYS.length;
  
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      minCellHeight: rowHeight,
      valign: 'middle',
      halign: 'center',
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      minCellHeight: 12,
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: {
        cellWidth: 25,
        fontStyle: 'bold',
        halign: 'center',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
      },
    },
    margin: { left: 10, right: 10, top: startY, bottom: bottomMargin },
    tableWidth: 'auto',
  });
  
  // Add teacher key at the bottom
  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  addTeacherKey(doc, teachers.filter(t => teachersInClass.has(t.id)), finalY + 10);
  
  // Save the PDF
  const filename = `timetable_${classData.class_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Add teacher key/legend to the PDF
 */
const addTeacherKey = (doc: jsPDF, teachers: TeacherIndexInfo[], startY: number): void => {
  if (teachers.length === 0) return;
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 10;
  const columnWidth = (pageWidth - 2 * margin) / 3; // 3 columns
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher Key:', margin, startY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  let currentY = startY + 6;
  let currentColumn = 0;
  
  // Sort by index
  const sortedTeachers = [...teachers].sort((a, b) => a.index - b.index);
  
  sortedTeachers.forEach((teacher) => {
    const x = margin + (currentColumn * columnWidth);
    const text = `T${teacher.index}: ${teacher.name}`;
    
    doc.text(text, x, currentY);
    
    currentColumn++;
    if (currentColumn >= 3) {
      currentColumn = 0;
      currentY += 5;
    }
  });
};

/**
 * Generate a single PDF containing all class timetables
 */
export const generateAllClassesPDF = (
  timetables: TimetableByClass[],
  teachers?: TeacherIndexInfo[]
): void => {
  if (timetables.length === 0) {
    alert('No timetables to download');
    return;
  }

  const doc = new jsPDF('landscape');
  const timeslots = extractTimeslots(timetables);
  const breaks = calculateBreaks(timeslots);
  
  // Build headers with break columns
  const headers: string[] = ['Day'];
  for (let i = 0; i < timeslots.length; i++) {
    headers.push(`${formatTime(timeslots[i].start_time)}\n${formatTime(timeslots[i].end_time)}`);
    const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
    if (breakAfterThis) {
      headers.push('');
    }
  }
  
  // Build teacher index lookup
  const teacherIndexMap = new Map<string, number>();
  const allTeachers = teachers || [];
  allTeachers.forEach(t => teacherIndexMap.set(t.id, t.index));
  
  timetables.forEach((classData, index) => {
    // Add new page for each class after the first
    if (index > 0) {
      doc.addPage();
    }
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Class Timetable - ${classData.class_name}`, 14, 15);
    
    // Add page number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${index + 1} of ${timetables.length}`, doc.internal.pageSize.width - 40, 15);
    
    // Collect teachers used in this class
    const teachersInClass = new Set<string>();
    
    // Prepare table data with break columns
    const tableData: any[][] = [];
    
    DAYS.forEach((day, dayIndex) => {
      const rowData: any[] = [day];
      
      for (let i = 0; i < timeslots.length; i++) {
        const entry = classData.timetable[day]?.[timeslots[i].time_slot];
        
        if (entry) {
          const teacherIndex = entry.teacher_index ?? teacherIndexMap.get(entry.teacher_id) ?? 0;
          teachersInClass.add(entry.teacher_id);
          rowData.push(`${entry.subject_name}\n(T${teacherIndex})`);
        } else {
          rowData.push('-');
        }
        
        // Add break cell if needed
        const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
        if (breakAfterThis) {
          if (dayIndex === 0) {
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
        }
      }
      
      tableData.push(rowData);
    });
    
    // Calculate row height
    const pageHeight = doc.internal.pageSize.height;
    const startY = 25;
    const bottomMargin = 40;
    const availableHeight = pageHeight - startY - bottomMargin;
    const rowHeight = (availableHeight * 0.6) / DAYS.length;
    
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: rowHeight,
        valign: 'middle',
        halign: 'center',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        minCellHeight: 12,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: {
          cellWidth: 25,
          fontStyle: 'bold',
          halign: 'center',
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
        },
      },
      margin: { left: 10, right: 10, top: startY, bottom: bottomMargin },
      tableWidth: 'auto',
    });
    
    // Add teacher key at the bottom
    const finalY = (doc as any).lastAutoTable?.finalY || 120;
    const teachersForClass = allTeachers.filter(t => teachersInClass.has(t.id));
    addTeacherKey(doc, teachersForClass, finalY + 10);
  });
  
  // Save the PDF
  doc.save('all_classes_timetables.pdf');
};

