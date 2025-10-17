import axios from 'axios';
import { API_BASE_URL } from '../config/environment';

// Create a base axios instance with common configuration
const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('staff_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

// Create API instances for different modules
export const MarksAPI = createAxiosInstance(API_BASE_URL);
export const StatisticsAPI = createAxiosInstance(API_BASE_URL);
export const ReportsAPI = createAxiosInstance(API_BASE_URL);