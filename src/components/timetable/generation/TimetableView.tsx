import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, User, Clock, AlertCircle, Sparkles, Download } from 'lucide-react';
import timetableGenerationService from '../../../services/timetableGenerationService';
import { generateAllClassesPDF } from '../../../utils/classTimetablePdfGenerator';
import type { TimetableByClass, TimetableStats, TeacherIndexInfo } from '../../../types/generatedTimetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableView: React.FC = () => {
  const [timetables, setTimetables] = useState<TimetableByClass[]>([]);
  const [teachers, setTeachers] = useState<TeacherIndexInfo[]>([]);
  const [stats, setStats] = useState<TimetableStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetables();
    fetchStats();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timetableGenerationService.getTimetableByClass();
      setTimetables(response.results);
      setTeachers(response.teachers || []);
    } catch (err: any) {
      console.error('Error fetching timetables:', err);
      setError(err.response?.data?.error || 'Failed to load timetables');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await timetableGenerationService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('This will clear existing timetables and generate new ones. Continue?')) {
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Use polling approach for long-running generation
      const result = await timetableGenerationService.generateTimetableWithPolling(
        (status) => {
          // Update UI with progress if needed
          if (status.elapsed_seconds) {
            console.log(`Generation in progress... ${status.elapsed_seconds}s elapsed`);
          }
        },
        2000, // Poll every 2 seconds
        600000 // Max 10 minutes
      );
      
      setSuccessMessage(
        result.data 
          ? `Timetable generated successfully! ${result.data.filled} of ${result.data.total_slots} slots filled. ${result.data.failed} failed.`
          : 'Timetable generated successfully!'
      );
      
      // Refresh data
      await fetchTimetables();
      await fetchStats();
    } catch (err: any) {
      console.error('Error generating timetable:', err);
      setError(err.message || err.response?.data?.error || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const getTimeslots = (classTimetable: TimetableByClass['timetable']) => {
    const timeslotSet = new Set<string>();
    
    Object.values(classTimetable).forEach(daySchedule => {
      Object.keys(daySchedule).forEach(slot => timeslotSet.add(slot));
    });
    
    // Sort by start time numerically
    return Array.from(timeslotSet).sort((a, b) => {
      const parseTime = (slot: string): number => {
        const startTime = slot.split('-')[0].replace(/\s+/g, '');
        const parts = startTime.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
      };
      return parseTime(a) - parseTime(b);
    });
  };

  const handleDownloadAll = () => {
    if (timetables.length === 0) {
      alert('No timetables to download');
      return;
    }
    generateAllClassesPDF(timetables, teachers);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timetable View</h1>
            <p className="text-gray-600 mt-1">
              View generated timetables for all classes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Download All Button */}
            {timetables.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={generating || loading}
                className="px-4 py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download size={20} />
                Download All
              </button>
            )}
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Timetable
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium uppercase">Total Entries</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_entries}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium uppercase">Classes Scheduled</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_classes_scheduled}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium uppercase">Failed Slots</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_failed}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>

      {/* Timetables */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : timetables.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-blue-200">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-md">
            <Calendar size={40} className="text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Timetables Generated</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Click the "Generate Timetable" button to create timetables for all classes using the MinConflict algorithm.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 inline-flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Sparkles size={20} />
            Generate Timetable
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {timetables.map((classData) => {
            const timeslots = getTimeslots(classData.timetable);

            return (
              <div key={classData.class_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Class Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white">{classData.class_name}</h2>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 sticky left-0 bg-gray-100 z-10">
                          Day
                        </th>
                        {timeslots.map(timeslot => (
                          <th key={timeslot} className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 min-w-[180px]">
                            <div className="flex items-center justify-center gap-2">
                              <Clock size={16} className="text-gray-400" />
                              {timeslot}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {DAYS.map(day => (
                        <tr key={day} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-300 sticky left-0 bg-white">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-600" />
                              {day}
                            </div>
                          </td>
                          {timeslots.map(timeslot => {
                            const entry = classData.timetable[day]?.[timeslot];
                            
                            return (
                              <td key={`${day}-${timeslot}`} className="px-3 py-3 border-r border-gray-200">
                                {entry ? (
                                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3 hover:bg-blue-100 transition-colors">
                                    <div className="flex items-start gap-2 mb-1">
                                      <BookOpen size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span className="font-bold text-blue-900 text-sm leading-tight">
                                        {entry.subject_name}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2 ml-6">
                                      <User size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700 text-xs leading-tight">
                                        {entry.teacher_name}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-gray-400 text-xs py-4">-</div>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimetableView;
