import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authentication/contexts/AuthContext';
import { useStaffAuth } from './authentication/contexts/StaffAuthContext';
import { useParentAuth } from './authentication/contexts/ParentAuthContext';
import { useAuthStatus } from '../hooks/useAuthStatus';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
  children = "Logout"
}) => {
  const navigate = useNavigate();
  const { logout: logoutSchool } = useAuth();
  const { logout: logoutStaff } = useStaffAuth();
  const { logout: logoutParent } = useParentAuth();
  const { currentUserType } = useAuthStatus();

  const handleLogout = () => {
    // Clear all possible auth states
    logoutSchool();
    logoutStaff();
    logoutParent();

    // Clear any session storage
    sessionStorage.clear();

    // Redirect based on current user type
    switch (currentUserType) {
      case 'school':
        navigate('/', { replace: true });
        break;
      case 'staff':
        navigate('/', { replace: true });
        break;
      case 'parent':
        navigate('/', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children}
    </button>
  );
};

export default LogoutButton;
