import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, AlertCircle, Download, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { generateSingleTeacherPDF, generateAllTeachersPDF } from '../../utils/teacherSchedulePdfGenerator';
import allTeachersScheduleService from '../../services/allTeachersScheduleService';
import type { TeacherSchedule, TimeSlot } from '../../services/allTeachersScheduleService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
      
      // Expand all teachers by default
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
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  const expandAll = () => {
    setExpandedTeachers(new Set(filteredTeachers.map(t => t.teacher_id)));
  };

  const collapseAll = () => {
    setExpandedTeachers(new Set());
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacher_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = (teacher: TeacherSchedule) => {
    generateSingleTeacherPDF(teacher, timeslots);
  };

  const downloadAllPDF = () => {
    generateAllTeachersPDF(filteredTeachers, timeslots);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Teachers Schedules</h1>
              <p className="text-gray-600 text-sm">View and manage schedules for all teachers</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={downloadAllPDF}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All (PDF)
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Teachers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{teachers.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Working Days</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{DAYS.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Time Slots</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{timeslots.length}</p>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-between cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                onClick={() => toggleTeacher(teacher.teacher_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {teacher.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{teacher.teacher_name}</h3>
                    <p className="text-sm text-gray-600">{teacher.teacher_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(teacher);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    PDF
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
                <div className="p-4 overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 bg-blue-600 text-white p-3 text-left font-semibold sticky left-0 z-10">
                          Day
                        </th>
                        {timeslots.map((timeslot) => (
                          <th
                            key={timeslot.time_slot}
                            className="border border-gray-300 bg-blue-600 text-white p-3 text-center font-semibold min-w-[150px]"
                          >
                            <div className="text-sm">
                              {timeslot.start_time}
                            </div>
                            <div className="text-xs font-normal opacity-90">
                              {timeslot.end_time}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day) => (
                        <tr key={day} className="hover:bg-gray-50">
                          <td className="border border-gray-300 bg-blue-50 p-3 font-semibold text-gray-900 sticky left-0 z-10">
                            {day}
                          </td>
                          {timeslots.map((timeslot) => {
                            const entries = teacher.schedule[day]?.[timeslot.time_slot] || [];
                            
                            return (
                              <td
                                key={timeslot.time_slot}
                                className={`border border-gray-300 p-2 text-center align-middle ${
                                  entries.length > 0 ? 'bg-green-50' : 'bg-white'
                                }`}
                              >
                                {entries.length === 0 ? (
                                  <span className="text-gray-400 text-sm">-</span>
                                ) : entries.length === 1 ? (
                                  <div className="space-y-1">
                                    <div className="font-semibold text-gray-900 text-sm">
                                      {entries[0].subject_abbreviation || entries[0].subject}
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
                                          {entry.subject_abbreviation || entry.subject}
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
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllTeachersSchedules;
