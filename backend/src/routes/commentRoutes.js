'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route: /api/chapters/:chapterId/comments
router.get('/', commentController.getChapterComments);
router.post('/', authMiddleware, commentController.createComment);

module.exports = router;
