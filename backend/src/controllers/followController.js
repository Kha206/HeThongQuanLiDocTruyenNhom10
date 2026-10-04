'use strict';

const { StoryFollow, Story } = require('../models');

class FollowController {
  /**
   * Bật/Tắt theo dõi bộ truyện (Toggle Follow)
   * POST /api/stories/:id/follow
   */
  async toggleFollow(req, res) {
    try {
      const userId = req.user.id;
      const storyId = req.params.id;

      const story = await Story.findByPk(storyId);
      if (!story) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bộ truyện.'
        });
      }

      const existingFollow = await StoryFollow.findOne({
        where: { user_id: userId, story_id: storyId }
      });

      let isFollowing = false;
      if (existingFollow) {
        await existingFollow.destroy();
        isFollowing = false;
      } else {
        await StoryFollow.create({
          user_id: userId,
          story_id: storyId
        });
        isFollowing = true;
      }

      const followersCount = await StoryFollow.count({
        where: { story_id: storyId }
      });

      return res.status(200).json({
        success: true,
        is_following: isFollowing,
        followers_count: followersCount,
        message: isFollowing ? 'Đã thêm truyện vào danh sách theo dõi.' : 'Đã hủy theo dõi truyện.'
      });
    } catch (err) {
      console.error('Error in toggleFollow:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái theo dõi.'
      });
    }
  }

  /**
   * Lấy trạng thái theo dõi của người dùng đối với bộ truyện
   * GET /api/stories/:id/follow-status
   */
  async getFollowStatus(req, res) {
    try {
      const storyId = req.params.id;
      const userId = req.user ? req.user.id : null;

      let isFollowing = false;
      if (userId) {
        const follow = await StoryFollow.findOne({
          where: { user_id: userId, story_id: storyId }
        });
        isFollowing = !!follow;
      }

      const followersCount = await StoryFollow.count({
        where: { story_id: storyId }
      });

      return res.status(200).json({
        success: true,
        is_following: isFollowing,
        followers_count: followersCount
      });
    } catch (err) {
      console.error('Error in getFollowStatus:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái theo dõi.'
      });
    }
  }
}

module.exports = new FollowController();
