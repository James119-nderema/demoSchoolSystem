export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  school_name: string;
  is_active: boolean;
  date_joined: string | null;
}

export interface TeacherCreateData {
  full_name: string;
  phone_number?: string;
}

export interface TeacherCreateResponse {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  temporary_password: string;
  message: string;
}

export interface TeacherUpdateData {
  full_name?: string;
  phone_number?: string;
}

export interface TeacherResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Teacher[];
}

export interface TeacherStatsResponse {
  total_teachers: number;
  active_teachers: number;
}
