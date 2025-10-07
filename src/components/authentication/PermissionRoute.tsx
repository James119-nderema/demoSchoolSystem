import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionRouteProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactElement;
  redirectTo?: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  children,
  redirectTo = '/staff/dashboard',
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default PermissionRoute;
