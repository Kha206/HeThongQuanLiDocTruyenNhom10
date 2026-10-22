import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';
import AccessBlockedSheet from '../components/AccessBlockedSheet';
import { parseContentToParagraphs } from '../utils/htmlUtils';

/**
 * ChapterReaderScreen - Màn hình Đọc Chương Truyện Marvel
 * 
 * ĐẶC ĐIỂM KỸ THUẬT:
 * 1. Gọi GET /api/chapters/:id kèm Bearer token (nếu có).
 * 2. Hiển thị ảnh bìa riêng của từng chương (qua ProxiedImage / /api/image-proxy).
 * 3. Nội dung tóm tắt / cốt truyện chương hiển thị bằng font Merriweather, line-height thoáng đãng.
 * 4. Xử lý HTML gọn nhẹ bằng hàm parseContentToParagraphs thuần regex (không bloat dependency).
 * 5. Danh sách nhân vật xuất hiện (character_credits): ảnh riêng từng nhân vật, lọc trùng lặp,
 *    fallback bằng icon siêu anh hùng vector (tuyệt đối không dùng avatar chữ cái đầu).
 * 6. Điều hướng chương trước (prev_chapter) và chương sau (next_chapter).
 * 7. Bắt mã 403 PAYMENT_REQUIRED -> hiển thị AccessBlockedSheet.
 * 8. Bắt mã 401 UNAUTHORIZED -> hiển thị thông báo hướng dẫn đăng nhập.
 */
export default function ChapterReaderScreen({ route, navigation }) {
  const { chapterId: initialChapterId, storyId, storyTitle } = route.params || {};
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);

  const { isVip, isAuthenticated } = useAuth();

  const [chapter, setChapter] = useState(null);
  const [prevChapter, setPrevChapter] = useState(null);
  const [nextChapter, setNextChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Tải dữ liệu chương truyện từ backend
  const fetchChapterDetail = useCallback(async (targetId) => {
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setAccessBlocked(null);
    setIsUnauthorized(false);

    try {
      const res = await api.get(`/api/chapters/${targetId}`);
      if (res.success && res.chapter) {
        setChapter(res.chapter);
        setPrevChapter(res.prev_chapter || null);
        setNextChapter(res.next_chapter || null);
      } else {
        setError(res.message || 'Không thể tải chi tiết chương truyện.');
      }
    } catch (err) {
      if (err.status === 403 || err.code === 'PAYMENT_REQUIRED' || err.data?.code === 'PAYMENT_REQUIRED') {
        setAccessBlocked({
          code: 'PAYMENT_REQUIRED',
          message: err.data?.message || err.message,
          access_info: err.access_info || err.data?.access_info || null,
        });
      } else if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.data?.code === 'UNAUTHORIZED') {
        setIsUnauthorized(true);
      } else {
        setError(err.message || 'Không thể kết nối đến máy chủ để tải chương truyện.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải chương khi ID thay đổi hoặc khi trạng thái VIP thay đổi
  useEffect(() => {
    fetchChapterDetail(currentChapterId);
  }, [currentChapterId, fetchChapterDetail, isVip]);

  // Màu nhấn của chương (hoặc fallback Marvel Red #ED1D24)
  const accentColor = useMemo(() => {
    if (chapter?.accent_color && /^#[0-9A-Fa-f]{6}$/.test(chapter.accent_color)) {
      return chapter.accent_color;
    }
    return '#ED1D24';
  }, [chapter?.accent_color]);

  // Phân tích nội dung và trích yếu
  const { pullQuote, paragraphs } = useMemo(() => {
    if (!chapter?.content) {
      return {
        pullQuote: chapter?.title || 'Ấn phẩm truyện tranh Marvel Comics',
        paragraphs: ['Đang cập nhật nội dung chi tiết cho chương truyện này...'],
      };
    }

    const allParagraphs = parseContentToParagraphs(chapter.content);
    if (allParagraphs.length === 0) {
      return {
        pullQuote: chapter.title || 'Hồi ký siêu anh hùng',
        paragraphs: [],
      };
    }

    // Chọn câu đầu tiên làm trích yếu (Pull quote) giống giao diện Web
    const firstPara = allParagraphs[0];
    const sentences = firstPara.match(/[^.!?]+[.!?]+/g) || [firstPara];
    const quote = sentences[0].trim();

    let remainingText = allParagraphs.slice();
    if (sentences.length > 1) {
      remainingText[0] = sentences.slice(1).join(' ').trim();
    } else {
      remainingText = allParagraphs.slice(1);
    }

    if (remainingText.length === 0) {
      remainingText = allParagraphs;
    }

    return {
      pullQuote: quote,
      paragraphs: remainingText,
    };
  }, [chapter?.content, chapter?.title]);

  // Danh sách nhân vật xuất hiện (đảm bảo không trùng lặp theo tên)
  const uniqueCharacters = useMemo(() => {
    if (!chapter?.character_credits) return [];
    let list = chapter.character_credits;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch (e) {
        list = [];
      }
    }

    if (!Array.isArray(list)) return [];

    const seen = new Set();
    const result = [];
    for (const char of list) {
      if (!char || !char.name) continue;
      const key = char.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(char);
      }
    }
    return result;
  }, [chapter?.character_credits]);

  // Chuyển sang đọc chương khác (prev/next)
  const handleNavigateChapter = (targetChapterId) => {
    if (targetChapterId) {
      setCurrentChapterId(targetChapterId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Top Floating Navbar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.navTitleGroup}>
          <Text style={styles.navStoryTitle} numberOfLines={1}>
            {chapter?.story?.title || storyTitle || 'Truyện Tranh Marvel'}
          </Text>
          <Text style={[styles.navChapterSubtitle, { color: accentColor }]} numberOfLines={1}>
            {chapter ? `Chương ${chapter.chapter_number}: ${chapter.title}` : 'Đọc chương'}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Trạng thái Đang tải dữ liệu */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Đang khởi tạo không gian đọc...</Text>
          <Text style={styles.loadingSub}>Dữ liệu chính thức từ Comic Vine</Text>
        </View>
      ) : isUnauthorized ? (
        /* Trạng thái 401: Yêu cầu đăng nhập */
        <View style={styles.centerBox}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="log-in-outline" size={36} color="#ED1D24" />
          </View>
          <Text style={styles.errorHeading}>Cần Đăng Nhập</Text>
          <Text style={styles.errorSubHeading}>
            Vui lòng đăng nhập tài khoản để đọc chương truyện trả phí này.
          </Text>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnPrimaryText}>Đăng Nhập Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : error && !accessBlocked ? (
        /* Trạng thái lỗi khác */
        <View style={styles.centerBox}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={36} color="#F87171" />
          </View>
          <Text style={styles.errorHeading}>Không Thể Tải Chương</Text>
          <Text style={styles.errorSubHeading}>{error}</Text>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => fetchChapterDetail(currentChapterId)}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnPrimaryText}>Thử Lại</Text>
          </TouchableOpacity>
        </View>
      ) : chapter ? (
        /* Trạng thái hiển thị nội dung chương */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Cover Card của riêng chương truyện */}
          <View style={styles.heroCoverCard}>
            <View style={styles.coverImageContainer}>
              <ProxiedImage
                url={chapter.cover_image}
                style={styles.chapterCoverImage}
                fallbackIcon="book-outline"
                fallbackIconSize={48}
              />
            </View>

            {/* Badges metadata */}
            <View style={styles.metaBadgeRow}>
              <View style={[styles.issueBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.issueBadgeText}>Issue #{chapter.chapter_number}</Text>
              </View>

              {chapter.release_date && (
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#9CA3AF" style={{ marginRight: 4 }} />
                  <Text style={styles.dateBadgeText}>{chapter.release_date}</Text>
                </View>
              )}

              {chapter.is_preview ? (
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeText}>ĐỌC THỬ MIỄN PHÍ</Text>
                </View>
              ) : (
                <View style={styles.vipBadge}>
                  <Ionicons name="sparkles" size={11} color="#FBBF24" style={{ marginRight: 3 }} />
                  <Text style={styles.vipBadgeText}>BẢN QUYỀN VIP</Text>
                </View>
              )}
            </View>

            {/* Tiêu đề chương */}
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
          </View>

          {/* Pull Quote (Trích yếu nghệ thuật) */}
          {pullQuote && (
            <View style={[styles.pullQuoteBox, { borderLeftColor: accentColor }]}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.pullQuoteText}>"{pullQuote}"</Text>
              <Text style={styles.pullQuoteAuthor}>
                — Trích yếu hồi ký Issue #{chapter.chapter_number}
              </Text>
            </View>
          )}

          {/* Nội dung chương chính: Font Merriweather */}
          <View style={styles.articleSection}>
            {paragraphs.map((p, index) => (
              <Text key={index} style={styles.merriweatherParagraph}>
                {p}
              </Text>
            ))}
          </View>

          {/* Khu vực Nhân Vật Xuất Hiện (character_credits) */}
          {uniqueCharacters.length > 0 && (
            <View style={styles.charactersSection}>
              <View style={styles.charactersSectionHeader}>
                <Ionicons name="people" size={18} color={accentColor} style={{ marginRight: 8 }} />
                <Text style={styles.charactersSectionTitle}>
                  Nhân Vật Xuất Hiện ({uniqueCharacters.length})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.charactersScroll}
              >
                {uniqueCharacters.map((char, idx) => (
                  <View key={`${char.name}_${idx}`} style={styles.characterCard}>
                    <View style={[styles.charAvatarWrapper, { borderColor: accentColor }]}>
                      {char.icon_url ? (
                        <ProxiedImage
                          url={char.icon_url}
                          style={styles.charAvatar}
                          fallbackIcon="shield-outline"
                          fallbackIconSize={22}
                        />
                      ) : (
                        <View style={styles.charFallbackIcon}>
                          <Ionicons name="shield-outline" size={24} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.charName} numberOfLines={2}>
                      {char.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Điều hướng Chương Trước / Chương Sau */}
          <View style={styles.chapterNavSection}>
            <View style={styles.chapterNavGrid}>
              {prevChapter ? (
                <TouchableOpacity
                  style={styles.chapterNavCard}
                  onPress={() => handleNavigateChapter(prevChapter.id)}
                  activeOpacity={0.8}
                >
                  <ProxiedImage
                    url={prevChapter.cover_image}
                    style={styles.navThumb}
                    fallbackIcon="book-outline"
                    fallbackIconSize={18}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.navDirectionText, { color: accentColor }]}>
                      ‹ Chương trước
                    </Text>
                    <Text style={styles.navChapterTitle} numberOfLines={1}>
                      {prevChapter.title}
                    </Text>
                    <Text style={styles.navIssueNumber}>Issue #{prevChapter.chapter_number}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {nextChapter ? (
                <TouchableOpacity
                  style={[styles.chapterNavCard, { marginLeft: 10 }]}
                  onPress={() => handleNavigateChapter(nextChapter.id)}
                  activeOpacity={0.8}
                >
                  <ProxiedImage
                    url={nextChapter.cover_image}
                    style={styles.navThumb}
                    fallbackIcon="book-outline"
                    fallbackIconSize={18}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.navDirectionText, { color: accentColor }]}>
                      Chương sau ›
                    </Text>
                    <Text style={styles.navChapterTitle} numberOfLines={1}>
                      {nextChapter.title}
                    </Text>
                    <Text style={styles.navIssueNumber}>Issue #{nextChapter.chapter_number}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Bottom Sheet Khóa Bản Quyền (403 PAYMENT_REQUIRED) */}
      <AccessBlockedSheet
        visible={!!accessBlocked}
        accessInfo={accessBlocked?.access_info}
        message={accessBlocked?.message}
        onNavigateToSubscriptions={() => {
          setAccessBlocked(null);
          navigation.navigate('Subscriptions');
        }}
        onClose={() => setAccessBlocked(null)}
        onGoBack={() => {
          setAccessBlocked(null);
          navigation.goBack();
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 15, 20, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A38',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleGroup: {
    flex: 1,
    marginHorizontal: 12,
  },
  navStoryTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navChapterSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 16,
  },
  loadingSub: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(237, 29, 36, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 29, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 6,
  },
  errorSubHeading: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 300,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  heroCoverCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 16,
    marginBottom: 20,
  },
  coverImageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F0F14',
    marginBottom: 14,
  },
  chapterCoverImage: {
    width: '100%',
    height: '100%',
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  issueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  issueBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBadgeText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  previewBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vipBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  chapterTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 28,
  },
  pullQuoteBox: {
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 22,
    position: 'relative',
  },
  quoteMark: {
    position: 'absolute',
    top: -10,
    left: 12,
    fontSize: 48,
    color: 'rgba(255, 255, 255, 0.08)',
    fontFamily: 'Italiana_400Regular',
  },
  pullQuoteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Italiana_400Regular',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  pullQuoteAuthor: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleSection: {
    marginBottom: 28,
  },
  merriweatherParagraph: {
    color: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Merriweather_400Regular',
    lineHeight: 28,
    marginBottom: 18,
    textAlign: 'justify',
  },
  charactersSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    paddingTop: 20,
    marginBottom: 28,
  },
  charactersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  charactersSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  charactersScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  characterCard: {
    width: 90,
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 14,
    padding: 10,
  },
  charAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#0F0F14',
    marginBottom: 8,
  },
  charAvatar: {
    width: '100%',
    height: '100%',
  },
  charFallbackIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161F',
  },
  charName: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 14,
  },
  chapterNavSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A38',
    paddingTop: 20,
  },
  chapterNavGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 10,
  },
  navThumb: {
    width: 40,
    height: 54,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#0F0F14',
  },
  navDirectionText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  navChapterTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 2,
  },
  navIssueNumber: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
