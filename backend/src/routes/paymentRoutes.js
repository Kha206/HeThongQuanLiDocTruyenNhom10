'use strict';

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả các route thanh toán đều yêu cầu người dùng đã đăng nhập
router.post('/checkout', authMiddleware, paymentController.checkout);
router.post('/process-sandbox', authMiddleware, paymentController.processSandbox);
router.get('/my-subscription', authMiddleware, paymentController.getMySubscription);
router.get('/purchased-stories', authMiddleware, paymentController.getPurchasedStories);
router.get('/my-transactions', authMiddleware, paymentController.getMyTransactions);

module.exports = router;
