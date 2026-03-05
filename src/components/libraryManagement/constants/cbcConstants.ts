/**
 * CBC Learning Areas and Grade Level Constants
 * Aligned with Kenya Institute of Curriculum Development (KICD) structure
 */

import type { CBCGradeLevel, CBCLearningArea, CBCLevelCategory, ResourceType } from '../types';

// ─── CBC Learning Areas ──────────────────────────────────────────────────────
export const CBC_LEARNING_AREAS: { value: CBCLearningArea; label: string }[] = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Integrated Science', label: 'Integrated Science' },
  { value: 'English', label: 'English' },
  { value: 'Kiswahili', label: 'Kiswahili' },
  { value: 'Creative Arts & Sports', label: 'Creative Arts & Sports' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'CRE', label: 'Christian Religious Education (CRE)' },
  { value: 'IRE', label: 'Islamic Religious Education (IRE)' },
  { value: 'Home Science', label: 'Home Science' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Pre-Technical Studies', label: 'Pre-Technical Studies' },
  { value: 'Business Studies', label: 'Business Studies' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Health Education', label: 'Health Education' },
  { value: 'Life Skills', label: 'Life Skills' },
  { value: 'Foreign Languages', label: 'Foreign Languages' },
  { value: 'General', label: 'General / Cross-cutting' },
];

// ─── CBC Grade Levels ────────────────────────────────────────────────────────
export const CBC_GRADE_LEVELS: { value: CBCGradeLevel; label: string; category: CBCLevelCategory }[] = [
  { value: 'PP1', label: 'PP1', category: 'Pre-Primary' },
  { value: 'PP2', label: 'PP2', category: 'Pre-Primary' },
  { value: 'Grade 1', label: 'Grade 1', category: 'Primary' },
  { value: 'Grade 2', label: 'Grade 2', category: 'Primary' },
  { value: 'Grade 3', label: 'Grade 3', category: 'Primary' },
  { value: 'Grade 4', label: 'Grade 4', category: 'Primary' },
  { value: 'Grade 5', label: 'Grade 5', category: 'Primary' },
  { value: 'Grade 6', label: 'Grade 6', category: 'Primary' },
  { value: 'Grade 7', label: 'Grade 7', category: 'Junior Secondary' },
  { value: 'Grade 8', label: 'Grade 8', category: 'Junior Secondary' },
  { value: 'Grade 9', label: 'Grade 9', category: 'Junior Secondary' },
  { value: 'Grade 10', label: 'Grade 10', category: 'Senior Secondary' },
  { value: 'Grade 11', label: 'Grade 11', category: 'Senior Secondary' },
  { value: 'Grade 12', label: 'Grade 12', category: 'Senior Secondary' },
];

export const CBC_LEVEL_CATEGORIES: CBCLevelCategory[] = [
  'Pre-Primary',
  'Primary',
  'Junior Secondary',
  'Senior Secondary',
];

// ─── Resource Types ──────────────────────────────────────────────────────────
export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'textbook', label: 'Textbook', icon: '📘' },
  { value: 'supplementary_reader', label: 'Supplementary Reader', icon: '📖' },
  { value: 'digital_resource', label: 'Digital Resource', icon: '💻' },
  { value: 'newspaper', label: 'Newspaper', icon: '📰' },
  { value: 'periodical', label: 'Periodical / Magazine', icon: '📑' },
  { value: 'reference', label: 'Reference Material', icon: '📚' },
  { value: 'fiction', label: 'Fiction', icon: '📕' },
  { value: 'non_fiction', label: 'Non-Fiction', icon: '📗' },
];

// ─── Book Conditions ─────────────────────────────────────────────────────────
export const BOOK_CONDITIONS: { value: string; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'worn', label: 'Worn', color: 'bg-orange-100 text-orange-800' },
  { value: 'damaged', label: 'Damaged', color: 'bg-red-100 text-red-800' },
  { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-800' },
];

// ─── Default Fine Configuration (KES) ────────────────────────────────────────
export const DEFAULT_FINE_CONFIG = {
  daily_rate: 10,          // KES 10 per day
  max_fine_per_book: 500,  // Max KES 500 per book
  lost_book_multiplier: 2, // 2x book price
  grace_period_days: 1,    // 1 day grace period
};

// ─── Default Library Settings ────────────────────────────────────────────────
export const DEFAULT_LIBRARY_SETTINGS = {
  max_books_per_student: 3,
  max_books_per_teacher: 5,
  default_loan_days_student: 14,
  default_loan_days_teacher: 30,
  max_renewals: 2,
  fine_config: DEFAULT_FINE_CONFIG,
  opening_hours: '08:00',
  closing_hours: '17:00',
};

// ─── Borrowing Status Labels ─────────────────────────────────────────────────
export const BORROWING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800' },
  returned: { label: 'Returned', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' },
  lost: { label: 'Lost', color: 'bg-gray-100 text-gray-800' },
  renewed: { label: 'Renewed', color: 'bg-purple-100 text-purple-800' },
};
