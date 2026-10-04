'use strict';

const assert = require('assert');
const {
  sequelize,
  User,
  Story,
  Chapter,
  ReadingProgress,
  StoryFollow,
  Notification,
  Comment
} = require('../src/models');

async function runSprint4Tests() {
  console.log('\n================================================================');
  console.log('🧪 BẮT ĐẦU CHẠY UNIT TEST: Sprint 4 Features (Tiến Độ, Follow, Thông Báo, Bình Luận)');
  console.log('================================================================\n');

  let testUser, testStory, testChapter;

  try {
    // Setup
    console.log('📦 [Setup] Khởi tạo dữ liệu kiểm thử Sprint 4...');
    testUser = await User.create({
      username: `sprint4_user_${Date.now()}`,
      email: `sprint4_${Date.now()}@marvel.local`,
      password: 'Password123!',
      full_name: 'Người Đọc Sprint 4',
      role: 'reader'
    });

    testStory = await Story.create({
      title: `Truyện Sprint 4 Test ${Date.now()}`,
      slug: `truyen-sprint4-test-${Date.now()}`,
      access_policy: 'paid',
      price: 29000,
      status: 'ongoing'
    });

    testChapter = await Chapter.create({
      story_id: testStory.id,
      chapter_number: 1,
      title: 'Hồi 1: Khởi Đầu Mới',
      is_preview: false
    });
    console.log('✅ [Setup] Tạo dữ liệu test thành công.\n');

    // TEST 1: Ghi nhận và cập nhật tiến độ đọc (Auto-Resume)
    console.log('🧪 TEST 1: Lưu & Cập nhật tiến độ đọc (ReadingProgress)...');
    const [prog1, created1] = await ReadingProgress.findOrCreate({
      where: { user_id: testUser.id, story_id: testStory.id },
      defaults: {
        user_id: testUser.id,
        story_id: testStory.id,
        chapter_id: testChapter.id,
        scroll_y: 850,
        progress_percent: 42.50
      }
    });
    assert.strictEqual(created1, true, 'ReadingProgress phải được tạo mới lần đầu');
    assert.strictEqual(Number(prog1.progress_percent), 42.50, 'Tiến độ đọc ban đầu phải là 42.50%');

    // Cập nhật tiếp khi đọc đến 85%
    await prog1.update({
      scroll_y: 1700,
      progress_percent: 85.00
    });
    const updatedProg = await ReadingProgress.findOne({
      where: { user_id: testUser.id, story_id: testStory.id }
    });
    assert.strictEqual(Number(updatedProg.progress_percent), 85.00, 'Tiến độ sau cập nhật phải là 85%');
    assert.strictEqual(updatedProg.scroll_y, 1700, 'Vị trí cuộn scroll_y phải được ghi nhớ chính xác');
    console.log('✅ TEST 1 PASS: Tiến độ đọc lưu và khôi phục chính xác (85%, scroll 1700px).\n');

    // TEST 2: Theo dõi truyện (StoryFollow)
    console.log('🧪 TEST 2: Bật / Tắt theo dõi truyện (StoryFollow)...');
    const follow1 = await StoryFollow.create({
      user_id: testUser.id,
      story_id: testStory.id
    });
    assert.ok(follow1.id, 'Phải tạo thành công bản ghi theo dõi');

    const count1 = await StoryFollow.count({ where: { story_id: testStory.id } });
    assert.strictEqual(count1, 1, 'Số lượng người theo dõi phải là 1');

    await follow1.destroy();
    const count2 = await StoryFollow.count({ where: { story_id: testStory.id } });
    assert.strictEqual(count2, 0, 'Sau khi hủy theo dõi, số lượng follower phải về 0');
    console.log('✅ TEST 2 PASS: Chức năng theo dõi và hủy theo dõi hoạt động chuẩn xác.\n');

    // TEST 3: Thông báo chương mới (Notification)
    console.log('🧪 TEST 3: Tạo và đánh dấu đọc thông báo (Notification)...');
    const notif = await Notification.create({
      user_id: testUser.id,
      title: `Chương mới: ${testStory.title}`,
      message: 'Chương 2: Cuộc Đụng Độ đã ra mắt!',
      type: 'new_chapter',
      link_url: `/stories/${testStory.id}/chapters/${testChapter.id}`,
      is_read: false
    });
    assert.strictEqual(notif.is_read, false, 'Thông báo mới tạo phải có is_read = false');

    const unreadBefore = await Notification.count({ where: { user_id: testUser.id, is_read: false } });
    assert.strictEqual(unreadBefore, 1, 'Số thông báo chưa đọc phải là 1');

    await notif.update({ is_read: true });
    const unreadAfter = await Notification.count({ where: { user_id: testUser.id, is_read: false } });
    assert.strictEqual(unreadAfter, 0, 'Sau khi đọc, số thông báo chưa đọc phải là 0');
    console.log('✅ TEST 3 PASS: Thông báo tạo mới và đánh dấu đã đọc hoạt động chuẩn xác.\n');

    // TEST 4: Bình luận chương & Thích bình luận (Comment)
    console.log('🧪 TEST 4: Đăng bình luận & Thích bình luận (Comment & Like)...');
    const comment = await Comment.create({
      user_id: testUser.id,
      story_id: testStory.id,
      chapter_id: testChapter.id,
      content: 'Chương này vẽ đỉnh cao quá Marvel ơi!',
      status: 'approved',
      likes_count: 0
    });
    assert.strictEqual(comment.status, 'approved', 'Bình luận mặc định phải ở trạng thái approved');
    assert.strictEqual(comment.likes_count, 0, 'Lượt like ban đầu là 0');

    await comment.increment('likes_count', { by: 1 });
    await comment.reload();
    assert.strictEqual(comment.likes_count, 1, 'Lượt like sau khi bấm phải tăng lên 1');
    console.log('✅ TEST 4 PASS: Đăng bình luận và tăng lượt thích thành công.\n');

    // TEST 5: Báo cáo vi phạm & Kiểm duyệt Admin (Report & Moderate)
    console.log('🧪 TEST 5: Báo cáo vi phạm & Admin xử lý bình luận (Moderation)...');
    await comment.update({
      is_reported: true,
      report_reason: 'Spam đường link độc hại'
    });
    assert.strictEqual(comment.is_reported, true, 'Bình luận phải được cắm cờ vi phạm');

    // Admin ẩn bình luận vi phạm
    await comment.update({ status: 'hidden' });
    assert.strictEqual(comment.status, 'hidden', 'Admin phải ẩn được bình luận vi phạm');

    // Khách đọc bình thường chỉ lấy bình luận approved -> bình luận hidden sẽ không hiển thị
    const publicComments = await Comment.findAll({
      where: { chapter_id: testChapter.id, status: 'approved' }
    });
    assert.strictEqual(publicComments.length, 0, 'Bình luận bị ẩn không được xuất hiện ở danh sách công khai');
    console.log('✅ TEST 5 PASS: Báo cáo vi phạm và ẩn bình luận hoạt động chính xác 100%.\n');

    console.log('================================================================');
    console.log('🎉 TẤT CẢ 5/5 TEST CASES SPRINT 4 ĐÃ ĐẠT 100% ĐỊNH NGHĨA HOÀN THÀNH (DoD)!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 [Cleanup] Dọn dẹp dữ liệu test Sprint 4...');
    try {
      if (testUser) {
        await ReadingProgress.destroy({ where: { user_id: testUser.id } });
        await StoryFollow.destroy({ where: { user_id: testUser.id } });
        await Notification.destroy({ where: { user_id: testUser.id } });
        await Comment.destroy({ where: { user_id: testUser.id } });
        await testUser.destroy();
      }
      if (testStory) {
        await Chapter.destroy({ where: { story_id: testStory.id } });
        await testStory.destroy();
      }
    } catch (e) {
      console.error('Error in cleanup:', e);
    }
    console.log('✅ [Cleanup] Hoàn tất dọn dẹp!\n');
  }
}

runSprint4Tests();
