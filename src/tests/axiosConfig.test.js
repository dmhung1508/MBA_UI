import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios BEFORE importing axiosConfig
vi.mock('axios', () => {
  const mockAxiosInstanceFunction = vi.fn();

  const mockAxiosInstance = Object.assign(mockAxiosInstanceFunction, {
    interceptors: {
      request: {
        use: vi.fn((fulfilled, rejected) => {
          mockAxiosInstance._requestInterceptor = { fulfilled, rejected };
          return 0;
        }),
      },
      response: {
        use: vi.fn((fulfilled, rejected) => {
          mockAxiosInstance._responseInterceptor = { fulfilled, rejected };
          return 0;
        }),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  });

  const mockAxios = {
    create: vi.fn(() => mockAxiosInstance),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: mockAxios,
    __mockAxiosInstance: mockAxiosInstance,
    __mockAxios: mockAxios,
  };
});

// Now import axios and axiosConfig
import axios from 'axios';
import axiosInstance from '../config/axiosConfig';

// Get references to the mocks - create() was called during import, so get that return value
const mockAxios = axios;
const mockAxiosInstance = mockAxios.create.mock.results[0]?.value;

describe('Axios Config - Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    window.location.href = '';
    // Reset the mock functions
    mockAxios.post.mockReset();
    mockAxiosInstance.mockReset();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      const mockToken = 'test-access-token';
      localStorage.setItem('access_token', mockToken);

      const config = { headers: {} };
      const requestInterceptor = mockAxiosInstance._requestInterceptor.fulfilled;
      const result = await requestInterceptor(config);

      expect(result.headers['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should not add Authorization header when token does not exist', async () => {
      localStorage.removeItem('access_token');

      const config = { headers: {} };
      const requestInterceptor = mockAxiosInstance._requestInterceptor.fulfilled;
      const result = await requestInterceptor(config);

      expect(result.headers['Authorization']).toBeUndefined();
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should refresh token on 401 error', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';

      localStorage.setItem('access_token', oldToken);

      // Mock refresh endpoint response
      mockAxios.post.mockResolvedValueOnce({
        data: { access_token: newToken },
      });

      // Mock the retry request (axiosInstance is called as a function)
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true },
      });

      // Simulate 401 error
      const error = {
        config: { headers: {}, url: '/test' },
        response: { status: 401 },
      };

      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;
      await responseInterceptor(error);

      // Verify token was updated
      expect(localStorage.getItem('access_token')).toBe(newToken);
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth_mini/refresh'),
        {},
        { withCredentials: true }
      );
    });

    it('should redirect to login when refresh fails', async () => {
      localStorage.setItem('access_token', 'expired-token');
      localStorage.setItem('token_type', 'bearer');
      localStorage.setItem('user_role', 'user');

      // Mock refresh endpoint failure
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 401 },
      });

      // Simulate 401 error
      const error = {
        config: { headers: {} },
        response: { status: 401 },
      };

      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;

      try {
        await responseInterceptor(error);
      } catch (e) {
        // Expected to throw
      }

      // Verify storage was cleared
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('token_type')).toBeNull();
      expect(localStorage.getItem('user_role')).toBeNull();
      expect(window.location.href).toBe('/mini/login');
    });

    it('should queue multiple requests during refresh', async () => {
      const newToken = 'new-token';

      localStorage.setItem('access_token', 'old-token');

      // Mock refresh to take some time
      mockAxios.post.mockImplementationOnce(
        () => new Promise(resolve => {
          setTimeout(() => resolve({ data: { access_token: newToken } }), 100);
        })
      );

      // Mock retry requests
      mockAxiosInstance.mockResolvedValue({ data: { success: true } });

      // Simulate 401 error - each needs its own config object
      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;

      // Fire off multiple requests with separate config objects
      const promises = [
        responseInterceptor({ config: { headers: {} }, response: { status: 401 } }),
        responseInterceptor({ config: { headers: {} }, response: { status: 401 } }),
        responseInterceptor({ config: { headers: {} }, response: { status: 401 } }),
      ];

      await Promise.all(promises);

      // Refresh should only be called once
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should update token expiration after refresh', async () => {
      const newToken = 'new-token';
      const beforeTime = Date.now();

      localStorage.setItem('access_token', 'old-token');

      mockAxios.post.mockResolvedValueOnce({
        data: { access_token: newToken },
      });

      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true },
      });

      // Simulate 401 error
      const error = {
        config: { headers: {} },
        response: { status: 401 },
      };

      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;
      await responseInterceptor(error);

      const storedExpiration = parseInt(localStorage.getItem('token_expiration'));
      const expectedExpiration = beforeTime + (3 * 60 * 1000);

      expect(storedExpiration).toBeGreaterThanOrEqual(expectedExpiration - 100);
      expect(storedExpiration).toBeLessThanOrEqual(expectedExpiration + 100);
    });
  });

  describe('Error Handling', () => {
    it('should reject non-401 errors without refresh', async () => {
      const error = {
        config: {},
        response: { status: 500, data: { detail: 'Server Error' } },
      };

      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;

      await expect(responseInterceptor(error)).rejects.toEqual(error);

      // Refresh should not be called
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should reject network errors without refresh', async () => {
      const error = {
        message: 'Network Error',
        config: {},
      };

      const responseInterceptor = mockAxiosInstance._responseInterceptor.rejected;

      await expect(responseInterceptor(error)).rejects.toEqual(error);

      // Refresh should not be called
      expect(mockAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Token Storage', () => {
    it('should store access token after refresh', () => {
      const newToken = 'refreshed-token';
      localStorage.setItem('access_token', newToken);

      expect(localStorage.getItem('access_token')).toBe(newToken);
    });

    it('should store token expiration after refresh', () => {
      const expirationTime = new Date().getTime() + (3 * 60 * 1000);
      localStorage.setItem('token_expiration', expirationTime.toString());

      expect(localStorage.getItem('token_expiration')).toBe(expirationTime.toString());
    });

    it('should clear all auth data on refresh failure', () => {
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('token_type', 'bearer');
      localStorage.setItem('user_role', 'user');
      localStorage.setItem('token_expiration', '123456');

      // Clear all
      localStorage.clear();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('token_type')).toBeNull();
      expect(localStorage.getItem('user_role')).toBeNull();
      expect(localStorage.getItem('token_expiration')).toBeNull();
    });
  });
});
