import { API_BASE_URL, API_TIMEOUT, API_UPLOAD_TIMEOUT } from '../config/environment';

// Backend API Configuration
const API_CONFIG = {
  // Base URL for the backend server
  BASE_URL: API_BASE_URL,
  
  // API endpoints
  ENDPOINTS: {
    // Authentication endpoints
    AUTH: {
      SCHOOL_LOGIN: '/api/login/',
      SCHOOL_REGISTER: '/api/register/',
      SCHOOL_FORGOT_PASSWORD: '/api/forgot-password/',
      SCHOOL_RESET_PASSWORD: '/api/reset-password/',
      STAFF_LOGIN: '/api/staff/login/',
      STAFF_REGISTER: '/api/staff/register/',
      STAFF_FORGOT_PASSWORD: '/api/staff/forgot-password/',
      STAFF_RESET_PASSWORD: '/api/staff/reset-password/',
      PARENT_LOGIN: '/api/parents/login/',
      PARENT_REGISTER: '/api/parents/register/',
      PARENT_FORGOT_PASSWORD: '/api/parents/forgot-password/',
      PARENT_VERIFY_TOKEN: '/api/parents/verify_token/',
    },
    
    // Core data endpoints
    STUDENTS: '/api/students/',
    CLASSES: '/api/classes/',
    SUBJECTS: '/api/subjects/',
    STAFF: '/api/staff/',
    
    // Input marks endpoints
    INPUT_MARKS: {
      BASE: '/api/input-marks/',
      RESULTS: '/api/input-marks/results/',
      STATISTICS: '/api/input-marks/results/statistics/',
      BULK_INPUT: '/api/input-marks/results/bulk_input/',
      DROPDOWN_DATA: '/api/input-marks/dropdown-data/',
      CLASS_STUDENTS: '/api/input-marks/class-students/',
      CLASS_SUBJECTS: '/api/input-marks/class-subjects/',
      STUDENT_ANALYTICS: '/api/input-marks/student-analytics/',
      CLASS_ANALYTICS: '/api/input-marks/class-analytics/',
      SUBJECT_ANALYTICS: '/api/input-marks/subject-analytics/',
      UPDATE_RESULT: (id: string) => `/api/input-marks/results/${id}/`,
      MARKS_TEMPLATE: '/api/input-marks/marks-template/',
      AVAILABLE_TEACHERS: '/api/input-marks/available-teachers/',
    },
    
    // Parent endpoints
    PARENTS: {
      BASE: '/api/parents/',
      STUDENT_ANALYTICS: '/api/parents/student_analytics/',
      VERIFY_TOKEN: '/api/parents/verify_token/',
    },
    
    // Reports endpoints - using InputMarks app
    REPORTS: {
      STUDENT_REPORT_DATA: '/api/input-marks/student-report-data/',
      BULK_REPORT_DATA: '/api/input-marks/bulk-report-data/',
    },
  }
};

// API utility functions
export class APIService {
  private static baseUrl = API_CONFIG.BASE_URL;
  
  // Auto-logout utility function
  private static handleAuthenticationFailure(): void {
    // Clear all authentication tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('staff_refresh_token');
    localStorage.removeItem('parent_refresh_token');
    
    // Redirect to appropriate login page based on current route
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/staff')) {
      window.location.href = '/login';
    } else if (currentPath.startsWith('/parent')) {
      window.location.href = '/parent/login';
    } else {
      window.location.href = '/login';
    }
  }
  
  // Check if error is authentication related
  private static isAuthenticationError(status: number, errorData: any): boolean {
    return status === 401 || 
           status === 403 ||
           errorData.detail === 'Authentication credentials were not provided.' ||
           errorData.error === 'Authentication credentials were not provided.' ||
           errorData.message === 'Authentication credentials were not provided.' ||
           errorData.detail?.includes('Invalid token') ||
           errorData.error?.includes('Invalid token') ||
           errorData.message?.includes('Invalid token');
  }
  
  // Get full URL for an endpoint
  static getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
  
  // Get authentication headers
  static getAuthHeaders(userType: 'staff' | 'parent' | 'school' = 'staff'): HeadersInit {
    let token: string | null = null;
    
    if (userType === 'school') {
      // For school endpoints, try school token first, then staff token (for ADMINISTRATIVE_STAFF)
      token = localStorage.getItem('access_token') || localStorage.getItem('staff_access_token');
    } else if (userType === 'staff') {
      // For staff endpoints, try staff token first, then school token (for school admin accessing staff features)
      token = localStorage.getItem('staff_access_token') || localStorage.getItem('access_token');
    } else if (userType === 'parent') {
      token = localStorage.getItem('parent_access_token');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  // Generic fetch wrapper
  static async fetch<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    const url = this.getUrl(endpoint);
    let headers = this.getAuthHeaders(userType);
    
    // For FormData uploads, don't set Content-Type (let browser set it with boundary)
    if (options.body instanceof FormData) {
      const { 'Content-Type': _, ...headersWithoutContentType } = headers as any;
      headers = headersWithoutContentType;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        
        // Check for authentication failures and auto-logout
        if (this.isAuthenticationError(response.status, errorData)) {
          this.handleAuthenticationFailure();
          // Throw an error to satisfy the return type
          throw new Error('Session expired. You have been logged out.');
        }
        
        const error = new Error(errorData.error || errorData.detail || errorData.message || `HTTP ${response.status}`);
        // Attach response data to error for better debugging
        (error as any).response = { 
          status: response.status, 
          data: errorData 
        };
        (error as any).status = response.status;
        throw error;
      }
      
      // Check if response has content to parse
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      // For 204 No Content or responses without JSON content, return empty object
      if (response.status === 204 || !hasJsonContent) {
        return {} as T;
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
  
  // GET request
  static async get<T = any>(
    endpoint: string, 
    params?: Record<string, string>, 
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    return this.fetch<T>(url, { method: 'GET' }, userType);
  }
  
  // POST request
  static async post<T = any>(
    endpoint: string, 
    data?: any, 
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }, userType);
  }
  
  // PUT request
  static async put<T = any>(
    endpoint: string, 
    data?: any, 
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }, userType);
  }
  
  // DELETE request
  static async delete<T = any>(
    endpoint: string, 
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' }, userType);
  }

  // Upload with progress tracking
  static async uploadWithProgress<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    const url = this.getUrl(endpoint);
    const tokenKey = userType === 'staff' ? 'staff_access_token' : 
                     userType === 'parent' ? 'parent_access_token' : 
                     'access_token';
    const token = localStorage.getItem(tokenKey);

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up timeout (longer timeout for uploads)
      xhr.timeout = API_UPLOAD_TIMEOUT;
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
      }
      
      // Set up response handlers
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            
            // Check for authentication failures and auto-logout
            if (APIService.isAuthenticationError(xhr.status, errorData)) {
              APIService.handleAuthenticationFailure();
              // Reject with clear message
              reject(new Error('Session expired. You have been logged out.'));
              return;
            }
            
            const error = new Error(errorData.error || errorData.detail || errorData.message || `HTTP ${xhr.status}`);
            (error as any).response = { 
              status: xhr.status, 
              data: errorData 
            };
            (error as any).status = xhr.status;
            reject(error);
          } catch (parseError) {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Upload timeout - the file might be too large or the connection is slow'));
      };
      
      // Set up request
      xhr.open('POST', url);
      
      // Add authorization header
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      // Send the request
      xhr.send(formData);
    });
  }
  
  // PATCH request
  static async patch<T = any>(
    endpoint: string, 
    data?: any, 
    userType: 'staff' | 'parent' | 'school' = 'staff'
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }, userType);
  }
}

// Export endpoints for easy access
export const API_ENDPOINTS = API_CONFIG.ENDPOINTS;

// Export base URL
export const BASE_URL = API_CONFIG.BASE_URL;

// Convenience functions for common operations
export const AuthAPI = {
  // School authentication
  schoolLogin: (credentials: any) => 
    APIService.post(API_ENDPOINTS.AUTH.SCHOOL_LOGIN, credentials, 'school'),
  schoolRegister: (data: any) => 
    APIService.post(API_ENDPOINTS.AUTH.SCHOOL_REGISTER, data, 'school'),
  schoolForgotPassword: (email: string) => 
    APIService.post(API_ENDPOINTS.AUTH.SCHOOL_FORGOT_PASSWORD, { email }, 'school'),
  schoolResetPassword: (data: any) => 
    APIService.post(API_ENDPOINTS.AUTH.SCHOOL_RESET_PASSWORD, data, 'school'),
    
  // Staff authentication
  staffLogin: (credentials: any) => 
    APIService.post(API_ENDPOINTS.AUTH.STAFF_LOGIN, credentials, 'staff'),
  staffRegister: (data: any) => 
    APIService.post(API_ENDPOINTS.AUTH.STAFF_REGISTER, data, 'staff'),
  staffForgotPassword: (email: string) => 
    APIService.post(API_ENDPOINTS.AUTH.STAFF_FORGOT_PASSWORD, { email }, 'staff'),
  staffResetPassword: (data: any) => 
    APIService.post(API_ENDPOINTS.AUTH.STAFF_RESET_PASSWORD, data, 'staff'),
    
  // Parent authentication
  parentLogin: (credentials: any) => 
    APIService.post(API_ENDPOINTS.AUTH.PARENT_LOGIN, credentials, 'parent'),
  parentRegister: (data: any) => 
    APIService.post(API_ENDPOINTS.AUTH.PARENT_REGISTER, data, 'parent'),
  parentForgotPassword: (email: string) => 
    APIService.post(API_ENDPOINTS.AUTH.PARENT_FORGOT_PASSWORD, { email }, 'parent'),
  parentVerifyToken: () => 
    APIService.post(API_ENDPOINTS.AUTH.PARENT_VERIFY_TOKEN, {}, 'parent'),
};

export const DataAPI = {
  // Students
  getStudents: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.STUDENTS, params, 'staff'),
  createStudent: (data: any) => 
    APIService.post(API_ENDPOINTS.STUDENTS, data, 'staff'),
  updateStudent: (id: string, data: any) => 
    APIService.put(`${API_ENDPOINTS.STUDENTS}${id}/`, data, 'staff'),
  deleteStudent: (id: string) => 
    APIService.delete(`${API_ENDPOINTS.STUDENTS}${id}/`, 'staff'),
  bulkUploadStudents: (formData: FormData, onProgress?: (progress: number) => void) => 
    APIService.uploadWithProgress('/api/students/bulk_upload/', formData, onProgress, 'staff'),
  bulkUploadStudentsSchool: (formData: FormData, onProgress?: (progress: number) => void) => 
    APIService.uploadWithProgress('/api/students/bulk_upload/', formData, onProgress, 'school'),
    
  // Classes
  getClasses: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.CLASSES, params, 'staff'),
  createClass: (data: any) => 
    APIService.post(API_ENDPOINTS.CLASSES, data, 'staff'),
  updateClass: (id: string, data: any) => 
    APIService.put(`${API_ENDPOINTS.CLASSES}${id}/`, data, 'staff'),
  deleteClass: (id: string) => 
    APIService.delete(`${API_ENDPOINTS.CLASSES}${id}/`, 'staff'),
    
  // Subjects
  getSubjects: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.SUBJECTS, params, 'staff'),
  createSubject: (data: any) => 
    APIService.post(API_ENDPOINTS.SUBJECTS, data, 'staff'),
  updateSubject: (id: string, data: any) => 
    APIService.put(`${API_ENDPOINTS.SUBJECTS}${id}/`, data, 'staff'),
  deleteSubject: (id: string) => 
    APIService.delete(`${API_ENDPOINTS.SUBJECTS}${id}/`, 'staff'),
    
  // Staff
  getStaff: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.STAFF, params, 'staff'),
    
  // Schools
  createSchool: (data: any) => 
    APIService.post('/api/schools/', data, 'school'),
  getSchool: (id: string) =>
    APIService.get(`/api/schools/${id}/`, undefined, 'school'),
  updateSchool: (id: string, data: any) =>
    APIService.patch(`/api/schools/${id}/`, data, 'school'),
  getSchoolStaff: () => 
    APIService.get('/api/schools/staff/', undefined, 'school'),
  createSchoolStaff: (data: any) => 
    APIService.post('/api/schools/staff/', data, 'school'),
  deleteSchoolStaff: (staffId: number) => 
    APIService.delete(`/api/schools/staff/${staffId}/`, 'school'),
};

export const MarksAPI = {
  // Generic GET method
  get: async (endpoint: string, config?: any) => {
    try {
      const response = await APIService.get(endpoint, config?.params, 'staff');
      return response;
    } catch (err) {
      console.error('Error in MarksAPI GET:', err);
      throw err;
    }
  },

  // Update marks
  updateResult: async (resultId: string, data: { marks_obtained: number }) => {
    try {
      const response = await APIService.put(`${API_ENDPOINTS.INPUT_MARKS.RESULTS}${resultId}/`, data, 'staff');
      return response;
    } catch (err) {
      console.error('Error updating result:', err);
      throw err;
    }
  },

  // Dropdown data
  getDropdownData: () => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.DROPDOWN_DATA, undefined, 'staff'),
    
  // Class students
  getClassStudents: (classId: string) => 
    APIService.get(`${API_ENDPOINTS.INPUT_MARKS.CLASS_STUDENTS}${classId}/`, undefined, 'staff'),
    
  // Class subjects
  getClassSubjects: (classId: string) => 
    APIService.get(`${API_ENDPOINTS.INPUT_MARKS.CLASS_SUBJECTS}${classId}/`, undefined, 'staff'),
    
  // Input marks
  getResults: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.RESULTS, params, 'staff'),
  createResult: (data: any) => 
    APIService.post(API_ENDPOINTS.INPUT_MARKS.RESULTS, data, 'staff'),
  deleteResult: (id: string) => 
    APIService.delete(`${API_ENDPOINTS.INPUT_MARKS.RESULTS}${id}/`, 'staff'),
    
  // Bulk input
  bulkInput: (data: any) => 
    APIService.post(API_ENDPOINTS.INPUT_MARKS.BULK_INPUT, data, 'staff'),
    
  // Check if results exist
  checkExistingResults: (params: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.RESULTS, params, 'staff'),
    
  // Statistics
  getStatistics: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.STATISTICS, params, 'staff'),
    
  // Analytics
  getStudentAnalytics: (params: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.STUDENT_ANALYTICS, params, 'staff'),
  getClassAnalytics: (params: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.CLASS_ANALYTICS, params, 'staff'),
  getSubjectAnalytics: (params: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.INPUT_MARKS.SUBJECT_ANALYTICS, params, 'staff'),
  getSchoolAnalytics: (params: Record<string, string>) => 
    APIService.get('/api/input-marks/school-analytics/', params, 'school'),
    
  // Statistics Dashboard
  getDashboardSummary: () => 
    APIService.get('/api/statistics/dashboard_summary/', undefined, 'staff'),
  getPerformanceMetrics: () => 
    APIService.get('/api/statistics/performance_metrics/', undefined, 'staff'),
  getComparativeAnalysis: () => 
    APIService.get('/api/statistics/comparative_analysis/', undefined, 'staff'),
};

export const ParentsAPI = {
  // Parent dashboard
  getDashboard: () => 
    APIService.get('/api/parents/dashboard/', undefined, 'parent'),
    
  // Parent analytics
  getStudentAnalytics: (params?: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.PARENTS.STUDENT_ANALYTICS, params, 'parent'),
  verifyToken: () => 
    APIService.post(API_ENDPOINTS.PARENTS.VERIFY_TOKEN, {}, 'parent'),
};

export const ReportsAPI = {
  // Report generation
  getStudentReportData: (params: Record<string, string>, userType: 'staff' | 'parent' = 'staff') => 
    APIService.get(API_ENDPOINTS.REPORTS.STUDENT_REPORT_DATA, params, userType),
  getBulkReportData: (params: Record<string, string>) => 
    APIService.get(API_ENDPOINTS.REPORTS.BULK_REPORT_DATA, params, 'staff'),
};

// Environment configuration
export const setApiBaseUrl = (url: string) => {
  APIService['baseUrl'] = url;
};