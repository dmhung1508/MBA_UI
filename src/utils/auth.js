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
