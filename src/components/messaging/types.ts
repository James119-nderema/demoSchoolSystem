/**
 * Shared types for the messaging module
 */

export interface StudentOption {
  id: number | string;
  full_name: string;
  admission_number: string;
  assessment_no?: string;
  current_class?: string;
  current_class_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_name?: string;
}

export interface StaffOption {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  role: string;
  is_active: boolean;
}

export interface ClassOption {
  id: number | string;
  name: string;
  class_name?: string;
}

export interface ExamType {
  value: string;
  label: string;
}

export interface SubjectResult {
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  percentage?: number;
  points?: number;
  remarks?: string;
}

export interface StudentResult {
  student: StudentOption;
  results: SubjectResult[];
  average: number;
  grade: string;
  position: number;
  totalStudents: number;
  examType: string;
  totalMarks?: number;
  overallRemarks?: string;
}

export interface SchoolInfo {
  name: string;
  phone: string;
  email: string;
  motto: string;
  principal_name?: string;
}

export interface CreditBalance {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
}

export interface CreditStats {
  total_sent: number;
  total_failed: number;
  total_sessions: number;
}

export interface TopUpPackage {
  sms_count: number;
  amount: number;
  label: string;
}

export const gradeFromAvg = (a: number): string =>
  a >= 80 ? 'A' : a >= 75 ? 'A-' : a >= 70 ? 'B+' : a >= 65 ? 'B'
  : a >= 60 ? 'B-' : a >= 55 ? 'C+' : a >= 50 ? 'C' : a >= 45 ? 'C-'
  : a >= 40 ? 'D+' : a >= 35 ? 'D' : a >= 30 ? 'D-' : 'E';
