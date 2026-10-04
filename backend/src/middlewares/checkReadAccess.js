'use strict';

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Chapter, Story, Subscription, SubscriptionPlan, StoryPurchase, User } = require('../models');

/**
 * Helper to optionally extract user from Authorization header if not already set by authMiddleware
 */
const resolveUserFromToken = async (req) => {
  if (req.user) return req.user;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'marvel_secret_key_2026');
    const user = await User.findByPk(decoded.id);
    if (user) {
      req.user = user;
      return user;
    }
  } catch (err) {
    // Invalid or expired token
    return null;
  }

  return null;
};

/**
 * Core business function to evaluate read access for a chapter & user
 * Can be used directly by middleware or tested in isolation
 *
 * @param {Object} params
 * @param {number|string} params.chapterId
 * @param {Object|null} params.user
 * @returns {Promise<{ allowed: boolean, statusCode?: number, code?: string, message?: string, access?: Object, chapter?: Object, story?: Object }>}
 */
const evaluateReadAccess = async ({ chapterId, user }) => {
  const chapter = await Chapter.findByPk(chapterId, {
    include: [{ model: Story, as: 'story' }]
  });

  if (!chapter) {
    return {
      allowed: false,
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Chương truyện không tồn tại.'
    };
  }

  const story = chapter.story;

  // 1. FREE STORY OR PREVIEW CHAPTER: Open to everyone (no auth or payment required)
  if (story.access_policy === 'free' || chapter.is_preview) {
    return {
      allowed: true,
      statusCode: 200,
      reason: chapter.is_preview ? 'preview' : 'free_story',
      chapter,
      story
    };
  }

  // 2. PAID CHAPTER: Requires authenticated user
  if (!user) {
    return {
      allowed: false,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để đọc chương trả phí này.',
      chapter,
      story
    };
  }

  // 3. ADMIN: Always allowed full access
  if (user.role === 'admin') {
    return {
      allowed: true,
      statusCode: 200,
      reason: 'admin',
      chapter,
      story
    };
  }

  // 4. COMBINED INDEPENDENT ACCESS CHECK (US-26)
  // Condition A: Active monthly subscription
  const activeSub = await Subscription.findOne({
    where: {
      user_id: user.id,
      status: 'active',
      end_date: {
        [Op.gte]: new Date()
      }
    },
    include: [{ model: SubscriptionPlan, as: 'plan' }]
  });
  const hasActiveSubscription = !!activeSub;

  // Condition B: Purchased story individually
  const storyPurchase = await StoryPurchase.findOne({
    where: {
      user_id: user.id,
      story_id: story.id,
      status: 'completed'
    }
  });
  const hasPurchasedStory = !!storyPurchase;

  // Evaluate combination
  if (hasActiveSubscription || hasPurchasedStory) {
    const via = (hasActiveSubscription && hasPurchasedStory)
      ? 'both'
      : (hasActiveSubscription ? 'subscription' : 'purchase');

    return {
      allowed: true,
      statusCode: 200,
      via,
      activeSubscription: activeSub,
      storyPurchase,
      // Anti-duplicate charge protection flag
      no_duplicate_charge: true,
      chapter,
      story
    };
  }

  // 5. NEITHER CONDITION MET: Forbidden
  return {
    allowed: false,
    statusCode: 403,
    code: 'PAYMENT_REQUIRED',
    message: 'Chương này yêu cầu Gói Hội Viên VIP hoặc mua riêng trọn bộ truyện để đọc.',
    access_info: {
      chapter_id: chapter.id,
      chapter_number: chapter.chapter_number,
      title: chapter.title,
      story_id: story.id,
      story_title: story.title,
      story_price: story.price,
      access_policy: story.access_policy,
      has_active_subscription: false,
      has_purchased_story: false
    },
    chapter,
    story
  };
};

/**
 * Express Middleware: checkReadAccess (US-26)
 */
const checkReadAccess = async (req, res, next) => {
  try {
    const chapterId = req.params.chapterId;
    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã chương truyện (chapterId).'
      });
    }

    // Try resolving user from token if not present
    const user = await resolveUserFromToken(req);

    const result = await evaluateReadAccess({ chapterId, user });

    if (!result.allowed) {
      return res.status(result.statusCode || 403).json({
        success: false,
        code: result.code,
        message: result.message,
        access_info: result.access_info
      });
    }

    // Attach access details to request
    req.readAccess = {
      allowed: true,
      reason: result.reason,
      via: result.via,
      activeSubscription: result.activeSubscription,
      storyPurchase: result.storyPurchase,
      no_duplicate_charge: result.no_duplicate_charge || false
    };
    req.chapter = result.chapter;
    req.story = result.story;

    next();
  } catch (error) {
    console.error('Error in checkReadAccess middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi kiểm tra quyền đọc chương.',
      error: error.message
    });
  }
};

module.exports = {
  checkReadAccess,
  evaluateReadAccess,
  resolveUserFromToken
};
