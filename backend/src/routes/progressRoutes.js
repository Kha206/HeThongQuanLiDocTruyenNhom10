'use strict';

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả các route tiến độ đọc yêu cầu người dùng đăng nhập
router.use(authMiddleware);

router.post('/', progressController.saveProgress);
router.get('/', progressController.getAllReadingProgress);
router.get('/:storyId', progressController.getStoryProgress);
router.delete('/:storyId', progressController.deleteStoryProgress);

module.exports = router;
