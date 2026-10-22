import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';
import ChapterItem from '../components/ChapterItem';

export default function StoryDetailScreen({ route, navigation }) {
  const { storyId } = route.params || {};
  const { canAccessChapter } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storyId) return;

    const fetchStoryDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/stories/${storyId}`);
        if (res.success && res.story) {
          setStory(res.story);
        } else {
          setError('Không tìm thấy thông tin truyện.');
        }
      } catch (err) {
        setError(err.message || 'Lỗi khi tải thông tin truyện.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetail();
  }, [storyId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>Chi Tiết Truyện</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#ED1D24" />
          <Text style={styles.loadingText}>Đang tải chi tiết bộ truyện...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !story) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topNavTitle}>Chi Tiết Truyện</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorWrapper}>
          <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
          <Text style={styles.errorTitle}>Lỗi tải dữ liệu</Text>
          <Text style={styles.errorSub}>{error || 'Truyện không tồn tại.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ratingScore = story.average_rating
    ? Number(story.average_rating).toFixed(1)
    : (story.rating ? Number(story.rating).toFixed(1) : null);
  const ratingCount = story.rating_count || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Top Navbar */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle} numberOfLines={1}>
          {story.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.coverRow}>
            {/* Ảnh bìa riêng của truyện */}
            <View style={styles.coverWrapper}>
              <ProxiedImage
                url={story.cover_image}
                style={styles.coverImage}
                fallbackIcon="book-outline"
                fallbackIconSize={36}
              />
            </View>

            {/* Thông tin chính */}
            <View style={styles.mainInfo}>
              <View style={styles.badgeRow}>
                {story.access_policy === 'free' ? (
                  <View style={[styles.badge, styles.badgeFree]}>
                    <Text style={[styles.badgeText, styles.badgeTextFree]}>MIỄN PHÍ</Text>
                  </View>
                ) : story.access_policy === 'paid' ? (
                  <View style={[styles.badge, styles.badgePaid]}>
                    <Ionicons name="sparkles" size={10} color="#FBBF24" style={{ marginRight: 3 }} />
                    <Text style={[styles.badgeText, styles.badgeTextPaid]}>VIP</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeMixed]}>
                    <Text style={[styles.badgeText, styles.badgeTextMixed]}>CÓ ĐỌC THỬ</Text>
                  </View>
                )}

                <View style={[styles.badge, styles.badgeStatus]}>
                  <Text style={styles.badgeStatusText}>
                    {story.status === 'completed' ? 'Trọn bộ' : 'Đang ra'}
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>{story.title}</Text>

              {story.original_title ? (
                <Text style={styles.originalTitle}>{story.original_title}</Text>
              ) : null}

              <View style={styles.metaInfoRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#ED1D24" />
                  <Text style={styles.metaText}>{story.release_year || 'Marvel'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>{(story.view_count || 0).toLocaleString()} lượt đọc</Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingNumber}>
                  {ratingScore || 'Chưa có'}
                </Text>
                {ratingCount > 0 && (
                  <Text style={styles.ratingCount}>({ratingCount} lượt đánh giá)</Text>
                )}
              </View>
            </View>
          </View>

          {/* Thể loại */}
          {story.genres && story.genres.length > 0 && (
            <View style={styles.genresRow}>
              {story.genres.map((g) => (
                <View key={g.id || g.name} style={styles.genrePill}>
                  <Text style={styles.genreText}>{g.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Mô tả truyện */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionHeading}>Giới Thiệu Nội Dung</Text>
            <Text style={styles.descriptionText}>
              {story.description || 'Ấn phẩm truyện tranh đặc sắc từ vũ trụ Marvel Comics.'}
            </Text>
          </View>
        </View>

        {/* Danh Sách Chương */}
        <View style={styles.chaptersSection}>
          <View style={styles.chaptersHeader}>
            <View style={styles.chaptersTitleRow}>
              <Ionicons name="book" size={20} color="#ED1D24" style={{ marginRight: 8 }} />
              <Text style={styles.chaptersTitle}>Danh Sách Chương</Text>
              <View style={styles.chapterTotalBadge}>
                <Text style={styles.chapterTotalText}>{story.chapters?.length || 0} chương</Text>
              </View>
            </View>

            {/* Chú thích màu sắc */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
                <Text style={styles.legendText}>Đọc thử / Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
                <Text style={styles.legendText}>Yêu cầu VIP</Text>
              </View>
            </View>
          </View>

          {/* Danh sách các ChapterItem */}
          {story.chapters && story.chapters.length > 0 ? (
            story.chapters.map((ch) => {
              const isUnlocked = canAccessChapter(story, ch);
              return (
                <ChapterItem
                  key={ch.id}
                  chapter={ch}
                  story={story}
                  isUnlocked={isUnlocked}
                  onPress={(selectedChapter) => {
                    navigation.navigate('ChapterReader', {
                      chapterId: selectedChapter.id,
                      storyId: story.id,
                      storyTitle: story.title,
                      chapterNumber: selectedChapter.chapter_number,
                      chapterTitle: selectedChapter.title,
                    });
                  }}
                />
              );
            })
          ) : (
            <View style={styles.emptyChaptersBox}>
              <Ionicons name="file-tray-outline" size={32} color="#6B7280" />
              <Text style={styles.emptyChaptersText}>Chưa có chương nào được nạp cho truyện này.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backBtn: {
    padding: 6,
    backgroundColor: '#1A1A22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  topNavTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  errorWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: 'Outfit_700Bold',
  },
  errorSub: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1A1A22',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginBottom: 20,
  },
  coverRow: {
    flexDirection: 'row',
    gap: 14,
  },
  coverWrapper: {
    width: 105,
    height: 155,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  mainInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeFree: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextFree: {
    color: '#34D399',
  },
  badgePaid: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  badgeTextPaid: {
    color: '#FBBF24',
  },
  badgeMixed: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  badgeTextMixed: {
    color: '#60A5FA',
  },
  badgeStatus: {
    backgroundColor: '#23232E',
  },
  badgeStatusText: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    lineHeight: 22,
    marginBottom: 3,
  },
  originalTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  ratingNumber: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  ratingCount: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 42, 56, 0.6)',
  },
  genrePill: {
    backgroundColor: '#23232E',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#2A2A38',
  },
  genreText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  descriptionSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 42, 56, 0.6)',
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  descriptionText: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
  chaptersSection: {
    marginTop: 4,
  },
  chaptersHeader: {
    marginBottom: 12,
  },
  chaptersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  chaptersTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Italiana_400Regular',
    letterSpacing: 1.5,
  },
  chapterTotalBadge: {
    backgroundColor: '#23232E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: '#2A2A38',
  },
  chapterTotalText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  emptyChaptersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A22',
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  emptyChaptersText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
});
