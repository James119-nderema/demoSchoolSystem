export interface Class {
  id: string; // Changed from number to string for UUID
  school_id: number;
  school_name: string;
  class_name: string;
  class_code: string; // Represents type/category of class
  description?: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClassData {
  class_name: string;
  class_code: string;
  description?: string;
  capacity: number;
  is_active: boolean;
}

export interface ClassStats {
  total_classes: number;
  active_classes: number;
  inactive_classes: number;
}

export interface ClassApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Class[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[] | Record<string, string[]>;
  warnings?: string[];
}
