import { useState, useEffect } from 'react';
import { APIService } from '../../../services/baseUrl';

interface Class {
  id: string;
  class_name: string;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface AddClassScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { days: string[]; classes: string[]; time_slots: string[] }) => Promise<void>;
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

export default function AddClassScheduleModal({ isOpen, onClose, onSubmit }: AddClassScheduleModalProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

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

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSelectAllDays = () => {
    if (selectedDays.length === WEEKDAYS.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...WEEKDAYS]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map((c) => c.id));
    }
  };

  const handleSelectAllTimeSlots = () => {
    if (selectedTimeSlots.length === timeSlots.length) {
      setSelectedTimeSlots([]);
    } else {
      setSelectedTimeSlots(timeSlots.map((t) => t.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await onSubmit({
        days: selectedDays,
        classes: selectedClasses,
        time_slots: selectedTimeSlots,
      });
      
      // Reset form
      setSelectedDays([]);
      setSelectedClasses([]);
      setSelectedTimeSlots([]);
    } catch (error: any) {
      console.error('Error submitting schedule:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.message || 'Failed to add class schedules. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDays([]);
    setSelectedClasses([]);
    setSelectedTimeSlots([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Add Class Schedules</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Days Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Days <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllDays}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedDays.length === WEEKDAYS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {WEEKDAYS.map((day) => (
                    <label key={day} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
                {errors.days && <p className="mt-1 text-sm text-red-600">{errors.days[0]}</p>}
              </div>

              {/* Classes Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Classes <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                  {classes.map((classItem) => (
                    <label key={classItem.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(classItem.id)}
                        onChange={() => handleClassToggle(classItem.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm">{classItem.class_name}</span>
                    </label>
                  ))}
                  {classes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No classes available</p>
                  )}
                </div>
                {errors.classes && <p className="mt-1 text-sm text-red-600">{errors.classes[0]}</p>}
              </div>

              {/* Time Slots Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Time Slots <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllTimeSlots}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedTimeSlots.length === timeSlots.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                  {timeSlots.map((slot) => (
                    <label key={slot.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={selectedTimeSlots.includes(slot.id)}
                        onChange={() => handleTimeSlotToggle(slot.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </label>
                  ))}
                  {timeSlots.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No time slots available</p>
                  )}
                </div>
                {errors.time_slots && <p className="mt-1 text-sm text-red-600">{errors.time_slots[0]}</p>}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Summary:</strong> {selectedDays.length} day(s), {selectedClasses.length} class(es), {selectedTimeSlots.length} time slot(s)
                  {selectedDays.length > 0 && selectedClasses.length > 0 && selectedTimeSlots.length > 0 && (
                    <span className="ml-2">
                      = {selectedDays.length * selectedClasses.length * selectedTimeSlots.length} schedule(s) will be created
                    </span>
                  )}
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={loading || loadingData || selectedDays.length === 0 || selectedClasses.length === 0 || selectedTimeSlots.length === 0}
            >
              {loading ? 'Creating...' : 'Create Schedules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
