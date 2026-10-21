import { getToken, removeToken } from './authStorage';
import { API_BASE_URL } from '../utils/imageUrl';

let onUnauthorizedCallback = null;

/**
 * Đăng ký hàm xử lý khi gặp mã lỗi 401 Unauthorized từ server
 * @param {Function} callback 
 */
export function setUnauthorizedHandler(callback) {
  onUnauthorizedCallback = callback;
}

/**
 * Hàm gửi HTTP Request dùng chung cho toàn bộ app
 * - Tự động gắn Bearer Token nếu đã đăng nhập
 * - Bắt mã 401: Xóa token trong SecureStore và gọi callback chuyển về Login
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc địa chỉ máy dev (EXPO_PUBLIC_API_URL).');
  }

  // Xử lý 401 Unauthorized: xóa token và đưa về màn hình đăng nhập
  if (response.status === 401) {
    await removeToken();
    if (typeof onUnauthorizedCallback === 'function') {
      onUnauthorizedCallback();
    }
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    error.status = 401;
    error.data = errData;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let data = {};
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const errorMsg = data.message || `Yêu cầu thất bại với mã trạng thái ${response.status}.`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};

export default api;
