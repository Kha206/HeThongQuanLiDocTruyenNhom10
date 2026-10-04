'use strict';

const { Comment, User, Chapter, Story, sequelize } = require('../models');
const { broadcastNewComment } = require('../services/socketService');

class CommentController {
  /**
   * Lấy danh sách bình luận đã duyệt của chương
   * GET /api/chapters/:chapterId/comments
   */
  async getChapterComments(req, res) {
    try {
      const chapterId = req.params.chapterId;

      const comments = await Comment.findAll({
        where: {
          chapter_id: chapterId,
          status: 'approved'
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'avatar', 'role']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        comments
      });
    } catch (err) {
      console.error('Error in getChapterComments:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải bình luận.'
      });
    }
  }

  /**
   * Đăng bình luận mới cho chương
   * POST /api/chapters/:chapterId/comments
   */
  async createComment(req, res) {
    try {
      const userId = req.user.id;
      const chapterId = req.params.chapterId;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung bình luận không được để trống.'
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Bình luận không được vượt quá 1000 ký tự.'
        });
      }

      const chapter = await Chapter.findByPk(chapterId);
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: 'Chương truyện không tồn tại.'
        });
      }

      const newComment = await Comment.create({
        user_id: userId,
        story_id: chapter.story_id,
        chapter_id: chapterId,
        content: content.trim(),
        status: 'approved',
        likes_count: 0
      });

      const populatedComment = await Comment.findByPk(newComment.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'avatar', 'role']
          }
        ]
      });

      // Phát sự kiện real-time qua Socket.IO tới phòng của chapter
      broadcastNewComment(chapterId, populatedComment);

      return res.status(201).json({
        success: true,
        message: 'Bình luận thành công!',
        comment: populatedComment
      });
    } catch (err) {
      console.error('Error in createComment:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng bình luận.'
      });
    }
  }

  /**
   * Thích (Like) bình luận
   * POST /api/comments/:id/like
   */
  async likeComment(req, res) {
    try {
      const commentId = req.params.id;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Bình luận không tồn tại.'
        });
      }

      await comment.increment('likes_count', { by: 1 });
      await comment.reload();

      return res.status(200).json({
        success: true,
        likes_count: comment.likes_count
      });
    } catch (err) {
      console.error('Error in likeComment:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi thích bình luận.'
      });
    }
  }

  /**
   * Báo cáo bình luận vi phạm / spam
   * POST /api/comments/:id/report
   */
  async reportComment(req, res) {
    try {
      const commentId = req.params.id;
      const { reason = 'Nội dung vi phạm hoặc spam' } = req.body;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Bình luận không tồn tại.'
        });
      }

      await comment.update({
        is_reported: true,
        report_reason: reason
      });

      return res.status(200).json({
        success: true,
        message: 'Đã gửi báo cáo vi phạm tới ban quản trị để xem xét.'
      });
    } catch (err) {
      console.error('Error in reportComment:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi báo cáo vi phạm.'
      });
    }
  }

  /**
   * Admin: Lấy danh sách bình luận (có lọc vi phạm)
   * GET /api/admin/comments
   */
  async getAdminComments(req, res) {
    try {
      const { filter = 'all' } = req.query;
      const whereClause = {};

      if (filter === 'reported') {
        whereClause.is_reported = true;
      } else if (filter === 'hidden') {
        whereClause.status = 'hidden';
      }

      const comments = await Comment.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'full_name', 'email', 'avatar', 'role']
          },
          {
            model: Story,
            as: 'story',
            attributes: ['id', 'title', 'slug', 'cover_image']
          },
          {
            model: Chapter,
            as: 'chapter',
            attributes: ['id', 'chapter_number', 'title']
          }
        ],
        order: [
          ['is_reported', 'DESC'],
          ['created_at', 'DESC']
        ]
      });

      return res.status(200).json({
        success: true,
        comments
      });
    } catch (err) {
      console.error('Error in getAdminComments:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách bình luận quản trị.'
      });
    }
  }

  /**
   * Admin: Ẩn hoặc Duyệt lại bình luận
   * PATCH /api/admin/comments/:id/status
   */
  async updateCommentStatus(req, res) {
    try {
      const commentId = req.params.id;
      const { status } = req.body;

      if (!['approved', 'hidden'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ (approved hoặc hidden).'
        });
      }

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bình luận.'
        });
      }

      const updateData = { status };
      if (status === 'approved') {
        // Đã xem xét xong và cho phép hiển thị
        updateData.is_reported = false;
        updateData.report_reason = null;
      }

      await comment.update(updateData);

      return res.status(200).json({
        success: true,
        message: status === 'hidden' ? 'Đã ẩn bình luận vi phạm.' : 'Đã duyệt lại và hiển thị bình luận.',
        comment
      });
    } catch (err) {
      console.error('Error in updateCommentStatus:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái bình luận.'
      });
    }
  }

  /**
   * Admin: Xóa vĩnh viễn bình luận
   * DELETE /api/admin/comments/:id
   */
  async deleteComment(req, res) {
    try {
      const commentId = req.params.id;

      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bình luận.'
        });
      }

      await comment.destroy();

      return res.status(200).json({
        success: true,
        message: 'Đã xóa bình luận vĩnh viễn.'
      });
    } catch (err) {
      console.error('Error in deleteComment:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa bình luận.'
      });
    }
  }
}

module.exports = new CommentController();
