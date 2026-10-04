import React, { useState, useEffect } from 'react';
import { getProxiedImageUrl } from '../utils/imageProxy';

const DEFAULT_FALLBACK = 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg';

/**
 * ProxiedImage Component
 * Automatically routes images through the backend /api/image-proxy
 * and provides robust error handling with fallback.
 */
export const ProxiedImage = ({
  src,
  alt = '',
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  loading = 'lazy',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state whenever src changes so new images always render
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const effectiveSrc = hasError ? fallbackSrc : src;
  const proxiedSrc = getProxiedImageUrl(effectiveSrc);

  const handleError = (e) => {
    if (!hasError && fallbackSrc && fallbackSrc !== src) {
      setHasError(true);
    } else {
      e.target.onerror = null; // Prevent loop
    }
    if (onError) onError(e);
  };

  return (
    <img
      src={proxiedSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...props}
    />
  );
};

export default ProxiedImage;
