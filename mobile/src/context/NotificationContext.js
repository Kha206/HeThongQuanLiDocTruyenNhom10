import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // In-app real-time banner
  const [inAppBanner, setInAppBanner] = useState({ visible: false, notification: null });
  const bannerTimerRef = useRef(null);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setInAppBanner({ visible: false, notification: null });
  }, []);

  const showBanner = useCallback((notif) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setInAppBanner({ visible: true, notification: notif });
    bannerTimerRef.current = setTimeout(() => {
      setInAppBanner({ visible: false, notification: null });
      bannerTimerRef.current = null;
    }, 6000);
  }, []);

  // Lấy danh sách thông báo từ API (không cache cứng)
  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get('/api/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(typeof res.unread_count === 'number' ? res.unread_count : 0);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách thông báo:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Đánh dấu 1 thông báo là đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    // Tìm thông báo trong state
    const target = notifications.find((n) => n.id === notificationId);
    if (target && target.is_read) {
      return; // Đã đọc rồi thì không gọi lại
    }

    // Cập nhật lạc quan trên giao diện
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await api.patch(`/api/notifications/${notificationId}/read`);
      if (res.success && typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
    } catch (err) {
      console.warn('Lỗi khi đánh dấu thông báo đã đọc:', err.message);
    }
  }, [notifications]);

  // Đánh dấu tất cả thông báo là đã đọc
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0 && notifications.every((n) => n.is_read)) {
      return;
    }

    // Cập nhật lạc quan
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await api.patch('/api/notifications/read-all');
      if (res.success && typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
    } catch (err) {
      console.warn('Lỗi khi đánh dấu tất cả thông báo đã đọc:', err.message);
    }
  }, [unreadCount, notifications]);

  // Quản lý Socket.IO và sự kiện thời gian thực khi đăng nhập/đăng xuất
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // 1. Tải danh sách thông báo ban đầu
      fetchNotifications();

      // 2. Kết nối Socket.IO
      connectSocket(user.id);
      const socket = getSocket();

      // 3. Lắng nghe thông báo cá nhân mới (room user_${userId})
      const handleNewNotification = (notif) => {
        if (!notif) return;
        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === notif.id);
          if (exists) return prev;
          return [notif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        showBanner(notif);
      };

      // 4. Lắng nghe chương mới phát hành (room story_${storyId})
      const handleNewChapter = (data) => {
        if (!data) return;
        const bannerItem = {
          id: `chapter_${data.chapter?.id || Date.now()}`,
          title: `Chương mới: ${data.storyTitle || 'Truyện bạn theo dõi'}`,
          message: `Chương ${data.chapter?.chapter_number || ''}: ${data.chapter?.title || 'Đã phát hành'}`,
          type: 'new_chapter',
          link_url: `/stories/${data.storyId}/chapters/${data.chapter?.id}`,
          is_read: false,
          created_at: new Date().toISOString()
        };
        showBanner(bannerItem);
        // Tải lại danh sách từ server để đồng bộ chính xác
        fetchNotifications();
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('new_chapter_published', handleNewChapter);

      return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('new_chapter_published', handleNewChapter);
      };
    } else {
      // Người dùng chưa đăng nhập hoặc đăng xuất -> ngắt kết nối socket & reset state
      disconnectSocket();
      setNotifications([]);
      setUnreadCount(0);
      dismissBanner();
    }
  }, [isAuthenticated, user?.id, fetchNotifications, showBanner, dismissBanner]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        inAppBanner,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissBanner,
        showBanner
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
