import { schoolAPI, staffAPI } from '../utils/api';
import type { Subject, SubjectCreateData, SubjectResponse, SubjectStatsResponse, CSVUploadResponse } from '../types/subjects';

const ENDPOINTS = {
  SUBJECTS: '/subjects/',
  SUBJECTS_STATS: '/subjects/stats/',
  SUBJECTS_UPLOAD_CSV: '/subjects/upload-csv/',
};

// Helper function to get the appropriate API instance based on user type
const getAPI = () => {
  const userType = localStorage.getItem('user_type');
  return userType === 'staff' ? staffAPI : schoolAPI;
};

export const subjectsService = {
  // Get all subjects with pagination
  async getSubjects(page = 1, pageSize = 20): Promise<SubjectResponse> {
    try {
      const api = getAPI();
      const response = await api.get(`${ENDPOINTS.SUBJECTS}?page=${page}&page_size=${pageSize}`);
      
      // Handle paginated response from Django REST framework
      if (response.data.results) {
        return {
          success: true,
          data: {
            results: response.data.results,
            count: response.data.count,
            next: response.data.next || undefined,
            previous: response.data.previous || undefined
          }
        };
      } else {
        // Handle non-paginated response
        return {
          success: true,
          data: {
            results: Array.isArray(response.data) ? response.data : [response.data],
            count: Array.isArray(response.data) ? response.data.length : 1,
            next: undefined,
            previous: undefined
          }
        };
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch subjects',
        data: {
          results: [],
          count: 0,
          next: undefined,
          previous: undefined
        }
      };
    }
  },

  // Get a single subject by ID
  async getSubject(id: string): Promise<{ success: boolean; data?: Subject; message?: string }> {
    const api = getAPI();
    const response = await api.get(`${ENDPOINTS.SUBJECTS}${id}/`);
    return { success: true, data: response.data };
  },

  // Create a new subject
  async createSubject(data: SubjectCreateData): Promise<{ success: boolean; data?: Subject; message?: string; errors?: Record<string, string[]> }> {
    try {
      const api = getAPI();
      const response = await api.post(ENDPOINTS.SUBJECTS, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create subject',
        errors: error.response?.data?.errors || error.response?.data
      };
    }
  },

  // Update a subject
  async updateSubject(id: string, data: Partial<SubjectCreateData>): Promise<{ success: boolean; data?: Subject; message?: string; errors?: Record<string, string[]> }> {
    try {
      const api = getAPI();
      const response = await api.patch(`${ENDPOINTS.SUBJECTS}${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update subject',
        errors: error.response?.data?.errors || error.response?.data
      };
    }
  },

  // Delete a subject
  async deleteSubject(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const api = getAPI();
      await api.delete(`${ENDPOINTS.SUBJECTS}${id}/`);
      return { success: true, message: 'Subject deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete subject'
      };
    }
  },

  // Upload CSV file
  async uploadCSV(file: File): Promise<CSVUploadResponse> {
    try {
      const api = getAPI();
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const response = await api.post(ENDPOINTS.SUBJECTS_UPLOAD_CSV, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload CSV',
        errors: error.response?.data?.errors
      };
    }
  },

  // Get subject statistics
  async getStats(): Promise<SubjectStatsResponse> {
    try {
      const api = getAPI();
      const response = await api.get(ENDPOINTS.SUBJECTS_STATS);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch statistics'
      };
    }
  }
};
