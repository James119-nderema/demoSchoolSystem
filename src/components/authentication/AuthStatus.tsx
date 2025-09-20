import React from 'react';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import LogoutButton from '../LogoutButton';

const AuthStatus: React.FC = () => {
  const {
    isSchoolAuthenticated,
    isStaffAuthenticated,
    isParentAuthenticated,
    currentUserType,
    schoolUser,
    staffUser,
    parentUser,
    isLoading
  } = useAuthStatus();

  if (isLoading) {
    return <div className="p-4">Loading authentication status...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Authentication Status</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isSchoolAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>School Admin: {isSchoolAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isStaffAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Staff: {isStaffAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isParentAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Parent: {isParentAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
        </div>
      </div>

      <div className="mb-4">
        <strong>Current User Type:</strong> {currentUserType}
      </div>

      {schoolUser && (
        <div className="mb-2">
          <strong>School User:</strong> {schoolUser.school_name} ({schoolUser.email})
        </div>
      )}

      {staffUser && (
        <div className="mb-2">
          <strong>Staff User:</strong> {staffUser.first_name} {staffUser.last_name} ({staffUser.email})
        </div>
      )}

      {parentUser && (
        <div className="mb-2">
          <strong>Parent User:</strong> {parentUser.first_name} {parentUser.last_name} ({parentUser.email})
        </div>
      )}

      {(isSchoolAuthenticated || isStaffAuthenticated || isParentAuthenticated) && (
        <div className="mt-4">
          <LogoutButton />
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
