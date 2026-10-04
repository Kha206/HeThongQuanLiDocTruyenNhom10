'use strict';

const paymentService = require('../services/paymentService');

class PaymentController {
  /**
   * Tạo đơn thanh toán (Checkout)
   * POST /api/payments/checkout
   */
  async checkout(req, res) {
    try {
      const userId = req.user.id;
      const { payment_type, item_id, payment_method } = req.body;

      if (!payment_type || !item_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ payment_type và item_id.'
        });
      }

      const result = await paymentService.createCheckout({
        userId,
        paymentType: payment_type,
        itemId: item_id,
        paymentMethod: payment_method || 'sandbox'
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo phiên thanh toán thành công.',
        data: result
      });
    } catch (err) {
      console.error('Error in checkout:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi tạo phiên thanh toán.'
      });
    }
  }

  /**
   * Xử lý giao dịch Sandbox (mô phỏng cổng VNPay/MoMo)
   * POST /api/payments/process-sandbox
   */
  async processSandbox(req, res) {
    try {
      const { transaction_code, simulate_failure, simulate_error_on_grant } = req.body;

      if (!transaction_code) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu transaction_code.'
        });
      }

      const result = await paymentService.processSandboxPayment({
        transactionCode: transaction_code,
        simulateFailure: !!simulate_failure,
        simulateErrorOnGrant: !!simulate_error_on_grant
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
          payment: result.payment
        });
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        payment: result.payment
      });
    } catch (err) {
      console.error('Error in processSandbox:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ khi xử lý giao dịch Sandbox.'
      });
    }
  }

  /**
   * Lấy thông tin gói VIP hiện tại của người dùng
   * GET /api/payments/my-subscription
   */
  async getMySubscription(req, res) {
    try {
      const userId = req.user.id;
      const subscription = await paymentService.getUserActiveSubscription(userId);

      return res.status(200).json({
        success: true,
        subscription: subscription || null,
        is_vip: !!subscription
      });
    } catch (err) {
      console.error('Error in getMySubscription:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin gói đọc.'
      });
    }
  }

  /**
   * Lấy danh sách truyện người dùng đã mua lẻ (US-31)
   * GET /api/payments/purchased-stories
   */
  async getPurchasedStories(req, res) {
    try {
      const userId = req.user.id;
      const purchases = await paymentService.getUserPurchasedStories(userId);

      return res.status(200).json({
        success: true,
        purchases
      });
    } catch (err) {
      console.error('Error in getPurchasedStories:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách truyện đã mua.'
      });
    }
  }

  /**
   * Lấy toàn bộ lịch sử giao dịch của người dùng (US-32)
   * GET /api/payments/my-transactions
   */
  async getMyTransactions(req, res) {
    try {
      const userId = req.user.id;
      const transactions = await paymentService.getUserTransactions(userId);

      return res.status(200).json({
        success: true,
        transactions
      });
    } catch (err) {
      console.error('Error in getMyTransactions:', err);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử giao dịch.'
      });
    }
  }
}

module.exports = new PaymentController();
