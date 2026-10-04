const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All admin routes require admin authentication
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Admin Dashboard stats
router.get('/overview', adminController.getAdminOverview);

// Story management (US-01, US-12, US-04, US-07)
router.post('/stories', adminController.createStory);
router.put('/stories/:id', adminController.updateStory);
router.patch('/stories/:id/status', adminController.updateStoryStatus);
router.patch('/stories/:id/policy', adminController.updateStoryPolicy);
router.post('/stories/:id/quick-preview', adminController.setQuickPreviewChapters);
router.delete('/stories/:id', adminController.deleteStory);

// Chapter management
const { uploadChapterCover } = require('../middlewares/uploadMiddleware');
router.post('/upload-cover', uploadChapterCover.single('cover'), adminController.uploadChapterCover);
router.get('/comicvine/issues', adminController.searchComicVineIssues);
router.get('/comicvine/issue-by-url', adminController.fetchComicVineIssueByUrl);
router.get('/stories/:storyId/chapters', adminController.getStoryChapters);
router.post('/chapters', adminController.addChapter);
router.put('/chapters/:id', adminController.updateChapter);
router.patch('/chapters/:id/preview', adminController.toggleChapterPreview);
router.delete('/chapters/:id', adminController.deleteChapter);

const commentController = require('../controllers/commentController');

// Comment moderation
router.get('/comments', commentController.getAdminComments);
router.patch('/comments/:id/status', commentController.updateCommentStatus);
router.patch('/comments/:id/hide', (req, res, next) => {
  req.body = { ...req.body, status: 'hidden' };
  commentController.updateCommentStatus(req, res, next);
});
router.post('/comments/:id/hide', (req, res, next) => {
  req.body = { ...req.body, status: 'hidden' };
  commentController.updateCommentStatus(req, res, next);
});
router.patch('/comments/:id/restore', (req, res, next) => {
  req.body = { ...req.body, status: 'approved' };
  commentController.updateCommentStatus(req, res, next);
});
router.post('/comments/:id/restore', (req, res, next) => {
  req.body = { ...req.body, status: 'approved' };
  commentController.updateCommentStatus(req, res, next);
});
router.patch('/comments/:id/approve', (req, res, next) => {
  req.body = { ...req.body, status: 'approved' };
  commentController.updateCommentStatus(req, res, next);
});
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;

