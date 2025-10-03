import { APIService } from './baseUrl';
import type { Subject, SubjectCreateData, SubjectResponse, SubjectStatsResponse, CSVUploadResponse } from '../types/subjects';

const ENDPOINTS = {
  SUBJECTS: '/api/subjects/',
  SUBJECTS_STATS: '/api/subjects/stats/',
  SUBJECTS_UPLOAD_CSV: '/api/subjects/upload-csv/',
};

export const subjectsService = {
  // Get all subjects with pagination
  async getSubjects(page = 1, pageSize = 20, showAll = false): Promise<SubjectResponse> {
    try {
      let url = `${ENDPOINTS.SUBJECTS}?page=${page}&page_size=${pageSize}`;
      if (showAll) {
        url += '&show_all=true';
      }
      
      const response = await APIService.get(url, undefined, 'staff');
      
      // Handle paginated response from Django REST framework
      if (response.results) {
        return {
          success: true,
          data: {
            results: response.results,
            count: response.count,
            next: response.next || undefined,
            previous: response.previous || undefined
          }
        };
      } else {
        // Handle non-paginated response
        return {
          success: true,
          data: {
            results: Array.isArray(response) ? response : [response],
            count: Array.isArray(response) ? response.length : 1,
            next: undefined,
            previous: undefined
          }
        };
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch subjects',
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
    try {
      const response = await APIService.get(`${ENDPOINTS.SUBJECTS}${id}/`, undefined, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch subject'
      };
    }
  },

  // Create a new subject
  async createSubject(data: SubjectCreateData): Promise<{ success: boolean; data?: Subject; message?: string; errors?: Record<string, string[]> }> {
    try {
      const response = await APIService.post(ENDPOINTS.SUBJECTS, data, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create subject',
        errors: error.response?.data
      };
    }
  },

  // Update a subject
  async updateSubject(id: string, data: Partial<SubjectCreateData>): Promise<{ success: boolean; data?: Subject; message?: string; errors?: Record<string, string[]> }> {
    try {
      const response = await APIService.patch(`${ENDPOINTS.SUBJECTS}${id}/`, data, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update subject',
        errors: error.response?.data
      };
    }
  },

  // Delete a subject
  async deleteSubject(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await APIService.delete(`${ENDPOINTS.SUBJECTS}${id}/`, 'staff');
      return { success: true, message: 'Subject deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete subject'
      };
    }
  },

  // Upload CSV file
  async uploadCSV(file: File): Promise<CSVUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const response = await APIService.post(ENDPOINTS.SUBJECTS_UPLOAD_CSV, formData, 'staff');
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to upload CSV',
        errors: error.response?.data
      };
    }
  },

  // Get subject statistics
  async getStats(): Promise<SubjectStatsResponse> {
    try {
      const response = await APIService.get(ENDPOINTS.SUBJECTS_STATS, undefined, 'staff');
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics'
      };
    }
  }
};
