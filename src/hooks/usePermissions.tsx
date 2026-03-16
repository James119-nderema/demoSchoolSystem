import { useState, useEffect } from 'react';
import { normalizePackages, type SchoolPackage } from '../config/packageAccess';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: string;
  school_name: string;
  phone_number: string;
  role: string;
  permissions: string[];
  selected_packages?: string[];
}

// Full permissions for school admin (ADMINISTRATIVE_STAFF)
const ADMIN_STAFF_PERMISSIONS = [
  'manage_students', 'view_students', 'view_all_students',
  'manage_classes', 'view_classes', 'view_all_classes',
  'manage_subjects', 'view_subjects',
  'manage_staff', 'view_staff',
  'manage_timetable', 'generate_timetable', 'view_timetable', 'view_all_timetables',
  'input_marks', 'view_results', 'view_all_results', 'manage_grades',
  'view_statistics', 'view_all_statistics',
  'view_reports', 'download_reports', 'download_all_reports',
  'manage_finance', 'view_finance',
  'manage_payroll', 'view_payroll',
  'access_school_profile',
  'view_national_results', 'manage_national_results',
  'manage_library', 'view_library'
];

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [selectedPackages, setSelectedPackages] = useState<SchoolPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const PERMISSION_FEATURES: Record<string, SchoolPackage | 'GLOBAL'> = {
    manage_timetable: 'TIMETABLE',
    generate_timetable: 'TIMETABLE',
    view_timetable: 'TIMETABLE',
    view_all_timetables: 'TIMETABLE',
    input_marks: 'REPORT_MANAGEMENT',
    view_results: 'REPORT_MANAGEMENT',
    view_all_results: 'REPORT_MANAGEMENT',
    manage_grades: 'REPORT_MANAGEMENT',
    view_statistics: 'REPORT_MANAGEMENT',
    view_class_statistics: 'REPORT_MANAGEMENT',
    view_all_statistics: 'REPORT_MANAGEMENT',
    view_reports: 'REPORT_MANAGEMENT',
    download_reports: 'REPORT_MANAGEMENT',
    download_class_reports: 'REPORT_MANAGEMENT',
    download_all_reports: 'REPORT_MANAGEMENT',
    generate_reports: 'REPORT_MANAGEMENT',
    view_national_results: 'REPORT_MANAGEMENT',
    manage_national_results: 'REPORT_MANAGEMENT',
    view_finance: 'FEE_MANAGEMENT',
    manage_finance: 'FEE_MANAGEMENT',
    view_fee_reports: 'FEE_MANAGEMENT',
    generate_fee_reports: 'FEE_MANAGEMENT',
    view_payroll: 'PAYROLL',
    manage_payroll: 'PAYROLL',
    view_library: 'LIBRARY_MANAGEMENT',
    manage_library: 'LIBRARY_MANAGEMENT',
  };

  const filterPermissionsByPackages = (rawPermissions: string[], packages: SchoolPackage[]) => {
    if (packages.length === 0) return rawPermissions;
    return rawPermissions.filter(permission => {
      const feature = PERMISSION_FEATURES[permission] || 'GLOBAL';
      if (feature === 'GLOBAL') return true;
      return packages.includes(feature);
    });
  };

  useEffect(() => {
    // First check for staff_info
    const staffInfo = localStorage.getItem('staff_info');
    if (staffInfo) {
      try {
        const info: StaffInfo = JSON.parse(staffInfo);
        const packages = normalizePackages((info as any).selected_packages || []);
        setSelectedPackages(packages);
        setPermissions(filterPermissionsByPackages(info.permissions || [], packages));
        setRole(info.role || '');
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing staff info:', error);
      }
    }
    
    // Then check for school_info (school admin login)
    const schoolInfo = localStorage.getItem('school_info');
    if (schoolInfo) {
      try {
        // School admins get full ADMINISTRATIVE_STAFF permissions
        const parsed = JSON.parse(schoolInfo);
        const packages = normalizePackages(parsed.selected_packages || []);
        setSelectedPackages(packages);
        setPermissions(filterPermissionsByPackages(ADMIN_STAFF_PERMISSIONS, packages));
        setRole('ADMINISTRATIVE_STAFF');
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing school info:', error);
      }
    }
    
    setLoading(false);
  }, []);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  // Specific permission checks based on your roles
  const canManageStudents = (): boolean => hasPermission('manage_students');
  const canViewStudents = (): boolean => 
    (role !== 'LIBRARIAN' && hasPermission('view_students')) || 
    hasPermission('view_assigned_students') || 
    hasPermission('manage_students');
  
  const canManageClasses = (): boolean => hasPermission('manage_classes');
  const canViewClasses = (): boolean => 
    hasPermission('view_classes') || 
    hasPermission('view_assigned_classes') || 
    hasPermission('manage_classes');
  
  const canManageSubjects = (): boolean => hasPermission('manage_subjects');
  const canViewSubjects = (): boolean => 
    hasPermission('view_subjects') || 
    hasPermission('view_assigned_subjects') || 
    hasPermission('manage_subjects');
  
  const canManageStaff = (): boolean => hasPermission('manage_staff');
  
  const canManageTimetable = (): boolean => hasPermission('manage_timetable');
  const canGenerateTimetable = (): boolean => hasPermission('generate_timetable');
  const canViewTimetable = (): boolean => hasPermission('view_timetable');

  const isTimetableOnlyAdmin = (): boolean =>
    role === 'ADMINISTRATIVE_STAFF' &&
    selectedPackages.length === 1 &&
    selectedPackages[0] === 'TIMETABLE';

  const effectiveCanManageTimetable = (): boolean =>
    isTimetableOnlyAdmin() || canManageTimetable();

  const effectiveCanGenerateTimetable = (): boolean =>
    isTimetableOnlyAdmin() || canGenerateTimetable();

  const effectiveCanViewTimetable = (): boolean =>
    isTimetableOnlyAdmin() || canViewTimetable();
  
  const canInputMarks = (): boolean => hasPermission('input_marks');
  const canViewResults = (): boolean => hasPermission('view_results');
  
  const canViewStatistics = (): boolean => 
    hasPermission('view_statistics') || 
    hasPermission('view_class_statistics') || 
    hasPermission('view_all_statistics');
  
  const canViewReports = (): boolean => hasPermission('view_reports');
  const canDownloadReports = (): boolean => 
    hasPermission('download_reports') || 
    hasPermission('download_class_reports') || 
    hasPermission('download_all_reports');
  const canDownloadClassReports = (): boolean => hasPermission('download_class_reports');
  const canDownloadAllReports = (): boolean => hasPermission('download_all_reports');
  
  // Full Results access - only Director of Studies, Class Teacher, and Administrative Staff
  const canViewFullResults = (): boolean => 
    (role === 'DIRECTOR_OF_STUDIES' || role === 'CLASS_TEACHER' || role === 'ADMINISTRATIVE_STAFF') &&
    hasPermission('view_results');
  
  // Full Results download - Director of Studies, Administrative Staff, and Class Teacher
  const canDownloadFullResults = (): boolean => 
    (role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF' || role === 'CLASS_TEACHER') &&
    canDownloadReports();
  
  // Report Cards access - only Director of Studies and Administrative Staff
  const canAccessReportCards = (): boolean => 
    (role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF') && hasPermission('view_reports');
  
  const canManageFinance = (): boolean => hasPermission('manage_finance');
  const canViewFinance = (): boolean => hasPermission('view_finance');

  // Library permissions
  const canManageLibrary = (): boolean => 
    hasPermission('manage_library');
  const canViewLibrary = (): boolean => 
    hasPermission('view_library');

  // Role checks
  const isTeacher = (): boolean => role === 'TEACHER';
  const isClassTeacher = (): boolean => role === 'CLASS_TEACHER';
  const isHOD = (): boolean => role === 'HOD';
  const isDirectorOfStudies = (): boolean => role === 'DIRECTOR_OF_STUDIES';
  const isBursar = (): boolean => role === 'BURSAR';
  const isLibrarian = (): boolean => role === 'LIBRARIAN';
  const isAdministrativeStaff = (): boolean => role === 'ADMINISTRATIVE_STAFF';

  // Special permissions for Director of Studies
  // DOS can add students, classes, and subjects
  const canAddStudents = (): boolean => 
    role === 'CLASS_TEACHER' || role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';
  
  const canUploadStudents = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';
  
  const canAddClasses = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  const canEditClasses = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES';
  
  const canDeleteClasses = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES';
  
  const canAddSubjects = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF' || role === 'LIBRARIAN';
  
  const canEditSubjects = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES';
  
  const canDeleteSubjects = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES';
  
  // Class Teacher, Director of Studies and Administrative Staff can edit students
  const canEditStudents = (): boolean => 
    role === 'CLASS_TEACHER' || role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  // Class Teacher, Director of Studies and Administrative Staff can delete students
  const canDeleteStudents = (): boolean => 
    role === 'CLASS_TEACHER' || role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  // Director of Studies and Bursar can view ALL students (not filtered by assigned classes)
  const canViewAllStudents = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';
  
  // Administrative Staff can manage staff members
  const canManageStaffMembers = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  // Administrative Staff can access school profile
  const canAccessSchoolProfile = (): boolean => 
    role === 'ADMINISTRATIVE_STAFF';

  return {
    permissions,
    role,
    selectedPackages,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Specific permission checks
    canManageStudents,
    canViewStudents,
    canManageClasses,
    canViewClasses,
    canManageSubjects,
    canViewSubjects,
    canManageStaff,
    canManageTimetable: effectiveCanManageTimetable,
    canGenerateTimetable: effectiveCanGenerateTimetable,
    canViewTimetable: effectiveCanViewTimetable,
    canInputMarks,
    canViewResults,
    canViewStatistics,
    canViewReports,
    canDownloadReports,
    canDownloadClassReports,
    canDownloadAllReports,
    canViewFullResults,
    canDownloadFullResults,
    canAccessReportCards,
    canManageFinance,
    canViewFinance,
    canManageLibrary,
    canViewLibrary,
    // Special permissions for DOS/Bursar/Admin Staff
    canAddStudents,
    canUploadStudents,
    canEditStudents,
    canDeleteStudents,
    canAddClasses,
    canEditClasses,
    canDeleteClasses,
    canAddSubjects,
    canEditSubjects,
    canDeleteSubjects,
    canViewAllStudents,
    canManageStaffMembers,
    canAccessSchoolProfile,
    // Role checks
    isTeacher,
    isClassTeacher,
    isHOD,
    isDirectorOfStudies,
    isBursar,
    isLibrarian,
    isAdministrativeStaff,
  };
};
