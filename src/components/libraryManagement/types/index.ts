/**
 * Library Management System — Type Definitions
 * Aligned with Kenya CBC curriculum structure
 */

// ─── CBC Learning Areas ──────────────────────────────────────────────────────
export type CBCLearningArea =
  | 'Mathematics'
  | 'Integrated Science'
  | 'English'
  | 'Kiswahili'
  | 'Creative Arts & Sports'
  | 'Social Studies'
  | 'CRE'
  | 'IRE'
  | 'Home Science'
  | 'Agriculture'
  | 'Pre-Technical Studies'
  | 'Business Studies'
  | 'Computer Science'
  | 'Health Education'
  | 'Life Skills'
  | 'Foreign Languages'
  | 'General';

export type CBCGradeLevel =
  | 'PP1' | 'PP2'
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6'
  | 'Grade 7' | 'Grade 8' | 'Grade 9'
  | 'Grade 10' | 'Grade 11' | 'Grade 12';

export type CBCLevelCategory = 'Pre-Primary' | 'Primary' | 'Junior Secondary' | 'Senior Secondary';

export type ResourceType = 'textbook' | 'supplementary_reader' | 'digital_resource' | 'newspaper' | 'periodical' | 'reference' | 'fiction' | 'non_fiction';

export type BookCondition = 'new' | 'good' | 'fair' | 'worn' | 'damaged' | 'lost';

export type BorrowingStatus = 'active' | 'returned' | 'overdue' | 'lost' | 'renewed';

export type MemberType = 'student' | 'teacher' | 'staff';

export type FineStatus = 'pending' | 'paid' | 'waived';

// ─── Book / Resource ─────────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publication_year: number;
  edition?: string;
  resource_type: ResourceType;
  learning_areas: string[];   // Subject names from database
  grade_levels: string[];     // Class names from database
  subject_integration_tags: string[];  // A book may serve multiple learning areas
  is_kicd_approved: boolean;
  kicd_approval_number?: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  cover_image?: string;
  description?: string;
  condition: BookCondition;
  digital_url?: string;
  barcode?: string;
  price: number;
  date_acquired: string;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publication_year: number;
  edition?: string;
  resource_type: ResourceType;
  learning_areas: string[];   // Subject names from database
  grade_levels: string[];     // Class names from database
  subject_integration_tags: string[];
  is_kicd_approved: boolean;
  kicd_approval_number?: string;
  total_copies: number;
  shelf_location: string;
  cover_image?: string;
  description?: string;
  condition: BookCondition;
  digital_url?: string;
  barcode?: string;
  price?: number;
  date_acquired: string;
}

// ─── Book Copy (unique identifier per physical copy) ─────────────────────────
export interface BookCopy {
  id: string;
  book_id: string;
  copy_uid: string;          // Unique char identifier e.g. "MAT-001-A"
  is_available: boolean;
  condition: BookCondition;
  assigned_to?: string;      // member_id when borrowed
  created_at: string;
}

export interface BookCopyFormData {
  book_id: string;
  copy_uid: string;
}

export interface BookCopyBulkResponse {
  created: BookCopy[];
  failed: string[];
  created_count: number;
  failed_count: number;
}

// ─── Library Member ──────────────────────────────────────────────────────────
export interface LibraryMember {
  id: string;
  member_type: MemberType;
  full_name: string;
  admission_number?: string;  // students
  staff_id?: string;          // staff/teachers
  grade?: string;
  stream?: string;
  phone_number?: string;
  email?: string;
  is_active: boolean;
  total_borrowed: number;
  total_returned: number;
  current_borrowed: number;
  outstanding_fines: number;
  created_at: string;
}

// ─── Borrowing Transaction ───────────────────────────────────────────────────
export interface BorrowingRecord {
  id: string;
  book: Book;
  member: LibraryMember;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: BorrowingStatus;
  renewals_count: number;
  max_renewals: number;
  fine_amount: number;
  fine_status: FineStatus;
  notes?: string;
  issued_by: string;
  returned_to?: string;
  created_at: string;
}

export type BorrowingMode = 'individual' | 'class';

export interface IssueBorrowingData {
  book_id: string;
  member_id: string;
  member_type: 'student' | 'staff';
  due_date: string;
  notes?: string;
  copy_uid?: string;         // unique book copy identifier
  borrowing_mode?: BorrowingMode;
}

export interface ClassBorrowingAssignment {
  student_id: string;
  student_name: string;
  admission_number: string;
  copy_uid: string;
}

export interface ClassBorrowingData {
  book_id: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  subject: string;
  due_date: string;
  assignments: ClassBorrowingAssignment[];
}

export interface ReturnData {
  borrowing_id: string;
  condition_on_return: BookCondition;
  notes?: string;
}

// ─── CBC Project Resource Tracking ───────────────────────────────────────────
export interface ProjectResourceRequest {
  id: string;
  student: LibraryMember;
  project_title: string;
  learning_area: CBCLearningArea;
  grade_level: CBCGradeLevel;
  resources_needed: string[];
  resources_allocated: Book[];
  status: 'pending' | 'allocated' | 'completed' | 'returned';
  due_date: string;
  notes?: string;
  created_at: string;
}

// ─── Reading Corner Log ──────────────────────────────────────────────────────
export interface ReadingCornerEntry {
  id: string;
  student: LibraryMember;
  date: string;
  start_time: string;
  end_time?: string;
  book_read?: Book;
  learning_area?: CBCLearningArea;
  pages_read?: number;
  notes?: string;
  logged_by: string;
}

// ─── Fine Configuration ──────────────────────────────────────────────────────
export interface FineConfig {
  daily_rate: number;
  max_fine_per_book: number;
  lost_book_multiplier: number;
  grace_period_days: number;
}

// ─── Reports / Analytics ─────────────────────────────────────────────────────
export interface CirculationStats {
  total_books: number;
  total_copies: number;
  books_borrowed: number;
  books_available: number;
  total_members: number;
  active_borrowers: number;
  overdue_count: number;
  total_issued: number;
  total_returned: number;
  currently_borrowed: number;
  total_fines_pending: number;
  fines_collected: number;
  books_by_type: { type: ResourceType; count: number }[];
  borrowing_trend: { date: string; count: number }[];
  by_learning_area: { learning_area: string; count: number }[];
  by_grade: { grade: string; count: number }[];
}

export interface PopularBookEntry {
  book_id: string;
  book: Book;
  title: string;
  borrow_count: number;
  learning_area: CBCLearningArea;
  grade_level: CBCGradeLevel;
}

export interface OverdueEntry {
  borrowing_id: string;
  borrowing: BorrowingRecord;
  book_title: string;
  member_name: string;
  due_date: string;
  days_overdue: number;
  fine_amount: number;
}

export interface InventoryEntry {
  book_id: string;
  title: string;
  isbn?: string;
  learning_area: string;
  book: Book;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
  lost_copies: number;
  damaged_copies: number;
  condition_summary: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface LibraryDashboardStats {
  total_books: number;
  total_copies: number;
  available_copies: number;
  active_loans: number;
  overdue_loans: number;
  total_members: number;
  pending_fines: number;
  books_added_this_month: number;
  returns_today: number;
  issues_today: number;
  popular_books: PopularBookEntry[];
  recent_activity: RecentActivityEntry[];
  borrowing_by_grade: { grade: CBCGradeLevel; count: number }[];
  borrowing_by_learning_area: { area: CBCLearningArea; count: number }[];
}

export interface RecentActivityEntry {
  id: string;
  type: 'issue' | 'return' | 'fine_paid' | 'book_added' | 'renewal';
  description: string;
  member_name?: string;
  book_title?: string;
  timestamp: string;
}

// ─── School Overview (from existing endpoints) ───────────────────────────────
export interface SchoolOverview {
  total_students: number;
  total_classes: number;
  total_subjects: number;
  total_assessments: number;
  overall_average: number;
}

export interface PerformanceSummary {
  excellent: number;
  good: number;
  average: number;
  below_average: number;
}

export interface ClassRanking {
  class_name: string;
  class_code: string;
  average: number;
  student_count: number;
  total_assessments: number;
  rank: number;
}

export interface TopSubject {
  subject_name: string;
  subject_code: string;
  average: number;
  std_deviation: number;
  assessments: number;
}

export interface DashboardData {
  school_overview: SchoolOverview;
  performance_summary: PerformanceSummary;
  class_rankings_by_stream: Record<string, ClassRanking[]>;
  top_subjects: TopSubject[];
  // Library-specific data (when library API is available)
  library?: LibraryDashboardStats;
}

// ─── Procurement ─────────────────────────────────────────────────────────────
export interface ProcurementRequest {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  resource_type: ResourceType;
  learning_areas: CBCLearningArea[];
  grade_levels: CBCGradeLevel[];
  quantity: number;
  estimated_cost: number;
  reason: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'ordered' | 'received' | 'rejected';
  approved_by?: string;
  notes?: string;
  created_at: string;
}

// ─── Library Settings ────────────────────────────────────────────────────────
export interface LibrarySettings {
  max_books_per_student: number;
  max_books_per_teacher: number;
  default_loan_days_student: number;
  default_loan_days_teacher: number;
  max_renewals: number;
  fine_config: FineConfig;
  opening_hours: string;
  closing_hours: string;
}

// ─── Tab definitions ─────────────────────────────────────────────────────────
export type LibraryTab =
  | 'dashboard'
  | 'catalog'
  | 'borrowing'
  | 'members'
  | 'cbc-resources'
  | 'reports'
  | 'settings';
