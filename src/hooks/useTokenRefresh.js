import { useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { resolveApiBaseUrl } from '../config/runtimeConfig';

/**
 * Hook to proactively refresh token based on user activity
 * Implements complete token management for all cases:
 * - TH1: Normal requests with valid token
 * - TH2: Auto-refresh when user active but no API calls
 * - TH3: Reactive refresh on 401 (handled by axiosConfig)
 * - TH4: Auto-logout after 4 minutes of inactivity
 */
export const useTokenRefresh = () => {
  const checkIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const CHECK_INTERVAL = 5000; // Check every 5 seconds
  const apiBaseUrl = resolveApiBaseUrl();

  /**
   * Force logout due to inactivity
   */
  const forceLogout = () => {
    // Stop the interval to prevent further checks
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Clear all auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_role');
    localStorage.removeItem('token_expiration');

    // Show notification
    toast.error('Phiên làm việc đã hết hạn do không có hoạt động. Vui lòng đăng nhập lại.', {
      autoClose: 5000,
    });

    // Redirect to login
    setTimeout(() => {
      window.location.href = '/mini/login';
    }, 1000);
  };

  /**
   * Refresh access token
   */
  const refreshToken = async () => {
    // Prevent concurrent refresh calls
    if (isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) return;

      const response = await axios.post(
        `${apiBaseUrl}/auth_mini/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const { access_token } = response.data;

      // Update token and expiration
      localStorage.setItem('access_token', access_token);
      const newExpiration = Date.now() + (30 * 60 * 1000); // 30 minutes
      localStorage.setItem('token_expiration', newExpiration.toString());
    } catch (error) {
      console.error('Failed to refresh token:', error);

      // If refresh fails with 401, it means refresh-token also expired
      if (error.response?.status === 401) {
        forceLogout();
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  /**
   * Periodic check for token refresh
   * Runs every 5 seconds to ensure we don't miss the refresh window
   */
  const periodicCheck = () => {
    const token = localStorage.getItem('access_token');
    const tokenExpiration = localStorage.getItem('token_expiration');

    // If not logged in, skip checks
    if (!token || !tokenExpiration) {
      return;
    }

    const now = Date.now();
    const expiresAt = parseInt(tokenExpiration);

    // Refresh token if expired/expiring soon
    const tokenExpired = now >= expiresAt;
    const tokenExpiresSoon = (expiresAt - now) < 10000; // Less than 10 seconds left

    if (tokenExpired || tokenExpiresSoon) {
      refreshToken();
    }
  };

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Start periodic check every 5 seconds
    checkIntervalRef.current = setInterval(periodicCheck, CHECK_INTERVAL);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return null;
};
