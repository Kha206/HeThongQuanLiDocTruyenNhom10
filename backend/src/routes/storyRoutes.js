const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const followController = require('../controllers/followController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/proxy-image', storyController.proxyImage);
router.get('/', storyController.getAllStories);
router.get('/hero', storyController.getHeroStories);
router.get('/chapters/:chapterId', storyController.getChapterDetail);
router.get('/:id', storyController.getStoryById);
router.post('/:id/view', storyController.recordStoryView);

// Follow / Unfollow Story
router.post('/:id/follow', authMiddleware, followController.toggleFollow);
router.get('/:id/follow-status', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
}, followController.getFollowStatus);

module.exports = router;
