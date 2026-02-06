import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('useTokenRefresh Hook', () => {
  let mockPostResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    window.location.href = '';

    // Mock successful refresh response
    mockPostResponse = {
      data: { access_token: 'new-token' },
    };
    axios.post = vi.fn().mockResolvedValue(mockPostResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Activity Detection', () => {
    it('should listen for scroll events', () => {
      localStorage.setItem('access_token', 'test-token');
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useTokenRefresh());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should listen for mouse movement', () => {
      localStorage.setItem('access_token', 'test-token');
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useTokenRefresh());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should listen for keyboard input', () => {
      localStorage.setItem('access_token', 'test-token');
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useTokenRefresh());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should listen for click events', () => {
      localStorage.setItem('access_token', 'test-token');
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useTokenRefresh());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        { passive: true }
      );
    });

    it('should listen for touch events', () => {
      localStorage.setItem('access_token', 'test-token');
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useTokenRefresh());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Token Refresh Logic', () => {
    it('should refresh token when expiring soon and activity detected', async () => {
      const now = Date.now();
      const expiresIn20Seconds = now + 20000; // 20 seconds from now

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn20Seconds.toString());

      renderHook(() => useTokenRefresh());

      // Simulate scroll activity
      window.dispatchEvent(new Event('scroll'));

      // Wait for debounce (500ms) + async refresh
      await vi.advanceTimersByTimeAsync(600);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth_mini/refresh'),
        {},
        { withCredentials: true }
      );

      expect(localStorage.getItem('access_token')).toBe('new-token');
    });

    it('should NOT refresh token when not expiring soon', async () => {
      const now = Date.now();
      const expiresIn2Minutes = now + (2 * 60 * 1000); // 2 minutes from now

      localStorage.setItem('access_token', 'current-token');
      localStorage.setItem('token_expiration', expiresIn2Minutes.toString());

      renderHook(() => useTokenRefresh());

      // Simulate scroll activity
      window.dispatchEvent(new Event('scroll'));

      // Wait for debounce
      await vi.advanceTimersByTimeAsync(600);

      // Should NOT call refresh (token still valid for 2 minutes)
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should NOT refresh token when already expired', async () => {
      const now = Date.now();
      const expiredToken = now - 10000; // Expired 10 seconds ago

      localStorage.setItem('access_token', 'expired-token');
      localStorage.setItem('token_expiration', expiredToken.toString());

      renderHook(() => useTokenRefresh());

      // Simulate scroll activity
      window.dispatchEvent(new Event('scroll'));

      // Wait for debounce
      await vi.advanceTimersByTimeAsync(600);

      // Should NOT call refresh (let axios interceptor handle it)
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should update token expiration to 3 minutes after refresh', async () => {
      const now = Date.now();
      const expiresIn15Seconds = now + 15000;

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn15Seconds.toString());

      renderHook(() => useTokenRefresh());

      // Simulate activity
      window.dispatchEvent(new Event('scroll'));

      // Wait for refresh
      await vi.advanceTimersByTimeAsync(600);

      const newExpiration = parseInt(localStorage.getItem('token_expiration'));
      const expectedExpiration = now + (3 * 60 * 1000);

      // Allow 1 second margin for test execution time
      expect(newExpiration).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(newExpiration).toBeLessThanOrEqual(expectedExpiration + 1000);
    });
  });

  describe('Debouncing', () => {
    it('should debounce multiple rapid activity events', async () => {
      const now = Date.now();
      const expiresIn20Seconds = now + 20000;

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn20Seconds.toString());

      renderHook(() => useTokenRefresh());

      // Simulate rapid scrolling
      window.dispatchEvent(new Event('scroll'));
      await vi.advanceTimersByTimeAsync(100);
      window.dispatchEvent(new Event('scroll'));
      await vi.advanceTimersByTimeAsync(100);
      window.dispatchEvent(new Event('scroll'));
      await vi.advanceTimersByTimeAsync(100);
      window.dispatchEvent(new Event('scroll'));

      // Wait for debounce
      await vi.advanceTimersByTimeAsync(600);

      // Should only call refresh once despite multiple events
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should use 500ms debounce delay', async () => {
      const now = Date.now();
      const expiresIn20Seconds = now + 20000;

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn20Seconds.toString());

      renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('scroll'));

      // Before 500ms - should not refresh yet
      await vi.advanceTimersByTimeAsync(400);
      expect(axios.post).not.toHaveBeenCalled();

      // After 500ms - should refresh
      await vi.advanceTimersByTimeAsync(200);
      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('Login State Check', () => {
    it('should NOT add listeners when user is not logged in', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      // No token in localStorage
      localStorage.removeItem('access_token');

      renderHook(() => useTokenRefresh());

      // Should not add any event listeners
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should add listeners when user is logged in', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      localStorage.setItem('access_token', 'valid-token');

      renderHook(() => useTokenRefresh());

      // Should add 5 event listeners (scroll, mousemove, keydown, click, touchstart)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      localStorage.setItem('access_token', 'token');

      const { unmount } = renderHook(() => useTokenRefresh());

      unmount();

      // Should remove all 5 event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(5);
    });

    it('should clear pending timers on unmount', () => {
      const now = Date.now();
      const expiresIn20Seconds = now + 20000;

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn20Seconds.toString());

      const { unmount } = renderHook(() => useTokenRefresh());

      // Trigger activity (starts timer)
      window.dispatchEvent(new Event('scroll'));

      // Unmount before timer completes
      unmount();

      // Advance time - refresh should not be called since timer was cleared
      vi.advanceTimersByTime(1000);

      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle refresh failure gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const now = Date.now();
      const expiresIn20Seconds = now + 20000;

      localStorage.setItem('access_token', 'old-token');
      localStorage.setItem('token_expiration', expiresIn20Seconds.toString());

      // Mock refresh failure
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('scroll'));

      await vi.advanceTimersByTimeAsync(600);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Should NOT logout (let axios interceptor handle it)
      expect(localStorage.getItem('access_token')).toBe('old-token');

      consoleErrorSpy.mockRestore();
    });

    it('should not crash when token_expiration is missing', async () => {
      localStorage.setItem('access_token', 'token');
      // No token_expiration set

      const { unmount } = renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('scroll'));

      await vi.advanceTimersByTimeAsync(600);

      // Should not crash or call refresh
      expect(axios.post).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe('Multiple Activity Types', () => {
    it('should respond to scroll activity', async () => {
      const now = Date.now();
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('token_expiration', (now + 20000).toString());

      renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('scroll'));
      await vi.advanceTimersByTimeAsync(600);

      expect(axios.post).toHaveBeenCalled();
    });

    it('should respond to mouse movement', async () => {
      const now = Date.now();
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('token_expiration', (now + 20000).toString());

      renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('mousemove'));
      await vi.advanceTimersByTimeAsync(600);

      expect(axios.post).toHaveBeenCalled();
    });

    it('should respond to keyboard input', async () => {
      const now = Date.now();
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('token_expiration', (now + 20000).toString());

      renderHook(() => useTokenRefresh());

      window.dispatchEvent(new Event('keydown'));
      await vi.advanceTimersByTimeAsync(600);

      expect(axios.post).toHaveBeenCalled();
    });
  });
});
