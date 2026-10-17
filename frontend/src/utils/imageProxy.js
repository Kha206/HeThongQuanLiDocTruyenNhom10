/**
 * Marvel Comic Platform - Image Proxy Utility
 * Proxies external images (specifically ComicVine / GameSpot) through backend
 * to bypass anti-hotlinking 403 Forbidden restrictions and CORS headers.
 */

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

/**
 * Returns a proxied URL for any image that requires CORS or hotlink bypass.
 * @param {string} url - Source image URL
 * @returns {string} Proxied image URL
 */
export function getProxiedImageUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const cleanUrl = url.trim();

  // Handle local uploaded files (e.g. /uploads/avatars/ or /uploads/chapters/)
  if (cleanUrl.startsWith('/uploads/')) {
    const backendBase = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : 'http://localhost:5000';
    return `${backendBase}${cleanUrl}`;
  }

  // If already proxied, data URI, or relative path, return as is
  if (
    cleanUrl.startsWith('data:') ||
    cleanUrl.startsWith('/') ||
    cleanUrl.includes('/api/image-proxy') ||
    cleanUrl.includes('/api/stories/proxy-image')
  ) {
    return cleanUrl;
  }

  // Proxy any ComicVine, GameSpot, or remote HTTP/HTTPS images
  if (
    cleanUrl.includes('comicvine.gamespot.com') ||
    cleanUrl.includes('gamespot.com') ||
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://')
  ) {
    return `${getApiBase()}/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
  }

  return cleanUrl;
}

export default getProxiedImageUrl;
