import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStaffAuth } from './contexts/StaffAuthContext';
import { useAuth } from './contexts/AuthContext';

interface StaffProtectedRouteProps {
  children: ReactNode;
}

const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated: isStaffAuth, loading: staffLoading } = useStaffAuth();
  const { isAuthenticated: isSchoolAuth, loading: schoolLoading } = useAuth();

  // Check if either auth context is still loading
  if (staffLoading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Allow access if authenticated via EITHER school or staff auth
  if (!isStaffAuth && !isSchoolAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default StaffProtectedRoute;