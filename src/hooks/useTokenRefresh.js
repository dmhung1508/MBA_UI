import { useEffect, useRef } from 'react';
import axios from 'axios';

/**
 * Hook to proactively refresh token based on user activity
 * Monitors scrolling, mouse movement, and keyboard activity
 * Refreshes token before it expires to keep session alive
 */
export const useTokenRefresh = () => {
  const lastActivityRef = useRef(Date.now());
  const refreshTimerRef = useRef(null);

  const refreshToken = async () => {
    try {
      const tokenExpiration = localStorage.getItem('token_expiration');
      if (!tokenExpiration) return;

      const expiresAt = parseInt(tokenExpiration);
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If token expires in less than 30 seconds, refresh it
      if (timeUntilExpiry < 30000 && timeUntilExpiry > 0) {
        console.log('🔄 Proactively refreshing token due to user activity');

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth_mini/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        // Update token and expiration
        localStorage.setItem('access_token', access_token);
        const newExpiration = Date.now() + (3 * 60 * 1000); // 3 minutes
        localStorage.setItem('token_expiration', newExpiration.toString());

        console.log('✅ Token refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      // Don't logout here - let the axios interceptor handle it on next API call
    }
  };

  const handleActivity = () => {
    lastActivityRef.current = Date.now();

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Check if we need to refresh after a short delay
    // This prevents too many refresh checks during continuous scrolling
    refreshTimerRef.current = setTimeout(() => {
      refreshToken();
    }, 500);
  };

  useEffect(() => {
    // Only run if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Activity event listeners
    const events = ['scroll', 'mousemove', 'keydown', 'click', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return null;
};
