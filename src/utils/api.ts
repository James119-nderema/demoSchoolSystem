import axios from 'axios';

// Create separate axios instances for different auth types
export const schoolAPI = axios.create({
  baseURL: 'https://techhubai.pythonanywhere.com/api',
});

export const staffAPI = axios.create({
  baseURL: 'https://techhubai.pythonanywhere.com/api',
});

export const parentAPI = axios.create({
  baseURL: 'https://techhubai.pythonanywhere.com/api',
});

// School API interceptor
schoolAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

schoolAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('school_info');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Staff API interceptor
staffAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staff_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

staffAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_info');
      window.location.href = '/staff/login';
    }
    return Promise.reject(error);
  }
);

// Parent API interceptor
parentAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parent_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

parentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('parent_access_token');
      localStorage.removeItem('parent_info');
      window.location.href = '/parent/login';
    }
    return Promise.reject(error);
  }
);

export default { schoolAPI, staffAPI, parentAPI };
