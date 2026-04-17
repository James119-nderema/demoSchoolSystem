import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, User, Clock, AlertCircle, Sparkles, Download, RefreshCw, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import timetableGenerationService from '../../../services/timetableGenerationService';
import { generateAllClassesPDF } from '../../../utils/classTimetablePdfGenerator';
import type { TimetableByClass, TeacherIndexInfo, BlockInfo } from '../../../types/generatedTimetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TimetableView: React.FC = () => {
  const [timetables, setTimetables] = useState<TimetableByClass[]>([]);
  const [teachers, setTeachers] = useState<TeacherIndexInfo[]>([]);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingClass, setGeneratingClass] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timetableGenerationService.getTimetableByClass();
      setTimetables(response.results);
      setTeachers(response.teachers || []);
      setBlocks(response.blocks || []);
      if (response.results.length > 0) {
        setExpandedClasses(new Set(response.results.map(c => c.class_id)));
      }
    } catch (err: any) {
      console.error('Error fetching timetables:', err);
      setError(err.response?.data?.error || 'Failed to load timetables');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('This will clear existing timetables and generate new ones. Continue?')) return;
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await timetableGenerationService.generateTimetableWithPolling(
        (status) => { if (status.elapsed_seconds) console.log(`Generation in progress... ${status.elapsed_seconds}s elapsed`); },
        2000, 600000
      );
      setSuccessMessage(
        result.data
          ? `Timetable generated successfully! ${result.data.filled} of ${result.data.total_slots} slots filled. ${result.data.failed} failed.`
          : 'Timetable generated successfully!'
      );
      await fetchTimetables();
    } catch (err: any) {
      console.error('Error generating timetable:', err);
      setError(err.message || err.response?.data?.error || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateClass = async (classId: string, className: string) => {
    if (!confirm(`This will regenerate the timetable for ${className} only. Teachers' schedules from other classes will be respected. Continue?`)) return;
    setGeneratingClass(prev => ({ ...prev, [classId]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await timetableGenerationService.generateClassTimetableWithPolling(
        classId,
        (status) => { if (status.elapsed_seconds) console.log(`Class generation in progress... ${status.elapsed_seconds}s elapsed`); },
        2000, 600000
      );
      setSuccessMessage(
        result.data
          ? `Timetable regenerated for ${className}! ${result.data.filled} of ${result.data.total_slots} slots filled.`
          : `Timetable regenerated for ${className} successfully!`
      );
      await fetchTimetables();
    } catch (err: any) {
      console.error('Error generating class timetable:', err);
      setError(err.message || err.response?.data?.error || `Failed to generate timetable for ${className}`);
    } finally {
      setGeneratingClass(prev => ({ ...prev, [classId]: false }));
    }
  };

  const getTimeslots = (classTimetable: TimetableByClass['timetable']) => {
    const timeslotSet = new Set<string>();
    Object.values(classTimetable).forEach(daySchedule => {
      Object.keys(daySchedule).forEach(slot => timeslotSet.add(slot));
    });
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
    if (timetables.length === 0) { alert('No timetables to download'); return; }
    generateAllClassesPDF(timetables, teachers, blocks);
  };

  const toggleClass = (classId: string) => {
    const next = new Set(expandedClasses);
    if (next.has(classId)) next.delete(classId); else next.add(classId);
    setExpandedClasses(next);
  };

  const getDisplayName = (entry: TimetableByClass['timetable'][string][string]) => {
    if (entry.is_block && entry.block_name) return entry.block_name;
    return entry.subject_abbreviation || entry.subject_name;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Timetable View</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">View generated timetables for all classes</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {timetables.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={generating || loading}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 md:py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm md:text-base"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Download All</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span className="hidden sm:inline">Generate Timetable</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
        {successMessage && (
          <div className="mb-4 p-3 md:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2 text-sm md:text-base">
            <AlertCircle size={18} />
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 md:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2 text-sm md:text-base">
            <AlertCircle size={18} />
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 md:p-12 text-center border-2 border-dashed border-blue-200">
          <div className="bg-white rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-md">
            <Calendar size={36} className="text-blue-500" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">No Timetables Generated</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm md:text-base">
            Click "Generate Timetable" to create timetables for all classes using the MinConflict algorithm.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 inline-flex items-center gap-2 font-semibold shadow-lg"
          >
            <Sparkles size={20} />
            Generate Timetable
          </button>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {timetables.map((classData) => {
            const timeslots = getTimeslots(classData.timetable);
            const isExpanded = expandedClasses.has(classData.class_id);

            return (
              <div key={classData.class_id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Class Header */}
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleClass(classData.class_id)}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-2xl font-bold text-white">{classData.class_name}</h2>
                    {isExpanded ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGenerateClass(classData.class_id, classData.class_name); }}
                    disabled={generating || generatingClass[classData.class_id]}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold transition-all duration-200 backdrop-blur-sm border border-white/30"
                  >
                    {generatingClass[classData.class_id] ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Regenerate</span>
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <>
                    {/* Desktop Timetable Grid */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 sticky left-0 bg-gray-100 z-10">Day</th>
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
                                      <div className={`${entry.is_block ? 'bg-purple-50 border-l-4 border-purple-500' : 'bg-blue-50 border-l-4 border-blue-500'} rounded p-3 hover:opacity-90 transition-colors`}>
                                        <div className="flex items-start gap-2 mb-1">
                                          {entry.is_block ? (
                                            <Layers size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                          ) : (
                                            <BookOpen size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                          )}
                                          <span className={`font-bold text-sm leading-tight ${entry.is_block ? 'text-purple-900' : 'text-blue-900'}`}>
                                            {getDisplayName(entry)}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2 ml-6">
                                          <User size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-gray-700 text-xs leading-tight">{entry.teacher_name}</span>
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

                    {/* Mobile Card View */}
                    <div className="md:hidden p-3 space-y-3">
                      {DAYS.map(day => {
                        const dayEntries = timeslots
                          .map(ts => ({ timeslot: ts, entry: classData.timetable[day]?.[ts] }))
                          .filter(item => item.entry);
                        if (dayEntries.length === 0) return null;
                        return (
                          <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-blue-600" />
                                <span className="font-bold text-gray-900 text-sm">{day}</span>
                                <span className="text-xs text-gray-500 ml-auto">{dayEntries.length} period{dayEntries.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {dayEntries.map(({ timeslot, entry }) => (
                                <div key={timeslot} className="px-4 py-3 flex items-center gap-3">
                                  <div className="text-xs text-gray-500 font-mono w-24 flex-shrink-0">{timeslot}</div>
                                  <div className={`flex-1 pl-3 ${entry!.is_block ? 'border-l-[3px] border-purple-500' : 'border-l-[3px] border-blue-500'}`}>
                                    <div className="flex items-center gap-1.5">
                                      {entry!.is_block && <Layers size={13} className="text-purple-600 flex-shrink-0" />}
                                      <span className={`font-semibold text-sm ${entry!.is_block ? 'text-purple-900' : 'text-gray-900'}`}>
                                        {getDisplayName(entry!)}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">{entry!.teacher_name}</span>
                                  </div>
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
            );
          })}

          {/* Block Subject Legend */}
          {blocks.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6">
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                Block Subjects Key
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {blocks.map((block) => (
                  <div key={block.identifier} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="font-semibold text-purple-900 text-sm mb-1.5">{block.block_name}</div>
                    <div className="space-y-0.5">
                      {block.subjects.map((subj) => (
                        <div key={subj.id} className="text-xs text-purple-700">• {subj.name} ({subj.abbreviation})</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimetableView;
