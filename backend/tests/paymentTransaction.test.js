'use strict';

const assert = require('assert');
const {
  User,
  Story,
  SubscriptionPlan,
  Subscription,
  StoryPurchase,
  Payment,
  sequelize
} = require('../src/models');
const paymentService = require('../src/services/paymentService');

async function runPaymentTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU CHẠY TEST: Thanh Toán Sandbox & Transaction Rollback (US-08)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const timestamp = Date.now();
  let testUser = null;
  let testPlan = null;
  let testStory = null;

  try {
    // Setup
    testUser = await User.create({
      username: `tx_tester_${timestamp}`,
      email: `tx_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });

    // Get existing active Plan from database
    testPlan = await SubscriptionPlan.findOne({
      where: { is_active: true },
      order: [['id', 'ASC']]
    });

    if (!testPlan) {
      testPlan = await SubscriptionPlan.create({
        name: 'Gói Độc Giả Marvel (1 Tháng)',
        slug: 'goi-doc-gia-marvel-1-thang',
        price: 49000,
        duration_days: 30,
        is_active: true
      });
    }

    testStory = await Story.create({
      title: '[TEST] Story for Purchase Test',
      slug: `test-story-tx-${timestamp}`,
      description: 'Test purchase',
      publisher: 'Marvel Comics',
      access_policy: 'paid',
      price: 79000,
      status: 'ongoing'
    });

    console.log('✅ [Setup] Khởi tạo dữ liệu người dùng & sản phẩm thành công.\n');

    // TEST 1: Tạo checkout đơn hàng thành công
    try {
      const checkout = await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'subscription',
        itemId: testPlan.id,
        paymentMethod: 'vnpay'
      });

      assert.ok(checkout.transactionCode, 'Phải có transactionCode');
      assert.strictEqual(Number(checkout.amount), Number(testPlan.price));
      assert.strictEqual(checkout.payment.status, 'pending');
      console.log('✅ TEST 1 PASS: Tạo checkout đơn hàng pending thành công (VNPay Sandbox).');
      passed++;
    } catch (err) {
      console.error('❌ TEST 1 FAIL:', err.message);
      failed++;
    }

    // TEST 2: Giao dịch thất bại -> Không cấp quyền
    try {
      const checkoutFail = await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'subscription',
        itemId: testPlan.id,
        paymentMethod: 'sandbox'
      });

      const failResult = await paymentService.processSandboxPayment({
        transactionCode: checkoutFail.transactionCode,
        simulateFailure: true
      });

      assert.strictEqual(failResult.success, false);
      assert.strictEqual(failResult.payment.status, 'failed');

      // Verify no subscription was granted
      const sub = await Subscription.findOne({ where: { user_id: testUser.id, status: 'active' } });
      assert.strictEqual(sub, null, 'Giao dịch thất bại không được cấp quyền');

      console.log('✅ TEST 2 PASS: Giao dịch bị hủy/thất bại -> Trạng thái failed, KHÔNG kích hoạt quyền đọc.');
      passed++;
    } catch (err) {
      console.error('❌ TEST 2 FAIL:', err.message);
      failed++;
    }

    // TEST 3: Giao dịch thành công -> Kích hoạt gói đọc VIP 30 ngày
    let activeSubId = null;
    let initialEndDate = null;
    try {
      const checkoutSuccess = await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'subscription',
        itemId: testPlan.id,
        paymentMethod: 'momo'
      });

      const successResult = await paymentService.processSandboxPayment({
        transactionCode: checkoutSuccess.transactionCode
      });

      assert.strictEqual(successResult.success, true);
      assert.strictEqual(successResult.payment.status, 'completed');

      const sub = await Subscription.findOne({ where: { user_id: testUser.id, status: 'active' } });
      assert.ok(sub, 'Phải có subscription active');
      activeSubId = sub.id;
      initialEndDate = new Date(sub.end_date);
      console.log('✅ TEST 3 PASS: Thanh toán thành công -> Kích hoạt gói VIP mới (hạn 30 ngày).');
      passed++;
    } catch (err) {
      console.error('❌ TEST 3 FAIL:', err.message);
      failed++;
    }

    // TEST 4: Gia hạn gói đọc -> Cộng dồn số ngày vào ngày hết hạn hiện tại
    try {
      const checkoutRenew = await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'subscription',
        itemId: testPlan.id,
        paymentMethod: 'vnpay'
      });

      await paymentService.processSandboxPayment({
        transactionCode: checkoutRenew.transactionCode
      });

      const renewedSub = await Subscription.findByPk(activeSubId);
      const newEndDate = new Date(renewedSub.end_date);
      const diffDays = Math.round((newEndDate - initialEndDate) / (1000 * 60 * 60 * 24));
      assert.strictEqual(diffDays, 30, 'Phải cộng thêm đúng 30 ngày khi gia hạn');
      console.log('✅ TEST 4 PASS: Gia hạn gói thành công -> Thời hạn được cộng dồn thêm 30 ngày chính xác.');
      passed++;
    } catch (err) {
      console.error('❌ TEST 4 FAIL:', err.message);
      failed++;
    }

    // TEST 5: Mua truyện riêng lẻ -> Kích hoạt bản quyền StoryPurchase
    try {
      const checkoutStory = await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'story_purchase',
        itemId: testStory.id,
        paymentMethod: 'sandbox'
      });

      const purchaseResult = await paymentService.processSandboxPayment({
        transactionCode: checkoutStory.transactionCode
      });

      assert.strictEqual(purchaseResult.success, true);
      const purchase = await StoryPurchase.findOne({
        where: { user_id: testUser.id, story_id: testStory.id, status: 'completed' }
      });
      assert.ok(purchase, 'Phải có bản ghi StoryPurchase');
      console.log('✅ TEST 5 PASS: Mua riêng lẻ bộ truyện thành công -> Ghi nhận bản quyền trong story_purchases.');
      passed++;
    } catch (err) {
      console.error('❌ TEST 5 FAIL:', err.message);
      failed++;
    }

    // TEST 6: Ngăn chặn mua trùng lặp bộ truyện đã sở hữu
    try {
      await paymentService.createCheckout({
        userId: testUser.id,
        paymentType: 'story_purchase',
        itemId: testStory.id,
        paymentMethod: 'sandbox'
      });
      console.error('❌ TEST 6 FAIL: Lẽ ra phải chặn không cho tạo checkout truyện đã sở hữu.');
      failed++;
    } catch (err) {
      assert.ok(err.message.includes('đã sở hữu'), 'Phải thông báo đã sở hữu');
      console.log('✅ TEST 6 PASS: Chống mua trùng -> Hệ thống từ chối tạo checkout khi người dùng đã sở hữu truyện.');
      passed++;
    }

    // TEST 7: DB TRANSACTION ROLLBACK KHI GẶP LỖI CẤP QUYỀN (US-08)
    try {
      // Create fresh user for rollback test
      const rollbackUser = await User.create({
        username: `rollback_user_${timestamp}`,
        email: `rollback_${timestamp}@test.marvel`,
        password: 'password123',
        role: 'reader'
      });

      const checkoutRollback = await paymentService.createCheckout({
        userId: rollbackUser.id,
        paymentType: 'subscription',
        itemId: testPlan.id,
        paymentMethod: 'sandbox'
      });

      // Attempt processing with simulateErrorOnGrant = true
      let caughtError = false;
      try {
        await paymentService.processSandboxPayment({
          transactionCode: checkoutRollback.transactionCode,
          simulateErrorOnGrant: true
        });
      } catch (e) {
        caughtError = true;
      }

      assert.strictEqual(caughtError, true, 'Phải bắt được lỗi khi rollback');

      // Verify that Payment was NOT marked completed because transaction was rolled back!
      const paymentAfterRollback = await Payment.findOne({
        where: { transaction_code: checkoutRollback.transactionCode }
      });
      assert.strictEqual(paymentAfterRollback.status, 'pending', 'Payment phải rollback về pending, không được lưu completed');

      // Verify that NO subscription was created
      const subAfterRollback = await Subscription.findOne({
        where: { user_id: rollbackUser.id }
      });
      assert.strictEqual(subAfterRollback, null, 'Không được tạo subscription khi transaction rollback');

      await rollbackUser.destroy();
      console.log('✅ TEST 7 PASS: Cơ chế DB Transaction Rollback (US-08) -> Khi cấp quyền lỗi, toàn bộ giao dịch và quyền được rollback nguyên vẹn, không để dữ liệu tiền - quyền lệch nhau!');
      passed++;
    } catch (err) {
      console.error('❌ TEST 7 FAIL:', err.message);
      failed++;
    }

  } catch (globalErr) {
    console.error('💥 Lỗi toàn cục:', globalErr);
    failed++;
  } finally {
    // Cleanup
    console.log('\n🧹 [Cleanup] Dọn dẹp dữ liệu test thanh toán...');
    try {
      if (testUser) await testUser.destroy();
      if (testStory) await testStory.destroy();
      console.log('✅ [Cleanup] Xong!');
    } catch (e) {
      console.warn('⚠️ Lỗi cleanup:', e.message);
    }

    console.log('\n================================================================');
    console.log(`📊 KẾT QUẢ TEST THANH TOÁN & TRANSACTION: ${passed} PASSED / ${passed + failed} TOTAL`);
    if (failed === 0) {
      console.log('🎉 TẤT CẢ TEST TRANSACTIONS ĐÃ ĐẠT 100% TIÊU CHUẨN DEFINITION OF DONE!');
    } else {
      console.log(`❌ CÓ ${failed} TEST CASES BỊ LỖI.`);
      process.exit(1);
    }
    console.log('================================================================\n');
  }
}

if (require.main === module) {
  runPaymentTestSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runPaymentTestSuite };
