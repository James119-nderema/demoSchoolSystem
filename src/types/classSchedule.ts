export interface ClassSchedule {
  id: string;
  school: string;
  day_of_week: string;
  class_name: string;
  class_name_display: string;
  time_slot: string;
  time_slot_display: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  date_created: string;
  date_updated: string;
}

export interface ClassScheduleCreateData {
  days: string[];
  classes: string[];
  time_slots: string[];
}

export interface ClassScheduleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassSchedule[];
}

export interface ClassScheduleStatsResponse {
  total_schedules: number;
  active_schedules: number;
  schedules_by_day: Record<string, number>;
}
