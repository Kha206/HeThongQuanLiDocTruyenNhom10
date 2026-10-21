export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';

/**
 * Chuyển đổi URL ảnh thành URL hợp lệ qua backend Image Proxy hoặc static uploads.
 * - Ảnh ComicVine / bên ngoài: ${API_BASE_URL}/api/image-proxy?url=...
 * - Ảnh upload nội bộ: ${API_BASE_URL}/uploads/...
 * @param {string|null|undefined} rawUrl 
 * @returns {string|null}
 */
export function getProxiedImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const url = rawUrl.trim();
  if (!url) return null;

  // Đường dẫn tĩnh upload từ backend (/uploads/...)
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }

  // Data URI
  if (url.startsWith('data:')) {
    return url;
  }

  // URL ComicVine hoặc internet: chuyển qua image-proxy của backend để vượt tường lửa / CORS
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // Đường dẫn tương đối khác
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  return url;
}
