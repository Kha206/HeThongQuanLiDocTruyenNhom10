'use strict';

const assert = require('assert');
const {
  User,
  Story,
  Chapter,
  SubscriptionPlan,
  Subscription,
  StoryPurchase,
  sequelize
} = require('../src/models');
const { evaluateReadAccess, checkReadAccess } = require('../src/middlewares/checkReadAccess');

// Helper to create mock Express request/response
function createMockContext({ chapterId, user }) {
  const req = {
    params: { chapterId },
    user,
    headers: {}
  };

  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getResult: () => ({ statusCode, responseData, nextCalled }) };
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU CHẠY UNIT TEST: Middleware Quyền Đọc Kết Hợp (US-26)');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  let testPaidStory = null;
  let testFreeStory = null;
  let previewChapter = null;
  let vipChapter = null;
  let freeChapter = null;
  let testPlan = null;

  let userNoAccess = null;
  let userExpiredSub = null;
  let userOnlySub = null;
  let userOnlyPurchased = null;
  let userBoth = null;
  let adminUser = null;

  try {
    // 1. SETUP FIXTURES IN MYSQL DATABASE
    console.log('📦 [Setup] Khởi tạo dữ liệu kiểm thử trong MySQL marvel_db...');

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

    // Create Test Paid Story
    testPaidStory = await Story.create({
      title: '[TEST] Marvel Paid Story for Access Control',
      slug: `test-paid-story-${Date.now()}`,
      description: 'Test story for US-26',
      publisher: 'Marvel Comics',
      access_policy: 'paid',
      price: 69000,
      status: 'ongoing'
    });

    // Create Test Free Story
    testFreeStory = await Story.create({
      title: '[TEST] Marvel Free Story for Access Control',
      slug: `test-free-story-${Date.now()}`,
      description: 'Test free story for US-26',
      publisher: 'Marvel Comics',
      access_policy: 'free',
      price: 0,
      status: 'ongoing'
    });

    // Chapter 1: Preview Chapter of Paid Story
    previewChapter = await Chapter.create({
      story_id: testPaidStory.id,
      chapter_number: 1,
      title: 'Chương 1: Đọc Thử Miễn Phí (Preview)',
      is_preview: true,
      content: 'Nội dung đọc thử miễn phí'
    });

    // Chapter 2: VIP Paid Chapter
    vipChapter = await Chapter.create({
      story_id: testPaidStory.id,
      chapter_number: 2,
      title: 'Chương 2: Chương VIP Trả Phí',
      is_preview: false,
      content: 'Nội dung chương bí mật trả phí của Marvel'
    });

    // Chapter 3: Free Chapter of Free Story
    freeChapter = await Chapter.create({
      story_id: testFreeStory.id,
      chapter_number: 1,
      title: 'Chương Miễn Phí Toàn Bộ',
      is_preview: false,
      content: 'Nội dung chương miễn phí'
    });

    const timestamp = Date.now();

    // Create test users
    userNoAccess = await User.create({
      username: `reader_no_access_${timestamp}`,
      email: `no_access_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });

    userExpiredSub = await User.create({
      username: `reader_expired_${timestamp}`,
      email: `expired_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });
    // Add expired subscription (5 days ago)
    const pastStart = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await Subscription.create({
      user_id: userExpiredSub.id,
      plan_id: testPlan.id,
      start_date: pastStart,
      end_date: pastEnd,
      status: 'expired'
    });

    userOnlySub = await User.create({
      username: `reader_sub_${timestamp}`,
      email: `sub_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });
    // Add active subscription (30 days ahead)
    const futureEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Subscription.create({
      user_id: userOnlySub.id,
      plan_id: testPlan.id,
      start_date: new Date(),
      end_date: futureEnd,
      status: 'active'
    });

    userOnlyPurchased = await User.create({
      username: `reader_purchased_${timestamp}`,
      email: `purchased_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });
    // Add purchased story
    await StoryPurchase.create({
      user_id: userOnlyPurchased.id,
      story_id: testPaidStory.id,
      price_paid: testPaidStory.price,
      status: 'completed'
    });

    userBoth = await User.create({
      username: `reader_both_${timestamp}`,
      email: `both_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'reader'
    });
    // Add both active subscription AND purchased story
    await Subscription.create({
      user_id: userBoth.id,
      plan_id: testPlan.id,
      start_date: new Date(),
      end_date: futureEnd,
      status: 'active'
    });
    await StoryPurchase.create({
      user_id: userBoth.id,
      story_id: testPaidStory.id,
      price_paid: testPaidStory.price,
      status: 'completed'
    });

    adminUser = await User.create({
      username: `admin_tester_${timestamp}`,
      email: `admin_${timestamp}@test.marvel`,
      password: 'password123',
      role: 'admin'
    });

    console.log('✅ [Setup] Khởi tạo dữ liệu thành công!\n');

    // -------------------------------------------------------------
    // TEST CASES IMPLEMENTATION
    // -------------------------------------------------------------

    // CASE 1: Free Story Chapter -> Allowed for guest (user = null)
    try {
      const res = await evaluateReadAccess({ chapterId: freeChapter.id, user: null });
      assert.strictEqual(res.allowed, true, 'Case 1: Phải được đọc truyện Free');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.reason, 'free_story');
      console.log('✅ TEST CASE 1 PASS: Chương thuộc truyện Free -> Khách vãng lai (chưa đăng nhập) được đọc.');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 1 FAIL:', err.message);
      failedCount++;
    }

    // CASE 2: Preview Chapter of Paid Story -> Allowed for guest (user = null)
    try {
      const res = await evaluateReadAccess({ chapterId: previewChapter.id, user: null });
      assert.strictEqual(res.allowed, true, 'Case 2: Phải được đọc chương đọc thử');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.reason, 'preview');
      console.log('✅ TEST CASE 2 PASS: Chương có cờ is_preview = true -> Khách chưa đăng nhập được đọc thử.');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 2 FAIL:', err.message);
      failedCount++;
    }

    // CASE 3: VIP Chapter + Guest user (user = null) -> 401 Unauthorized
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: null });
      assert.strictEqual(res.allowed, false, 'Case 3: Khách không được đọc chương VIP');
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.code, 'UNAUTHORIZED');
      console.log('✅ TEST CASE 3 PASS: Chương VIP + Chưa đăng nhập -> Trả về HTTP 401 UNAUTHORIZED.');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 3 FAIL:', err.message);
      failedCount++;
    }

    // CASE 4: VIP Chapter + Logged-in user without sub and without purchase -> 403 Forbidden
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: userNoAccess });
      assert.strictEqual(res.allowed, false, 'Case 4: User không quyền phải bị chặn');
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.code, 'PAYMENT_REQUIRED');
      console.log('✅ TEST CASE 4 PASS: Chương VIP + Đã đăng nhập nhưng KHÔNG có gói & CHƯA mua -> Trả về 403 PAYMENT_REQUIRED.');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 4 FAIL:', err.message);
      failedCount++;
    }

    // CASE 5: VIP Chapter + Expired Subscription + No purchase -> 403 Forbidden
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: userExpiredSub });
      assert.strictEqual(res.allowed, false, 'Case 5: Gói hết hạn phải bị chặn');
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.code, 'PAYMENT_REQUIRED');
      console.log('✅ TEST CASE 5 PASS: Chương VIP + Gói hội viên ĐÃ HẾT HẠN -> Trả về 403 PAYMENT_REQUIRED.');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 5 FAIL:', err.message);
      failedCount++;
    }

    // CASE 6: VIP Chapter + ONLY Active Subscription -> 200 Allowed via subscription
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: userOnlySub });
      assert.strictEqual(res.allowed, true, 'Case 6: Có gói active phải được đọc');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.via, 'subscription');
      assert.ok(res.activeSubscription, 'Phải có thông tin subscription');
      console.log('✅ TEST CASE 6 PASS: Chương VIP + CHỈ CÓ Gói VIP còn hạn -> 200 Cho phép đọc qua gói (via: subscription).');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 6 FAIL:', err.message);
      failedCount++;
    }

    // CASE 7: VIP Chapter + ONLY Purchased Story -> 200 Allowed via purchase
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: userOnlyPurchased });
      assert.strictEqual(res.allowed, true, 'Case 7: Đã mua truyện phải được đọc');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.via, 'purchase');
      assert.ok(res.storyPurchase, 'Phải có thông tin purchase');
      console.log('✅ TEST CASE 7 PASS: Chương VIP + CHỈ ĐÃ MUA truyện này -> 200 Cho phép đọc qua mua lẻ (via: purchase).');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 7 FAIL:', err.message);
      failedCount++;
    }

    // CASE 8: VIP Chapter + BOTH Active Sub AND Purchased Story -> 200 Allowed (Anti-duplicate charge protection)
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: userBoth });
      assert.strictEqual(res.allowed, true, 'Case 8: Có cả 2 quyền phải được đọc');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.via, 'both');
      assert.strictEqual(res.no_duplicate_charge, true, 'Bắt buộc cờ no_duplicate_charge = true');
      console.log('✅ TEST CASE 8 PASS: Chương VIP + CÓ CẢ HAI ĐIỀU KIỆN (Gói VIP + Đã mua) -> 200 Allowed via "both", cờ no_duplicate_charge = true (CHỐNG THU PHÍ TRÙNG).');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 8 FAIL:', err.message);
      failedCount++;
    }

    // CASE 9: VIP Chapter + Admin user -> Always 200 Allowed
    try {
      const res = await evaluateReadAccess({ chapterId: vipChapter.id, user: adminUser });
      assert.strictEqual(res.allowed, true, 'Case 9: Admin luôn được đọc');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.reason, 'admin');
      console.log('✅ TEST CASE 9 PASS: Chương VIP + Người dùng là Admin -> 200 Toàn quyền đọc (reason: admin).');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 9 FAIL:', err.message);
      failedCount++;
    }

    // CASE 10: Express Middleware Execution Simulation (End-to-End HTTP context)
    try {
      // 10A: Blocked user through express middleware
      const ctxBlocked = createMockContext({ chapterId: vipChapter.id, user: userNoAccess });
      await checkReadAccess(ctxBlocked.req, ctxBlocked.res, ctxBlocked.next);
      const resBlocked = ctxBlocked.getResult();
      assert.strictEqual(resBlocked.statusCode, 403, 'Middleware phải trả 403');
      assert.strictEqual(resBlocked.nextCalled, false, 'Next không được gọi khi bị chặn');

      // 10B: Allowed user through express middleware
      const ctxAllowed = createMockContext({ chapterId: vipChapter.id, user: userBoth });
      await checkReadAccess(ctxAllowed.req, ctxAllowed.res, ctxAllowed.next);
      const resAllowed = ctxAllowed.getResult();
      assert.strictEqual(resAllowed.nextCalled, true, 'Next() phải được gọi khi đủ quyền');
      assert.strictEqual(ctxAllowed.req.readAccess.allowed, true);
      assert.strictEqual(ctxAllowed.req.readAccess.via, 'both');
      assert.strictEqual(ctxAllowed.req.readAccess.no_duplicate_charge, true);

      console.log('✅ TEST CASE 10 PASS: Mô phỏng Express Middleware (req, res, next) hoạt động chính xác 100% cho cả luồng chặn (403) và luồng duyệt (next()).');
      passedCount++;
    } catch (err) {
      console.error('❌ TEST CASE 10 FAIL:', err.message);
      failedCount++;
    }

  } catch (globalErr) {
    console.error('💥 Lỗi nghiêm trọng khi chạy test suite:', globalErr);
    failedCount++;
  } finally {
    // CLEANUP TEST FIXTURES
    console.log('\n🧹 [Cleanup] Dọn dẹp dữ liệu test...');
    try {
      if (userBoth) await userBoth.destroy();
      if (userOnlyPurchased) await userOnlyPurchased.destroy();
      if (userOnlySub) await userOnlySub.destroy();
      if (userExpiredSub) await userExpiredSub.destroy();
      if (userNoAccess) await userNoAccess.destroy();
      if (adminUser) await adminUser.destroy();

      if (previewChapter) await previewChapter.destroy();
      if (vipChapter) await vipChapter.destroy();
      if (freeChapter) await freeChapter.destroy();

      if (testPaidStory) await testPaidStory.destroy();
      if (testFreeStory) await testFreeStory.destroy();
      console.log('✅ [Cleanup] Đã dọn dẹp sạch sẽ!');
    } catch (cleanupErr) {
      console.warn('⚠️ Lỗi dọn dẹp:', cleanupErr.message);
    }

    console.log('\n================================================================');
    console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passedCount} PASSED / ${passedCount + failedCount} TOTAL`);
    if (failedCount === 0) {
      console.log('🎉 TẤT CẢ CÁC TEST CASES ĐÃ ĐẠT 100% TIÊU CHUẨN DEFINITION OF DONE!');
    } else {
      console.log(`❌ CÓ ${failedCount} TEST CASES BỊ LỖI.`);
      process.exit(1);
    }
    console.log('================================================================\n');
  }
}

// Execute if run directly
if (require.main === module) {
  runTestSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runTestSuite };
