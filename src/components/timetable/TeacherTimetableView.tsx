import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Clock, User, AlertCircle, TrendingUp, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import teacherTimetableService from '../../services/teacherTimetableService';
import type { TimetableEntry, TimeSlot, TeacherStatsResponse } from '../../services/teacherTimetableService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TeacherTimetableView: React.FC = () => {
  const [timetable, setTimetable] = useState<{
    [day: string]: {
      [timeSlot: string]: TimetableEntry[];
    };
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

  const downloadTimetablePDF = () => {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('My Teaching Timetable', 14, 20);
    
    // Add teacher name and date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Teacher: ${teacherName}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);
    
    // Prepare table data with days as rows and time slots as columns
    const headers = ['Day', ...timeSlots.map(slot => slot.time_slot)];  // Changed from slot.slot to slot.time_slot
    
    const rows = DAYS.map(day => {
      const row = [day];
      timeSlots.forEach(slot => {
        const entries = getCellContent(day, slot.time_slot);  // Changed from slot.slot to slot.time_slot
        if (entries.length > 0) {
          const cellContent = entries
            .map(entry => `${entry.subject}\n(${entry.class})`)
            .join('\n\n');
          row.push(cellContent);
        } else {
          row.push('-');
        }
      });
      return row;
    });

    // Add table using autoTable
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [243, 244, 246] }, // First column (days) highlighted
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { top: 40 },
    });

    // Add footer with statistics
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(10);
    doc.text(
      `Total Periods: ${stats?.total_periods || 0} | Classes: ${stats?.classes_taught || 0} | Subjects: ${stats?.subjects_taught || 0}`,
      14,
      finalY + 10
    );

    // Save the PDF
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
      <div className="p-6">
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
          </div>
          <button
            onClick={downloadTimetablePDF}
            disabled={timeSlots.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
        <p className="text-gray-600">
          View your teaching schedule - {teacherName}
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Periods</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_periods}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.classes_taught}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.subjects_taught}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Per Day</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.total_periods / 5).toFixed(1)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 text-sm">
            This timetable shows only the classes and subjects you are assigned to teach. 
            The schedule is organized by days (columns) and time slots (rows).
          </p>
        </div>
      </div>

      {/* Timetable */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header */}
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500 sticky left-0 bg-blue-600 z-10 min-w-[120px]">
                  Day
                </th>
                {timeSlots.map((slot, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider min-w-[180px]"
                  >
                    <div className="text-sm font-bold">{slot.time_slot}</div>
                    <div className="text-xs font-normal opacity-90">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {DAYS.map((day, index) => (
                <tr key={day} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Day Column */}
                  <td className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-gradient-to-r from-gray-100 to-gray-50 z-10">
                    <div className="text-sm font-bold text-gray-900">{day}</div>
                  </td>

                  {/* Time Slot Columns */}
                  {timeSlots.map((slot, slotIdx) => {
                    const entries = getCellContent(day, slot.time_slot);
                    
                    return (
                      <td
                        key={`${day}-${slotIdx}`}
                        className={`px-2 py-2 border border-gray-300 text-center align-middle ${
                          entries.length > 0 ? 'bg-green-50' : 'bg-white'
                        }`}
                      >
                        {entries.length === 0 ? (
                          <span className="text-gray-400 text-sm">-</span>
                        ) : entries.length === 1 ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 text-sm">
                              {entries[0].subject}
                            </div>
                            <div className="text-xs text-gray-600">
                              {entries[0].class}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {entries[0].is_block && (
                              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mb-1">
                                Block Subject
                              </div>
                            )}
                            {entries.map((entry, idx) => (
                              <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                                <div className="font-semibold text-gray-900 text-sm">
                                  {entry.subject}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {entry.class}
                                </div>
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

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
        </div>
      </div>

      {/* Empty State */}
      {timeSlots.length === 0 && (
        <div className="mt-8 text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">
            Your timetable has not been generated yet or you have no assigned classes.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetableView;
