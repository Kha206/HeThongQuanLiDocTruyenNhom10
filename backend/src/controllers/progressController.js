'use strict';

const { ReadingProgress, Story, Chapter, sequelize } = require('../models');

class ProgressController {
  /**
   * Lưu hoặc cập nhật tiến độ đọc của người dùng
   * POST /api/reading-progress
   */
  async saveProgress(req, res) {
    try {
      const userId = req.user.id;
      const { story_id, chapter_id, scroll_y, progress_percent } = req.body;

      if (!story_id || !chapter_id) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu story_id hoặc chapter_id.'
        });
      }

      // Kiểm tra chapter có thuộc story không
      const chapter = await Chapter.findOne({
        where: { id: chapter_id, story_id }
      });

      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: 'Chương truyện không tồn tại trong bộ truyện này.'
        });
      }

      const percent = Math.min(100, Math.max(0, parseFloat(progress_percent) || 0));
      const scrollY = Math.max(0, parseInt(scroll_y) || 0);

      // Upsert reading progress
      const [progress, created] = await ReadingProgress.findOrCreate({
        where: { user_id: userId, story_id },
        defaults: {
          user_id: userId,
          story_id,
          chapter_id,
          scroll_y: scrollY,
          progress_percent: percent
        }
      });

      if (!created) {
        await progress.update({
          chapter_id,
          scroll_y: scrollY,
          progress_percent: percent,
          updated_at: new Date()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lưu tiến độ đọc thành công.',
        progress
      });
    } catch (err) {
      console.error('Error in saveProgress:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ khi lưu tiến độ đọc.'
      });
    }
  }

  /**
   * Lấy tiến độ đọc của một bộ truyện cụ thể
   * GET /api/reading-progress/:storyId
   */
  async getStoryProgress(req, res) {
    try {
      const userId = req.user.id;
      const storyId = req.params.storyId;

      const progress = await ReadingProgress.findOne({
        where: { user_id: userId, story_id: storyId },
        include: [
          {
            model: Chapter,
            as: 'chapter',
            attributes: ['id', 'chapter_number', 'title', 'cover_image', 'accent_color']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        progress: progress || null
      });
    } catch (err) {
      console.error('Error in getStoryProgress:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải tiến độ đọc.'
      });
    }
  }

  /**
   * Lấy danh sách toàn bộ truyện đang đọc dở của người dùng
   * GET /api/reading-progress
   */
  async getAllReadingProgress(req, res) {
    try {
      const userId = req.user.id;

      const progressList = await ReadingProgress.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Story,
            as: 'story',
            attributes: ['id', 'title', 'original_title', 'slug', 'cover_image', 'status', 'access_policy', 'rating']
          },
          {
            model: Chapter,
            as: 'chapter',
            attributes: ['id', 'chapter_number', 'title', 'cover_image', 'accent_color']
          }
        ],
        order: [['updated_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        history: progressList
      });
    } catch (err) {
      console.error('Error in getAllReadingProgress:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách truyện đang đọc.'
      });
    }
  }

  /**
   * Xóa một truyện khỏi lịch sử đang đọc
   * DELETE /api/reading-progress/:storyId
   */
  async deleteStoryProgress(req, res) {
    try {
      const userId = req.user.id;
      const storyId = req.params.storyId;

      const deleted = await ReadingProgress.destroy({
        where: { user_id: userId, story_id: storyId }
      });

      return res.status(200).json({
        success: true,
        message: deleted ? 'Đã xóa khỏi danh sách truyện đang đọc.' : 'Không tìm thấy bản ghi để xóa.'
      });
    } catch (err) {
      console.error('Error in deleteStoryProgress:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa lịch sử đọc.'
      });
    }
  }
}

module.exports = new ProgressController();
