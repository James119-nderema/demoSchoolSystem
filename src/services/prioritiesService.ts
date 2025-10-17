import { APIService } from './baseUrl';
import type { 
  SubjectPriority, 
  SubjectPriorityCreateData, 
  SubjectPriorityResponse, 
  SubjectPriorityStatsResponse 
} from '../types/priorities';

const ENDPOINTS = {
  PRIORITIES: '/api/priorities/',
  PRIORITIES_STATS: '/api/priorities/stats/',
};

export const prioritiesService = {
  // Get all priorities with pagination
  async getPriorities(page = 1, pageSize = 20): Promise<SubjectPriorityResponse> {
    try {
      const url = `${ENDPOINTS.PRIORITIES}?page=${page}&page_size=${pageSize}`;
      
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.get(url, undefined, authType);
      
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
      console.error('Error fetching priorities:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch priorities',
        data: {
          results: [],
          count: 0,
          next: undefined,
          previous: undefined
        }
      };
    }
  },

  // Get a single priority by ID
  async getPriority(id: string): Promise<{ success: boolean; data?: SubjectPriority; message?: string }> {
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.get(`${ENDPOINTS.PRIORITIES}${id}/`, undefined, authType);
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch priority'
      };
    }
  },

  // Create a new priority
  async createPriority(data: SubjectPriorityCreateData): Promise<{ success: boolean; data?: SubjectPriority; message?: string; errors?: Record<string, string[]> }> {
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.post(ENDPOINTS.PRIORITIES, data, authType);
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create priority',
        errors: error.response?.data?.errors || error.response?.data
      };
    }
  },

  // Update a priority
  async updatePriority(id: string, data: Partial<SubjectPriorityCreateData>): Promise<{ success: boolean; data?: SubjectPriority; message?: string; errors?: Record<string, string[]> }> {
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.patch(`${ENDPOINTS.PRIORITIES}${id}/`, data, authType);
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update priority',
        errors: error.response?.data?.errors || error.response?.data
      };
    }
  },

  // Delete a priority
  async deletePriority(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      await APIService.delete(`${ENDPOINTS.PRIORITIES}${id}/`, authType);
      return { success: true, message: 'Priority deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete priority'
      };
    }
  },

  // Get priority statistics
  async getStats(): Promise<SubjectPriorityStatsResponse> {
    try {
      const authType = localStorage.getItem('access_token') ? 'school' : 'staff';
      const response = await APIService.get(ENDPOINTS.PRIORITIES_STATS, undefined, authType);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics'
      };
    }
  }
};
