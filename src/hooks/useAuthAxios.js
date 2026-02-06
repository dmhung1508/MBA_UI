import { useCallback } from 'react';
import axiosInstance from '../config/axiosConfig';

/**
 * Custom hook for making authenticated API calls
 * Automatically handles token refresh on 401 errors
 */
export const useAuthAxios = () => {
  const get = useCallback(async (url, config = {}) => {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  const post = useCallback(async (url, data = {}, config = {}) => {
    try {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  const put = useCallback(async (url, data = {}, config = {}) => {
    try {
      const response = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  const del = useCallback(async (url, config = {}) => {
    try {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  return {
    get,
    post,
    put,
    delete: del,
    axiosInstance, // Export raw instance for advanced usage
  };
};
