import axios from 'axios';
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

const API_BASE_URL = 'http://localhost:8000/api/timetable';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('staff_access_token') || localStorage.getItem('access_token');
};

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API functions
export const timeSlotApi = {
  // List time slots with optional filters
  listTimeSlots: async (params?: {
    class_level?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<TimeSlot>> => {
    const response = await apiClient.get('/time-slots/', { params });
    return response.data;
  },

  // Get a specific time slot
  getTimeSlot: async (id: string): Promise<TimeSlot> => {
    const response = await apiClient.get(`/time-slots/${id}/`);
    return response.data;
  },

  // Create a new time slot
  createTimeSlot: async (data: TimeSlotCreate): Promise<TimeSlot> => {
    const response = await apiClient.post('/time-slots/', data);
    return response.data;
  },

  // Update a time slot
  updateTimeSlot: async (id: string, data: TimeSlotUpdate): Promise<TimeSlot> => {
    const response = await apiClient.patch(`/time-slots/${id}/`, data);
    return response.data;
  },

  // Delete a time slot
  deleteTimeSlot: async (id: string): Promise<void> => {
    await apiClient.delete(`/time-slots/${id}/`);
  },

  // Get time slot statistics
  getStatistics: async (): Promise<TimeSlotStatistics> => {
    const response = await apiClient.get('/time-slots/statistics/');
    return response.data;
  },

  // Bulk create time slots
  bulkCreateTimeSlots: async (timeSlots: TimeSlotCreate[]): Promise<{
    message: string;
    created: TimeSlot[];
    errors?: any[];
  }> => {
    const response = await apiClient.post('/time-slots/bulk-create/', {
      time_slots: timeSlots
    });
    return response.data;
  },
};
