import { APIService } from './baseUrl';
import type {
  GenerateResponse,
  TimetableByClassResponse,
  FailedScheduleResponse,
  TimetableStats
} from '../types/generatedTimetable';

const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('access_token') ? 'school' : 'staff';
};

interface GenerationStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  message?: string;
  elapsed_seconds?: number;
  result?: GenerateResponse['data'];
  error?: string;
}

const timetableGenerationService = {
  // Start timetable generation (async - returns immediately)
  generateTimetable: async (): Promise<GenerateResponse> => {
    const authType = getAuthType();
    const response = await APIService.post(
      '/api/timetable/generate/',
      { force_regenerate: true },
      authType
    );
    return response;
  },

  // Get generation status (for polling)
  getGenerationStatus: async (): Promise<GenerationStatus> => {
    const authType = getAuthType();
    const response = await APIService.get('/api/timetable/generate/status/', {}, authType);
    return response;
  },

  // Generate with polling - waits for completion
  generateTimetableWithPolling: async (
    onProgress?: (status: GenerationStatus) => void,
    pollInterval: number = 2000,
    maxWaitTime: number = 300000 // 5 minutes max
  ): Promise<GenerateResponse> => {
    const authType = getAuthType();
    
    // Start generation
    await APIService.post(
      '/api/timetable/generate/',
      { force_regenerate: true },
      authType
    );
    
    // Poll for status
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const status = await timetableGenerationService.getGenerationStatus();
      
      if (onProgress) {
        onProgress(status);
      }
      
      if (status.status === 'completed') {
        const defaultData = {
          success: true,
          generation_batch: '',
          total_slots: 0,
          filled: 0,
          failed: 0
        };
        return {
          message: status.message || 'Timetable generation completed',
          data: status.result ? status.result : defaultData
        };
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Timetable generation failed');
      }
      
      // If idle, generation may not have started yet or was already done
      if (status.status === 'idle') {
        // Check if we have timetable data
        break;
      }
    }
    
    throw new Error('Timetable generation timed out');
  },

  // Get timetable organized by class
  getTimetableByClass: async (): Promise<TimetableByClassResponse> => {
    const authType = getAuthType();
    const response = await APIService.get('/api/timetable/by-class/', {}, authType);
    return response;
  },

  // Get failed schedules
  getFailedSchedules: async (page: number = 1, search: string = ''): Promise<FailedScheduleResponse> => {
    const authType = getAuthType();
    const params: Record<string, string> = {
      page: page.toString()
    };
    
    if (search) {
      params.search = search;
    }
    
    const response = await APIService.get('/api/timetable/failed/', params, authType);
    return response;
  },

  // Get timetable statistics
  getStats: async (): Promise<TimetableStats> => {
    const authType = getAuthType();
    const response = await APIService.get('/api/timetable/stats/', {}, authType);
    return response;
  },

  // Clear timetable
  clearTimetable: async (): Promise<{ message: string }> => {
    const authType = getAuthType();
    const response = await APIService.delete('/api/timetable/clear/', authType);
    return response;
  },

  // Start single-class timetable generation (async - returns immediately)
  generateClassTimetable: async (classId: string): Promise<{ message: string; status: string; class_id: string; class_name: string }> => {
    const authType = getAuthType();
    const response = await APIService.post(
      `/api/timetable/generate/class/${classId}/`,
      {},
      authType
    );
    return response;
  },

  // Get single-class generation status (for polling)
  getClassGenerationStatus: async (classId: string): Promise<GenerationStatus> => {
    const authType = getAuthType();
    const response = await APIService.get(`/api/timetable/generate/class/${classId}/status/`, {}, authType);
    return response;
  },

  // Generate single class with polling - waits for completion
  generateClassTimetableWithPolling: async (
    classId: string,
    onProgress?: (status: GenerationStatus) => void,
    pollInterval: number = 2000,
    maxWaitTime: number = 300000 // 5 minutes max
  ): Promise<GenerateResponse> => {
    // Start generation
    await timetableGenerationService.generateClassTimetable(classId);

    // Poll for status
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const status = await timetableGenerationService.getClassGenerationStatus(classId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        const defaultData = {
          success: true,
          generation_batch: '',
          total_slots: 0,
          filled: 0,
          failed: 0
        };
        return {
          message: status.message || 'Class timetable generation completed',
          data: status.result ? status.result : defaultData
        };
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Class timetable generation failed');
      }

      if (status.status === 'idle') {
        break;
      }
    }

    throw new Error('Class timetable generation timed out');
  }
};

export default timetableGenerationService;
