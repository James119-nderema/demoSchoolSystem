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
  created_at: string;
  updated_at: string;
}

export interface SubjectPriorityCreateData {
  subject: string;
  time_slot: string;
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
