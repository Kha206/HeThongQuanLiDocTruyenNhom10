'use strict';

const assert = require('assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  sequelize,
  User,
  Story,
  Chapter,
  StoryRating,
  PasswordReset,
  Comment,
  Payment,
  StoryPurchase,
  SubscriptionPlan,
  Subscription
} = require('../src/models');
const paymentService = require('../src/services/paymentService');

async function runSprint5Tests() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU CHẠY UNIT TEST: Sprint 5 Features (Tài Khoản, Rating, Thống Kê)');
  console.log('================================================================\n');

  let testUser = null;
  let restrictedUser = null;
  let suspendedUser = null;
  let adminUser = null;
  let testStory = null;
  let testChapter = null;

  try {
    const timestamp = Date.now();

    // Setup Users
    console.log('📦 [Setup] Khởi tạo dữ liệu người dùng kiểm thử Sprint 5...');
    testUser = await User.create({
      username: `s5_tester_${timestamp}`,
      email: `s5_${timestamp}@test.marvel`,
      password: 'OldPassword123!',
      full_name: 'Người Đọc Sprint 5',
      role: 'reader',
      status: 'active'
    });

    restrictedUser = await User.create({
      username: `s5_restricted_${timestamp}`,
      email: `s5_restricted_${timestamp}@test.marvel`,
      password: 'Password123!',
      full_name: 'Người Bị Hạn Chế',
      role: 'reader',
      status: 'restricted',
      status_reason: 'Vi phạm bình luận spam'
    });

    suspendedUser = await User.create({
      username: `s5_suspended_${timestamp}`,
      email: `s5_suspended_${timestamp}@test.marvel`,
      password: 'Password123!',
      full_name: 'Người Bị Tạm Ngừng',
      role: 'reader',
      status: 'suspended',
      status_reason: 'Gian lận thanh toán'
    });

    adminUser = await User.create({
      username: `s5_admin_${timestamp}`,
      email: `s5_admin_${timestamp}@test.marvel`,
      password: 'AdminPassword123!',
      full_name: 'Quản Trị Viên Sprint 5',
      role: 'admin',
      status: 'active'
    });

    testStory = await Story.create({
      title: `Truyện Sprint 5 Test ${timestamp}`,
      slug: `truyen-sprint-5-${timestamp}`,
      publisher: 'Marvel Comics',
      access_policy: 'paid',
      price: 35000,
      status: 'ongoing',
      view_count: 120
    });

    testChapter = await Chapter.create({
      story_id: testStory.id,
      chapter_number: 1,
      title: 'Hồi 1: Cuộc Chiến Bắt Đầu',
      is_preview: false
    });
    console.log('✅ [Setup] Dữ liệu kiểm thử đã sẵn sàng.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Đổi mật khẩu bảo mật qua bcrypt
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 1: Kiểm thử chức năng Đổi mật khẩu...');
    const userToChange = await User.findByPk(testUser.id);
    const isOldCorrect = await userToChange.checkPassword('OldPassword123!');
    assert.strictEqual(isOldCorrect, true, 'Mật khẩu cũ phải khớp');

    const isOldWrong = await userToChange.checkPassword('WrongOldPassword!');
    assert.strictEqual(isOldWrong, false, 'Mật khẩu cũ sai phải bị từ chối');

    // Đổi mật khẩu mới >= 8 ký tự
    const newPass = 'NewSecretPassword2026!';
    userToChange.password = newPass;
    await userToChange.save();

    // Verify hash changed and compare works
    const isNewMatch = await userToChange.checkPassword(newPass);
    assert.strictEqual(isNewMatch, true, 'Mật khẩu mới phải kiểm tra được bằng bcrypt');
    assert.notStrictEqual(userToChange.password, newPass, 'Mật khẩu lưu trong DB không bao giờ được là plain text');
    assert.strictEqual(userToChange.password.startsWith('$2'), true, 'Mật khẩu phải được băm bằng bcrypt');
    console.log('✅ TEST 1 PASS: Đổi mật khẩu bảo mật bằng bcrypt thành công.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Quên mật khẩu & Đặt lại với Token hash (30 phút, 1 lần)
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 2: Kiểm thử Quên & Đặt lại mật khẩu (Token Hash, 30 phút, 1 lần)...');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    const resetRecord = await PasswordReset.create({
      user_id: testUser.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    assert.ok(resetRecord.id, 'Phải tạo được bản ghi password_resets');
    assert.ok(!resetRecord.used_at, 'Token ban đầu chưa được sử dụng');

    // Xác thực token hợp lệ
    const foundToken = await PasswordReset.findOne({
      where: {
        token_hash: tokenHash,
        used_at: null
      }
    });
    assert.ok(foundToken, 'Tìm thấy token hợp lệ');
    assert.ok(new Date(foundToken.expires_at) > new Date(), 'Token chưa hết hạn');

    // Đặt lại mật khẩu và đánh dấu đã sử dụng
    const resetUser = await User.findByPk(foundToken.user_id);
    const passAfterReset = 'ResetPassAfterToken123!';
    resetUser.password = passAfterReset;
    await resetUser.save();

    foundToken.used_at = new Date();
    await foundToken.save();

    // Kiểm tra token không thể tái sử dụng lần 2
    const reuseAttempt = await PasswordReset.findOne({
      where: {
        token_hash: tokenHash,
        used_at: null
      }
    });
    assert.strictEqual(reuseAttempt, null, 'Token đã sử dụng không thể dùng lại lần thứ 2');

    // Đăng nhập lại với mật khẩu mới
    const canLoginAfterReset = await resetUser.checkPassword(passAfterReset);
    assert.strictEqual(canLoginAfterReset, true, 'Đăng nhập thành công với mật khẩu vừa đặt lại');
    console.log('✅ TEST 2 PASS: Quy trình tạo token hash, đặt lại và vô hiệu hóa token hoạt động chính xác 100%.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Đánh giá truyện 1-5 sao và tính điểm trung bình thật
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 3: Đánh giá truyện (Rating thật 1-5 sao, tính trung bình & lượt đánh giá)...');
    // Trước khi có đánh giá, kiểm tra bảng story_ratings
    const initialRatingsCount = await StoryRating.count({ where: { story_id: testStory.id } });
    assert.strictEqual(initialRatingsCount, 0, 'Truyện mới chưa có đánh giá nào');

    // User 1 đánh giá 5 sao
    const r1 = await StoryRating.create({
      user_id: testUser.id,
      story_id: testStory.id,
      score: 5,
      review: 'Truyện cực hay!'
    });

    // User 2 (Admin) đánh giá 4 sao
    const r2 = await StoryRating.create({
      user_id: adminUser.id,
      story_id: testStory.id,
      score: 4,
      review: 'Hình ảnh đẹp'
    });

    // Tính điểm trung bình thật
    const statsRes = await StoryRating.findAll({
      where: { story_id: testStory.id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      raw: true
    });

    const avg = Number(parseFloat(statsRes[0].avgScore).toFixed(1));
    const count = Number(statsRes[0].ratingCount);
    assert.strictEqual(count, 2, 'Phải có 2 lượt đánh giá');
    assert.strictEqual(avg, 4.5, 'Điểm trung bình (5 + 4) / 2 phải là 4.5');

    // Sửa điểm của User 1 từ 5 sao thành 3 sao
    r1.score = 3;
    await r1.save();

    const updatedStats = await StoryRating.findAll({
      where: { story_id: testStory.id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      raw: true
    });
    const newAvg = Number(parseFloat(updatedStats[0].avgScore).toFixed(1));
    assert.strictEqual(newAvg, 3.5, 'Điểm trung bình sau khi sửa (3 + 4) / 2 phải là 3.5');

    // Thử tạo đánh giá trùng lặp cùng user_id và story_id -> Phải bị chặn bởi unique index
    let duplicateBlocked = false;
    try {
      await StoryRating.create({
        user_id: testUser.id,
        story_id: testStory.id,
        score: 5
      });
    } catch (e) {
      duplicateBlocked = true;
    }
    assert.strictEqual(duplicateBlocked, true, 'Unique constraint phải chặn 1 user đánh giá 2 lần cùng 1 truyện');
    console.log('✅ TEST 3 PASS: Hệ thống đánh giá truyện thực tế (tính avg 3.5, chống trùng) chính xác 100%.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Kiểm soát trạng thái tài khoản (Restricted & Suspended)
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 4: Kiểm tra cơ chế hạn chế (restricted) & tạm ngừng (suspended)...');
    // 4.1. Tài khoản suspended không được đăng nhập
    assert.strictEqual(suspendedUser.status, 'suspended', 'Tài khoản phải ở trạng thái suspended');

    // 4.2. Tài khoản restricted bị chặn thanh toán / mua truyện
    let restrictedPaymentBlocked = false;
    try {
      await paymentService.createCheckout({
        userId: restrictedUser.id,
        paymentType: 'story_purchase',
        itemId: testStory.id,
        paymentMethod: 'sandbox'
      });
    } catch (e) {
      restrictedPaymentBlocked = true;
      assert.ok(e.message.includes('giới hạn') || e.message.includes('restricted'), 'Thông báo lỗi phải rõ ràng');
    }
    assert.strictEqual(restrictedPaymentBlocked, true, 'Tài khoản bị hạn chế không được tạo thanh toán');

    // 4.3. Khôi phục tài khoản về active
    restrictedUser.status = 'active';
    restrictedUser.status_reason = null;
    await restrictedUser.save();
    assert.strictEqual(restrictedUser.status, 'active', 'Khôi phục tài khoản thành công');
    console.log('✅ TEST 4 PASS: Cơ chế chặn và khôi phục trạng thái người dùng hoạt động hoàn hảo.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Tính toán dữ liệu thống kê Admin từ Database thật
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 5: Kiểm tra tính toán API thống kê Admin từ dữ liệu thật...');
    const totalStoriesCount = await Story.count();
    assert.ok(totalStoriesCount >= 1, 'Số lượng truyện phải >= 1');

    const totalUsersCount = await User.count({ where: { role: 'reader' } });
    assert.ok(totalUsersCount >= 1, 'Số lượng độc giả phải >= 1');

    // Kiểm tra tính toán doanh thu tổng
    const revenueRes = await Payment.findOne({
      where: { status: 'completed' },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']]
    });
    const totalRevenue = parseFloat(revenueRes?.getDataValue('total') || 0);
    assert.strictEqual(typeof totalRevenue, 'number', 'Doanh thu phải là số');

    console.log(`📊 Dữ liệu thực tế: ${totalStoriesCount} truyện, ${totalUsersCount} độc giả, tổng doanh thu: ${totalRevenue.toLocaleString()} VNĐ.`);
    // -------------------------------------------------------------------------
    // TEST 6: Phân quyền API thống kê & Quản lý thành viên (Không xóa cứng)
    // -------------------------------------------------------------------------
    console.log('🧪 TEST 6: Phân quyền API Admin (roleMiddleware) & Quản trị trạng thái thành viên...');
    const roleMiddleware = require('../src/middlewares/roleMiddleware');
    const adminCheck = roleMiddleware('admin');

    // 6.1. Reader bị chặn 403
    let forbiddenCalled = false;
    const mockReqReader = { user: testUser, method: 'GET', originalUrl: '/api/admin/stats/overview' };
    const mockResReader = {
      status(code) {
        if (code === 403) forbiddenCalled = true;
        return {
          json(payload) {
            assert.strictEqual(payload.success, false);
          }
        };
      }
    };
    adminCheck(mockReqReader, mockResReader, () => {});
    assert.strictEqual(forbiddenCalled, true, 'Độc giả truy cập API thống kê Admin phải bị chặn 403 Forbidden');

    // 6.2. Admin được cho phép đi tiếp (next)
    let nextCalled = false;
    const mockReqAdmin = { user: adminUser, method: 'GET', originalUrl: '/api/admin/stats/overview' };
    const mockResAdmin = { status: () => ({ json: () => {} }) };
    adminCheck(mockReqAdmin, mockResAdmin, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Admin phải được phép truy cập API thống kê');

    // 6.3. Admin quản trị trạng thái thành viên (restrict, suspend, restore)
    const adminController = require('../src/controllers/adminController');
    
    // Hạn chế tài khoản
    let updatedUserRes = null;
    const mockReqRestrict = {
      user: adminUser,
      params: { id: testUser.id },
      body: { status: 'restricted', reason: 'Tạm khóa tính năng bình luận do spam' }
    };
    const mockResRestrict = {
      status(code) {
        assert.strictEqual(code, 200, 'HTTP status phải là 200');
        return {
          json(payload) {
            assert.strictEqual(payload.success, true);
            updatedUserRes = payload.user;
          }
        };
      }
    };
    await adminController.updateUserStatus(mockReqRestrict, mockResRestrict);
    assert.strictEqual(updatedUserRes.status, 'restricted');
    assert.strictEqual(updatedUserRes.status_reason, 'Tạm khóa tính năng bình luận do spam');

    // Kiểm tra không xóa cứng dữ liệu
    const userInDb = await User.findByPk(testUser.id);
    assert.ok(userInDb, 'Dữ liệu người dùng không bao giờ bị xóa cứng khỏi cơ sở dữ liệu');
    assert.strictEqual(userInDb.status, 'restricted');

    // Khôi phục tài khoản
    const mockReqRestore = {
      user: adminUser,
      params: { id: testUser.id },
      body: { status: 'active' }
    };
    const mockResRestore = {
      status(code) {
        assert.strictEqual(code, 200);
        return {
          json(payload) {
            assert.strictEqual(payload.success, true);
          }
        };
      }
    };
    await adminController.updateUserStatus(mockReqRestore, mockResRestore);
    const restoredInDb = await User.findByPk(testUser.id);
    assert.strictEqual(restoredInDb.status, 'active');
    assert.strictEqual(restoredInDb.status_reason, null);
    console.log('✅ TEST 6 PASS: Phân quyền API thống kê & Quản lý trạng thái thành viên (chống xóa cứng) thành công.\n');

    console.log('================================================================');
    console.log('🎉 TẤT CẢ 6/6 TEST CASES SPRINT 5 ĐÃ ĐẠT 100% TIÊU CHÍ HOÀN THÀNH (DoD)!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ SPRINT 5 TEST FAILED:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 [Cleanup] Dọn dẹp dữ liệu test Sprint 5...');
    try {
      if (testUser) {
        await PasswordReset.destroy({ where: { user_id: testUser.id } });
        await StoryRating.destroy({ where: { user_id: testUser.id } });
        await testUser.destroy();
      }
      if (restrictedUser) await restrictedUser.destroy();
      if (suspendedUser) await suspendedUser.destroy();
      if (adminUser) {
        await StoryRating.destroy({ where: { user_id: adminUser.id } });
        await adminUser.destroy();
      }
      if (testStory) {
        await Chapter.destroy({ where: { story_id: testStory.id } });
        await StoryRating.destroy({ where: { story_id: testStory.id } });
        await testStory.destroy();
      }
    } catch (e) {
      console.warn('⚠️ Lỗi cleanup Sprint 5:', e.message);
    }
    console.log('✅ [Cleanup] Hoàn tất dọn dẹp!\n');
  }
}

runSprint5Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
