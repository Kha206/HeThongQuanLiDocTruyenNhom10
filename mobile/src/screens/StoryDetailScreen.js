import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';
import ChapterItem from '../components/ChapterItem';
import Pagination from '../components/Pagination';
import SandboxPaymentModal from '../components/SandboxPaymentModal';

const CHAPTERS_PER_PAGE = 9;

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

  // Phân trang & điều hướng chương (CHAPTERS_PER_PAGE = 9)
  const [chapterSortOrder, setChapterSortOrder] = useState('asc'); // 'asc': Cũ nhất trước, 'desc': Mới nhất trước
  const [chapterPage, setChapterPage] = useState(1);
  const [jumpInput, setJumpInput] = useState('');
  const [jumpError, setJumpError] = useState('');
  const [highlightedChapterId, setHighlightedChapterId] = useState(null);

  const scrollViewRef = useRef(null);
  const chaptersSectionY = useRef(0);
  const highlightTimerRef = useRef(null);

  // Reset phân trang và thứ tự khi chuyển bộ truyện
  useEffect(() => {
    setChapterSortOrder('asc');
    setChapterPage(1);
    setJumpInput('');
    setJumpError('');
    setHighlightedChapterId(null);
  }, [storyId]);

  // Hủy timer làm nổi bật khi unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // Tải thông tin chi tiết truyện
  const fetchStoryDetail = useCallback(async () => {
    if (!storyId) return;
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
  }, [storyId]);

  useEffect(() => {
    fetchStoryDetail();
  }, [fetchStoryDetail]);

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

  // Khoảng số chương min - max thực tế trong bộ truyện
  const { minChapter, maxChapter } = useMemo(() => {
    if (!story?.chapters || story.chapters.length === 0) {
      return { minChapter: null, maxChapter: null };
    }
    const nums = story.chapters
      .map((c) => Number(c.chapter_number))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) {
      return { minChapter: null, maxChapter: null };
    }
    return {
      minChapter: Math.min(...nums),
      maxChapter: Math.max(...nums),
    };
  }, [story?.chapters]);

  // Sắp xếp danh sách chương theo thứ tự cũ nhất hoặc mới nhất
  const sortedChapters = useMemo(() => {
    if (!story?.chapters || story.chapters.length === 0) return [];
    const list = [...story.chapters];
    list.sort((a, b) => {
      const numA = Number(a.chapter_number) || 0;
      const numB = Number(b.chapter_number) || 0;
      return chapterSortOrder === 'asc' ? numA - numB : numB - numA;
    });
    return list;
  }, [story?.chapters, chapterSortOrder]);

  const totalChapterPages = Math.max(1, Math.ceil(sortedChapters.length / CHAPTERS_PER_PAGE));
  const safeChapterPage = Math.min(Math.max(1, chapterPage), totalChapterPages);

  const currentChapters = useMemo(() => {
    const startIdx = (safeChapterPage - 1) * CHAPTERS_PER_PAGE;
    return sortedChapters.slice(startIdx, startIdx + CHAPTERS_PER_PAGE);
  }, [sortedChapters, safeChapterPage]);

  // Đổi thứ tự sắp xếp chương: tự động quay về trang 1
  const handleToggleSortOrder = () => {
    setChapterSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setChapterPage(1);
    setJumpError('');
  };

  // Chuyển trang chương và cuộn mượt về đầu danh sách chương
  const handleChapterPageChange = (targetPage) => {
    setChapterPage(targetPage);
    setJumpError('');
    if (scrollViewRef.current && chaptersSectionY.current > 0) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, chaptersSectionY.current - 10),
        animated: true,
      });
    }
  };

  // Nhảy tới chương số: tính đúng trang theo chapter_number thực tế
  const handleJumpToChapter = () => {
    const trimmed = jumpInput.trim();
    if (!trimmed) {
      setJumpError('Vui lòng nhập số chương.');
      return;
    }
    const targetNum = Number(trimmed);
    if (isNaN(targetNum)) {
      setJumpError('Vui lòng nhập một số hợp lệ.');
      return;
    }

    const targetIndex = sortedChapters.findIndex(
      (c) => Number(c.chapter_number) === targetNum
    );

    if (targetIndex === -1) {
      if (minChapter !== null && maxChapter !== null) {
        setJumpError(`Truyện này chỉ có chương ${minChapter} đến ${maxChapter}.`);
      } else {
        setJumpError('Không tìm thấy số chương này.');
      }
      return;
    }

    const targetPage = Math.floor(targetIndex / CHAPTERS_PER_PAGE) + 1;
    setChapterPage(targetPage);
    setJumpError('');
    setJumpInput('');

    const targetChapter = sortedChapters[targetIndex];
    setHighlightedChapterId(targetChapter.id);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedChapterId(null);
    }, 2000);

    if (scrollViewRef.current && chaptersSectionY.current > 0) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, chaptersSectionY.current - 10),
        animated: true,
      });
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
          <View style={styles.errorActionsRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchStoryDetail}>
              <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backErrorBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backErrorBtnText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
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

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
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
        <View
          style={styles.chaptersSection}
          onLayout={(e) => {
            chaptersSectionY.current = e.nativeEvent.layout.y;
          }}
        >
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

          {/* Hàng công cụ: Đổi thứ tự & Nhảy tới chương */}
          {story.chapters && story.chapters.length >= 2 && (
            <View style={styles.chapterToolbar}>
              <View style={styles.chapterToolbarTop}>
                <TouchableOpacity
                  style={styles.sortToggleBtn}
                  onPress={handleToggleSortOrder}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={14}
                    color="#ED1D24"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.sortToggleText}>
                    {chapterSortOrder === 'asc' ? 'Cũ nhất trước' : 'Mới nhất trước'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.jumpRow}>
                <Text style={styles.jumpLabel}>Nhảy tới chương số:</Text>
                <View style={styles.jumpControls}>
                  <TextInput
                    style={styles.jumpInput}
                    keyboardType="numeric"
                    placeholder={
                      minChapter !== null && maxChapter !== null
                        ? `${minChapter} - ${maxChapter}`
                        : 'Số'
                    }
                    placeholderTextColor="#6B7280"
                    value={jumpInput}
                    onChangeText={(text) => {
                      setJumpInput(text);
                      if (jumpError) setJumpError('');
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleJumpToChapter}
                  />
                  <TouchableOpacity
                    style={styles.jumpBtn}
                    onPress={handleJumpToChapter}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.jumpBtnText}>Đi</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {jumpError ? (
                <View style={styles.jumpErrorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color="#F87171" style={{ marginRight: 4 }} />
                  <Text style={styles.jumpErrorText}>{jumpError}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Danh sách các ChapterItem */}
          {currentChapters && currentChapters.length > 0 ? (
            currentChapters.map((ch) => {
              const isUnlocked = canAccessChapter(story, ch);
              return (
                <ChapterItem
                  key={ch.id}
                  chapter={ch}
                  story={story}
                  isUnlocked={isUnlocked}
                  isHighlighted={highlightedChapterId === ch.id}
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

          {/* Phân trang danh sách chương */}
          {totalChapterPages > 1 && (
            <Pagination
              currentPage={safeChapterPage}
              totalPages={totalChapterPages}
              onPageChange={handleChapterPageChange}
              style={{ marginTop: 14 }}
            />
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
  errorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
  },
  backErrorBtn: {
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backErrorBtnText: {
    color: '#D1D5DB',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
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
  chapterToolbar: {
    backgroundColor: '#16161F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 12,
    marginBottom: 12,
  },
  chapterToolbarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortToggleText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  jumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  jumpLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  jumpControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jumpInput: {
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 13,
    width: 80,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  jumpBtn: {
    backgroundColor: '#ED1D24',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jumpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  jumpErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  jumpErrorText: {
    color: '#F87171',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
