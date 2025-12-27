export interface GeneratedTimetableEntry {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  day: string;
  time_slot: string;
  start_time: string;
  end_time: string;
  generation_batch: string;
  created_at: string;
}

export interface TimetableByClass {
  class_id: string;
  class_name: string;
  timetable: {
    [day: string]: {
      [timeslot: string]: {
        subject_id: string;
        subject_name: string;
        teacher_id: string;
        teacher_name: string;
        teacher_index?: number;
        start_time: string;
        end_time: string;
      };
    };
  };
}

export interface TeacherIndexInfo {
  id: string;
  index: number;
  name: string;
  email: string;
}

export interface FailedSchedule {
  id: string;
  class_name: string | null;
  subject_name: string | null;
  teacher_name: string | null;
  day: string | null;
  time_slot: string | null;
  reason: string;
  created_at: string;
}

export interface GenerationLog {
  id: string;
  generation_batch: string;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  total_slots_to_fill: number;
  slots_filled: number;
  slots_failed: number;
  success_rate: number;
  algorithm_used: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface TimetableStats {
  total_entries: number;
  total_failed: number;
  total_classes_scheduled: number;
  latest_generation: GenerationLog | null;
}

export interface GenerateResponse {
  message: string;
  data: {
    success: boolean;
    generation_batch: string;
    total_slots: number;
    filled: number;
    failed: number;
  };
}

export interface TimetableByClassResponse {
  count: number;
  results: TimetableByClass[];
  teachers?: TeacherIndexInfo[];
}

export interface FailedScheduleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FailedSchedule[];
}
