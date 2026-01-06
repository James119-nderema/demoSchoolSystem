import { useState, useEffect } from 'react';
import { APIService } from '../../../services/baseUrl';
import type { Subject } from '../../../types/subjects';
import type { TimeSlot } from '../../../types/timetable';

interface AddPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; time_slots: string[]; teacher?: string | null }) => Promise<void>;
}

export default function AddPriorityModal({ isOpen, onClose, onSubmit }: AddPriorityModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      
      // Load subjects
      const subjectsResponse = await APIService.get('/api/subjects/', { page: '1', page_size: '10000' }, authType);
      setSubjects(subjectsResponse.results || []);
      
      // Load time slots
      const timeSlotsResponse = await APIService.get('/api/timetable/time-slots/', { page: '1', page_size: '10000' }, authType);
      setTimeSlots(timeSlotsResponse.results || []);
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      alert('Failed to load subjects and time slots. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSelectAllTimeSlots = () => {
    if (selectedTimeSlots.length === timeSlots.length) {
      setSelectedTimeSlots([]);
    } else {
      setSelectedTimeSlots(timeSlots.map(slot => slot.id));
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
      await onSubmit({
        subject: selectedSubject,
        time_slots: selectedTimeSlots,
      });
      
      // Reset form
      setSelectedSubject('');
      setSelectedTimeSlots([]);
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
                  onChange={(e) => setSelectedSubject(e.target.value)}
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

              {/* Time Slots - Checkbox Multi-select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Time Slots <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllTimeSlots}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    {selectedTimeSlots.length === timeSlots.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className={`border ${
                  errors.time_slot ? 'border-red-300' : 'border-gray-300'
                } rounded-md max-h-48 overflow-y-auto p-2`}>
                  {timeSlots.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No time slots available</p>
                  ) : (
                    timeSlots.map((slot) => (
                      <label
                        key={slot.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTimeSlots.includes(slot.id)}
                          onChange={() => handleTimeSlotToggle(slot.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={loading}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedTimeSlots.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedTimeSlots.length} time slot{selectedTimeSlots.length !== 1 ? 's' : ''} selected
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
