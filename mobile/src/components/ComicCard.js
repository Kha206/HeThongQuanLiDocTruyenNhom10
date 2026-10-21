import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProxiedImage from './ProxiedImage';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function ComicCard({ story, onPress }) {
  if (!story) return null;

  const getPolicyBadge = () => {
    switch (story.access_policy) {
      case 'free':
        return (
          <View style={[styles.badge, styles.badgeFree]}>
            <Text style={[styles.badgeText, styles.badgeTextFree]}>MIỄN PHÍ</Text>
          </View>
        );
      case 'paid':
        return (
          <View style={[styles.badge, styles.badgePaid]}>
            <Ionicons name="sparkles" size={10} color="#FBBF24" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, styles.badgeTextPaid]}>
              VIP {story.price && Number(story.price) > 0 ? `• ${Number(story.price).toLocaleString('vi-VN')}đ` : ''}
            </Text>
          </View>
        );
      case 'mixed':
        return (
          <View style={[styles.badge, styles.badgeMixed]}>
            <Text style={[styles.badgeText, styles.badgeTextMixed]}>CÓ ĐỌC THỬ</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (story.status) {
      case 'ongoing':
        return (
          <View style={[styles.badge, styles.badgeOngoing]}>
            <Text style={[styles.badgeText, styles.badgeTextOngoing]}>Đang ra</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={[styles.badge, styles.badgeCompleted]}>
            <Ionicons name="checkmark-circle" size={10} color="#C084FC" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Trọn bộ</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const ratingScore = story.average_rating ? Number(story.average_rating).toFixed(1) : (story.rating ? Number(story.rating).toFixed(1) : null);
  const ratingCount = story.rating_count || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress && onPress(story)}
    >
      {/* Cover Image Container */}
      <View style={styles.imageContainer}>
        <ProxiedImage
          url={story.cover_image}
          style={styles.coverImage}
          fallbackIcon="book-outline"
        />

        {/* Status Badge (Góc trên trái) */}
        <View style={styles.topLeftBadge}>
          {getStatusBadge()}
        </View>

        {/* Policy Badge (Góc trên phải) */}
        <View style={styles.topRightBadge}>
          {getPolicyBadge()}
        </View>

        {/* Rating Badge (Góc dưới trái) */}
        <View style={styles.bottomLeftBadge}>
          {ratingScore ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#FBBF24" />
              <Text style={styles.ratingText}>{ratingScore}</Text>
              {ratingCount > 0 && <Text style={styles.ratingCountText}>({ratingCount})</Text>}
            </View>
          ) : (
            <Text style={styles.ratingCountText}>Mới</Text>
          )}
        </View>

        {/* View Count (Góc dưới phải) */}
        <View style={styles.bottomRightBadge}>
          <Ionicons name="eye-outline" size={11} color="#9CA3AF" />
          <Text style={styles.viewsText}>{formatNumber(story.view_count || 0)}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.info}>
        {/* Year & Publisher */}
        <View style={styles.metaRow}>
          <Text style={styles.metaYear}>
            {story.release_year || 'Marvel'}
          </Text>
          <Text style={styles.metaPublisher} numberOfLines={1}>
            {story.publisher || 'Marvel Comics'}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {story.title}
        </Text>

        {/* Description / Subtitle */}
        <Text style={styles.description} numberOfLines={2}>
          {story.description || story.original_title || 'Truyện tranh siêu anh hùng vũ trụ Marvel Comics.'}
        </Text>

        {/* Genres & Chapter count */}
        <View style={styles.footerRow}>
          <View style={styles.genresContainer}>
            {story.genres && story.genres.slice(0, 2).map((g) => (
              <View key={g.id || g.name} style={styles.genrePill}>
                <Text style={styles.genrePillText}>{g.name}</Text>
              </View>
            ))}
          </View>
          {story.chapters && story.chapters.length > 0 && (
            <Text style={styles.chapterCountText}>{story.chapters.length} chap</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 14,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#0F0F14',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  topLeftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  topRightBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomLeftBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(15, 15, 20, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomRightBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 15, 20, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  badgeTextFree: {
    color: '#34D399',
  },
  badgePaid: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  badgeTextPaid: {
    color: '#FBBF24',
  },
  badgeMixed: {
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  badgeTextMixed: {
    color: '#60A5FA',
  },
  badgeOngoing: {
    backgroundColor: 'rgba(6, 182, 212, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.45)',
  },
  badgeTextOngoing: {
    color: '#22D3EE',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.45)',
  },
  badgeTextCompleted: {
    color: '#C084FC',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '700',
  },
  ratingCountText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  viewsText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaYear: {
    fontSize: 11,
    color: '#ED1D24',
    fontWeight: '700',
  },
  metaPublisher: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 42, 56, 0.6)',
  },
  genresContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  genrePill: {
    backgroundColor: '#23232E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  genrePillText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  chapterCountText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
