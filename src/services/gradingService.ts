import { APIService, API_ENDPOINTS } from './baseUrl';

export interface GradeDefinition {
  id?: string;
  grade: string;
  min_marks: number;
  max_marks: number;
  points: number;
  remarks?: string;
}

export interface GradeScaleGrouped {
  class_id: string;
  class_name: string;
  class_code: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grades: GradeDefinition[];
}

export interface GradeScaleCreateData {
  subject_ids: string[];
  class_ids: string[];
  grades: GradeDefinition[];
}

export interface GradeScaleStats {
  total_assignments: number;
  classes_with_grades: number;
  subjects_with_grades: number;
  total_entries: number;
}

export interface ClassItem {
  id: string;
  class_name: string;
  class_code: string;
}

export interface SubjectItem {
  id: string;
  subject_name: string;
  subject_code?: string;
}

const ENDPOINTS = {
  GRADING: '/api/grading/',
  GRADING_STATS: '/api/grading/stats/',
};

// Always use staff auth for grading (Director of Studies only page)
const AUTH_TYPE = 'staff' as const;

export const gradingService = {
  /**
   * Get classes for staff users (all classes for grading)
   */
  async getClasses(): Promise<ClassItem[]> {
    try {
      const response = await APIService.get(`${API_ENDPOINTS.CLASSES}?page=1&page_size=100&show_all=true`, undefined, AUTH_TYPE);
      return response.results || [];
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  /**
   * Get subjects for staff users
   */
  async getSubjects(): Promise<SubjectItem[]> {
    try {
      const response = await APIService.get('/api/subjects/?page=1&page_size=100&show_all=true', undefined, AUTH_TYPE);
      return response.results || [];
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  },

  /**
   * Get all grade scales grouped by class and subject
   */
  async getGradeScales(classId?: string, subjectId?: string): Promise<{
    success: boolean;
    data: GradeScaleGrouped[];
    count: number;
    message?: string;
  }> {
    try {
      let url = ENDPOINTS.GRADING;
      const params: string[] = [];
      
      if (classId) params.push(`class_id=${classId}`);
      if (subjectId) params.push(`subject_id=${subjectId}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await APIService.get(url, undefined, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error fetching grade scales:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error.message || 'Failed to fetch grade scales'
      };
    }
  },

  /**
   * Create grade scales (supports bulk creation)
   */
  async createGradeScales(data: GradeScaleCreateData): Promise<{
    success: boolean;
    message?: string;
    count?: number;
    error?: string;
  }> {
    try {
      const response = await APIService.post(ENDPOINTS.GRADING, data, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error creating grade scales:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create grade scales'
      };
    }
  },

  /**
   * Update a single grade scale
   */
  async updateGradeScale(id: string, data: Partial<GradeDefinition>): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await APIService.put(`${ENDPOINTS.GRADING}${id}/`, data, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error updating grade scale:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update grade scale'
      };
    }
  },

  /**
   * Delete a single grade scale
   */
  async deleteGradeScale(id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      await APIService.delete(`${ENDPOINTS.GRADING}${id}/`, AUTH_TYPE);
      return { success: true, message: 'Grade scale deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting grade scale:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete grade scale'
      };
    }
  },

  /**
   * Delete all grade scales for a class-subject combination
   */
  async deleteByClassSubject(classId: string, subjectId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await APIService.delete(
        `${ENDPOINTS.GRADING}class/${classId}/subject/${subjectId}/`,
        AUTH_TYPE
      );
      return response;
    } catch (error: any) {
      console.error('Error deleting grade scales:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete grade scales'
      };
    }
  },

  /**
   * Get grade scale statistics
   */
  async getStats(): Promise<{
    success: boolean;
    stats?: GradeScaleStats;
    error?: string;
  }> {
    try {
      const response = await APIService.get(ENDPOINTS.GRADING_STATS, undefined, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error fetching grade scale stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch stats'
      };
    }
  }
};

export default gradingService;
