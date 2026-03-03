import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, BookOpen, Clock, User, AlertCircle, TrendingUp, Download, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import teacherTimetableService from '../../services/teacherTimetableService';
import type { TimetableEntry, TimeSlot, TeacherStatsResponse } from '../../services/teacherTimetableService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/** Get display name for entry - shows block name for block subjects */
const getEntryDisplay = (entry: TimetableEntry) => {
  if (entry.is_block && entry.block_name) return entry.block_name;
  return entry.subject_abbreviation || entry.subject;
};

const TeacherTimetableView: React.FC = () => {
  const [timetable, setTimetable] = useState<{
    [day: string]: { [timeSlot: string]: TimetableEntry[] };
  }>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [stats, setStats] = useState<TeacherStatsResponse['stats'] | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetable();
    fetchStats();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await teacherTimetableService.getMyTimetable();
      setTimetable(response.timetable);
      setTimeSlots(response.timeslots);
      setTeacherName(response.teacher_name);
    } catch (err: any) {
      console.error('Error fetching timetable:', err);
      setError(err.response?.data?.error || 'Failed to load your timetable');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await teacherTimetableService.getMyStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getCellContent = (day: string, timeSlot: string): TimetableEntry[] => {
    return timetable[day]?.[timeSlot] || [];
  };

  // Collect unique blocks for legend
  const blocksLegend = useMemo(() => {
    const blockMap = new Map<string, { block_name: string; subjects: Set<string> }>();
    Object.values(timetable).forEach(daySchedule => {
      Object.values(daySchedule).forEach(entries => {
        entries.forEach(entry => {
          if (entry.is_block && entry.block_identifier && entry.block_name) {
            if (!blockMap.has(entry.block_identifier)) {
              blockMap.set(entry.block_identifier, { block_name: entry.block_name, subjects: new Set() });
            }
            blockMap.get(entry.block_identifier)!.subjects.add(entry.subject_abbreviation || entry.subject);
          }
        });
      });
    });
    return Array.from(blockMap.entries()).map(([id, data]) => ({
      identifier: id,
      block_name: data.block_name,
      subjects: Array.from(data.subjects)
    }));
  }, [timetable]);

  const parseTimeToMinutes = (timeStr: string): number => {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    const timeOnly = cleanTime.replace(/\s*(AM|PM)\s*/i, '');
    const parts = timeOnly.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);
    if (isPM && hours !== 12) hours += 12;
    else if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  interface BreakInfo {
    afterSlotIndex: number;
    durationMinutes: number;
    type: 'SHORT BREAK' | 'LONG BREAK' | 'LUNCH BREAK';
  }

  const calculateBreaks = (): BreakInfo[] => {
    if (timeSlots.length < 2) return [];
    const gaps: { afterSlotIndex: number; durationMinutes: number }[] = [];
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const currentEndTime = parseTimeToMinutes(timeSlots[i].end_time);
      const nextStartTime = parseTimeToMinutes(timeSlots[i + 1].start_time);
      const gap = nextStartTime - currentEndTime;
      if (gap > 2) gaps.push({ afterSlotIndex: i, durationMinutes: gap });
    }
    if (gaps.length === 0) return [];
    const sortedGaps = [...gaps].sort((a, b) => a.durationMinutes - b.durationMinutes);
    return gaps.map(gap => {
      const rank = sortedGaps.findIndex(g => g.afterSlotIndex === gap.afterSlotIndex && g.durationMinutes === gap.durationMinutes);
      let breakType: 'SHORT BREAK' | 'LONG BREAK' | 'LUNCH BREAK';
      if (sortedGaps.length === 1) {
        breakType = gap.durationMinutes <= 15 ? 'SHORT BREAK' : gap.durationMinutes <= 30 ? 'LONG BREAK' : 'LUNCH BREAK';
      } else if (sortedGaps.length === 2) {
        breakType = rank === 0 ? 'SHORT BREAK' : 'LUNCH BREAK';
      } else {
        breakType = rank < sortedGaps.length / 3 ? 'SHORT BREAK' : rank < (sortedGaps.length * 2) / 3 ? 'LONG BREAK' : 'LUNCH BREAK';
      }
      return { afterSlotIndex: gap.afterSlotIndex, durationMinutes: gap.durationMinutes, type: breakType };
    });
  };

  const downloadTimetablePDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('My Teaching Timetable', 14, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Teacher: ${teacherName}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    const breaks = calculateBreaks();
    const headers: string[] = ['Day'];
    for (let i = 0; i < timeSlots.length; i++) {
      headers.push(timeSlots[i].time_slot);
      if (breaks.find(b => b.afterSlotIndex === i)) headers.push('');
    }

    const rows: (string | { content: string; rowSpan?: number; styles?: object })[][] = [];
    DAYS.forEach((day, dayIndex) => {
      const row: (string | { content: string; rowSpan?: number; styles?: object })[] = [day];
      for (let i = 0; i < timeSlots.length; i++) {
        const slot = timeSlots[i];
        const entries = getCellContent(day, slot.time_slot);
        if (entries.length > 0) {
          // For block subjects, show block name; for multiple block entries, show block name header
          if (entries.length > 1 && entries[0].is_block && entries[0].block_name) {
            const cellContent = `${entries[0].block_name}\n${entries.map(e => `${e.subject_abbreviation || e.subject} (${e.class})`).join('\n')}`;
            row.push(cellContent);
          } else {
            const cellContent = entries
              .map(entry => `${getEntryDisplay(entry)}\n(${entry.class})`)
              .join('\n\n');
            row.push(cellContent);
          }
        } else {
          row.push('-');
        }
        const breakAfterThis = breaks.find(b => b.afterSlotIndex === i);
        if (breakAfterThis) {
          if (dayIndex === 0) {
            const breakText = breakAfterThis.type.split(' ').join('\n');
            row.push({
              content: breakText,
              rowSpan: DAYS.length,
              styles: {
                fillColor: breakAfterThis.type === 'LUNCH BREAK' ? [255, 243, 205] : breakAfterThis.type === 'LONG BREAK' ? [219, 234, 254] : [220, 252, 231],
                textColor: breakAfterThis.type === 'LUNCH BREAK' ? [146, 64, 14] : breakAfterThis.type === 'LONG BREAK' ? [30, 64, 175] : [22, 101, 52],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 8,
                cellWidth: 15,
              }
            });
          }
        }
      }
      rows.push(row);
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [243, 244, 246] } },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { top: 40 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;

    // Add block legend to PDF
    if (blocksLegend.length > 0) {
      let legendY = finalY + 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Block Subjects Key:', 14, legendY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      legendY += 6;
      blocksLegend.forEach(block => {
        doc.text(`${block.block_name}: ${block.subjects.join(', ')}`, 14, legendY);
        legendY += 5;
      });
    }

    doc.setFontSize(10);
    doc.text(
      `Total Periods: ${stats?.total_periods || 0} | Classes: ${stats?.classes_taught || 0} | Subjects: ${stats?.subjects_taught || 0}`,
      14,
      (blocksLegend.length > 0 ? finalY + 12 + 6 + blocksLegend.length * 5 + 5 : finalY + 10)
    );
    doc.save(`${teacherName.replace(/\s+/g, '_')}_Timetable.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Timetable</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Timetable</h1>
          </div>
          <button
            onClick={downloadTimetablePDF}
            disabled={timeSlots.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            Download PDF
          </button>
        </div>
        <p className="text-gray-600 text-sm md:text-base">View your teaching schedule - {teacherName}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Total Periods</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total_periods}</p>
              </div>
              <div className="bg-blue-100 p-2 md:p-3 rounded-lg hidden sm:block">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Classes</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.classes_taught}</p>
              </div>
              <div className="bg-green-100 p-2 md:p-3 rounded-lg hidden sm:block">
                <User className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Subjects</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.subjects_taught}</p>
              </div>
              <div className="bg-purple-100 p-2 md:p-3 rounded-lg hidden sm:block">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600">Avg Per Day</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{(stats.total_periods / 5).toFixed(1)}</p>
              </div>
              <div className="bg-orange-100 p-2 md:p-3 rounded-lg hidden sm:block">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-blue-900 text-xs md:text-sm">
          This timetable shows only the classes and subjects you are assigned to teach.
        </p>
      </div>

      {/* Desktop Timetable */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 sticky left-0 bg-blue-600 z-10 min-w-[120px]">Day</th>
                {timeSlots.map((slot, idx) => (
                  <th key={idx} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[180px]">
                    <div className="text-sm font-bold">{slot.time_slot}</div>
                    <div className="text-xs font-normal opacity-90">{slot.start_time} - {slot.end_time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {DAYS.map((day, index) => (
                <tr key={day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-gradient-to-r from-gray-100 to-gray-50 z-10">
                    <div className="text-sm font-bold text-gray-900">{day}</div>
                  </td>
                  {timeSlots.map((slot, slotIdx) => {
                    const entries = getCellContent(day, slot.time_slot);
                    return (
                      <td key={`${day}-${slotIdx}`} className={`px-2 py-2 border border-gray-300 text-center align-middle ${entries.length > 0 ? 'bg-green-50' : 'bg-white'}`}>
                        {entries.length === 0 ? (
                          <span className="text-gray-400 text-sm">-</span>
                        ) : entries.length === 1 ? (
                          <div className="space-y-1">
                            <div className={`font-semibold text-sm ${entries[0].is_block ? 'text-purple-900' : 'text-gray-900'}`}>
                              {getEntryDisplay(entries[0])}
                            </div>
                            <div className="text-xs text-gray-600">{entries[0].class}</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {entries[0].is_block && entries[0].block_name && (
                              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mb-1 flex items-center justify-center gap-1">
                                <Layers size={11} />
                                {entries[0].block_name}
                              </div>
                            )}
                            {entries.map((entry, idx) => (
                              <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                                <div className="font-semibold text-gray-900 text-sm">{entry.subject_abbreviation || entry.subject}</div>
                                <div className="text-xs text-gray-600">{entry.class}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {DAYS.map(day => {
          const daySlots = timeSlots
            .map(ts => ({ ts, entries: getCellContent(day, ts.time_slot) }))
            .filter(item => item.entries.length > 0);
          if (daySlots.length === 0) return null;
          return (
            <div key={day} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-600" />
                  <span className="font-bold text-gray-900 text-sm">{day}</span>
                  <span className="text-xs text-gray-500 ml-auto">{daySlots.length} period{daySlots.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {daySlots.map(({ ts, entries }) => (
                  <div key={ts.time_slot} className="px-4 py-3">
                    <div className="text-xs text-gray-500 font-mono mb-1.5">{ts.start_time} - {ts.end_time}</div>
                    {entries.length === 1 ? (
                      <div className={`pl-3 ${entries[0].is_block ? 'border-l-[3px] border-purple-500' : 'border-l-[3px] border-blue-500'}`}>
                        <div className="flex items-center gap-1.5">
                          {entries[0].is_block && <Layers size={13} className="text-purple-600 flex-shrink-0" />}
                          <span className={`font-semibold text-sm ${entries[0].is_block ? 'text-purple-900' : 'text-gray-900'}`}>
                            {getEntryDisplay(entries[0])}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{entries[0].class}</span>
                      </div>
                    ) : (
                      <div className="pl-3 border-l-[3px] border-purple-500 space-y-1.5">
                        {entries[0].is_block && entries[0].block_name && (
                          <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <Layers size={11} />
                            {entries[0].block_name}
                          </div>
                        )}
                        {entries.map((entry, idx) => (
                          <div key={idx}>
                            <span className="font-semibold text-sm text-gray-900">{entry.subject_abbreviation || entry.subject}</span>
                            <span className="text-xs text-gray-500 ml-1.5">({entry.class})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Subject Legend */}
      {blocksLegend.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
          <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Layers size={18} className="text-purple-600" />
            Block Subjects Key
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blocksLegend.map((block) => (
              <div key={block.identifier} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-semibold text-purple-900 text-sm mb-1.5">{block.block_name}</div>
                <div className="space-y-0.5">
                  {block.subjects.map((subj, idx) => (
                    <div key={idx} className="text-xs text-purple-700">• {subj}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">Subject Name</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">Class Name</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-gray-700">Free Period</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span className="text-gray-700">Block Subject</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {timeSlots.length === 0 && (
        <div className="mt-8 text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">Your timetable has not been generated yet or you have no assigned classes.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetableView;
