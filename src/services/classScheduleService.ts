import { APIService } from './baseUrl';
import type { ClassSchedule, ClassScheduleCreateData, ClassScheduleResponse, ClassScheduleStatsResponse } from '../types/classSchedule';

// Determine auth type based on available tokens
const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('access_token') ? 'school' : 'staff';
};

export const classScheduleService = {
  // Get all class schedules with pagination
  getSchedules: async (page: number = 1, pageSize: number = 20, search?: string, day?: string): Promise<{ success: boolean; data?: ClassScheduleResponse; message?: string }> => {
    try {
      const authType = getAuthType();
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize.toString(),
      };
      
      if (search) params.search = search;
      if (day) params.day = day;
      
      const response = await APIService.get('/api/class-schedule/', params, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch class schedules'
      };
    }
  },

  // Get a single class schedule
  getSchedule: async (id: string): Promise<{ success: boolean; data?: ClassSchedule; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.get(`/api/class-schedule/${id}/`, {}, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch class schedule'
      };
    }
  },

  // Create new class schedules
  createSchedules: async (data: ClassScheduleCreateData): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.post('/api/class-schedule/', data, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create class schedules'
      };
    }
  },

  // Update a class schedule
  updateSchedule: async (id: string, data: Partial<ClassSchedule>): Promise<{ success: boolean; data?: ClassSchedule; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.patch(`/api/class-schedule/${id}/`, data, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update class schedule'
      };
    }
  },

  // Delete a class schedule
  deleteSchedule: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const authType = getAuthType();
      await APIService.delete(`/api/class-schedule/${id}/`, authType);
      
      return {
        success: true,
        message: 'Class schedule deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete class schedule'
      };
    }
  },

  // Get statistics
  getStats: async (): Promise<{ success: boolean; data?: ClassScheduleStatsResponse; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.get('/api/class-schedule/stats/', {}, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics'
      };
    }
  },
};
