import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, AlertCircle, Download, ChevronDown, ChevronUp, Search, Layers } from 'lucide-react';
import { generateSingleTeacherPDF, generateAllTeachersPDF } from '../../utils/teacherSchedulePdfGenerator';
import allTeachersScheduleService from '../../services/allTeachersScheduleService';
import type { TeacherSchedule, TimeSlot, ScheduleEntry } from '../../services/allTeachersScheduleService';
import { SkeletonList } from '../ui/Skeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/** Get display name for entry - shows block name for block subjects */
const getEntryDisplay = (entry: ScheduleEntry) => {
  if (entry.is_block && entry.block_name) return entry.block_name;
  return entry.subject_abbreviation || entry.subject;
};

const AllTeachersSchedules: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherSchedule[]>([]);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllTeachersSchedules();
  }, []);

  const fetchAllTeachersSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await allTeachersScheduleService.getAllTeachersSchedules();
      setTeachers(response.teachers);
      setTimeslots(response.timeslots);
      if (response.teachers.length > 0) {
        const allTeacherIds = response.teachers.map(t => t.teacher_id);
        setExpandedTeachers(new Set(allTeacherIds));
      }
    } catch (err: any) {
      console.error('Error fetching all teachers schedules:', err);
      setError(err.response?.data?.error || 'Failed to load teachers schedules');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = (teacherId: number) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) newExpanded.delete(teacherId);
    else newExpanded.add(teacherId);
    setExpandedTeachers(newExpanded);
  };

  const expandAll = () => setExpandedTeachers(new Set(filteredTeachers.map(t => t.teacher_id)));
  const collapseAll = () => setExpandedTeachers(new Set());

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacher_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = (teacher: TeacherSchedule) => generateSingleTeacherPDF(teacher, timeslots);
  const downloadAllPDF = () => generateAllTeachersPDF(filteredTeachers, timeslots);

  // Collect unique blocks from all teacher schedules for legend
  const blocksLegend = React.useMemo(() => {
    const blockMap = new Map<string, { block_name: string; subjects: Set<string> }>();
    teachers.forEach(t => {
      Object.values(t.schedule).forEach(daySchedule => {
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
    });
    return Array.from(blockMap.entries()).map(([id, data]) => ({
      identifier: id,
      block_name: data.block_name,
      subjects: Array.from(data.subjects)
    }));
  }, [teachers]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            All Teachers Schedules
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 flex-1 max-w-sm" />
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-36" />
        </div>
        <SkeletonList items={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-800">Error Loading Schedules</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Teachers Schedules</h1>
              <p className="text-gray-600 text-xs md:text-sm">View and manage schedules for all teachers</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={expandAll} className="flex-1 sm:flex-none px-3 py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Expand All
            </button>
            <button onClick={collapseAll} className="flex-1 sm:flex-none px-3 py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Collapse All
            </button>
            <button
              onClick={downloadAllPDF}
              className="flex-1 sm:flex-none px-3 py-2 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 md:gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download All (PDF)</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              <span className="text-xs md:text-sm text-gray-600">Teachers</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-blue-900">{teachers.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              <span className="text-xs md:text-sm text-gray-600">Days</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-green-900">{DAYS.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 md:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              <span className="text-xs md:text-sm text-gray-600">Slots</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-purple-900">{timeslots.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Teachers List */}
      <div className="space-y-4">
        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No teachers found matching your search.</p>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.teacher_id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Teacher Header */}
              <div
                className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                onClick={() => toggleTeacher(teacher.teacher_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
                    {teacher.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">{teacher.teacher_name}</h3>
                    <p className="text-xs md:text-sm text-gray-600 hidden sm:block">{teacher.teacher_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadPDF(teacher); }}
                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  {expandedTeachers.has(teacher.teacher_id) ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Teacher Timetable */}
              {expandedTeachers.has(teacher.teacher_id) && (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block p-4 overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 bg-blue-600 text-white p-3 text-left font-semibold sticky left-0 z-10">Day</th>
                          {timeslots.map((timeslot) => (
                            <th key={timeslot.time_slot} className="border border-gray-300 bg-blue-600 text-white p-3 text-center font-semibold min-w-[150px]">
                              <div className="text-sm">{timeslot.start_time}</div>
                              <div className="text-xs font-normal opacity-90">{timeslot.end_time}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS.map((day) => (
                          <tr key={day} className="hover:bg-gray-50">
                            <td className="border border-gray-300 bg-blue-50 p-3 font-semibold text-gray-900 sticky left-0 z-10">{day}</td>
                            {timeslots.map((timeslot) => {
                              const entries = teacher.schedule[day]?.[timeslot.time_slot] || [];
                              return (
                                <td key={timeslot.time_slot} className={`border border-gray-300 p-2 text-center align-middle ${entries.length > 0 ? 'bg-green-50' : 'bg-white'}`}>
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
                                          <div className="font-semibold text-gray-900 text-sm">
                                            {entry.subject_abbreviation || entry.subject}
                                          </div>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden p-3 space-y-3">
                    {DAYS.map(day => {
                      const daySlots = timeslots
                        .map(ts => ({ ts, entries: teacher.schedule[day]?.[ts.time_slot] || [] }))
                        .filter(item => item.entries.length > 0);
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
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
                                        <span className="font-semibold text-sm text-gray-900">
                                          {entry.subject_abbreviation || entry.subject}
                                        </span>
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
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Block Subject Legend */}
      {blocksLegend.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
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
    </div>
  );
};

export default AllTeachersSchedules;
