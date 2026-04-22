import { APIService } from './baseUrl';

export interface TeacherIndexRow {
  teacher_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  index: number;
}

interface TeacherIndexListResponse {
  count: number;
  results: TeacherIndexRow[];
}

export const teacherIndexService = {
  async getTeacherIndexes(search = ''): Promise<TeacherIndexListResponse> {
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    return APIService.get('/api/teachers/indexes/', params, 'staff');
  },

  async bulkUpdateTeacherIndexes(updates: Array<{ teacher_id: string; index: number }>): Promise<{ message: string }> {
    return APIService.put('/api/teachers/indexes/bulk-update/', { updates }, 'staff');
  },
};
