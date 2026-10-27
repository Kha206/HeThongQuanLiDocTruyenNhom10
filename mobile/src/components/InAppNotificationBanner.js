import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

export default function InAppNotificationBanner({ navigationRef }) {
  const { inAppBanner, dismissBanner, markAsRead } = useNotifications();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { visible, notification } = inAppBanner;

  useEffect(() => {
    if (visible && notification) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 9,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, notification, slideAnim, opacityAnim]);

  if (!notification && !visible) {
    return null;
  }

  const handlePress = () => {
    if (!notification) return;

    // Đánh dấu đã đọc nếu là thông báo lưu trong DB
    if (typeof notification.id === 'number') {
      markAsRead(notification.id);
    }

    dismissBanner();

    // Điều hướng theo link_url
    const link = notification.link_url;
    if (link && navigationRef?.isReady?.()) {
      const chapterMatch = link.match(/\/stories\/(\d+)\/chapters\/(\d+)/);
      if (chapterMatch) {
        const [, storyId, chapterId] = chapterMatch;
        navigationRef.navigate('ChapterReader', {
          chapterId: Number(chapterId),
          storyId: Number(storyId)
        });
        return;
      }

      const storyMatch = link.match(/\/stories\/(\d+)/);
      if (storyMatch) {
        const [, storyId] = storyMatch;
        navigationRef.navigate('StoryDetail', {
          storyId: Number(storyId)
        });
        return;
      }
    }

    // Mặc định chuyển tới tab Thông Báo
    if (navigationRef?.isReady?.()) {
      navigationRef.navigate('Main', { screen: 'NotificationTab' });
    }
  };

  const isChapterType = notification?.type === 'new_chapter';

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 10) + 4,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.bannerCard,
          pressed && styles.bannerCardPressed
        ]}
      >
        {/* Thanh nhấn đỏ Marvel phía trái */}
        <View style={styles.accentStrip} />

        {/* Icon huy hiệu */}
        <View style={styles.iconCircle}>
          <Ionicons
            name={isChapterType ? 'book' : 'notifications'}
            size={18}
            color="#FFFFFF"
          />
        </View>

        {/* Nội dung thông báo */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {notification?.title || 'Thông báo mới'}
            </Text>
            <Text style={styles.timeText}>Vừa xong</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {notification?.message || ''}
          </Text>
        </View>

        {/* Nút đóng banner */}
        <TouchableOpacity
          onPress={dismissBanner}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
    overflow: 'hidden'
  },
  bannerCardPressed: {
    backgroundColor: '#23232E'
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ED1D24'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ED1D24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 10
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  titleText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    marginRight: 6
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Inter_400Regular'
  },
  messageText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6
  }
});
