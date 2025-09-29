import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { validateToken, clearAuthData } from '../../../utils/authUtils';
import { API_BASE_URL } from '../../../config/environment';

interface StaffUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  school_id: number;
  user_type: string;
}

interface StaffAuthContextType {
  user: StaffUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

interface StaffAuthProviderProps {
  children: ReactNode;
}

export const StaffAuthProvider: React.FC<StaffAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app start
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('staff_access_token');
      const storedUser = localStorage.getItem('staff_info');
      
      if (storedToken && storedUser) {
        try {
          // Validate token with backend
          const isValid = await validateToken(storedToken, 'staff');
          
          if (isValid) {
            const userData = JSON.parse(storedUser);
            setToken(storedToken);
            setUser({
              id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              phone: userData.phone,
              employee_id: userData.employee_id,
              school_id: userData.school_id,
              user_type: 'staff'
            });
            
            // Set staff authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          } else {
            // Token is invalid, clear auth data
            clearAuthData('staff');
          }
        } catch (error) {
          console.error('Error validating stored staff token:', error);
          clearAuthData('staff');
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/staff/auth/login/`, {
        email,
        password
      });

      const { access_token, staff } = response.data;
      
      // Store tokens and user info
      localStorage.setItem('staff_access_token', access_token);
      localStorage.setItem('staff_info', JSON.stringify(staff));
      
      // Update state
      setToken(access_token);
      setUser({
        id: staff.id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        email: staff.email,
        phone: staff.phone,
        employee_id: staff.employee_id,
        school_id: staff.school_id,
        user_type: 'staff'
      });
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (error) {
      console.error('Staff login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear all auth data using utility
    clearAuthData('staff');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    loading
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = (): StaffAuthContextType => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};

export default StaffAuthContext;
