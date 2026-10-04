/**
 * Marvel Comic Platform - Image Proxy Utility
 * Proxies external images (specifically ComicVine / GameSpot) through backend
 * to bypass anti-hotlinking 403 Forbidden restrictions and CORS headers.
 */

const API_BASE = 'http://localhost:5000/api';

/**
 * Returns a proxied URL for any image that requires CORS or hotlink bypass.
 * @param {string} url - Source image URL
 * @returns {string} Proxied image URL
 */
export function getProxiedImageUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const cleanUrl = url.trim();

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
    return `${API_BASE}/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
  }

  return cleanUrl;
}

export default getProxiedImageUrl;
