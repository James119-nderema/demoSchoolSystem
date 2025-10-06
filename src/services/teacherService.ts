import { APIService } from './baseUrl';
import type { Teacher, TeacherCreateData, TeacherCreateResponse, TeacherUpdateData, TeacherResponse, TeacherStatsResponse } from '../types/teacher';

// Determine auth type based on available tokens
const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('access_token') ? 'school' : 'staff';
};

export const teacherService = {
  // Get all teachers with pagination
  getTeachers: async (page: number = 1, pageSize: number = 20, search?: string): Promise<{ success: boolean; data?: TeacherResponse; message?: string }> => {
    try {
      const authType = getAuthType();
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize.toString(),
      };
      
      if (search) params.search = search;
      
      const response = await APIService.get('/api/teachers/', params, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch teachers'
      };
    }
  },

  // Get a single teacher
  getTeacher: async (id: string): Promise<{ success: boolean; data?: Teacher; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.get(`/api/teachers/${id}/`, {}, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch teacher'
      };
    }
  },

  // Create a new teacher
  createTeacher: async (data: TeacherCreateData): Promise<{ success: boolean; data?: TeacherCreateResponse; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.post('/api/teachers/', data, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error || error.message || 'Failed to create teacher'
      };
    }
  },

  // Update a teacher
  updateTeacher: async (id: string, data: TeacherUpdateData): Promise<{ success: boolean; data?: Teacher; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.patch(`/api/teachers/${id}/`, data, authType);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update teacher'
      };
    }
  },

  // Delete a teacher
  deleteTeacher: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const authType = getAuthType();
      await APIService.delete(`/api/teachers/${id}/`, authType);
      
      return {
        success: true,
        message: 'Teacher deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete teacher'
      };
    }
  },

  // Get statistics
  getStats: async (): Promise<{ success: boolean; data?: TeacherStatsResponse; message?: string }> => {
    try {
      const authType = getAuthType();
      const response = await APIService.get('/api/teachers/stats/', {}, authType);
      
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
