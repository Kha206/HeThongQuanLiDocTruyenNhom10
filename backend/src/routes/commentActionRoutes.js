'use strict';

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.post('/:id/like', commentController.likeComment);
router.post('/:id/report', authMiddleware, commentController.reportComment);

// Admin comment moderation actions via /api/comments
router.patch('/:id/hide', authMiddleware, roleMiddleware('admin'), (req, res, next) => {
  req.body = { ...req.body, status: 'hidden' };
  commentController.updateCommentStatus(req, res, next);
});
router.post('/:id/hide', authMiddleware, roleMiddleware('admin'), (req, res, next) => {
  req.body = { ...req.body, status: 'hidden' };
  commentController.updateCommentStatus(req, res, next);
});
router.patch('/:id/restore', authMiddleware, roleMiddleware('admin'), (req, res, next) => {
  req.body = { ...req.body, status: 'approved' };
  commentController.updateCommentStatus(req, res, next);
});
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), commentController.updateCommentStatus);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), commentController.deleteComment);

module.exports = router;

