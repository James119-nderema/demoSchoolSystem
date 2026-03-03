import { APIService } from './baseUrl';

interface ScheduleEntry {
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

interface TeacherSchedule {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  schedule: {
    [day: string]: {
      [time_slot: string]: ScheduleEntry[];
    };
  };
}

interface TimeSlot {
  time_slot: string;
  start_time: string;
  end_time: string;
  label: string;
}

interface AllTeachersResponse {
  teachers: TeacherSchedule[];
  timeslots: TimeSlot[];
  days: string[];
}

const allTeachersScheduleService = {
  /**
   * Get schedules for all teachers in the school
   * Only accessible to Director of Studies
   */
  getAllTeachersSchedules: async (): Promise<AllTeachersResponse> => {
    return await APIService.get<AllTeachersResponse>(
      '/api/timetable/all-teachers/',
      undefined,
      'staff'
    );
  },
};

export default allTeachersScheduleService;
export type { ScheduleEntry, TeacherSchedule, TimeSlot, AllTeachersResponse };
