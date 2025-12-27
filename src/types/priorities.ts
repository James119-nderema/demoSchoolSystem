export interface SubjectPriority {
  id: string;
  school: string;
  subject: string;
  subject_name: string;
  subject_code?: string;
  time_slot: string;
  start_time: string;
  end_time: string;
  time_slot_display: string;
  teacher?: string | null;
  teacher_name?: string | null;
  teacher_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectPriorityCreateData {
  subject: string;
  time_slot: string;
  teacher?: string | null;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

export interface TeachersBySubjectResponse {
  success: boolean;
  results: Teacher[];
  message?: string;
}

export interface SubjectPriorityResponse {
  success: boolean;
  message?: string;
  data?: {
    results: SubjectPriority[];
    count: number;
    next?: string;
    previous?: string;
  };
  errors?: Record<string, string[]>;
}

export interface SubjectPriorityStatsResponse {
  success: boolean;
  data?: {
    total_priorities: number;
  };
  message?: string;
}
