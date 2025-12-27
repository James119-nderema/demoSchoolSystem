import { useState, useEffect } from 'react';
import { APIService } from '../../../services/baseUrl';
import type { Subject } from '../../../types/subjects';
import type { TimeSlot } from '../../../types/timetable';
import type { SubjectPriority, Teacher } from '../../../types/priorities';

interface EditPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; time_slot: string; teacher?: string | null }) => Promise<void>;
  priority: SubjectPriority;
}

export default function EditPriorityModal({ isOpen, onClose, onSubmit, priority }: EditPriorityModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(priority.subject);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(priority.time_slot);
  const [selectedTeacher, setSelectedTeacher] = useState<string>(priority.teacher || '');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      setSelectedSubject(priority.subject);
      setSelectedTimeSlot(priority.time_slot);
      setSelectedTeacher(priority.teacher || '');
    }
  }, [isOpen, priority]);

  // Load teachers when subject changes or initially when editing
  useEffect(() => {
    if (selectedSubject && isOpen) {
      loadTeachersForSubject(selectedSubject);
    } else {
      setTeachers([]);
    }
  }, [selectedSubject, isOpen]);

  const loadTeachersForSubject = async (subjectId: string) => {
    setLoadingTeachers(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.get(`/api/priorities/teachers-by-subject/${subjectId}/`, {}, authType);
      
      // API returns { success: true, results: [...] }
      if (response?.results && Array.isArray(response.results)) {
        setTeachers(response.results);
      } else if (Array.isArray(response)) {
        setTeachers(response);
      } else {
        setTeachers([]);
      }
      
      // If editing and the current teacher is not in the list, clear it
      if (priority.teacher && subjectId !== priority.subject) {
        setSelectedTeacher('');
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubject(newSubjectId);
    // Clear teacher selection when subject changes
    if (newSubjectId !== priority.subject) {
      setSelectedTeacher('');
    }
  };

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
      if (timeSlotsResponse.results) {
        setTimeSlots(timeSlotsResponse.results);
      } else if (Array.isArray(timeSlotsResponse)) {
        setTimeSlots(timeSlotsResponse);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      alert('Failed to load subjects and time slots. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await onSubmit({
        subject: selectedSubject,
        time_slot: selectedTimeSlot,
        teacher: selectedTeacher || null,
      });
    } catch (error: any) {
      console.error('Error updating priority:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.message || 'Failed to update priority. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Edit Subject Priority</h3>
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
                  onChange={(e) => handleSubjectChange(e.target.value)}
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

              {/* Teacher (Optional) - Only show when subject is selected */}
              {selectedSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher <span className="text-gray-400">(Optional)</span>
                  </label>
                  {loadingTeachers ? (
                    <div className="flex items-center space-x-2 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-500">Loading teachers...</span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                        className={`block w-full px-3 py-2 border ${
                          errors.teacher ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        disabled={loading}
                      >
                        <option value="">All Teachers (Global Priority)</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name} ({teacher.email})
                          </option>
                        ))}
                      </select>
                      {teachers.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">No teachers assigned to this subject</p>
                      )}
                      {errors.teacher && (
                        <p className="mt-1 text-sm text-red-600">{errors.teacher[0]}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedTeacher 
                          ? "Priority will only apply to classes taught by this teacher"
                          : "Priority will apply to all classes for this subject"
                        }
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Time Slot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time Slot <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className={`block w-full px-3 py-2 border ${
                    errors.time_slot ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Time Slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </option>
                  ))}
                </select>
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
              {loading ? 'Updating...' : 'Update Priority'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
