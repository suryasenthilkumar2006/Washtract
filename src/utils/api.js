import axios from 'axios';

/**
 * Configured axios instance
 * baseURL set once here — all calls use relative paths
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attaches JWT token to every outgoing request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('washtrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Catches 401 globally — clears token and redirects to login
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('washtrack_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;