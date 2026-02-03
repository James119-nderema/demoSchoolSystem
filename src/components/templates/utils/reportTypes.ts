// Shared types for report card generation

export interface SchoolInfo {
  id: number;
  school_name: string;
  principal_name: string;
  phone_number: string;
  email: string;
  address: string;
  motto: string;
  vision: string;
  mission: string;
  logo_url: string | null;
  class_teacher_name?: string;
}

export interface ExamResult {
  exam_name: string;
  marks: number;
  grade: string;
}

export interface CBCRating {
  rating: string;
  column: number;
}

export interface SubjectResult {
  subject_name: string;
  subject_code?: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  remarks?: string;
  percentage?: number;
  points?: number;
  position?: number;
  subject_position?: number; // Class rank for this subject
  teacher_initials?: string;
  exam_results?: ExamResult[];
  test_ratings?: CBCRating[];
}

export interface StudentReportData {
  student: {
    id?: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    gender?: string;
    kcpe_marks?: number;
    kcpe_position?: number;
    position?: number;
    total_students?: number;
  };
  results: SubjectResult[];
  overall: {
    total_marks: number;
    average: number;
    grade: string;
    position: number;
    out_of: number;
    class_average?: number;
    points?: number;
    total_points?: number;
    stream_position?: number;
    vap?: string;
    overall_remarks?: string;
  };
  school_info?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string | null;
    motto?: string;
  };
  exam_info?: {
    term: string;
    academic_year: string;
    exam_type: string;
  };
  class_teacher_name?: string;
  class_teacher_remark?: string;
  principal_remark?: string;
  facilitator_remark?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  file: string;
  thumbnail: string;
  type: 'high-school' | 'grade-8' | 'primary';
}

export interface ClassOption {
  id: string;
  class_name: string;
  class_code: string;
}

export interface StudentOption {
  id: string;
  full_name: string;
  admission_number: string;
  current_class: string;
}

export interface ExamTypeOption {
  value: string;
  label: string;
}

export interface TermOption {
  value: string;
  label: string;
}

// Backend response interfaces
export interface BackendSubjectData {
  subject: string;
  subject_code?: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  points?: number;
  remarks?: string;
}

export interface BackendStudentReport {
  school_info: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string | null;
    motto?: string;
  };
  student_info: {
    name: string;
    admission_number: string;
    class?: string;
    class_name?: string;
    position?: number;
    total_students?: number;
  };
  exam_info: {
    term: string;
    academic_year: string;
    exam_type: string;
  };
  subjects: BackendSubjectData[];
  summary: {
    total_marks_obtained: number;
    total_possible_marks: number;
    overall_percentage: number;
    overall_grade: string;
    overall_remarks?: string;
    total_subjects: number;
    total_points?: number;
    position: number;
    total_students?: number;
    class_average?: number;
  };
  class_teacher_name?: string;
}
