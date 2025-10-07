import { staffAPI } from '../utils/api';

interface TimetableEntry {
  id: string;
  subject: string;
  subject_id: string;
  class: string;
  class_id: string;
  start_time: string;
  end_time: string;
}

interface TimeSlot {
  id: string;
  slot: string;
  start_time: string;
  end_time: string;
}

interface TeacherTimetableResponse {
  success: boolean;
  timetable: {
    [day: string]: {
      [timeSlot: string]: TimetableEntry[];
    };
  };
  time_slots: TimeSlot[];
  days: string[];
  teacher_name: string;
  total_classes: number;
}

interface TeacherStatsResponse {
  success: boolean;
  stats: {
    total_periods: number;
    classes_taught: number;
    subjects_taught: number;
    periods_per_day: {
      [day: string]: number;
    };
    subjects_breakdown: {
      [subject: string]: number;
    };
  };
}

const teacherTimetableService = {
  /**
   * Get the authenticated teacher's timetable
   */
  getMyTimetable: async (): Promise<TeacherTimetableResponse> => {
    const response = await staffAPI.get('/timetable/teacher/my-timetable/');
    return response.data;
  },

  /**
   * Get statistics about the teacher's timetable
   */
  getMyStats: async (): Promise<TeacherStatsResponse> => {
    const response = await staffAPI.get('/timetable/teacher/my-stats/');
    return response.data;
  },
};

export default teacherTimetableService;
export type { TimetableEntry, TimeSlot, TeacherTimetableResponse, TeacherStatsResponse };
