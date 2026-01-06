import { useState, useEffect } from 'react';
import { APIService } from '../../../services/baseUrl';
import type { Subject } from '../../../types/subjects';
import type { TimeSlot } from '../../../types/timetable';
import type { Teacher } from '../../../types/priorities';

interface AddPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; time_slots: string[]; teacher?: string | null }) => Promise<void>;
}

export default function AddPriorityModal({ isOpen, onClose, onSubmit }: AddPriorityModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [filteredTimeSlots, setFilteredTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingTeacherClasses, setLoadingTeacherClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  // Load teachers when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadTeachersForSubject(selectedSubject);
    } else {
      setTeachers([]);
      setSelectedTeacher(null);
    }
  }, [selectedSubject]);

  // Filter timeslots when teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      loadTimeslotsForTeacher(selectedTeacher);
    } else {
      // Show all timeslots if no teacher selected
      setFilteredTimeSlots(timeSlots);
    }
    // Reset selected timeslots when teacher changes
    setSelectedTimeSlots([]);
  }, [selectedTeacher, timeSlots]);

  const formatTime = (time: string) => {
    // Remove seconds from time (HH:MM:SS -> HH:MM)
    return time.substring(0, 5);
  };

  const loadDropdownData = async () => {
    setLoadingData(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      
      // Load subjects - use staff endpoint for staff, regular endpoint for school
      const subjectsEndpoint = authType === 'staff' ? '/api/staff/subjects/' : '/api/subjects/';
      const subjectsResponse = await APIService.get(subjectsEndpoint, { page: '1', page_size: '10000' }, authType);
      
      // Handle different response structures
      if (subjectsResponse.results) {
        setSubjects(subjectsResponse.results);
      } else if (Array.isArray(subjectsResponse)) {
        setSubjects(subjectsResponse);
      } else {
        setSubjects([]);
      }
      
      // Load time slots
      const timeSlotsResponse = await APIService.get('/api/timetable/time-slots/', { page: '1', page_size: '10000' }, authType);
      
      // Handle different response structures
      let loadedTimeSlots: TimeSlot[] = [];
      if (timeSlotsResponse.results) {
        loadedTimeSlots = timeSlotsResponse.results;
      } else if (Array.isArray(timeSlotsResponse)) {
        loadedTimeSlots = timeSlotsResponse;
      }
      setTimeSlots(loadedTimeSlots);
      setFilteredTimeSlots(loadedTimeSlots);
      
      
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      alert('Failed to load subjects and time slots. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const loadTeachersForSubject = async (subjectId: string) => {
    setLoadingTeachers(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      console.log('Fetching teachers for subject ID:', subjectId, 'authType:', authType);
      
      const response = await APIService.get(`/api/priorities/teachers-by-subject/${subjectId}/`, {}, authType);
      console.log('Teachers API response:', response);
      
      // Handle different response formats
      if (response?.results && Array.isArray(response.results)) {
        console.log('Found teachers:', response.results);
        setTeachers(response.results);
      } else if (Array.isArray(response)) {
        console.log('Response is array:', response);
        setTeachers(response);
      } else {
        console.log('No teachers found in response');
        setTeachers([]);
      }
    } catch (error) {
      console.error('Failed to load teachers for subject:', error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadTimeslotsForTeacher = async (teacherId: string) => {
    setLoadingTeacherClasses(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      
      // Get classes that this teacher teaches
      const response = await APIService.get(`/api/staff-profile/assignments/`, { staff: teacherId }, authType);
      
      // Extract unique class IDs from assignments
      const classIds = new Set<string>();
      const assignments = response?.results || response || [];
      
      if (Array.isArray(assignments)) {
        assignments.forEach((assignment: any) => {
          if (assignment.class_assigned_details?.id) {
            classIds.add(assignment.class_assigned_details.id);
          } else if (assignment.class_assigned) {
            classIds.add(assignment.class_assigned);
          }
        });
      }
      
      // Get timeslots from ClassSchedule for those classes
      if (classIds.size > 0) {
        const classScheduleResponse = await APIService.get('/api/timetable/class-schedules/', { page: '1', page_size: '10000' }, authType);
        const schedules = classScheduleResponse?.results || classScheduleResponse || [];
        
        // Get unique timeslot IDs used by the teacher's classes
        const timeslotIds = new Set<string>();
        if (Array.isArray(schedules)) {
          schedules.forEach((schedule: any) => {
            if (classIds.has(schedule.class_assigned) && schedule.time_slot) {
              timeslotIds.add(schedule.time_slot);
            }
          });
        }
        
        // Filter to only timeslots used by teacher's classes
        const filtered = timeSlots.filter(slot => timeslotIds.has(slot.id));
        setFilteredTimeSlots(filtered.length > 0 ? filtered : timeSlots);
      } else {
        setFilteredTimeSlots(timeSlots);
      }
    } catch (error) {
      console.error('Failed to load timeslots for teacher:', error);
      setFilteredTimeSlots(timeSlots);
    } finally {
      setLoadingTeacherClasses(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedTeacher(null); // Reset teacher when subject changes
    setSelectedTimeSlots([]); // Reset timeslots when subject changes
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  const handleSelectAllTimeSlots = () => {
    if (selectedTimeSlots.length === filteredTimeSlots.length) {
      setSelectedTimeSlots([]);
    } else {
      setSelectedTimeSlots(filteredTimeSlots.map(slot => slot.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (selectedTimeSlots.length === 0) {
      setErrors({ time_slot: ['Please select at least one time slot'] });
      return;
    }
    
    setLoading(true);

    try {
      // Submit all selected timeslots in a single bulk request
      await onSubmit({
        subject: selectedSubject,
        time_slots: selectedTimeSlots,
        teacher: selectedTeacher || null,
      });
      
      // Reset form
      setSelectedSubject('');
      setSelectedTimeSlots([]);
      setSelectedTeacher(null);
      setTeachers([]);
    } catch (error: any) {
      console.error('Error submitting priority:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.message || 'Failed to add priority. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSubject('');
    setSelectedTimeSlots([]);
    setSelectedTeacher(null);
    setTeachers([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Subject Priority</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name} {subject.subject_code && `(${subject.subject_code})`}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject[0]}</p>
                )}
              </div>

              {/* Teacher (Optional - shown after subject is selected) */}
              {selectedSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher <span className="text-gray-400">(Optional)</span>
                  </label>
                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading teachers...</span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedTeacher || ''}
                        onChange={(e) => setSelectedTeacher(e.target.value || null)}
                        className={`block w-full px-3 py-2 border ${
                          errors.teacher ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        disabled={loading}
                      >
                        <option value="">All Teachers (applies to all classes)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name} ({teacher.email})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedTeacher 
                          ? "Priority will only apply to classes taught by this teacher" 
                          : "Priority will apply to all classes for this subject"}
                      </p>
                    </>
                  )}
                  {errors.teacher && (
                    <p className="mt-1 text-sm text-red-600">{errors.teacher[0]}</p>
                  )}
                </div>
              )}

              {/* Time Slots (Checkboxes for bulk selection) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Time Slots <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllTimeSlots}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    disabled={loading || loadingTeacherClasses}
                  >
                    {selectedTimeSlots.length === filteredTimeSlots.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {loadingTeacherClasses ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading timeslots...</span>
                  </div>
                ) : (
                  <div className={`max-h-48 overflow-y-auto border ${
                    errors.time_slot ? 'border-red-300' : 'border-gray-300'
                  } rounded-md p-2 space-y-1`}>
                    {filteredTimeSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No time slots available</p>
                    ) : (
                      filteredTimeSlots.map((slot) => (
                        <label
                          key={slot.id}
                          className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            selectedTimeSlots.includes(slot.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTimeSlots.includes(slot.id)}
                            onChange={() => handleTimeSlotToggle(slot.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={loading}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {selectedTimeSlots.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedTimeSlots.length} time slot{selectedTimeSlots.length > 1 ? 's' : ''} selected
                  </p>
                )}
                {errors.time_slot && (
                  <p className="mt-1 text-sm text-red-600">{errors.time_slot[0]}</p>
                )}
              </div>

              {/* Display general errors */}
              {errors.non_field_errors && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.non_field_errors[0]}</p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || loadingData}
            >
              {loading ? 'Adding...' : 'Add Priority'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
