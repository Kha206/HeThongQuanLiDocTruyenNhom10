'use strict';

const { Op } = require('sequelize');
const {
  Payment,
  Subscription,
  SubscriptionPlan,
  StoryPurchase,
  Story,
  User,
  sequelize
} = require('../models');

class PaymentService {
  /**
   * Khởi tạo giao dịch thanh toán (Checkout)
   */
  async createCheckout({ userId, paymentType, itemId, paymentMethod = 'vnpay' }) {
    let amount = 0;
    let itemTitle = '';

    let normalizedType = paymentType;
    if (normalizedType === 'story') {
      normalizedType = 'story_purchase';
    }

    if (normalizedType === 'subscription') {
      const plan = await SubscriptionPlan.findByPk(itemId);
      if (!plan || !plan.is_active) {
        throw new Error('Gói đọc không tồn tại hoặc đã ngừng hỗ trợ.');
      }
      amount = plan.price;
      itemTitle = plan.name;
    } else if (normalizedType === 'story_purchase') {
      const story = await Story.findByPk(itemId);
      if (!story) {
        throw new Error('Truyện không tồn tại.');
      }
      // Check if user already owns this story
      const existingPurchase = await StoryPurchase.findOne({
        where: {
          user_id: userId,
          story_id: itemId,
          status: 'completed'
        }
      });
      if (existingPurchase) {
        throw new Error('Bạn đã sở hữu bản quyền bộ truyện này rồi, không cần mua lại!');
      }
      amount = story.price || 0;
      itemTitle = story.title;
    } else {
      throw new Error('Loại giao dịch không hợp lệ.');
    }

    const methodPrefix = (paymentMethod || 'sandbox').toUpperCase();
    const transactionCode = `${methodPrefix}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      payment_type: normalizedType,
      item_id: itemId,
      transaction_code: transactionCode,
      status: 'pending',
      payment_details: {
        item_title: itemTitle,
        created_at: new Date()
      }
    });

    return {
      payment,
      transactionCode,
      amount,
      itemTitle,
      paymentType,
      paymentMethod
    };
  }

  /**
   * Xử lý giao dịch Sandbox với Sequelize Transaction đảm bảo toàn vẹn dữ liệu (US-08)
   */
  async processSandboxPayment({ transactionCode, simulateFailure = false, simulateErrorOnGrant = false }) {
    const payment = await Payment.findOne({ where: { transaction_code: transactionCode } });
    if (!payment) {
      throw new Error('Không tìm thấy mã giao dịch thanh toán.');
    }

    if (payment.status === 'completed') {
      return {
        success: true,
        alreadyProcessed: true,
        message: 'Giao dịch này đã được hoàn tất trước đó.',
        payment
      };
    }

    // 1. Trường hợp giao dịch thất bại / người dùng hủy thanh toán
    if (simulateFailure) {
      await payment.update({
        status: 'failed',
        payment_details: {
          ...payment.payment_details,
          failure_reason: 'Giao dịch bị từ chối hoặc người dùng hủy bỏ tại cổng Sandbox',
          failed_at: new Date()
        }
      });

      return {
        success: false,
        message: 'Giao dịch thanh toán không thành công. Quyền đọc chưa được kích hoạt.',
        payment
      };
    }

    // 2. Trường hợp thanh toán thành công: Bọc trong Sequelize Transaction
    const result = await sequelize.transaction(async (t) => {
      // Cập nhật trạng thái Payment thành completed
      await payment.update(
        {
          status: 'completed',
          payment_details: {
            ...payment.payment_details,
            completed_at: new Date(),
            gateway_response: 'SUCCESS_200_SANDBOX'
          }
        },
        { transaction: t }
      );

      // Cấp quyền theo loại giao dịch
      if (payment.payment_type === 'subscription') {
        const plan = await SubscriptionPlan.findByPk(payment.item_id, { transaction: t });
        if (!plan) {
          throw new Error('Gói thành viên không tồn tại trong hệ thống.');
        }

        const durationDays = plan.duration_days || 30;

        // Kiểm tra xem user đã có gói đang active còn hạn không
        const activeSub = await Subscription.findOne({
          where: {
            user_id: payment.user_id,
            status: 'active',
            end_date: {
              [Op.gte]: new Date()
            }
          },
          transaction: t
        });

        if (activeSub) {
          // GIA HẠN GÓI: Cộng dồn thời hạn sử dụng tiếp nối
          const currentEndDate = new Date(activeSub.end_date);
          const newEndDate = new Date(currentEndDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

          await activeSub.update(
            {
              plan_id: plan.id,
              payment_id: payment.id,
              end_date: newEndDate
            },
            { transaction: t }
          );
        } else {
          // KÍCH HOẠT MỚI: Bắt đầu từ thời điểm hiện tại
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

          await Subscription.create(
            {
              user_id: payment.user_id,
              plan_id: plan.id,
              payment_id: payment.id,
              start_date: startDate,
              end_date: endDate,
              status: 'active'
            },
            { transaction: t }
          );
        }
      } else if (payment.payment_type === 'story_purchase' || payment.payment_type === 'story') {
        // Kiểm tra xem đã sở hữu chưa (tránh insert trùng lặp)
        const existingPurchase = await StoryPurchase.findOne({
          where: {
            user_id: payment.user_id,
            story_id: payment.item_id,
            status: 'completed'
          },
          transaction: t
        });

        if (!existingPurchase) {
          await StoryPurchase.create(
            {
              user_id: payment.user_id,
              story_id: payment.item_id,
              payment_id: payment.id,
              price_paid: payment.amount,
              status: 'completed'
            },
            { transaction: t }
          );
        }
      }

      // Giả lập lỗi ở bước cuối cùng để kiểm chứng cơ chế Rollback (US-08)
      if (simulateErrorOnGrant) {
        throw new Error('Lỗi mô phỏng trong quá trình kích hoạt quyền (Simulated Rollback Test)');
      }

      return payment;
    });

    return {
      success: true,
      message: 'Thanh toán và kích hoạt quyền đọc thành công qua Sandbox!',
      payment: result
    };
  }

  /**
   * Lấy thông tin gói VIP hiện tại của người dùng
   */
  async getUserActiveSubscription(userId) {
    const sub = await Subscription.findOne({
      where: {
        user_id: userId,
        status: 'active',
        end_date: {
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan'
        }
      ],
      order: [['end_date', 'DESC']]
    });

    if (!sub) return null;

    const now = new Date();
    const endDate = new Date(sub.end_date);
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      id: sub.id,
      plan_name: sub.plan?.name,
      plan_slug: sub.plan?.slug,
      badge: sub.plan?.badge,
      start_date: sub.start_date,
      end_date: sub.end_date,
      days_remaining: daysRemaining,
      status: sub.status,
      is_active: true
    };
  }

  /**
   * Lấy danh sách các truyện người dùng đã mua lẻ (US-31)
   */
  async getUserPurchasedStories(userId) {
    const purchases = await StoryPurchase.findAll({
      where: {
        user_id: userId,
        status: 'completed'
      },
      include: [
        {
          model: Story,
          as: 'story'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return purchases.map((p) => ({
      purchase_id: p.id,
      story_id: p.story_id,
      story: p.story,
      price_paid: p.price_paid,
      purchased_at: p.created_at
    }));
  }

  /**
   * Lấy lịch sử tất cả các giao dịch thanh toán của người dùng (US-32)
   */
  async getUserTransactions(userId) {
    const payments = await Payment.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    const results = await Promise.all(
      payments.map(async (p) => {
        let title = p.payment_details?.item_title || '';
        let cover = null;
        if (!title) {
          if (p.payment_type === 'subscription') {
            const plan = await SubscriptionPlan.findByPk(p.item_id);
            title = plan ? plan.name : 'Gói Hội Viên';
          } else {
            const story = await Story.findByPk(p.item_id);
            title = story ? story.title : 'Truyện bản quyền';
            cover = story?.cover_image || null;
          }
        } else if (p.payment_type === 'story_purchase' || p.payment_type === 'story') {
          const story = await Story.findByPk(p.item_id, { attributes: ['cover_image'] });
          cover = story?.cover_image || null;
        }

        return {
          id: p.id,
          transaction_code: p.transaction_code,
          amount: p.amount,
          payment_method: p.payment_method,
          payment_type: p.payment_type,
          item_id: p.item_id,
          item_title: title,
          item_cover: cover,
          status: p.status,
          created_at: p.created_at,
          payment_details: p.payment_details
        };
      })
    );

    return results;
  }
}

module.exports = new PaymentService();
