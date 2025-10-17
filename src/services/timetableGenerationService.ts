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

const timetableGenerationService = {
  // Generate timetable
  generateTimetable: async (): Promise<GenerateResponse> => {
    const authType = getAuthType();
    const response = await APIService.post(
      '/api/timetable/generate/',
      { force_regenerate: true },
      authType
    );
    return response;
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
  }
};

export default timetableGenerationService;
