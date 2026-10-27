import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

function formatNotificationTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function NotificationsScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // Gọi lại API lấy dữ liệu mới nhất mỗi khi màn hình được lấy nét (không cache cứng)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchNotifications();
      }
    }, [isAuthenticated, fetchNotifications])
  );

  const handleNotificationPress = (item) => {
    if (!item) return;

    // Đánh dấu đã đọc nếu chưa đọc
    if (!item.is_read && typeof item.id === 'number') {
      markAsRead(item.id);
    }

    // Điều hướng theo dữ liệu liên kết đính kèm
    const link = item.link_url;
    if (link) {
      const chapterMatch = link.match(/\/stories\/(\d+)\/chapters\/(\d+)/);
      if (chapterMatch) {
        const [, storyId, chapterId] = chapterMatch;
        navigation.navigate('ChapterReader', {
          chapterId: Number(chapterId),
          storyId: Number(storyId)
        });
        return;
      }

      const storyMatch = link.match(/\/stories\/(\d+)/);
      if (storyMatch) {
        const [, storyId] = storyMatch;
        navigation.navigate('StoryDetail', {
          storyId: Number(storyId)
        });
        return;
      }

      if (link.includes('subscription') || link.includes('plan')) {
        navigation.navigate('Subscriptions');
        return;
      }
    }
  };

  // Trường hợp người dùng chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>THÔNG BÁO</Text>
        </View>

        <View style={styles.unauthContainer}>
          <View style={styles.unauthCard}>
            <View style={styles.unauthIconCircle}>
              <Ionicons name="notifications-outline" size={36} color="#ED1D24" />
            </View>
            <Text style={styles.unauthTitle}>ĐĂNG NHẬP ĐỂ XEM THÔNG BÁO</Text>
            <Text style={styles.unauthDesc}>
              Vui lòng đăng nhập để cập nhật chương truyện mới từ các bộ truyện bạn theo dõi và thông báo quan trọng từ hệ thống.
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.loginBtnText}>ĐĂNG NHẬP NGAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render từng thẻ thông báo
  const renderItem = ({ item }) => {
    const isUnread = !item.is_read;
    const isChapter = item.type === 'new_chapter';

    return (
      <TouchableOpacity
        style={[styles.itemCard, isUnread && styles.itemCardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Chấm tròn trạng thái chưa đọc */}
        <View style={[styles.unreadDot, isUnread && styles.unreadDotActive]} />

        {/* Icon loại thông báo */}
        <View style={[styles.typeIconCircle, isChapter ? styles.typeIconChapter : styles.typeIconSystem]}>
          <Ionicons
            name={isChapter ? 'book-outline' : 'notifications-outline'}
            size={18}
            color={isChapter ? '#ED1D24' : '#60A5FA'}
          />
        </View>

        {/* Nội dung thông báo */}
        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <Text
              style={[styles.itemTitle, isUnread && styles.itemTitleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.itemTime}>
              {formatNotificationTime(item.created_at || item.createdAt)}
            </Text>
          </View>

          <Text style={styles.itemMessage} numberOfLines={3}>
            {item.message}
          </Text>

          <View style={styles.itemFooterRow}>
            <View style={[styles.statusBadge, isUnread ? styles.statusBadgeUnread : styles.statusBadgeRead]}>
              <Text style={[styles.statusBadgeText, isUnread ? styles.statusTextUnread : styles.statusTextRead]}>
                {isUnread ? 'Mới • Chưa đọc' : 'Đã đọc'}
              </Text>
            </View>

            {item.link_url ? (
              <View style={styles.linkHintRow}>
                <Text style={styles.linkHintText}>Xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Giao diện khi danh sách trống
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="notifications-off-outline" size={48} color="#6B7280" />
        </View>
        <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
        <Text style={styles.emptyDesc}>
          Khi có chương truyện mới từ các bộ truyện bạn theo dõi, thông báo sẽ xuất hiện ngay tại đây.
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('HomeTab')}
          activeOpacity={0.8}
        >
          <Ionicons name="compass-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.exploreBtnText}>Khám phá kho truyện</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header màn hình */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>THÔNG BÁO</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount} mới</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#ED1D24" style={{ marginRight: 4 }} />
            <Text style={styles.markAllBtnText}>Đã đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.markAllBtn, styles.markAllBtnDisabled]}>
            <Ionicons name="checkmark-done-outline" size={16} color="#4B5563" style={{ marginRight: 4 }} />
            <Text style={styles.markAllBtnTextDisabled}>Đã đọc tất cả</Text>
          </View>
        )}
      </View>

      {/* Vùng danh sách thông báo */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#ED1D24" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor="#ED1D24"
              colors={['#ED1D24']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F14'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F2C',
    backgroundColor: '#0F0F14'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 1
  },
  countBadge: {
    backgroundColor: 'rgba(237, 29, 36, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(237, 29, 36, 0.4)'
  },
  countBadgeText: {
    color: '#ED1D24',
    fontSize: 11,
    fontFamily: 'Outfit_700Bold'
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(237, 29, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237, 29, 36, 0.25)'
  },
  markAllBtnDisabled: {
    backgroundColor: 'transparent',
    borderColor: '#2A2A38'
  },
  markAllBtnText: {
    color: '#ED1D24',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold'
  },
  markAllBtnTextDisabled: {
    color: '#4B5563',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold'
  },
  listContent: {
    padding: 14,
    paddingBottom: 24
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242432'
  },
  itemCardUnread: {
    backgroundColor: '#1E1E2A',
    borderColor: 'rgba(237, 29, 36, 0.35)'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
    marginTop: 6,
    marginRight: 8
  },
  unreadDotActive: {
    backgroundColor: '#ED1D24'
  },
  typeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  typeIconChapter: {
    backgroundColor: 'rgba(237, 29, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(237, 29, 36, 0.3)'
  },
  typeIconSystem: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)'
  },
  itemContent: {
    flex: 1
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  itemTitle: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginRight: 8
  },
  itemTitleUnread: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold'
  },
  itemTime: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_400Regular'
  },
  itemMessage: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 8
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  statusBadgeUnread: {
    backgroundColor: 'rgba(237, 29, 36, 0.12)'
  },
  statusBadgeRead: {
    backgroundColor: '#242432'
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium'
  },
  statusTextUnread: {
    color: '#ED1D24',
    fontFamily: 'Inter_600SemiBold'
  },
  statusTextRead: {
    color: '#6B7280'
  },
  linkHintRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  linkHintText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginRight: 2
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 10
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A22',
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8
  },
  emptyDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold'
  },
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  unauthCard: {
    width: '100%',
    backgroundColor: '#1A1A22',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A38'
  },
  unauthIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(237, 29, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  unauthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center'
  },
  unauthDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED1D24',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center'
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5
  }
});
