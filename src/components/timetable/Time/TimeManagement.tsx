import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Clock, Users, AlertCircle } from 'lucide-react';
import { timeSlotApi } from '../../../api/timeSlotApi';
import type { TimeSlot, TimeSlotCreate, TimeSlotUpdate } from '../../../types/timeSlot';
import TimePicker from '../../common/TimePicker';

interface TimeManagementProps {
  title?: string;
  subtitle?: string;
}

const TimeManagement: React.FC<TimeManagementProps> = ({ 
  title = "Time Management", 
  subtitle = "Manage class schedules and time slots" 
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    current_page: number;
  }>({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
  });

  // Form state
  const [selectedStartTime, setSelectedStartTime] = useState('08:00');
  const [selectedEndTime, setSelectedEndTime] = useState('09:00');
  const [selectedClassLevel, setSelectedClassLevel] = useState<'Primary' | 'Junior Secondary' | 'Senior Secondary'>('Primary');
  const [isActive, setIsActive] = useState(true);

  // Load time slots on component mount
  useEffect(() => {
    loadTimeSlots();
  }, []);

  // Memoized callback functions to prevent infinite re-renders
  const handleStartTimeChange = useCallback((time: string) => {
    setSelectedStartTime(time);
  }, []);

  const handleEndTimeChange = useCallback((time: string) => {
    setSelectedEndTime(time);
  }, []);

  const loadTimeSlots = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await timeSlotApi.listTimeSlots({
        page,
        page_size: 20,
      });
      
      setTimeSlots(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
        current_page: page,
      });
    } catch (err: any) {
      console.error('Error loading time slots:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load time slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate that end time is after start time
    if (selectedStartTime >= selectedEndTime) {
      setError('End time must be after start time');
      setIsLoading(false);
      return;
    }

    // Check for duplicate or overlapping timeslots in the same class level
    const existingSlots = timeSlots.filter(slot => 
      slot.class_level === selectedClassLevel && 
      (!editingSlot || slot.id !== editingSlot.id)
    );
    
    // Check for exact duplicate
    const exactDuplicate = existingSlots.find(slot => 
      slot.start_time === selectedStartTime && slot.end_time === selectedEndTime
    );
    if (exactDuplicate) {
      setError(`A time slot with the same start and end time already exists for ${selectedClassLevel}`);
      setIsLoading(false);
      return;
    }
    
    // Normalize time to HH:MM for consistent comparison (backend may return HH:MM:SS)
    const normalizeTime = (t: string) => t.substring(0, 5);

    // Check for overlapping timeslots (allow adjacent slots that share a boundary)
    const newStart = normalizeTime(selectedStartTime);
    const newEnd = normalizeTime(selectedEndTime);
    const overlapping = existingSlots.find(slot => {
      const existingStart = normalizeTime(slot.start_time);
      const existingEnd = normalizeTime(slot.end_time);
      // Adjacent slots (e.g. 8:20-9:00 and 9:00-9:40) are allowed
      if (newStart === existingEnd || newEnd === existingStart) {
        return false;
      }
      // True overlap: start < existingEnd AND end > existingStart
      return newStart < existingEnd && newEnd > existingStart;
    });
    if (overlapping) {
      setError(`Time slot overlaps with existing slot: ${overlapping.start_time} - ${overlapping.end_time} for ${selectedClassLevel}`);
      setIsLoading(false);
      return;
    }

    try {
      const timeSlotData: TimeSlotCreate | TimeSlotUpdate = {
        start_time: selectedStartTime,
        end_time: selectedEndTime,
        class_level: selectedClassLevel,
        is_active: isActive,
      };

      if (editingSlot) {
        // Update existing slot
        const updatedSlot = await timeSlotApi.updateTimeSlot(editingSlot.id, timeSlotData);
        setTimeSlots(timeSlots.map(slot => slot.id === editingSlot.id ? updatedSlot : slot));
      } else {
        // Create new slot - backend now returns full serialized object
        const newSlot = await timeSlotApi.createTimeSlot(timeSlotData as TimeSlotCreate);
        setTimeSlots([newSlot, ...timeSlots]);
        setPagination(prev => ({ ...prev, count: prev.count + 1 }));
      }

      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving time slot:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] ||
                          err.response?.data?.start_time?.[0] ||
                          err.response?.data?.end_time?.[0] ||
                          err.response?.data?.class_level?.[0] ||
                          err.message || 
                          'Failed to save time slot';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setSelectedStartTime(slot.start_time);
    setSelectedEndTime(slot.end_time);
    setSelectedClassLevel(slot.class_level);
    setIsActive(slot.is_active);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await timeSlotApi.deleteTimeSlot(id);
      setTimeSlots(timeSlots.filter(slot => slot.id !== id));
      setPagination(prev => ({ ...prev, count: prev.count - 1 }));
    } catch (err: any) {
      console.error('Error deleting time slot:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete time slot');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStartTime('08:00');
    setSelectedEndTime('09:00');
    setSelectedClassLevel('Primary');
    setIsActive(true);
    setEditingSlot(null);
    setError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const getClassLevelColor = (level: string) => {
    switch (level) {
      case 'Primary':
        return 'bg-green-100 text-green-800';
      case 'Junior Secondary':
        return 'bg-blue-100 text-blue-800';
      case 'Senior Secondary':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (isNaN(minutes) || minutes === undefined || minutes === null) {
      return '0m';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeRange = (slot: TimeSlot) => {
    // First try the pre-formatted display field
    if (slot.time_range_display) {
      return slot.time_range_display;
    }
    
    // Try individual display fields
    if (slot.start_time_display && slot.end_time_display) {
      return `${slot.start_time_display} - ${slot.end_time_display}`;
    }
    
    // Fallback to raw time fields and format them
    if (slot.start_time && slot.end_time) {
      const formatTime = (timeStr: string) => {
        try {
          // Handle both "HH:MM" and "HH:MM:SS" formats
          const [hours, minutes] = timeStr.split(':');
          return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        } catch {
          return timeStr;
        }
      };
      return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
    }
    
    return 'Invalid time';
  };

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              {title}
            </h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
            {pagination.count > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Total: {pagination.count} time slots
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Time Slot
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Time Slots Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr key="loading">
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : timeSlots.length === 0 ? (
                <tr key="empty">
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Clock className="w-12 h-12 text-gray-300 mb-2" />
                      <p>No time slots found</p>
                      <p className="text-sm">Click "Add Time Slot" to create your first time slot</p>
                    </div>
                  </td>
                </tr>
              ) : (
                timeSlots.map((slot, index) => (
                  <tr key={slot.id || `slot-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatTimeRange(slot)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDuration(slot.duration_minutes)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassLevelColor(slot.class_level)}`}>
                        <Users className="w-3 h-3 mr-1" />
                        {slot.class_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        slot.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(slot.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(slot)}
                          disabled={isLoading}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 p-1 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.count > 20 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => loadTimeSlots(pagination.current_page - 1)}
              disabled={!pagination.previous || isLoading}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => loadTimeSlots(pagination.current_page + 1)}
              disabled={!pagination.next || isLoading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                <span className="font-medium">{Math.ceil(pagination.count / 20)}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => loadTimeSlots(pagination.current_page - 1)}
                  disabled={!pagination.previous || isLoading}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadTimeSlots(pagination.current_page + 1)}
                  disabled={!pagination.next || isLoading}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Start Time Picker */}
              <TimePicker
                value={selectedStartTime}
                onChange={handleStartTimeChange}
                label="Start Time"
                id="startTime"
                use24Hour={false}
                required
              />

              {/* End Time Picker */}
              <TimePicker
                value={selectedEndTime}
                onChange={handleEndTimeChange}
                label="End Time"
                id="endTime"
                use24Hour={false}
                required
              />

              {/* Class Level Dropdown */}
              <div>
                <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Class Level
                </label>
                <select
                  id="classLevel"
                  value={selectedClassLevel}
                  onChange={(e) => setSelectedClassLevel(e.target.value as 'Primary' | 'Junior Secondary' | 'Senior Secondary')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="Primary">Primary</option>
                  <option value="Junior Secondary">Junior Secondary</option>
                  <option value="Senior Secondary">Senior Secondary</option>
                </select>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : editingSlot ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeManagement;
