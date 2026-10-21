import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProxiedImageUrl } from '../utils/imageUrl';

/**
 * Component hiển thị ảnh an toàn qua backend Image Proxy
 * - Tự động encode và chuyển qua /api/image-proxy cho ảnh ComicVine
 * - Nếu không có ảnh hoặc tải lỗi: hiển thị icon tĩnh trên nền tối Marvel, tuyệt đối không dùng ảnh placeholder từ internet
 */
export default function ProxiedImage({
  url,
  style,
  resizeMode = 'cover',
  fallbackIcon = 'book-outline',
  fallbackIconSize = 28
}) {
  const [hasError, setHasError] = useState(false);
  const proxiedUri = getProxiedImageUrl(url);

  if (!proxiedUri || hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Ionicons name={fallbackIcon} size={fallbackIconSize} color="#ED1D24" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: proxiedUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#1A1A22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A38',
  }
});
