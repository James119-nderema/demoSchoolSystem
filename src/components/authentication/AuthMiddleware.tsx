import React from 'react';
import type { ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useStaffAuth } from './contexts/StaffAuthContext';
import { useParentAuth } from './contexts/ParentAuthContext';

interface AuthMiddlewareProps {
  children: ReactNode;
}

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated: isSchoolAuth, loading: schoolLoading } = useAuth();
  const { isAuthenticated: isStaffAuth, loading: staffLoading } = useStaffAuth();
  const { isAuthenticated: isParentAuth, loading: parentLoading } = useParentAuth();

  // Define public routes that don't require any authentication
  const publicRoutes = [
    '/',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/staff/register',
    '/staff/login',
    '/staff/forgot-password',
    '/staff/reset-password',
    '/parent/register',
    '/parent/login',
    '/parent/register',
    '/parent/login',
    '/parent/forgot-password'
  ];

  // Define protected routes patterns
  const schoolProtectedRoutes = ['/school'];
  const staffProtectedRoutes = ['/staff/dashboard', '/staff/students', '/staff/classes', '/staff/subjects', '/staff/results', '/staff/profile'];
  const parentProtectedRoutes = ['/parent/dashboard', '/parent/dashboard'];

  const currentPath = location.pathname;

  // Check if current route is public (doesn't need authentication)
  const isPublicRoute = publicRoutes.includes(currentPath);

  // Check if current route needs authentication
  const isSchoolRoute = schoolProtectedRoutes.some(route => currentPath.startsWith(route));
  const isStaffRoute = staffProtectedRoutes.some(route => currentPath.startsWith(route));
  const isParentRoute = parentProtectedRoutes.some(route => currentPath.startsWith(route));

  // Show loading if any auth context is still loading
  if (schoolLoading || staffLoading || parentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // If it's a public route, allow access without authentication checks
  if (isPublicRoute) {
    // Still redirect authenticated users away from login pages to their dashboards
    if (isSchoolAuth && (currentPath === '/login' || currentPath === '/')) {
      return <Navigate to="/school/dashboard" replace />;
    }

    if (isStaffAuth && (currentPath === '/staff/login' || currentPath === '/staff/register')) {
      return <Navigate to="/staff/dashboard" replace />;
    }

    if (isParentAuth && (currentPath === '/parent/login' || currentPath === '/parent/login')) {
      return <Navigate to="/parent/dashboard" replace />;
    }

    return <>{children}</>;
  }

  // Handle protected route authentication
  if (isSchoolRoute && !isSchoolAuth) {
    return <Navigate to="/login" replace />;
  }

  if (isStaffRoute && !isStaffAuth) {
    return <Navigate to="/staff/login" replace />;
  }

  if (isParentRoute && !isParentAuth) {
    return <Navigate to="/parent/login" replace />;
  }

  return <>{children}</>;
};

export default AuthMiddleware;
