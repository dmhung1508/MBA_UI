/**
 * Utility functions for authentication
 */

/**
 * Kiểm tra xem token có còn hợp lệ không
 * @returns {boolean} true nếu token còn hợp lệ, false nếu hết hạn hoặc không tồn tại
 */
export const isTokenValid = () => {
  const token = localStorage.getItem('access_token');
  const expiration = localStorage.getItem('token_expiration');
  
  if (!token || !expiration) {
    return false;
  }
  
  const expirationTime = parseInt(expiration, 10);
  const currentTime = new Date().getTime();
  
  // Kiểm tra xem token có hết hạn chưa
  if (currentTime > expirationTime) {
    // Token đã hết hạn, xóa khỏi localStorage
    clearAuthData();
    return false;
  }
  
  return true;
};

/**
 * Lấy token hợp lệ (nếu còn hạn)
 * @returns {string|null} Token nếu còn hợp lệ, null nếu không
 */
export const getValidToken = () => {
  if (isTokenValid()) {
    return localStorage.getItem('access_token');
  }
  return null;
};

/**
 * Xóa tất cả dữ liệu authentication
 */
export const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user_role');
  localStorage.removeItem('token_expiration');
};

/**
 * Lấy headers với Authorization token
 * @param {Object} additionalHeaders - Headers bổ sung
 * @returns {Object} Headers object với Authorization nếu token hợp lệ
 */
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getValidToken();
  const headers = { ...additionalHeaders };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Gia hạn token (reset thời gian hết hạn thêm 30 ngày)
 */
export const renewToken = () => {
  if (isTokenValid()) {
    const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days
    localStorage.setItem('token_expiration', expirationTime.toString());
    return true;
  }
  return false;
};

/**
 * Xử lý logout khi token không hợp lệ
 */
export const handleInvalidToken = () => {
  clearAuthData();
  // Redirect về trang login
  window.location.href = '/mini/login';
};

/**
 * Wrapper cho fetch API với tự động xử lý token hết hạn
 * @param {string} url - URL để gọi API
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Kiểm tra token trước khi gọi API
  if (!isTokenValid()) {
    handleInvalidToken();
    throw new Error('Token expired or invalid');
  }
  
  // Thêm Authorization header
  const headers = getAuthHeaders(options.headers || {});
  const finalOptions = {
    ...options,
    headers
  };
  
  try {
    const response = await fetch(url, finalOptions);
    
    // Kiểm tra lỗi 401 Unauthorized hoặc 403 Forbidden
    if (response.status === 401 || response.status === 403) {
      // Kiểm tra xem có phải lỗi "Could not validate credentials" không
      try {
        const errorData = await response.clone().json();
        if (errorData.detail && 
            (errorData.detail.includes('Could not validate credentials') ||
             errorData.detail.includes('Not authenticated'))) {
          // Token không hợp lệ từ server, logout
          handleInvalidToken();
          throw new Error('Session expired. Please login again.');
        }
      } catch (e) {
        // Nếu không parse được JSON, vẫn coi như token hết hạn
        if (response.status === 401) {
          handleInvalidToken();
          throw new Error('Session expired. Please login again.');
        }
      }
    }
    
    return response;
  } catch (error) {
    // Network error hoặc các lỗi khác
    throw error;
  }
};
