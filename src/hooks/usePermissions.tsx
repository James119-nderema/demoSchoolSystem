import { useState, useEffect } from 'react';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: string;
  school_name: string;
  phone_number: string;
  role: string;
  permissions: string[];
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staffInfo = localStorage.getItem('staff_info');
    if (staffInfo) {
      try {
        const info: StaffInfo = JSON.parse(staffInfo);
        setPermissions(info.permissions || []);
        setRole(info.role || '');
      } catch (error) {
        console.error('Error parsing staff info:', error);
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
    hasPermission('view_students') || 
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
  
  // Full Results access - only Director of Studies and Class Teacher
  const canViewFullResults = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'CLASS_TEACHER';
  
  // Full Results download - only Director of Studies
  const canDownloadFullResults = (): boolean => role === 'DIRECTOR_OF_STUDIES';
  
  // Report Cards access - only Director of Studies and Administrative Staff
  const canAccessReportCards = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  const canManageFinance = (): boolean => hasPermission('manage_finance');
  const canViewFinance = (): boolean => hasPermission('view_finance');

  // Role checks
  const isTeacher = (): boolean => role === 'TEACHER';
  const isClassTeacher = (): boolean => role === 'CLASS_TEACHER';
  const isHOD = (): boolean => role === 'HOD';
  const isDirectorOfStudies = (): boolean => role === 'DIRECTOR_OF_STUDIES';
  const isBursar = (): boolean => role === 'BURSAR';
  const isAdministrativeStaff = (): boolean => role === 'ADMINISTRATIVE_STAFF';

  // Special permissions for Director of Studies
  // DOS can add students, classes, and subjects
  const canAddStudents = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';
  
  const canUploadStudents = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';
  
  const canAddClasses = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  const canAddSubjects = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'ADMINISTRATIVE_STAFF';
  
  // Director of Studies and Bursar can view ALL students (not filtered by assigned classes)
  const canViewAllStudents = (): boolean => 
    role === 'DIRECTOR_OF_STUDIES' || role === 'BURSAR' || role === 'ADMINISTRATIVE_STAFF';

  return {
    permissions,
    role,
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
    canManageTimetable,
    canGenerateTimetable,
    canViewTimetable,
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
    // Special permissions for DOS/Bursar
    canAddStudents,
    canUploadStudents,
    canAddClasses,
    canAddSubjects,
    canViewAllStudents,
    // Role checks
    isTeacher,
    isClassTeacher,
    isHOD,
    isDirectorOfStudies,
    isBursar,
    isAdministrativeStaff,
  };
};
