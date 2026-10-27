import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';
import ChapterItem from '../components/ChapterItem';
import SandboxPaymentModal from '../components/SandboxPaymentModal';

export default function StoryDetailScreen({ route, navigation }) {
  const { storyId } = route.params || {};
  const { isAuthenticated, purchasedStories, canAccessChapter } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trạng thái theo dõi truyện (Feature 2)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Trạng thái mua truyện lẻ Sandbox (Feature 1)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Tải thông tin chi tiết truyện
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

  // Lấy trạng thái theo dõi mới nhất mỗi khi vào màn hình (KHÔNG cache cứng, đồng bộ với Web)
  const fetchFollowStatus = useCallback(async () => {
    if (!storyId) return;
    try {
      const res = await api.get(`/api/stories/${storyId}/follow-status`);
      if (res.success) {
        setIsFollowing(!!res.is_following);
        setFollowersCount(res.followers_count || 0);
      }
    } catch (err) {
      console.warn('Lỗi khi lấy trạng thái theo dõi:', err.message);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      fetchFollowStatus();
    }, [fetchFollowStatus])
  );

  // Bật/Tắt theo dõi bộ truyện (Toggle Follow)
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (followLoading) return;

    setFollowLoading(true);
    // Cập nhật giao diện lập tức (Optimistic Update)
    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    const nextFollowing = !prevFollowing;
    setIsFollowing(nextFollowing);
    setFollowersCount(nextFollowing ? prevCount + 1 : Math.max(0, prevCount - 1));

    try {
      const res = await api.post(`/api/stories/${storyId}/follow`);
      if (res.success) {
        setIsFollowing(!!res.is_following);
        setFollowersCount(res.followers_count);
      } else {
        // Rollback nếu backend trả lỗi
        setIsFollowing(prevFollowing);
        setFollowersCount(prevCount);
      }
    } catch (err) {
      // Rollback
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      Alert.alert('Thông báo', err.message || 'Lỗi khi cập nhật theo dõi.');
    } finally {
      setFollowLoading(false);
    }
  };

  // Kiểm tra quyền sở hữu truyện lẻ từ AuthContext
  const isPurchased = useMemo(() => {
    if (!story?.id) return false;
    return purchasedStories.some((p) => Number(p.story_id) === Number(story.id));
  }, [story?.id, purchasedStories]);

  // Chương đầu tiên để bấm Đọc Ngay
  const firstChapter = useMemo(() => {
    if (!story?.chapters || story.chapters.length === 0) return null;
    return story.chapters[0];
  }, [story?.chapters]);

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
  const storyPriceNum = Number(story.price || 0);

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
                {followersCount > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons name="heart" size={12} color="#F43F5E" />
                    <Text style={[styles.metaText, { color: '#FDA4AF' }]}>
                      {followersCount} theo dõi
                    </Text>
                  </View>
                )}
              </View>

              {/* Rating */}
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingNumber}>
                  {ratingScore || 'Chưa có'}
                </Text>
                {ratingCount > 0 && (
                  <Text style={styles.ratingCount}>({ratingCount} đánh giá)</Text>
                )}
              </View>
            </View>
          </View>

          {/* Huy hiệu Đã sở hữu bản quyền trọn bộ (Nếu người dùng đã mua lẻ) */}
          {isPurchased ? (
            <View style={styles.ownershipBox}>
              <Ionicons name="checkmark-circle" size={18} color="#34D399" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ownershipTitle}>ĐÃ SỞ HỮU BẢN QUYỀN TRỌN BỘ</Text>
                <Text style={styles.ownershipSub}>
                  Bạn có thể đọc toàn bộ các chương bất cứ lúc nào mà không cần gói tháng.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Hàng nút Thao Tác Nổi Bật (Đọc ngay, Mua trọn bộ, Theo dõi) */}
          <View style={styles.actionButtonsRow}>
            {/* 1. Nút Đọc Ngay Chương 1 */}
            {firstChapter && (
              <TouchableOpacity
                style={styles.btnReadFirst}
                onPress={() => {
                  navigation.navigate('ChapterReader', {
                    chapterId: firstChapter.id,
                    storyId: story.id,
                    storyTitle: story.title,
                    chapterNumber: firstChapter.chapter_number,
                    chapterTitle: firstChapter.title,
                  });
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnReadFirstText}>Đọc Chương 1</Text>
              </TouchableOpacity>
            )}

            {/* 2. Nút Mua Trọn Bộ Riêng Lẻ (Chỉ hiện khi chưa sở hữu và truyện có tính phí) */}
            {!isPurchased && story.access_policy !== 'free' && storyPriceNum > 0 && (
              <TouchableOpacity
                style={styles.btnBuyStory}
                onPress={() => {
                  if (!isAuthenticated) {
                    navigation.navigate('Login');
                  } else {
                    setIsPurchaseModalOpen(true);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="cart" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnBuyStoryText}>
                  Mua Trọn Bộ ({storyPriceNum.toLocaleString('vi-VN')} đ)
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. Nút Theo Dõi Truyện (Toggle Follow - Feature 2) */}
            <TouchableOpacity
              style={[
                styles.btnFollow,
                isFollowing && styles.btnFollowActive
              ]}
              onPress={handleToggleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isFollowing ? 'heart' : 'heart-outline'}
                size={18}
                color={isFollowing ? '#F43F5E' : '#9CA3AF'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.btnFollowText, isFollowing && styles.btnFollowTextActive]}>
                {isFollowing ? 'Đang Theo Dõi' : 'Theo Dõi'}
              </Text>
              {followersCount > 0 && (
                <View style={[styles.followCountBadge, isFollowing && styles.followCountBadgeActive]}>
                  <Text style={[styles.followCountText, isFollowing && styles.followCountTextActive]}>
                    {followersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 4. Nút Xem Gói Hội Viên VIP */}
            {!isPurchased && story.access_policy !== 'free' && (
              <TouchableOpacity
                style={styles.btnVipPlans}
                onPress={() => navigation.navigate('Subscriptions')}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color="#FBBF24" style={{ marginRight: 6 }} />
                <Text style={styles.btnVipPlansText}>Xem Gói VIP</Text>
              </TouchableOpacity>
            )}
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

      {/* Modal Thanh toán Sandbox mua lẻ truyện */}
      <SandboxPaymentModal
        visible={isPurchaseModalOpen}
        story={story}
        paymentType="story_purchase"
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => {
          setIsPurchaseModalOpen(false);
        }}
      />
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
    padding: 24,
    paddingTop: 100,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    marginTop: 12,
  },
  errorSub: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  heroCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 16,
    marginBottom: 20,
  },
  coverRow: {
    flexDirection: 'row',
  },
  coverWrapper: {
    width: 110,
    aspectRatio: 2 / 3,
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
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeFree: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  badgeTextFree: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  badgePaid: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  badgeTextPaid: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  badgeMixed: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  badgeTextMixed: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  badgeStatus: {
    backgroundColor: '#2A2A38',
  },
  badgeStatusText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    lineHeight: 22,
    marginBottom: 2,
  },
  originalTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 4,
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
    gap: 4,
    backgroundColor: '#0F0F14',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A38',
    marginTop: 4,
  },
  ratingNumber: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  ratingCount: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  ownershipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  ownershipTitle: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  ownershipSub: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
  },
  btnReadFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ED1D24',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#ED1D24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  btnReadFirstText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  btnBuyStory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  btnBuyStoryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  btnFollow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnFollowActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
  },
  btnFollowText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  btnFollowTextActive: {
    color: '#FDA4AF',
    fontFamily: 'Inter_700Bold',
  },
  followCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  followCountBadgeActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
  },
  followCountText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  followCountTextActive: {
    color: '#FDA4AF',
    fontWeight: '700',
  },
  btnVipPlans: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnVipPlansText: {
    color: '#FBBF24',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  genrePill: {
    backgroundColor: '#2A2A38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  descriptionSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
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
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  chaptersSection: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 16,
  },
  chaptersHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
    paddingBottom: 10,
  },
  chaptersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chaptersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    flex: 1,
  },
  chapterTotalBadge: {
    backgroundColor: '#2A2A38',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  chapterTotalText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  emptyChaptersBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChaptersText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
});
