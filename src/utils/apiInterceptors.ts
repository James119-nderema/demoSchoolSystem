import axios from 'axios';
import { clearAuthData, redirectToLogin } from './authUtils';

// Create axios interceptor for handling authentication errors
export const setupAxiosInterceptors = () => {
  // Request interceptor to add token
  axios.interceptors.request.use(
    (config) => {
      const staffToken = localStorage.getItem('staff_access_token');
      const parentToken = localStorage.getItem('parent_access_token');
      const schoolToken = localStorage.getItem('access_token');
      
      if (parentToken && config.url?.includes('/api/parent')) {
        config.headers.Authorization = `Bearer ${parentToken}`;
      } else if (staffToken && config.url?.includes('/api/')) {
        config.headers.Authorization = `Bearer ${staffToken}`;
      } else if (schoolToken && config.url?.includes('/api/')) {
        config.headers.Authorization = `Bearer ${schoolToken}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle authentication errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        const { status } = error.response;
        
        // Handle authentication errors
        if (status === 401 || status === 403) {
          const currentPath = window.location.pathname;
          
          // Determine user type based on current path
          if (currentPath.startsWith('/staff')) {
            console.log('Staff authentication failed, redirecting to login...');
            clearAuthData('staff');
            redirectToLogin('staff');
          } else if (currentPath.startsWith('/parent')) {
            console.log('Parent authentication failed, redirecting to login...');
            clearAuthData('parent');
            redirectToLogin('parent');
          } else if (currentPath.startsWith('/school')) {
            console.log('School admin authentication failed, redirecting to login...');
            localStorage.removeItem('access_token');
            localStorage.removeItem('school_info');
            window.location.href = '/login';
          }
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Enhanced fetch wrapper with automatic auth handling
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const staffToken = localStorage.getItem('staff_access_token');
  const parentToken = localStorage.getItem('parent_access_token');
  const schoolToken = localStorage.getItem('access_token');
  
  // Build full URL using environment variable for production
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Add appropriate token based on URL and available tokens
  const headers = new Headers(options.headers);
  if (parentToken && url.includes('/api/parent')) {
    headers.set('Authorization', `Bearer ${parentToken}`);
  } else if (staffToken && url.includes('/api/')) {
    headers.set('Authorization', `Bearer ${staffToken}`);
  } else if (schoolToken && url.includes('/api/')) {
    headers.set('Authorization', `Bearer ${schoolToken}`);
  }
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/staff')) {
      clearAuthData('staff');
      redirectToLogin('staff');
      throw new Error('Authentication failed');
    } else if (currentPath.startsWith('/parent')) {
      clearAuthData('parent');
      redirectToLogin('parent');
      throw new Error('Authentication failed');
    } else if (currentPath.startsWith('/school')) {
      // Handle school admin authentication failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('school_info');
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }
  
  return response;
};
