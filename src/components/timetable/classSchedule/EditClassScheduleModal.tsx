import { useState, useEffect } from 'react';
import { APIService } from '../../../services/baseUrl';
import type { ClassSchedule } from '../../../types/classSchedule';

interface Class {
  id: string;
  class_name: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface EditClassScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { day_of_week?: string; class_name?: string; time_slot?: string }) => Promise<void>;
  schedule: ClassSchedule;
}

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function EditClassScheduleModal({ isOpen, onClose, onSubmit, schedule }: EditClassScheduleModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState(schedule.day_of_week);
  const [selectedClass, setSelectedClass] = useState(schedule.class_name);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(schedule.time_slot);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      setSelectedDay(schedule.day_of_week);
      setSelectedClass(schedule.class_name);
      setSelectedTimeSlot(schedule.time_slot);
    }
  }, [isOpen, schedule]);

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const loadDropdownData = async () => {
    setLoadingData(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      
      // Load classes
      const classesEndpoint = authType === 'staff' ? '/api/staff/classes/' : '/api/classes/';
      const classesResponse = await APIService.get(classesEndpoint, { page: '1', page_size: '10000' }, authType);
      
      if (classesResponse.results) {
        setClasses(classesResponse.results);
      } else if (Array.isArray(classesResponse)) {
        setClasses(classesResponse);
      } else {
        setClasses([]);
      }
      
      // Load time slots
      const timeSlotsResponse = await APIService.get('/api/timetable/time-slots/', { page: '1', page_size: '10000' }, authType);
      
      if (timeSlotsResponse.results) {
        setTimeSlots(timeSlotsResponse.results);
      } else if (Array.isArray(timeSlotsResponse)) {
        setTimeSlots(timeSlotsResponse);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      alert('Failed to load classes and time slots. Please try again.');
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
        day_of_week: selectedDay,
        class_name: selectedClass,
        time_slot: selectedTimeSlot,
      });
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.message || 'Failed to update class schedule. Please try again.');
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
          <h3 className="text-lg font-semibold text-gray-900">Edit Class Schedule</h3>
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
              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`block w-full px-3 py-2 border ${
                    errors.day_of_week ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Day</option>
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                {errors.day_of_week && (
                  <p className="mt-1 text-sm text-red-600">{errors.day_of_week[0]}</p>
                )}
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className={`block w-full px-3 py-2 border ${
                    errors.class_name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                  disabled={loading}
                >
                  <option value="">Select Class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name}
                    </option>
                  ))}
                </select>
                {errors.class_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.class_name[0]}</p>
                )}
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Slot <span className="text-red-500">*</span>
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
              {loading ? 'Updating...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
