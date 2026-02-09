import axios from 'axios';
import { API_BASE_URL } from '../config/environment';

// Utility function to check if token is valid
export const validateToken = async (token: string, userType: 'staff' | 'parent' | 'school'): Promise<boolean> => {
  try {
    let endpoint: string;
    if (userType === 'staff') {
      endpoint = '/api/staff/verify_token/';
    } else if (userType === 'school') {
      endpoint = '/api/schools/verify_token/';
    } else {
      endpoint = '/api/parents/verify_token/';
    }
    
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
export const clearAuthData = (userType: 'staff' | 'parent' | 'school') => {
  if (userType === 'staff') {
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_info');
  } else if (userType === 'school') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('school_info');
  } else {
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('parent_info');
  }
  
  // Clear axios default headers
  delete axios.defaults.headers.common['Authorization'];
};

// Redirect to appropriate login page
export const redirectToLogin = (userType: 'staff' | 'parent' | 'school') => {
  const loginPath = userType === 'parent' ? '/parent/login' : '/login';
  window.location.href = loginPath;
};

// Check token and redirect if invalid
export const checkAuthAndRedirect = async (userType: 'staff' | 'parent'): Promise<boolean> => {
  // For staff userType, check BOTH staff token AND school token
  if (userType === 'staff') {
    const staffToken = localStorage.getItem('staff_access_token');
    const schoolToken = localStorage.getItem('access_token');
    
    // Check staff token first
    if (staffToken) {
      const isStaffValid = await validateToken(staffToken, 'staff');
      if (isStaffValid) return true;
    }
    
    // Check school token if staff token is not valid
    if (schoolToken) {
      const isSchoolValid = await validateToken(schoolToken, 'school');
      if (isSchoolValid) return true;
    }
    
    // Neither token is valid
    clearAuthData('staff');
    clearAuthData('school');
    redirectToLogin('staff');
    return false;
  }
  
  // For parent userType
  const token = localStorage.getItem('parent_access_token');
  
  if (!token) {
    clearAuthData('parent');
    redirectToLogin('parent');
    return false;
  }
  
  const isValid = await validateToken(token, 'parent');
  if (!isValid) {
    clearAuthData('parent');
    redirectToLogin('parent');
    return false;
  }
  
  return true;
};
