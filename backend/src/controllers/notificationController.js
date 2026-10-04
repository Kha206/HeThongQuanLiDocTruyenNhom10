'use strict';

const { Notification } = require('../models');

class NotificationController {
  /**
   * Lấy danh sách thông báo của người dùng
   * GET /api/notifications
   */
  async getMyNotifications(req, res) {
    try {
      const userId = req.user.id;

      const notifications = await Notification.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 30
      });

      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });

      return res.status(200).json({
        success: true,
        notifications,
        unread_count: unreadCount
      });
    } catch (err) {
      console.error('Error in getMyNotifications:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách thông báo.'
      });
    }
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo.'
        });
      }

      await notification.update({ is_read: true });

      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false }
      });

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đã đọc.',
        unread_count: unreadCount
      });
    } catch (err) {
      console.error('Error in markAsRead:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo.'
      });
    }
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
      );

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
        unread_count: 0
      });
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông báo.'
      });
    }
  }
}

module.exports = new NotificationController();
