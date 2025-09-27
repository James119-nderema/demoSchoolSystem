import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { clearAuthData } from '../../../utils/authUtils';
import { useAuthValidation } from '../../../hooks/useAuthValidation';

interface ParentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  school_id: number;
  user_type: string;
}

interface ParentAuthContextType {
  user: ParentUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const ParentAuthContext = createContext<ParentAuthContextType | undefined>(undefined);

interface ParentAuthProviderProps {
  children: ReactNode;
}

export const ParentAuthProvider: React.FC<ParentAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ParentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use authentication validation hook for parents
  useAuthValidation('parent');

  useEffect(() => {
    // Check for existing token on app start
    const storedToken = localStorage.getItem('parent_access_token');
    const storedUser = localStorage.getItem('parent_info');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser({
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          school_id: userData.school_id,
          user_type: 'parent'
        });
        
        // Set parent authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored parent data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('https://techhubai.pythonanywhere.com/api/parents/login/', {
        email,
        password
      });

      const { access_token, parent } = response.data;
      
      // Store tokens and user info
      localStorage.setItem('parent_access_token', access_token);
      localStorage.setItem('parent_info', JSON.stringify(parent));
      
      // Update state
      setToken(access_token);
      setUser({
        id: parent.id,
        first_name: parent.first_name,
        last_name: parent.last_name,
        email: parent.email,
        phone: parent.phone,
        address: parent.address,
        school_id: parent.school_id,
        user_type: 'parent'
      });
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (error) {
      console.error('Parent login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Use centralized auth clearing
    clearAuthData('parent');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear default authorization header
    delete axios.defaults.headers.common['Authorization'];
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
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  );
};

export const useParentAuth = (): ParentAuthContextType => {
  const context = useContext(ParentAuthContext);
  if (!context) {
    throw new Error('useParentAuth must be used within a ParentAuthProvider');
  }
  return context;
};

export default ParentAuthContext;
