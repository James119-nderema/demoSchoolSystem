import { APIService, API_ENDPOINTS } from './baseUrl';
import type { Class, CreateClassData, ClassStats, ClassApiResponse, ApiResponse } from '../types/class';

export const classService = {
  // Get all classes with pagination
  getClasses: async (page: number = 1, pageSize: number = 20): Promise<ClassApiResponse> => {
    try {
      // Use APIService directly with 'school' user type for proper authentication
      const response = await APIService.get(API_ENDPOINTS.CLASSES, {
        page: page.toString(),
        page_size: pageSize.toString()
      }, 'school');
      console.log('Classes API Response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  // Get class statistics
  getClassStats: async (): Promise<ClassStats> => {
    try {
      const response = await APIService.get(`${API_ENDPOINTS.CLASSES}stats/`, undefined, 'school');
      console.log('Class Stats API Response:', response);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching class stats:', error);
      throw error;
    }
  },

  // Create a new class
  createClass: async (classData: CreateClassData): Promise<Class> => {
    try {
      const response = await APIService.post(API_ENDPOINTS.CLASSES, classData, 'school');
      console.log('Create Class API Response:', response);
      return response;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  },

  // Update a class
  updateClass: async (id: string, classData: Partial<CreateClassData>): Promise<Class> => {
    try {
      const response = await APIService.put(`${API_ENDPOINTS.CLASSES}${id}/`, classData, 'school');
      return response;
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  },

  // Delete a class
  deleteClass: async (id: string): Promise<void> => {
    try {
      await APIService.delete(`${API_ENDPOINTS.CLASSES}${id}/`, 'school');
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<ApiResponse<{ created_count: number; classes: Class[] }>> => {
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      // For FormData, we need to get auth headers without Content-Type
      const tokenKey = 'access_token'; // School user type
      const token = localStorage.getItem(tokenKey);
      
      const url = APIService.getUrl(`${API_ENDPOINTS.CLASSES}upload-csv/`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('CSV Upload Error Response:', errorData);
        console.error('Response Status:', response.status);
        console.error('Response Headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log('Upload CSV API Response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  },
};
