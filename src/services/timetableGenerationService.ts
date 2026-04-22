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

  // Probe whether timetable data is already available
  hasAnyTimetableData: async (): Promise<boolean> => {
    try {
      const byClass = await timetableGenerationService.getTimetableByClass();
      return Array.isArray(byClass?.results) && byClass.results.length > 0;
    } catch {
      return false;
    }
  },

  // Probe whether a specific class timetable is already available
  hasClassTimetableData: async (classId: string): Promise<boolean> => {
    try {
      const byClass = await timetableGenerationService.getTimetableByClass();
      return Array.isArray(byClass?.results) && byClass.results.some((row) => row.class_id === classId);
    } catch {
      return false;
    }
  },

  // Generate with polling - waits for completion
  generateTimetableWithPolling: async (
    onProgress?: (status: GenerationStatus) => void,
    pollInterval: number = 2000,
    maxWaitTime: number = 900000 // 15 minutes max
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
    let sawRunning = false;
    let idleStreak = 0;
    
    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      let status: GenerationStatus;
      try {
        status = await timetableGenerationService.getGenerationStatus();
      } catch {
        // transient polling error, continue until max wait time
        continue;
      }
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'running') {
        sawRunning = true;
        idleStreak = 0;
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
      
      if (status.status === 'idle') {
        idleStreak += 1;

        // On multi-worker deployments, status can appear idle even while generation runs elsewhere.
        // If data exists, treat as completed.
        const hasData = await timetableGenerationService.hasAnyTimetableData();
        if (hasData) {
          return {
            message: 'Timetable generation completed',
            data: {
              success: true,
              generation_batch: '',
              total_slots: 0,
              filled: 0,
              failed: 0,
            },
          };
        }

        // Keep waiting through transient idle reads.
        if (!sawRunning && idleStreak <= 10) {
          continue;
        }
      }
    }

    // Final check before timing out
    try {
      const finalStatus = await timetableGenerationService.getGenerationStatus();
      if (finalStatus.status === 'completed') {
        return {
          message: finalStatus.message || 'Timetable generation completed',
          data: finalStatus.result
            ? finalStatus.result
            : {
                success: true,
                generation_batch: '',
                total_slots: 0,
                filled: 0,
                failed: 0,
              },
        };
      }
      if (finalStatus.status === 'running') {
        throw new Error('Timetable generation is still running in the background. Please wait and refresh in a minute.');
      }
    } catch {
      // fall through to data probe below
    }

    const hasData = await timetableGenerationService.hasAnyTimetableData();
    if (hasData) {
      return {
        message: 'Timetable generation completed',
        data: {
          success: true,
          generation_batch: '',
          total_slots: 0,
          filled: 0,
          failed: 0,
        },
      };
    }

    throw new Error('Timetable generation timed out. The server may still be processing; please refresh shortly.');
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
    maxWaitTime: number = 900000 // 15 minutes max
  ): Promise<GenerateResponse> => {
    // Start generation
    await timetableGenerationService.generateClassTimetable(classId);

    // Poll for status
    const startTime = Date.now();
    let sawRunning = false;
    let idleStreak = 0;

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      let status: GenerationStatus;
      try {
        status = await timetableGenerationService.getClassGenerationStatus(classId);
      } catch {
        continue;
      }

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'running') {
        sawRunning = true;
        idleStreak = 0;
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
        idleStreak += 1;

        const hasClassData = await timetableGenerationService.hasClassTimetableData(classId);
        if (hasClassData) {
          return {
            message: 'Class timetable generation completed',
            data: {
              success: true,
              generation_batch: '',
              total_slots: 0,
              filled: 0,
              failed: 0,
            },
          };
        }

        if (!sawRunning && idleStreak <= 10) {
          continue;
        }
      }
    }

    try {
      const finalStatus = await timetableGenerationService.getClassGenerationStatus(classId);
      if (finalStatus.status === 'completed') {
        return {
          message: finalStatus.message || 'Class timetable generation completed',
          data: finalStatus.result
            ? finalStatus.result
            : {
                success: true,
                generation_batch: '',
                total_slots: 0,
                filled: 0,
                failed: 0,
              },
        };
      }
      if (finalStatus.status === 'running') {
        throw new Error('Class timetable generation is still running in the background. Please wait and refresh in a minute.');
      }
    } catch {
      // continue to data probe
    }

    const hasClassData = await timetableGenerationService.hasClassTimetableData(classId);
    if (hasClassData) {
      return {
        message: 'Class timetable generation completed',
        data: {
          success: true,
          generation_batch: '',
          total_slots: 0,
          filled: 0,
          failed: 0,
        },
      };
    }

    throw new Error('Class timetable generation timed out. The server may still be processing; please refresh shortly.');
  }
};

export default timetableGenerationService;
