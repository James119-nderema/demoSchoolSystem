import { APIService } from './baseUrl';

// Use the same structure as AllTeachersSchedule
interface TimetableEntry {
  subject: string;
  subject_abbreviation?: string;
  subject_id: number;
  class: string;
  class_id: number;
  start_time: string;
  end_time: string;
  time_slot: string;
  block_identifier: string | null;
  block_name?: string;
  is_block: boolean;
}

// Match AllTeachersSchedule TimeSlot structure
interface TimeSlot {
  time_slot: string;  // Changed from 'slot' to 'time_slot'
  start_time: string;
  end_time: string;
  label: string;
}

interface TeacherTimetableResponse {
  success: boolean;
  timetable: {
    [day: string]: {
      [timeSlot: string]: TimetableEntry[];
    };
  };
  timeslots: TimeSlot[];  // Changed from time_slots to timeslots
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
    const response = await APIService.get<TeacherTimetableResponse>(
      '/api/timetable/teacher/my-timetable/',
      undefined,
      'staff'
    );
    return response;
  },

  /**
   * Get statistics about the teacher's timetable
   */
  getMyStats: async (): Promise<TeacherStatsResponse> => {
    const response = await APIService.get<TeacherStatsResponse>(
      '/api/timetable/teacher/my-stats/',
      undefined,
      'staff'
    );
    return response;
  },
};

export default teacherTimetableService;
export type { TimetableEntry, TimeSlot, TeacherTimetableResponse, TeacherStatsResponse };
