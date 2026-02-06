import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthAxios } from '../hooks/useAuthAxios';
import axiosInstance from '../config/axiosConfig';

// Mock axios instance
vi.mock('../config/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useAuthAxios Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { tickets: [{ id: 1, title: 'Test' }] };
      axiosInstance.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useAuthAxios());

      const data = await result.current.get('/tickets');

      expect(axiosInstance.get).toHaveBeenCalledWith('/tickets', {});
      expect(data).toEqual(mockData);
    });

    it('should handle GET request errors', async () => {
      const mockError = { response: { data: { detail: 'Not found' } } };
      axiosInstance.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(result.current.get('/tickets')).rejects.toEqual({ detail: 'Not found' });
    });

    it('should pass config options to GET', async () => {
      const mockData = { success: true };
      axiosInstance.get.mockResolvedValue({ data: mockData });

      const { result } = renderHook(() => useAuthAxios());
      const config = { params: { limit: 10 } };

      await result.current.get('/tickets', config);

      expect(axiosInstance.get).toHaveBeenCalledWith('/tickets', config);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockResponse = { ticket_number: 'TICKET-001' };
      axiosInstance.post.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useAuthAxios());
      const postData = { title: 'New Ticket', description: 'Test' };

      const data = await result.current.post('/tickets', postData);

      expect(axiosInstance.post).toHaveBeenCalledWith('/tickets', postData, {});
      expect(data).toEqual(mockResponse);
    });

    it('should handle POST request errors', async () => {
      const mockError = { response: { data: { detail: 'Validation error' } } };
      axiosInstance.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(
        result.current.post('/tickets', {})
      ).rejects.toEqual({ detail: 'Validation error' });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = { message: 'Updated' };
      axiosInstance.put.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useAuthAxios());
      const updateData = { status: 'closed' };

      const data = await result.current.put('/tickets/TICKET-001', updateData);

      expect(axiosInstance.put).toHaveBeenCalledWith('/tickets/TICKET-001', updateData, {});
      expect(data).toEqual(mockResponse);
    });

    it('should handle PUT request errors', async () => {
      const mockError = { response: { data: { detail: 'Update failed' } } };
      axiosInstance.put.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(
        result.current.put('/tickets/TICKET-001', {})
      ).rejects.toEqual({ detail: 'Update failed' });
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { message: 'Deleted' };
      axiosInstance.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useAuthAxios());

      const data = await result.current.delete('/tickets/TICKET-001');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/tickets/TICKET-001', {});
      expect(data).toEqual(mockResponse);
    });

    it('should handle DELETE request errors', async () => {
      const mockError = { response: { data: { detail: 'Delete failed' } } };
      axiosInstance.delete.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(
        result.current.delete('/tickets/TICKET-001')
      ).rejects.toEqual({ detail: 'Delete failed' });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const mockError = { message: 'Network Error' };
      axiosInstance.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(result.current.get('/tickets')).rejects.toBe('Network Error');
    });

    it('should handle errors without response data', async () => {
      const mockError = { message: 'Unknown error' };
      axiosInstance.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthAxios());

      await expect(result.current.get('/tickets')).rejects.toBe('Unknown error');
    });
  });

  describe('Axios instance access', () => {
    it('should export raw axios instance', () => {
      const { result } = renderHook(() => useAuthAxios());

      expect(result.current.axiosInstance).toBeDefined();
      expect(result.current.axiosInstance).toBe(axiosInstance);
    });
  });
});
