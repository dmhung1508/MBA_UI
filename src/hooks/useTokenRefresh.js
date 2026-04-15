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
  const lastActivityRef = useRef(Date.now());
  const checkIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const RECENTLY_ACTIVE_THRESHOLD = 30000; // 30 seconds
  const INACTIVITY_TIMEOUT = 240000; // 4 minutes
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

      const response = await axios.post(
        `${apiBaseUrl}/auth_mini/refresh`,
        {},
        { withCredentials: true }
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
   * Periodic check for token refresh and inactivity logout
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
    const lastActivity = lastActivityRef.current;
    const timeSinceActivity = now - lastActivity;
    const wasRecentlyActive = timeSinceActivity < RECENTLY_ACTIVE_THRESHOLD;

    // TH4: Check for 4 minutes of inactivity → Force logout
    if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
      forceLogout();
      return;
    }

    // TH2: Check if token expired/expiring AND user was recently active
    const tokenExpired = now >= expiresAt;
    const tokenExpiresSoon = (expiresAt - now) < 10000; // Less than 10 seconds left

    if (wasRecentlyActive && (tokenExpired || tokenExpiresSoon)) {
      refreshToken();
    }
  };

  /**
   * Update last activity timestamp on user interaction
   */
  const handleActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Activity event listeners - update lastActivity timestamp
    const events = ['scroll', 'mousemove', 'keydown', 'click', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start periodic check every 5 seconds
    checkIntervalRef.current = setInterval(periodicCheck, CHECK_INTERVAL);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return null;
};
