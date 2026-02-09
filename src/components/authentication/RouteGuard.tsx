import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useStaffAuth } from './contexts/StaffAuthContext';
import { useParentAuth } from './contexts/ParentAuthContext';

interface RouteGuardProps {
  children: ReactNode;
  requiredAuth: 'school' | 'staff' | 'parent' | 'any' | 'none';
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated: isSchoolAuth, loading: schoolLoading } = useAuth();
  const { isAuthenticated: isStaffAuth, loading: staffLoading } = useStaffAuth();
  const { isAuthenticated: isParentAuth, loading: parentLoading } = useParentAuth();

  const isLoading = schoolLoading || staffLoading || parentLoading;

  useEffect(() => {
    if (isLoading) return;

    // If no authentication required, allow access
    if (requiredAuth === 'none') return;

    let isAuthorized = false;
    let redirectPath = '/login';

    switch (requiredAuth) {
      case 'school':
        isAuthorized = isSchoolAuth;
        redirectPath = '/login';
        break;
      case 'staff':
        isAuthorized = isStaffAuth;
        redirectPath = '/login';
        break;
      case 'parent':
        isAuthorized = isParentAuth;
        redirectPath = '/parent/login';
        break;
      case 'any':
        isAuthorized = isSchoolAuth || isStaffAuth || isParentAuth;
        redirectPath = '/login';
        break;
    }

    if (!isAuthorized) {
      // Store the intended destination to redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, isSchoolAuth, isStaffAuth, isParentAuth, requiredAuth, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  // If no auth required, allow access
  if (requiredAuth === 'none') {
    return <>{children}</>;
  }

  let isAuthorized = false;

  switch (requiredAuth) {
    case 'school':
      isAuthorized = isSchoolAuth;
      break;
    case 'staff':
      isAuthorized = isStaffAuth;
      break;
    case 'parent':
      isAuthorized = isParentAuth;
      break;
    case 'any':
      isAuthorized = isSchoolAuth || isStaffAuth || isParentAuth;
      break;
  }

  if (!isAuthorized) {
    return null; // Navigation will happen in useEffect
  }

  return <>{children}</>;
};

export default RouteGuard;