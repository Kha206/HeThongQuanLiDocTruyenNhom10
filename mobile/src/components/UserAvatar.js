import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getProxiedImageUrl } from '../utils/imageUrl';

/**
 * UserAvatar - Component hiển thị ảnh đại diện người dùng hoặc chữ cái đầu (Initials)
 * TUYỆT ĐỐI TUÂN THỦ: Avatar chữ cái đầu CHỈ DÙNG CHO NGƯỜI DÙNG (không dùng cho nhân vật/truyện)
 * Mọi ảnh người dùng đều đi qua getProxiedImageUrl an toàn.
 */
export default function UserAvatar({ user, size = 36, style }) {
  const [imageError, setImageError] = useState(false);

  const getInitialLetter = () => {
    const name = user?.full_name || user?.username || user?.user_name || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const avatarUrl = user?.avatar ? getProxiedImageUrl(user.avatar) : null;
  const initial = getInitialLetter();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const fontSize = Math.round(size * 0.42);

  if (avatarUrl && !imageError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[containerStyle, styles.image, style]}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: Chữ cái đầu chuẩn phong cách Marvel Theme
  return (
    <View style={[containerStyle, styles.initialContainer, style]}>
      <Text style={[styles.initialText, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#1A1A22',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  initialContainer: {
    backgroundColor: '#2A2A38',
    borderWidth: 1.5,
    borderColor: '#3E3E50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
});
