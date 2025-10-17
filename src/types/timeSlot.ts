// Types for TimeSlot API
export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  start_time_display: string;
  end_time_display: string;
  time_range_display: string;
  class_level: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  is_active: boolean;
  school_id: string;
  school_name: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotCreate {
  start_time: string;
  end_time: string;
  class_level: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  is_active?: boolean;
}

export interface TimeSlotUpdate {
  start_time?: string;
  end_time?: string;
  class_level?: 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  is_active?: boolean;
}

export interface TimeSlotStatistics {
  total_slots: number;
  active_slots: number;
  inactive_slots: number;
  class_level_distribution: {
    [key: string]: number;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
