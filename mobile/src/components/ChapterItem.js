import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProxiedImage from './ProxiedImage';

export default function ChapterItem({ chapter, story, isUnlocked, onPress }) {
  if (!chapter) return null;

  const accentColor = chapter.accent_color || '#ED1D24';

  const getStatusBadge = () => {
    if (chapter.is_preview) {
      return (
        <View style={[styles.badge, styles.badgePreview]}>
          <Ionicons name="eye-outline" size={11} color="#34D399" style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, styles.badgeTextPreview]}>ĐỌC THỬ</Text>
        </View>
      );
    }

    if (story?.access_policy === 'free') {
      return (
        <View style={[styles.badge, styles.badgeFree]}>
          <Ionicons name="lock-open-outline" size={11} color="#34D399" style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, styles.badgeTextFree]}>FREE</Text>
        </View>
      );
    }

    if (isUnlocked) {
      return (
        <View style={[styles.badge, styles.badgeUnlocked]}>
          <Ionicons name="checkmark-circle-outline" size={11} color="#34D399" style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, styles.badgeTextUnlocked]}>ĐÃ MỞ</Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.badgeLocked]}>
        <Ionicons name="lock-closed" size={11} color="#FBBF24" style={{ marginRight: 3 }} />
        <Text style={[styles.badgeText, styles.badgeTextLocked]}>VIP</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.container}
      onPress={() => onPress && onPress(chapter)}
    >
      {/* Accent bar bên trái */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        {/* Thumbnail riêng của từng chương */}
        <View style={styles.thumbWrapper}>
          <ProxiedImage
            url={chapter.cover_image}
            style={styles.thumbnail}
            fallbackIcon="book-outline"
            fallbackIconSize={20}
          />
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>#{chapter.chapter_number}</Text>
          </View>
        </View>

        {/* Text metadata */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {chapter.title || `Chương ${chapter.chapter_number}`}
          </Text>
          <Text style={styles.dateText}>
            {chapter.release_date || 'Phát hành chính thức'}
          </Text>
        </View>

        {/* Trạng thái khóa / mở khóa */}
        <View style={styles.badgeWrapper}>
          {getStatusBadge()}
          <Ionicons name="chevron-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 8,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 12,
  },
  thumbWrapper: {
    width: 44,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#0F0F14',
    borderWidth: 0.5,
    borderColor: '#2A2A38',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  numberBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  numberBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgePreview: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextPreview: {
    color: '#34D399',
  },
  badgeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextFree: {
    color: '#34D399',
  },
  badgeUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextUnlocked: {
    color: '#34D399',
  },
  badgeLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  badgeTextLocked: {
    color: '#FBBF24',
  },
});
