import { APIService } from '../services/baseUrl';
import type { 
  TimeSlot, 
  TimeSlotCreate, 
  TimeSlotUpdate, 
  TimeSlotStatistics, 
  PaginatedResponse 
} from '../types/timeSlot';

// Re-export types for convenience
export type { 
  TimeSlot, 
  TimeSlotCreate, 
  TimeSlotUpdate, 
  TimeSlotStatistics, 
  PaginatedResponse 
};

// Determine auth type based on available tokens
const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('access_token') ? 'school' : 'staff';
};

// API functions
export const timeSlotApi = {
  // List time slots with optional filters
  listTimeSlots: async (params?: {
    class_level?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<TimeSlot>> => {
    const authType = getAuthType();
    
    // Convert params to string format for APIService
    const stringParams: Record<string, string> = {};
    if (params) {
      if (params.class_level) stringParams.class_level = params.class_level;
      if (params.is_active !== undefined) stringParams.is_active = String(params.is_active);
      if (params.page) stringParams.page = String(params.page);
      if (params.page_size) stringParams.page_size = String(params.page_size);
    }
    
    const response = await APIService.get('/api/timetable/time-slots/', stringParams, authType);
    return response;
  },

  // Get a specific time slot
  getTimeSlot: async (id: string): Promise<TimeSlot> => {
    const authType = getAuthType();
    const response = await APIService.get(`/api/timetable/time-slots/${id}/`, {}, authType);
    return response;
  },

  // Create a new time slot
  createTimeSlot: async (data: TimeSlotCreate): Promise<TimeSlot> => {
    const authType = getAuthType();
    const response = await APIService.post('/api/timetable/time-slots/', data, authType);
    return response;
  },

  // Update a time slot
  updateTimeSlot: async (id: string, data: TimeSlotUpdate): Promise<TimeSlot> => {
    const authType = getAuthType();
    const response = await APIService.patch(`/api/timetable/time-slots/${id}/`, data, authType);
    return response;
  },

  // Delete a time slot
  deleteTimeSlot: async (id: string): Promise<void> => {
    const authType = getAuthType();
    await APIService.delete(`/api/timetable/time-slots/${id}/`, authType);
  },

  // Get time slot statistics
  getStatistics: async (): Promise<TimeSlotStatistics> => {
    const authType = getAuthType();
    const response = await APIService.get('/api/timetable/time-slots/statistics/', {}, authType);
    return response;
  },

  // Bulk create time slots
  bulkCreateTimeSlots: async (timeSlots: TimeSlotCreate[]): Promise<{
    message: string;
    created: TimeSlot[];
    errors?: any[];
  }> => {
    const authType = getAuthType();
    const response = await APIService.post('/api/timetable/time-slots/bulk-create/', {
      time_slots: timeSlots
    }, authType);
    return response;
  },
};
