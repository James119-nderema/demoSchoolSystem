import { APIService } from './baseUrl';

export interface NationalExamResult {
  id: string;
  full_name: string;
  assessment_no: string;
  class_name: string | null;
  year: number;
  english: number;
  kiswahili: number;
  mathematics: number;
  integrated_science: number;
  agriculture: number;
  social_studies: number | null;
  ire: number | null;
  cre: number | null;
  creative_arts_sports: number | null;
  pre_technical_studies: number | null;
  total_marks: number;
  average: number;
  grade: string;
  date_uploaded: string;
  date_updated: string;
}

export interface NationalExamUpload {
  id: string;
  year: number;
  file_name: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  error_log: string | null;
  date_uploaded: string;
  uploaded_by: string | null;
}

export interface UploadResponse {
  message: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: Array<{
    row: number;
    name: string;
    error: string;
  }>;
}

export interface NationalResultFilters {
  search?: string;
  assessment_no?: string;
  class_name?: string;
  year?: number | string;
}

// Statistics interfaces
export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface SubjectPerformance {
  subject: string;
  field: string;
  average: number;
  count: number;
}

export interface ClassSubjectPerformance {
  class_name: string;
  student_count: number;
  overall_average: number;
  subjects: Array<{
    subject: string;
    field: string;
    average: number;
  }>;
}

export interface GradeCountByClass {
  class_name: string;
  student_count: number;
  class_average: number;
  grades: Record<string, number>;
}

export interface TopStudent {
  full_name: string;
  assessment_no: string;
  class_name: string;
  marks: number;
  year: number;
}

export interface TopStudentsBySubject {
  subject: string;
  field: string;
  students: TopStudent[];
}

export interface NationalExamStatistics {
  grade_distribution: GradeDistribution[];
  subject_performance: SubjectPerformance[];
  class_subject_performance: ClassSubjectPerformance[];
  grade_count_by_class: GradeCountByClass[];
  top_students_by_subject: TopStudentsBySubject[];
  total_students: number;
  years: number[];
  classes: string[];
}

const ENDPOINTS = {
  NATIONAL_RESULTS: '/api/national-results/',
  UPLOAD: '/api/national-results/upload/',
  YEARS: '/api/national-results/years/',
  CLASSES: '/api/national-results/classes/',
  UPLOAD_HISTORY: '/api/national-results/uploads/',
  STATISTICS: '/api/national-results/statistics/',
};

// Always use staff auth
const AUTH_TYPE = 'staff' as const;

export const nationalResultsService = {
  /**
   * Get all national exam results with optional filtering
   */
  async getResults(filters?: NationalResultFilters): Promise<NationalExamResult[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.assessment_no) params.append('assessment_no', filters.assessment_no);
        if (filters.class_name) params.append('class_name', filters.class_name);
        if (filters.year) params.append('year', String(filters.year));
      }
      
      const queryString = params.toString();
      const url = queryString ? `${ENDPOINTS.NATIONAL_RESULTS}?${queryString}` : ENDPOINTS.NATIONAL_RESULTS;
      
      const response = await APIService.get(url, undefined, AUTH_TYPE);
      return response || [];
    } catch (error: any) {
      console.error('Error fetching national exam results:', error);
      throw error;
    }
  },

  /**
   * Get a single national exam result by ID
   */
  async getResultById(id: string): Promise<NationalExamResult> {
    try {
      const response = await APIService.get(`${ENDPOINTS.NATIONAL_RESULTS}${id}/`, undefined, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error fetching national exam result:', error);
      throw error;
    }
  },

  /**
   * Create a new national exam result
   */
  async createResult(data: Partial<NationalExamResult>): Promise<NationalExamResult> {
    try {
      const response = await APIService.post(ENDPOINTS.NATIONAL_RESULTS, data, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error creating national exam result:', error);
      throw error;
    }
  },

  /**
   * Update a national exam result
   */
  async updateResult(id: string, data: Partial<NationalExamResult>): Promise<NationalExamResult> {
    try {
      const response = await APIService.put(`${ENDPOINTS.NATIONAL_RESULTS}${id}/`, data, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error updating national exam result:', error);
      throw error;
    }
  },

  /**
   * Delete a national exam result
   */
  async deleteResult(id: string): Promise<void> {
    try {
      await APIService.delete(`${ENDPOINTS.NATIONAL_RESULTS}${id}/`, AUTH_TYPE);
    } catch (error: any) {
      console.error('Error deleting national exam result:', error);
      throw error;
    }
  },

  /**
   * Upload national exam results from CSV/Excel file
   */
  async uploadResults(file: File, year: number): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', String(year));
      
      const response = await APIService.post(ENDPOINTS.UPLOAD, formData, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error uploading national exam results:', error);
      throw error;
    }
  },

  /**
   * Get distinct years for filtering
   */
  async getYears(): Promise<number[]> {
    try {
      const response = await APIService.get(ENDPOINTS.YEARS, undefined, AUTH_TYPE);
      return response || [];
    } catch (error: any) {
      console.error('Error fetching years:', error);
      return [];
    }
  },

  /**
   * Get distinct classes for filtering
   */
  async getClasses(): Promise<string[]> {
    try {
      const response = await APIService.get(ENDPOINTS.CLASSES, undefined, AUTH_TYPE);
      return response || [];
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  /**
   * Get upload history
   */
  async getUploadHistory(): Promise<NationalExamUpload[]> {
    try {
      const response = await APIService.get(ENDPOINTS.UPLOAD_HISTORY, undefined, AUTH_TYPE);
      return response || [];
    } catch (error: any) {
      console.error('Error fetching upload history:', error);
      return [];
    }
  },

  /**
   * Get comprehensive statistics for national exam results
   */
  async getStatistics(year?: number | string): Promise<NationalExamStatistics> {
    try {
      const params = year ? `?year=${year}` : '';
      const response = await APIService.get(`${ENDPOINTS.STATISTICS}${params}`, undefined, AUTH_TYPE);
      return response;
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
};

export default nationalResultsService;
