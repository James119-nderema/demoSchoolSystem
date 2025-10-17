import { APIService } from './baseUrl';

export interface TeacherSubjectClass {
  id: number;
  teacher: string;
  teacher_name: string;
  teacher_email: string;
  subject: string;
  subject_name: string;
  subject_code: string;
  class_assigned: string;
  class_name: string;
  class_code: string;
  school: string;
  school_name: string;
  is_active: boolean;
  is_class_teacher: boolean;
  created_at: string;
  last_updated: string;
}

export interface TeacherSubjectClassCreate {
  teacher: string;
  class_assigned: string;
  subjects: string[];
}

export interface TeacherSubjectClassUpdate {
  teacher?: string;
  subject?: string;
  class_assigned?: string;
  is_active?: boolean;
}

export interface TeacherListItem {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface AssignmentStats {
  total_assignments: number;
  active_assignments: number;
  inactive_assignments: number;
  total_teachers: number;
  teachers_with_assignments: number;
}

const ENDPOINTS = {
  BASE: '/api/timetable/teacher-subject/',
  DETAIL: (id: string) => `/api/timetable/teacher-subject/${id}/`,
  TEACHERS: '/api/timetable/teacher-subject/teachers/list/',
  STATS: '/api/timetable/teacher-subject/stats/',
};

export const teacherSubjectClassService = {
  // Get all assignments with pagination and filters
  async getAssignments(
    page = 1,
    pageSize = 20,
    filters?: {
      search?: string;
      teacher_id?: string;
      class_id?: string;
      subject_id?: string;
    }
  ): Promise<{
    success: boolean;
    data?: {
      count: number;
      results: TeacherSubjectClass[];
      page: number;
      page_size: number;
      total_pages: number;
    };
    message?: string;
  }> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: pageSize.toString(),
      };

      if (filters?.search) params.search = filters.search;
      if (filters?.teacher_id) params.teacher_id = filters.teacher_id;
      if (filters?.class_id) params.class_id = filters.class_id;
      if (filters?.subject_id) params.subject_id = filters.subject_id;

      const response = await APIService.get(ENDPOINTS.BASE, params, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch assignments',
      };
    }
  },

  // Get a single assignment
  async getAssignment(id: string): Promise<{
    success: boolean;
    data?: TeacherSubjectClass;
    message?: string;
  }> {
    try {
      const response = await APIService.get(ENDPOINTS.DETAIL(id), undefined, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch assignment',
      };
    }
  },

  // Create new assignment(s)
  async createAssignments(data: TeacherSubjectClassCreate): Promise<{
    success: boolean;
    data?: {
      message: string;
      created_count: number;
      created: TeacherSubjectClass[];
      errors?: string[];
      warnings?: {
        message: string;
        duplicates: string[];
      };
    };
    message?: string;
  }> {
    try {
      const response = await APIService.post(ENDPOINTS.BASE, data, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      // Re-throw the error so the caller can handle validation details
      throw error;
    }
  },

  // Update an assignment
  async updateAssignment(
    id: string,
    data: TeacherSubjectClassUpdate
  ): Promise<{
    success: boolean;
    data?: TeacherSubjectClass;
    message?: string;
  }> {
    try {
      const response = await APIService.put(ENDPOINTS.DETAIL(id), data, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      // Re-throw the error so the caller can handle validation details
      throw error;
    }
  },

  // Delete an assignment
  async deleteAssignment(id: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await APIService.delete(ENDPOINTS.DETAIL(id), 'staff');
      return { success: true, message: 'Assignment deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete assignment',
      };
    }
  },

  // Get list of teachers
  async getTeachers(): Promise<{
    success: boolean;
    data?: {
      count: number;
      results: TeacherListItem[];
    };
    message?: string;
  }> {
    try {
      const response = await APIService.get(ENDPOINTS.TEACHERS, undefined, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch teachers',
      };
    }
  },

  // Get assignment statistics
  async getStats(): Promise<{
    success: boolean;
    data?: AssignmentStats;
    message?: string;
  }> {
    try {
      const response = await APIService.get(ENDPOINTS.STATS, undefined, 'staff');
      return { success: true, data: response };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics',
      };
    }
  },
};
