import axios from 'axios';
import { API_BASE_URL } from '../config/environment';

// Utility function to check if token is valid
export const validateToken = async (token: string, userType: 'staff' | 'parent'): Promise<boolean> => {
  try {
    const endpoint = userType === 'staff' 
      ? '/api/staff/auth/verify_token/' 
      : '/api/parents/verify_token/';
    
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Check both status code and response data
    return response.status === 200 && response.data?.valid === true;
  } catch (error) {
    return false;
  }
};

// Clear all authentication data
export const clearAuthData = (userType: 'staff' | 'parent') => {
  if (userType === 'staff') {
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_info');
  } else {
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('parent_info');
  }
  
  // Clear axios default headers
  delete axios.defaults.headers.common['Authorization'];
};

// Redirect to appropriate login page
export const redirectToLogin = (userType: 'staff' | 'parent') => {
  const loginPath = userType === 'staff' ? '/staff/login' : '/parent/login';
  window.location.href = loginPath;
};

// Check token and redirect if invalid
export const checkAuthAndRedirect = async (userType: 'staff' | 'parent'): Promise<boolean> => {
  const tokenKey = userType === 'staff' ? 'staff_access_token' : 'parent_access_token';
  const token = localStorage.getItem(tokenKey);
  
  if (!token) {
    clearAuthData(userType);
    redirectToLogin(userType);
    return false;
  }
  
  const isValid = await validateToken(token, userType);
  if (!isValid) {
    clearAuthData(userType);
    redirectToLogin(userType);
    return false;
  }
  
  return true;
};
