export interface FeatureModule {
  slug: string;
  title: string;
  shortDescription: string;
  iconKey: 'results' | 'fees' | 'timetable' | 'library' | 'students' | 'payroll' | 'security';
  benefits: string[];
  overview: string;
  businessValue: string[];
  coreCapabilities: string[];
  workflows: string[];
  integrations: string[];
  idealFor: string[];
}

export const featureModules: FeatureModule[] = [
  {
    slug: 'result-management',
    title: 'Result Management',
    iconKey: 'results',
    shortDescription:
      'Improve academic decision quality with centralized performance data, faster reporting cycles, and board-ready analytics.',
    benefits: [
      'Automated grade calculations',
      'Progress tracking over time',
      'Customizable report cards',
      'Department and class-level analytics',
    ],
    overview:
      'The Result Management module gives schools one trusted academic performance engine. It supports continuous assessment and exam cycles, reduces manual tabulation errors, and provides transparent records for teachers, HODs, directors of studies, and parents.',
    businessValue: [
      'Cut report preparation time from days to minutes',
      'Improve result accuracy with standardized grading logic',
      'Provide leadership with evidence-backed intervention insights',
      'Increase parent trust through timely and consistent reporting',
    ],
    coreCapabilities: [
      'Bulk mark entry and validation controls',
      'Term-wise and year-wise student performance history',
      'Subject, class, and student analytics dashboards',
      'Printable and downloadable report templates',
      'Merit lists, mean score summaries, and grade distributions',
    ],
    workflows: [
      'Teacher enters marks by class and subject',
      'System validates totals, grades, and ranking rules',
      'Class teacher and DOS review reports and statistics',
      'School shares approved reports with parents and stakeholders',
    ],
    integrations: [
      'Timetable module for teaching assignment context',
      'Parent portal for visibility into student performance',
      'Messaging module for targeted academic communication',
    ],
    idealFor: [
      'Academic coordinators and directors of studies',
      'Class teachers managing end-term report cycles',
      'School leaders needing performance analytics for decision making',
    ],
  },
  {
    slug: 'fees-payment',
    title: 'Fees Payment',
    iconKey: 'fees',
    shortDescription:
      'Strengthen school cashflow with transparent billing, faster collections, and cleaner reconciliation workflows.',
    benefits: [
      'M-Pesa integration',
      'Automated receipts',
      'Payment reminders',
      'Finance performance reports',
    ],
    overview:
      'The Fees Payment module centralizes school billing operations from invoice setup to payment confirmation. It removes ambiguity in balances, improves follow-up efficiency, and gives finance teams a clean audit trail of all collections.',
    businessValue: [
      'Increase collection rates with proactive reminders',
      'Reduce manual ledger reconciliation workload',
      'Improve fee visibility for parents and management',
      'Support faster finance reporting and forecasting',
    ],
    coreCapabilities: [
      'Invoice generation by class, stream, or student',
      'Automated receipting for successful payments',
      'Balance tracking with arrears visibility',
      'Manual payment capture with approval controls',
      'Collection and aging reports for management',
    ],
    workflows: [
      'Finance office publishes fee structures and invoices',
      'Parents pay via configured channels (including M-Pesa)',
      'System records payments and updates balances in real time',
      'Bursar reconciles and generates period reports',
    ],
    integrations: [
      'M-Pesa API for digital payment flows',
      'Parent portal for fee statements and receipts',
      'Accounting reports for reconciliation and audit support',
    ],
    idealFor: [
      'Bursars and accountants',
      'School administrators managing collection KPIs',
      'Institutions requiring payment transparency and audit readiness',
    ],
  },
  {
    slug: 'timetable-generation',
    title: 'Timetable Generation',
    iconKey: 'timetable',
    shortDescription:
      'Reduce scheduling delays and protect teaching time with conflict-aware timetable automation.',
    benefits: [
      'AI-powered scheduling',
      'Conflict detection',
      'Teacher availability',
      'Resource-aware allocation',
    ],
    overview:
      'The Timetable Generation module automates class and teacher scheduling while honoring school constraints such as workloads, subject frequency, blocked sessions, and teacher availability.',
    businessValue: [
      'Save administration hours every term',
      'Minimize timetable conflicts and teaching disruptions',
      'Improve fairness in workload distribution',
      'Increase timetable stability across classes and staff',
    ],
    coreCapabilities: [
      'Subject frequency and lesson allocation rules',
      'Teacher-subject-class assignment management',
      'Conflict alerts for room, teacher, and class overlaps',
      'Auto-generation with manual adjustment support',
      'Teacher and class schedule views',
    ],
    workflows: [
      'Admin configures constraints and teaching assignments',
      'System generates candidate timetables',
      'Admin reviews conflicts and applies adjustments',
      'Published timetable is shared with staff and learners',
    ],
    integrations: [
      'Teacher assignment and staff profile records',
      'Academic modules that depend on class/subject structure',
      'Printable schedule exports for noticeboards',
    ],
    idealFor: [
      'Timetable masters and directors of studies',
      'Schools with complex multi-stream scheduling',
      'Institutions moving from manual timetable spreadsheets',
    ],
  },
  {
    slug: 'ai-library',
    title: 'AI-Powered Library',
    iconKey: 'library',
    shortDescription:
      'Control stock movement, improve borrowing accountability, and connect lost-book recovery to finance workflows.',
    benefits: [
      'Smart book recommendations',
      'Digital cataloging',
      'Borrowing management',
      'Lost-book and payment tracking',
    ],
    overview:
      'The Library module digitizes catalog and circulation management with borrower-level accountability, transaction history, and practical workflows for lost or damaged resources.',
    businessValue: [
      'Reduce book losses and untracked circulation',
      'Improve service speed at the library desk',
      'Generate library usage insights for planning',
      'Link penalties to finance workflows for closure',
    ],
    coreCapabilities: [
      'Book catalog and copy-level inventory records',
      'Issue/return workflows with due-date controls',
      'Lost/damaged book handling and status tracking',
      'Borrower history and overdue monitoring',
      'Library activity reports for management',
    ],
    workflows: [
      'Librarian registers resources and copies',
      'Books are issued to students/staff with due dates',
      'Returns, penalties, and exception cases are processed',
      'Reports are generated for stock and circulation review',
    ],
    integrations: [
      'Student and staff profiles for borrower identity',
      'Finance workflows for lost-book payments',
      'Academic support resources for CBC and curriculum alignment',
    ],
    idealFor: [
      'Librarians and school resource managers',
      'Schools needing stronger library accountability',
      'Institutions scaling digital catalog operations',
    ],
  },
  {
    slug: 'student-management',
    title: 'Student Management',
    iconKey: 'students',
    shortDescription:
      'Build one trusted student record for administration, academic coordination, and parent communication.',
    benefits: [
      'Easy enrollment',
      'Attendance tracking',
      'Profile management',
      'Parent-ready visibility',
    ],
    overview:
      'The Student Management module is the core student information system for registration, profile updates, class assignment, and status tracking throughout the learner lifecycle.',
    businessValue: [
      'Eliminate fragmented student records across departments',
      'Improve data quality for finance and academic processes',
      'Speed up admissions, transfers, and profile updates',
      'Enable faster communication with guardians and parents',
    ],
    coreCapabilities: [
      'Student bio-data and admission records',
      'Class and stream assignment management',
      'Parent/guardian contact details and linkage',
      'Status controls for active/inactive learners',
      'Bulk import/export for operations teams',
    ],
    workflows: [
      'Admin captures admission and contact information',
      'Student is assigned to class/stream and activated',
      'Attendance and academic modules consume profile data',
      'Changes are tracked and reflected across modules',
    ],
    integrations: [
      'Results and timetable modules for academic operations',
      'Fees module for billing and statement mapping',
      'Parent portal for household visibility',
    ],
    idealFor: [
      'Admissions and records offices',
      'Administrators managing enrollment at scale',
      'Schools seeking a single source of learner truth',
    ],
  },
  {
    slug: 'payroll-management',
    title: 'Payroll Management',
    iconKey: 'payroll',
    shortDescription:
      'Run salary cycles with confidence using structured deductions, approval workflows, and payment tracking.',
    benefits: [
      'Salary setup by staff role',
      'Automated deductions handling',
      'Payroll batch processing',
      'Payment and remittance reporting',
    ],
    overview:
      'The Payroll module helps schools manage monthly compensation from salary configuration to payment processing. It supports controlled deduction logic, payment status visibility, and finance-ready payroll outputs.',
    businessValue: [
      'Reduce payroll errors and rework',
      'Shorten monthly payroll processing cycles',
      'Improve transparency of staff earnings and deductions',
      'Strengthen audit readiness for salary operations',
    ],
    coreCapabilities: [
      'Staff salary assignment and revision workflows',
      'Deduction rule configuration and recurring deductions',
      'Batch payroll processing for pay periods',
      'Payment status tracking and payout records',
      'Payroll summaries and downloadable reports',
    ],
    workflows: [
      'Finance team configures salary and deduction structures',
      'Payroll run is generated and reviewed for approval',
      'Payments are processed and statuses updated',
      'Reports are shared for accounting and management review',
    ],
    integrations: [
      'Staff profile records for compensation context',
      'Finance and accounting reports for reconciliation',
      'Payment integration settings for payout flows',
    ],
    idealFor: [
      'Bursars and HR/finance operations teams',
      'Schools formalizing monthly payroll controls',
      'Institutions requiring reliable salary documentation',
    ],
  },
  {
    slug: 'secure-reliable',
    title: 'Secure & Reliable',
    iconKey: 'security',
    shortDescription:
      'Operate with confidence using role-based controls, resilient uptime, and secure data handling.',
    benefits: [
      'Data encryption',
      'Role-based access',
      'Daily backups',
      '99.9% service uptime',
    ],
    overview:
      'Security and reliability controls are built into core workflows to keep school data protected, access controlled, and critical services available during busy operational periods.',
    businessValue: [
      'Lower risk of unauthorized access',
      'Maintain confidence in data integrity',
      'Support continuity during high-usage periods',
      'Improve compliance posture for institutional records',
    ],
    coreCapabilities: [
      'Role-based permissions across school, staff, and parent users',
      'Token-based authentication and session controls',
      'Operational logging for troubleshooting and audits',
      'Backup-friendly data model and export options',
      'Resilient architecture for day-to-day school operations',
    ],
    workflows: [
      'Roles are assigned to enforce least-privilege access',
      'Sensitive actions are authenticated and validated',
      'Operational events are logged for review',
      'Backups and exports support recovery and continuity',
    ],
    integrations: [
      'Authentication across unified staff/parent/school flows',
      'Reporting tools for operational governance',
      'Infrastructure-level monitoring and recovery practices',
    ],
    idealFor: [
      'School leaders prioritizing governance and risk control',
      'IT teams supporting multi-role school operations',
      'Institutions requiring dependable platform uptime',
    ],
  },
];

export const featureModuleBySlug = featureModules.reduce<Record<string, FeatureModule>>((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});
