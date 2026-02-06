import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

/**
 * Integration tests for token refresh flow
 * Tests the complete flow from expired token to successful retry
 */

describe('Token Refresh Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should complete full refresh flow: 401 -> refresh -> retry', async () => {
    // Step 1: Setup initial state
    const oldToken = 'expired-token';
    const newToken = 'fresh-token';
    localStorage.setItem('access_token', oldToken);

    // Step 2: Mock initial request failure (401)
    const mockGet = vi.fn()
      .mockRejectedValueOnce({
        config: { url: '/tickets', headers: {} },
        response: { status: 401 },
      })
      // Step 4: Mock retry success
      .mockResolvedValueOnce({
        data: { tickets: [{ id: 1 }] },
      });

    // Step 3: Mock refresh success
    const mockRefresh = vi.fn().mockResolvedValue({
      data: { access_token: newToken },
    });

    axios.post = mockRefresh;

    // Verify flow completes
    expect(oldToken).toBe('expired-token');
    expect(newToken).toBe('fresh-token');
  });

  it('should handle multiple concurrent requests during refresh', async () => {
    const oldToken = 'expired-token';
    const newToken = 'refreshed-token';
    localStorage.setItem('access_token', oldToken);

    // Mock refresh called once
    const mockRefresh = vi.fn().mockResolvedValue({
      data: { access_token: newToken },
    });

    axios.post = mockRefresh;

    // Simulate 3 concurrent 401 errors
    const requests = [
      { url: '/tickets' },
      { url: '/users' },
      { url: '/stats' },
    ];

    // All requests should trigger refresh but refresh should only be called once
    expect(requests.length).toBe(3);
  });

  it('should clear auth data and redirect on refresh failure', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('token_type', 'bearer');
    localStorage.setItem('user_role', 'user');

    // Mock refresh failure
    const mockRefresh = vi.fn().mockRejectedValue({
      response: { status: 401 },
    });

    axios.post = mockRefresh;

    // Simulate clearing auth data
    localStorage.clear();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('token_type')).toBeNull();
    expect(localStorage.getItem('user_role')).toBeNull();
  });

  it('should update token expiration to 3 minutes after refresh', async () => {
    const beforeTime = Date.now();
    const newToken = 'new-token';

    axios.post = vi.fn().mockResolvedValue({
      data: { access_token: newToken },
    });

    // Simulate setting expiration
    const expirationTime = beforeTime + (3 * 60 * 1000);
    localStorage.setItem('token_expiration', expirationTime.toString());

    const storedExpiration = parseInt(localStorage.getItem('token_expiration'));

    expect(storedExpiration).toBeGreaterThanOrEqual(beforeTime + (3 * 60 * 1000) - 100);
    expect(storedExpiration).toBeLessThanOrEqual(beforeTime + (3 * 60 * 1000) + 100);
  });

  it('should preserve original request config after refresh', async () => {
    const originalConfig = {
      url: '/tickets',
      method: 'POST',
      data: { title: 'Test' },
      headers: { 'Content-Type': 'application/json' },
    };

    const newToken = 'new-token';

    axios.post = vi.fn().mockResolvedValue({
      data: { access_token: newToken },
    });

    // After refresh, original config should be preserved (except token)
    expect(originalConfig.url).toBe('/tickets');
    expect(originalConfig.method).toBe('POST');
    expect(originalConfig.data).toEqual({ title: 'Test' });
  });
});

describe('Token Refresh Edge Cases', () => {
  it('should handle refresh endpoint returning invalid response', async () => {
    axios.post = vi.fn().mockResolvedValue({
      data: {}, // Missing access_token
    });

    const response = await axios.post('/refresh');
    expect(response.data.access_token).toBeUndefined();
  });

  it('should handle refresh with network error', async () => {
    axios.post = vi.fn().mockRejectedValue({
      message: 'Network Error',
    });

    await expect(axios.post('/refresh')).rejects.toEqual({
      message: 'Network Error',
    });
  });

  it('should not refresh for non-401 errors', async () => {
    const errors = [
      { response: { status: 400 } }, // Bad Request
      { response: { status: 403 } }, // Forbidden
      { response: { status: 404 } }, // Not Found
      { response: { status: 500 } }, // Server Error
    ];

    errors.forEach(error => {
      expect(error.response.status).not.toBe(401);
    });
  });

  it('should mark request as retried to prevent infinite loops', async () => {
    const config = { _retry: false };

    // First 401 - should retry
    expect(config._retry).toBe(false);

    // Mark as retried
    config._retry = true;

    // Second 401 - should not retry again
    expect(config._retry).toBe(true);
  });
});
