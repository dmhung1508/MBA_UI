import axios from 'axios';
import { API_ENDPOINTS } from './api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add access token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    // If response is successful, just return it
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth_mini/refresh`,
          {},
          {
            withCredentials: true, // Send refresh token cookie
          }
        );

        const { access_token } = response.data;

        // Update access token in localStorage
        localStorage.setItem('access_token', access_token);

        // Update token expiration (3 minutes from now)
        const expirationTime = new Date().getTime() + (3 * 60 * 1000);
        localStorage.setItem('token_expiration', expirationTime.toString());

        // Process queued requests with new token
        processQueue(null, access_token);

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // Refresh failed - clear auth data and redirect to login
        processQueue(refreshError, null);

        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user_role');
        localStorage.removeItem('token_expiration');

        // Redirect to login
        window.location.href = '/mini/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default axiosInstance;
