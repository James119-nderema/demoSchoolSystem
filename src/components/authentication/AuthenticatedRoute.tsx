import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkAuthAndRedirect } from '../../utils/authUtils';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  userType: 'staff' | 'parent';
  fallbackPath?: string;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ 
  children, 
  userType, 
  fallbackPath 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isValid = await checkAuthAndRedirect(userType);
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [userType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectPath = fallbackPath || (userType === 'staff' ? '/' : '/');
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default AuthenticatedRoute;
