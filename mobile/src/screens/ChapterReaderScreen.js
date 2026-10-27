import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Pressable
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProxiedImage from '../components/ProxiedImage';
import UserAvatar from '../components/UserAvatar';
import AccessBlockedSheet from '../components/AccessBlockedSheet';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import { parseContentToParagraphs } from '../utils/htmlUtils';

/**
 * ChapterReaderScreen - Màn hình Đọc Chương Truyện Marvel & Thảo Luận Cộng Đồng
 * 
 * TÍNH NĂNG ĐƯỢC BỔ SUNG:
 * 1. Mua truyện lẻ tại AccessBlockedSheet qua SandboxPaymentModal.
 * 2. Thảo luận theo chương:
 *    - Danh sách bình luận (Avatar người dùng / chữ cái đầu, tên, role, ngày giờ, số like, nội dung).
 *    - Ô đăng bình luận: xác thực đăng nhập, kiểm tra rỗng, giới hạn tối đa 1000 ký tự.
 *    - Nút Thích bình luận: gọi POST /api/comments/:id/like.
 *    - Nút Báo cáo bình luận vi phạm: gọi POST /api/comments/:id/report kèm lý do.
 *    - Phân trang 10 bình luận đầu tiên phía client kèm nút "Xem thêm bình luận".
 *    - Tải lại bình luận mỗi lần vào màn hình (useFocusEffect), không cache cứng.
 */
export default function ChapterReaderScreen({ route, navigation }) {
  const { chapterId: initialChapterId, storyId, storyTitle } = route.params || {};
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);

  const { user, isVip, isAuthenticated } = useAuth();

  const [chapter, setChapter] = useState(null);
  const [prevChapter, setPrevChapter] = useState(null);
  const [nextChapter, setNextChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessBlocked, setAccessBlocked] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Modal mua lẻ bản quyền truyện từ AccessBlockedSheet
  const [isStoryPurchaseModalOpen, setIsStoryPurchaseModalOpen] = useState(false);

  // States Thảo luận theo chương (Feature 3)
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(10);

  // Modal báo cáo bình luận
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [selectedReportReason, setSelectedReportReason] = useState('Nội dung phản cảm, thô tục');
  const [customReportReason, setCustomReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  // Tải danh sách bình luận của chương (KHÔNG cache cứng, backend đã lọc status: 'approved')
  const fetchComments = useCallback(async (targetId) => {
    if (!targetId) return;
    setCommentsLoading(true);
    try {
      const res = await api.get(`/api/chapters/${targetId}/comments`);
      if (res.success && Array.isArray(res.comments)) {
        setComments(res.comments);
        setVisibleCommentsCount(10);
      }
    } catch (err) {
      console.warn('Lỗi khi tải bình luận chương:', err.message);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // Tải chương khi ID thay đổi hoặc khi trạng thái VIP thay đổi
  useEffect(() => {
    fetchChapterDetail(currentChapterId);
    fetchComments(currentChapterId);
  }, [currentChapterId, fetchChapterDetail, fetchComments, isVip]);

  // Làm mới bình luận mỗi lần màn hình được focus
  useFocusEffect(
    useCallback(() => {
      if (currentChapterId) {
        fetchComments(currentChapterId);
      }
    }, [currentChapterId, fetchComments])
  );

  // Xử lý gửi bình luận mới
  const handleAddComment = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    const trimmed = newCommentText.trim();
    if (!trimmed) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung bình luận.');
      return;
    }

    if (trimmed.length > 1000) {
      Alert.alert('Thông báo', 'Bình luận không được vượt quá 1000 ký tự.');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/chapters/${currentChapterId}/comments`, {
        content: trimmed,
      });

      if (res.success && res.comment) {
        setComments((prev) => [res.comment, ...prev]);
        setNewCommentText('');
        Alert.alert('Thành công', 'Bình luận của bạn đã được đăng thành công.');
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể gửi bình luận.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi bình luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Xử lý thích bình luận (Like)
  const handleLikeComment = async (commentId) => {
    // Tăng số lượt thích lạc quan trên UI
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes_count: (c.likes_count || 0) + 1, is_liked: true }
          : c
      )
    );

    try {
      const res = await api.post(`/api/comments/${commentId}/like`);
      if (res.success && res.likes_count !== undefined) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, likes_count: res.likes_count } : c
          )
        );
      }
    } catch (err) {
      console.warn('Lỗi khi thích bình luận:', err.message);
    }
  };

  // Mở modal báo cáo bình luận
  const handleOpenReport = (commentId) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setReportingCommentId(commentId);
    setSelectedReportReason('Nội dung phản cảm, thô tục');
    setCustomReportReason('');
  };

  // Gửi báo cáo bình luận vi phạm
  const handleSubmitReport = async () => {
    if (!reportingCommentId || isSubmittingReport) return;

    const finalReason = selectedReportReason === 'Lý do khác'
      ? (customReportReason.trim() || 'Nội dung vi phạm tiêu chuẩn cộng đồng')
      : selectedReportReason;

    setIsSubmittingReport(true);
    try {
      const res = await api.post(`/api/comments/${reportingCommentId}/report`, {
        reason: finalReason,
      });

      if (res.success) {
        Alert.alert('Thông báo', 'Đã gửi báo cáo vi phạm tới ban quản trị để xem xét.');
        setReportingCommentId(null);
      } else {
        Alert.alert('Lỗi', res.message || 'Lỗi khi gửi báo cáo vi phạm.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Lỗi khi gửi báo cáo vi phạm.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

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

  // Danh sách bình luận hiển thị phân trang client
  const visibleComments = useMemo(() => {
    return comments.slice(0, visibleCommentsCount);
  }, [comments, visibleCommentsCount]);

  const reportReasonsList = [
    'Nội dung phản cảm, thô tục',
    'Spam hoặc quảng cáo trái phép',
    'Xúc phạm hoặc quấy rối độc giả khác',
    'Tiết lộ trước nội dung (Spoiler) chưa báo trước',
    'Lý do khác'
  ];

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
            {storyTitle || chapter?.story?.title || 'Marvel Comics'}
          </Text>
          <Text style={styles.navChapterTitleTop} numberOfLines={1}>
            {chapter ? `Issue #${chapter.chapter_number} - ${chapter.title}` : 'Đang tải chương...'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Subscriptions')}
          style={styles.navVipButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="sparkles" size={16} color="#FBBF24" />
        </TouchableOpacity>
      </View>

      {/* Vùng nội dung chính */}
      {loading ? (
        <View style={styles.centeredWrapper}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Đang nạp dữ liệu chương truyện...</Text>
        </View>
      ) : isUnauthorized ? (
        <View style={styles.centeredWrapper}>
          <Ionicons name="lock-closed" size={48} color="#FBBF24" />
          <Text style={styles.errorTitle}>Yêu Cầu Đăng Nhập</Text>
          <Text style={styles.errorSub}>Vui lòng đăng nhập để đọc chương truyện có bản quyền này.</Text>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionBtnPrimaryText}>Đăng Nhập Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : error && !accessBlocked ? (
        <View style={styles.centeredWrapper}>
          <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
          <Text style={styles.errorTitle}>Lỗi Tải Nội Dung</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => fetchChapterDetail(currentChapterId)}
          >
            <Text style={styles.actionBtnPrimaryText}>Thử Lại</Text>
          </TouchableOpacity>
        </View>
      ) : chapter ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Bìa Chương */}
          <View style={styles.chapterHeaderCard}>
            <View style={styles.coverFrame}>
              <ProxiedImage
                url={chapter.cover_image}
                style={styles.coverImage}
                fallbackIcon="book-outline"
                fallbackIconSize={48}
              />
              <View style={styles.coverOverlay} />
              <View style={styles.coverBadgeContainer}>
                <View style={[styles.issueBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.issueBadgeText}>Issue #{chapter.chapter_number}</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>{chapter.release_date || 'N/A'}</Text>
                </View>
                {chapter.is_preview && (
                  <View style={styles.previewPill}>
                    <Text style={styles.previewPillText}>ĐỌC THỬ MIỄN PHÍ</Text>
                  </View>
                )}
              </View>

              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>
          </View>

          {/* Trích Yếu Cốt Truyện (Pull Quote) */}
          {pullQuote ? (
            <View style={[styles.pullQuoteBox, { borderLeftColor: accentColor }]}>
              <Text style={[styles.quoteSymbol, { color: accentColor }]}>“</Text>
              <Text style={styles.pullQuoteText}>"{pullQuote}"</Text>
            </View>
          ) : null}

          {/* Nội dung bài viết / cốt truyện - Font Merriweather */}
          <View style={styles.contentSection}>
            {paragraphs.map((p, idx) => (
              <Text key={`para_${idx}`} style={styles.paragraphText}>
                {p}
              </Text>
            ))}
          </View>

          {/* Danh Sách Nhân Vật Xuất Hiện */}
          {uniqueCharacters.length > 0 && (
            <View style={styles.charactersSection}>
              <View style={styles.charactersSectionHeader}>
                <Ionicons name="people" size={18} color={accentColor} style={{ marginRight: 8 }} />
                <Text style={styles.charactersHeading}>Nhân Vật Xuất Hiện</Text>
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

          {/* ======================================================== */}
          {/* KHU VỰC THẢO LUẬN & BÌNH LUẬN THEO CHƯƠNG (Feature 3)     */}
          {/* ======================================================== */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsSectionHeader}>
              <View style={[styles.commentIconCircle, { backgroundColor: accentColor }]}>
                <Ionicons name="chatbubbles" size={18} color="#000000" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.commentsHeading}>Thảo Luận Chương</Text>
                  <View style={styles.commentsCountBadge}>
                    <Text style={styles.commentsCountBadgeText}>{comments.length}</Text>
                  </View>
                </View>
                <Text style={styles.commentsSubHeading}>
                  Góc giao lưu, chia sẻ cảm nghĩ cùng độc giả Marvel
                </Text>
              </View>
            </View>

            {/* Ô Đăng Bình Luận */}
            <View style={styles.commentInputBox}>
              {isAuthenticated ? (
                <View>
                  <View style={styles.currentUserInfoRow}>
                    <UserAvatar user={user} size={32} />
                    <Text style={styles.currentUserLabel}>
                      Bình luận với tư cách: <Text style={styles.currentUserName}>{user?.full_name || user?.username}</Text>
                    </Text>
                  </View>

                  <TextInput
                    style={styles.commentTextInput}
                    placeholder="Chia sẻ cảm nghĩ hoặc giả thuyết của bạn về chương truyện này..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                  />

                  <View style={styles.commentInputFooter}>
                    <Text style={styles.charCountText}>
                      {newCommentText.length}/1000 ký tự
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.btnSubmitComment,
                        (!newCommentText.trim() || submittingComment) && styles.btnSubmitCommentDisabled
                      ]}
                      onPress={handleAddComment}
                      disabled={!newCommentText.trim() || submittingComment}
                      activeOpacity={0.85}
                    >
                      {submittingComment ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="send" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.btnSubmitCommentText}>Gửi Bình Luận</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.guestNoticeBox}>
                  <Ionicons name="lock-closed-outline" size={28} color="#FBBF24" style={{ marginBottom: 8 }} />
                  <Text style={styles.guestNoticeText}>
                    Đăng nhập để tham gia thảo luận cùng cộng đồng độc giả Marvel
                  </Text>
                  <TouchableOpacity
                    style={styles.btnGuestLogin}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-in-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnGuestLoginText}>Đăng Nhập Ngay</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Danh Sách Bình Luận */}
            {commentsLoading && comments.length === 0 ? (
              <View style={styles.commentsLoadingBox}>
                <ActivityIndicator size="small" color="#ED1D24" />
                <Text style={styles.commentsLoadingText}>Đang nạp các bình luận...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyCommentsBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color="#6B7280" />
                <Text style={styles.emptyCommentsText}>
                  Chưa có bình luận nào cho chương này. Hãy là người đầu tiên chia sẻ cảm nghĩ!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {visibleComments.map((c) => {
                  const commentAuthor = c.user || {};
                  const isAdmin = commentAuthor.role === 'admin';
                  const isVipUser = commentAuthor.role === 'vip' || !isAdmin; // role display
                  const formattedTime = c.createdAt || c.created_at
                    ? new Date(c.createdAt || c.created_at).toLocaleString('vi-VN')
                    : 'Vừa xong';

                  return (
                    <View key={c.id} style={styles.commentItemCard}>
                      {/* Header bình luận: Avatar, Tên, Badge, Thời gian, Actions */}
                      <View style={styles.commentItemHeader}>
                        <View style={styles.commentAuthorGroup}>
                          <UserAvatar user={commentAuthor} size={36} />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.commentAuthorName} numberOfLines={1}>
                                {commentAuthor.full_name || commentAuthor.username || 'Độc Giả Marvel'}
                              </Text>
                              {isAdmin ? (
                                <View style={styles.roleBadgeAdmin}>
                                  <Text style={styles.roleBadgeAdminText}>ADMIN</Text>
                                </View>
                              ) : isVipUser ? (
                                <View style={styles.roleBadgeVip}>
                                  <Text style={styles.roleBadgeVipText}>VIP</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.commentTimestamp}>{formattedTime}</Text>
                          </View>
                        </View>

                        {/* Hàng hành động: Thích & Báo cáo */}
                        <View style={styles.commentActionGroup}>
                          {/* Nút Thích */}
                          <TouchableOpacity
                            style={styles.commentLikeBtn}
                            onPress={() => handleLikeComment(c.id)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={c.is_liked || (c.likes_count > 0) ? 'heart' : 'heart-outline'}
                              size={16}
                              color={c.is_liked || (c.likes_count > 0) ? '#ED1D24' : '#9CA3AF'}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[
                              styles.commentLikeCount,
                              (c.is_liked || (c.likes_count > 0)) && { color: '#ED1D24' }
                            ]}>
                              {c.likes_count ?? 0}
                            </Text>
                          </TouchableOpacity>

                          {/* Nút Báo Cáo */}
                          <TouchableOpacity
                            style={styles.commentReportBtn}
                            onPress={() => handleOpenReport(c.id)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="flag-outline" size={15} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Nội dung bình luận */}
                      <Text style={styles.commentContentText}>{c.content}</Text>
                    </View>
                  );
                })}

                {/* Nút Xem Thêm Bình Luận (Phân trang client) */}
                {comments.length > visibleCommentsCount && (
                  <TouchableOpacity
                    style={styles.btnLoadMoreComments}
                    onPress={() => setVisibleCommentsCount((prev) => prev + 10)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-down" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnLoadMoreCommentsText}>
                      Xem thêm bình luận ({comments.length - visibleCommentsCount} bình luận khác)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
        onBuyStory={() => {
          if (!isAuthenticated) {
            setAccessBlocked(null);
            navigation.navigate('Login');
            return;
          }
          setIsStoryPurchaseModalOpen(true);
        }}
        onClose={() => setAccessBlocked(null)}
        onGoBack={() => {
          setAccessBlocked(null);
          navigation.goBack();
        }}
      />

      {/* Modal Mua Lẻ Truyện Sandbox */}
      <SandboxPaymentModal
        visible={isStoryPurchaseModalOpen}
        story={{
          id: accessBlocked?.access_info?.story_id || storyId,
          title: accessBlocked?.access_info?.story_title || storyTitle || 'Truyện tranh Marvel',
          price: accessBlocked?.access_info?.story_price || 0,
        }}
        paymentType="story_purchase"
        onClose={() => setIsStoryPurchaseModalOpen(false)}
        onSuccess={async () => {
          setIsStoryPurchaseModalOpen(false);
          setAccessBlocked(null);
          // Làm mới quyền truy cập và mở khóa chương ngay lập tức
          await fetchChapterDetail(currentChapterId);
        }}
      />

      {/* Modal Báo Cáo Bình Luận Vi Phạm */}
      <Modal
        visible={!!reportingCommentId}
        transparent
        animationType="fade"
        onRequestClose={() => setReportingCommentId(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setReportingCommentId(null)}
        >
          <Pressable style={styles.reportModalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.reportModalHeader}>
              <View style={styles.reportModalTitleRow}>
                <Ionicons name="flag" size={18} color="#FBBF24" style={{ marginRight: 8 }} />
                <Text style={styles.reportModalTitle}>Báo Cáo Bình Luận Vi Phạm</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportingCommentId(null)}
                style={styles.reportModalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportModalSub}>
              Vui lòng chọn lý do vi phạm để ban quản trị tiến hành xem xét và xử lý:
            </Text>

            {/* Danh sách lý do */}
            <View style={styles.reportReasonsList}>
              {reportReasonsList.map((reason) => {
                const isSelected = selectedReportReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reportReasonItem,
                      isSelected && styles.reportReasonItemSelected
                    ]}
                    onPress={() => setSelectedReportReason(reason)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? '#ED1D24' : '#6B7280'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[
                      styles.reportReasonText,
                      isSelected && styles.reportReasonTextSelected
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ô nhập lý do khác nếu chọn */}
            {selectedReportReason === 'Lý do khác' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Nhập chi tiết lý do vi phạm..."
                placeholderTextColor="#6B7280"
                value={customReportReason}
                onChangeText={setCustomReportReason}
                maxLength={200}
              />
            )}

            {/* Các nút bấm hành động */}
            <View style={styles.reportModalActions}>
              <TouchableOpacity
                style={styles.btnCancelReport}
                onPress={() => setReportingCommentId(null)}
                disabled={isSubmittingReport}
                activeOpacity={0.8}
              >
                <Text style={styles.btnCancelReportText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSubmitReport, isSubmittingReport && { opacity: 0.6 }]}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
                activeOpacity={0.85}
              >
                {isSubmittingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnSubmitReportText}>Gửi Báo Cáo</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  navChapterTitleTop: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    marginTop: 1,
  },
  navVipButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 14,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    marginTop: 14,
  },
  errorSub: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  actionBtnPrimary: {
    backgroundColor: '#ED1D24',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  chapterHeaderCard: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    overflow: 'hidden',
    marginBottom: 20,
  },
  coverFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#0F0F14',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  coverBadgeContainer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
  },
  issueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  issueBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 0.5,
  },
  headerInfo: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  previewPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewPillText: {
    color: '#34D399',
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
    backgroundColor: '#16161F',
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    position: 'relative',
  },
  quoteSymbol: {
    fontSize: 32,
    fontFamily: 'Italiana_400Regular',
    lineHeight: 32,
    marginBottom: -10,
    opacity: 0.6,
  },
  pullQuoteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Italiana_400Regular',
    fontStyle: 'italic',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  contentSection: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  paragraphText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontFamily: 'Merriweather_300Light',
    lineHeight: 27,
    letterSpacing: 0.2,
  },
  charactersSection: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 16,
    marginBottom: 20,
  },
  charactersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  charactersHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  charactersScroll: {
    gap: 12,
    paddingRight: 12,
  },
  characterCard: {
    width: 90,
    alignItems: 'center',
  },
  charAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#0F0F14',
    marginBottom: 6,
  },
  charAvatar: {
    width: '100%',
    height: '100%',
  },
  charFallbackIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charName: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
  chapterNavSection: {
    marginBottom: 24,
  },
  chapterNavGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterNavCard: {
    flex: 1,
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navThumb: {
    width: 44,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#0F0F14',
    marginRight: 10,
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
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  commentsSection: {
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 16,
    marginTop: 8,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  commentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  commentsCountBadge: {
    backgroundColor: '#2A2A38',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentsCountBadgeText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  commentsSubHeading: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  commentInputBox: {
    backgroundColor: '#0F0F14',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 14,
    marginBottom: 20,
  },
  currentUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentUserLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginLeft: 10,
  },
  currentUserName: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  commentTextInput: {
    backgroundColor: '#1A1A22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  commentInputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  charCountText: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  btnSubmitComment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnSubmitCommentDisabled: {
    opacity: 0.5,
  },
  btnSubmitCommentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  guestNoticeBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  guestNoticeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  btnGuestLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnGuestLoginText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  commentsLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  commentsLoadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
  },
  emptyCommentsBox: {
    paddingVertical: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCommentsText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  commentsList: {
    gap: 12,
  },
  commentItemCard: {
    backgroundColor: '#16161F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 12,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAuthorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(237, 29, 36, 0.2)',
    borderColor: 'rgba(237, 29, 36, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  roleBadgeAdminText: {
    color: '#ED1D24',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  roleBadgeVip: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  roleBadgeVipText: {
    color: '#FBBF24',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
  commentTimestamp: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  commentActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
  },
  commentLikeCount: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  commentReportBtn: {
    padding: 5,
  },
  commentContentText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginTop: 2,
  },
  btnLoadMoreComments: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  btnLoadMoreCommentsText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 18,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportModalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  reportModalCloseBtn: {
    padding: 4,
  },
  reportModalSub: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
    lineHeight: 16,
  },
  reportReasonsList: {
    gap: 8,
    marginBottom: 14,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reportReasonItemSelected: {
    borderColor: '#ED1D24',
    backgroundColor: 'rgba(237, 29, 36, 0.08)',
  },
  reportReasonText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  reportReasonTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  customReasonInput: {
    backgroundColor: '#0F0F14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  reportModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btnCancelReport: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2A2A38',
  },
  btnCancelReportText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  btnSubmitReport: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#ED1D24',
  },
  btnSubmitReportText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
});
