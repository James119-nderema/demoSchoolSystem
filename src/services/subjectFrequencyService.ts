import { APIService } from './baseUrl';

export interface SubjectFrequency {
  id: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  class_level: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  frequency: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectFrequencyCreateData {
  subject: string;
  class_level: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  frequency: number;
  is_active?: boolean;
}

export interface SubjectFrequencyBulkCreateData {
  subjects: string[];
  class_level: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  frequency: number;
}

export interface SubjectFrequencyStats {
  total_frequencies: number;
  active_frequencies: number;
  inactive_frequencies: number;
  by_class_level: {
    [key: string]: number;
  };
  average_frequency: number;
}

export interface SubjectFrequencyResponse {
  success: boolean;
  message?: string;
  data?: SubjectFrequency;
  errors?: any;
}

export interface SubjectFrequencyListResponse {
  success: boolean;
  message?: string;
  data?: {
    count: number;
    next: string | null;
    previous: string | null;
    results: SubjectFrequency[];
  };
  errors?: any;
}

class SubjectFrequencyService {
  private baseUrl = '/api/timetable/subject-frequency';

  /**
   * Get all subject frequencies with optional filters
   */
  async getSubjectFrequencies(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      class_level?: string;
      subject_id?: string;
      is_active?: boolean;
    }
  ): Promise<SubjectFrequencyListResponse> {
    try {
      let url = `${this.baseUrl}/?page=${page}&page_size=${pageSize}`;
      
      if (filters?.class_level) {
        url += `&class_level=${filters.class_level}`;
      }
      if (filters?.subject_id) {
        url += `&subject_id=${filters.subject_id}`;
      }
      if (filters?.is_active !== undefined) {
        url += `&is_active=${filters.is_active}`;
      }

      const response = await APIService.get(url, undefined, 'staff');
      
      // Backend returns DRF paginated response directly, wrap it
      return {
        success: true,
        data: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          results: response.results || []
        }
      };
    } catch (error: any) {
      console.error('Error fetching subject frequencies:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch subject frequencies',
        errors: error,
        data: {
          count: 0,
          next: null,
          previous: null,
          results: []
        }
      };
    }
  }

  /**
   * Get a single subject frequency by ID
   */
  async getSubjectFrequency(id: string): Promise<SubjectFrequencyResponse> {
    try {
      const response = await APIService.get(`${this.baseUrl}/${id}/`, undefined, 'staff');
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Error fetching subject frequency:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch subject frequency',
        errors: error
      };
    }
  }

  /**
   * Create a new subject frequency
   */
  async createSubjectFrequency(data: SubjectFrequencyCreateData): Promise<SubjectFrequencyResponse> {
    try {
      const response = await APIService.post(this.baseUrl + '/', data, 'staff');
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Error creating subject frequency:', error);
      return {
        success: false,
        message: error.message || 'Failed to create subject frequency',
        errors: error
      };
    }
  }

  /**
   * Bulk create subject frequencies for multiple subjects
   */
  async bulkCreateSubjectFrequencies(data: SubjectFrequencyBulkCreateData): Promise<any> {
    try {
      const response = await APIService.post(`${this.baseUrl}/bulk/create/`, data, 'staff');
      return {
        success: true,
        ...response
      };
    } catch (error: any) {
      console.error('Error bulk creating subject frequencies:', error);
      return {
        success: false,
        message: error.message || 'Failed to bulk create subject frequencies',
        errors: error
      };
    }
  }

  /**
   * Update a subject frequency
   */
  async updateSubjectFrequency(id: string, data: Partial<SubjectFrequencyCreateData>): Promise<SubjectFrequencyResponse> {
    try {
      const response = await APIService.patch(`${this.baseUrl}/${id}/`, data, 'staff');
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Error updating subject frequency:', error);
      return {
        success: false,
        message: error.message || 'Failed to update subject frequency',
        errors: error
      };
    }
  }

  /**
   * Delete a subject frequency
   */
  async deleteSubjectFrequency(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      await APIService.delete(`${this.baseUrl}/${id}/`, 'staff');
      return {
        success: true,
        message: 'Subject frequency deleted successfully'
      };
    } catch (error: any) {
      console.error('Error deleting subject frequency:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete subject frequency'
      };
    }
  }

  /**
   * Get subject frequency statistics
   */
  async getStats(): Promise<{ success: boolean; data?: SubjectFrequencyStats; message?: string }> {
    try {
      const response = await APIService.get(`${this.baseUrl}/stats/`, undefined, 'staff');
      return response;
    } catch (error) {
      console.error('Error fetching subject frequency stats:', error);
      return {
        success: false,
        message: 'Failed to fetch statistics'
      };
    }
  }
}

export const subjectFrequencyService = new SubjectFrequencyService();
