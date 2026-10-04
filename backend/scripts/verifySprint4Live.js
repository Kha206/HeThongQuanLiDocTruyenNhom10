'use strict';

const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function runE2E() {
  console.log('\n================================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP TOÀN DIỆN SPRINT 4 (LIVE SERVER HTTP:5000)');
  console.log('================================================================\n');

  try {
    // 1. Đăng nhập Reader
    console.log('1️⃣ Đăng nhập tài khoản Độc giả...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      loginId: 'reader_vip@marvel.com',
      password: 'Marvel123!'
    });
    assert.strictEqual(loginRes.data.success, true);
    const readerToken = loginRes.data.token;
    const readerUser = loginRes.data.user;
    const readerHeader = { headers: { Authorization: `Bearer ${readerToken}` } };
    console.log(`✅ Đăng nhập thành công: ${readerUser.full_name} (${readerUser.email})`);

    // Lấy 1 Story & Chapter thật
    const storiesRes = await axios.get(`${API_BASE}/stories?limit=5`);
    assert.strictEqual(storiesRes.data.success, true);
    const story = storiesRes.data.stories[0];
    const storyDetailRes = await axios.get(`${API_BASE}/stories/${story.id}`);
    const chapters = storyDetailRes.data.story.chapters;
    const chapter1 = chapters[0];
    const chapterVip = chapters.find(c => !c.is_preview) || chapters[1];
    console.log(`📖 Truyện thử nghiệm: "${story.title}" (ID: ${story.id}), Chapter 1: ID ${chapter1.id}, Chapter VIP: ID ${chapterVip.id}`);

    // 2. Test Theo Dõi Truyện (US-35, US-36)
    console.log('\n2️⃣ Kiểm tra Chức năng Theo Dõi Truyện (Follow / Unfollow)...');
    // Follow
    const followRes = await axios.post(`${API_BASE}/stories/${story.id}/follow`, {}, readerHeader);
    console.log(`   Kết quả toggle follow: is_following = ${followRes.data.is_following}, count = ${followRes.data.followers_count}`);
    // Status check
    const statusRes = await axios.get(`${API_BASE}/stories/${story.id}/follow-status`, readerHeader);
    assert.strictEqual(statusRes.data.is_following, followRes.data.is_following);
    // Đảm bảo user đang follow để test nhận thông báo chương mới ở bước sau
    if (!followRes.data.is_following) {
      await axios.post(`${API_BASE}/stories/${story.id}/follow`, {}, readerHeader);
    }
    console.log(`✅ Theo dõi truyện hoạt động chính xác! Người dùng đã follow "${story.title}".`);

    // 3. Test Ghi Nhận & Khôi Phục Tiến Độ Đọc (Auto-Resume)
    console.log('\n3️⃣ Kiểm tra Ghi nhận & Tiếp tục tiến độ đọc (Reading Progress)...');
    const saveProgRes = await axios.post(`${API_BASE}/reading-progress`, {
      story_id: story.id,
      chapter_id: chapter1.id,
      scroll_y: 1250,
      progress_percent: 68.50
    }, readerHeader);
    assert.strictEqual(saveProgRes.data.success, true);
    assert.strictEqual(Number(saveProgRes.data.progress.progress_percent), 68.50);

    // Truy vấn tiến độ của truyện này
    const getProgRes = await axios.get(`${API_BASE}/reading-progress/${story.id}`, readerHeader);
    assert.strictEqual(getProgRes.data.success, true);
    assert.strictEqual(getProgRes.data.progress.scroll_y, 1250);
    console.log(`✅ Tiến độ đọc được lưu và khôi phục chuẩn xác: Chương ${getProgRes.data.progress.chapter.chapter_number} ở mức 68.5%, vị trí cuộn 1250px.`);

    // Lấy danh sách truyện đang đọc
    const allProgRes = await axios.get(`${API_BASE}/reading-progress`, readerHeader);
    assert.strictEqual(allProgRes.data.success, true);
    assert.ok(allProgRes.data.history.length > 0);
    console.log(`✅ Danh sách truyện đang đọc trả về ${allProgRes.data.history.length} truyện với đầy đủ progress bar.`);

    // 4. Test Mua Truyện Lẻ & Kích Hoạt Bản Quyền (US-30, US-26)
    console.log('\n4️⃣ Kiểm tra Luồng Mua Truyện Một Lần & Cổng Sandbox...');
    // Tạo checkout mua truyện
    try {
      const checkoutRes = await axios.post(`${API_BASE}/payments/checkout`, {
        payment_type: 'story_purchase',
        item_id: story.id,
        payment_method: 'vnpay'
      }, readerHeader);
      console.log(`   Khởi tạo đơn hàng mã: ${checkoutRes.data.data.transactionCode}, Số tiền: ${checkoutRes.data.data.amount} VNĐ`);

      // Xử lý thanh toán thành công qua Sandbox
      const payRes = await axios.post(`${API_BASE}/payments/process-sandbox`, {
        transaction_code: checkoutRes.data.data.transactionCode,
        simulate_failure: false
      }, readerHeader);
      assert.strictEqual(payRes.data.success, true);
      console.log(`✅ Thanh toán Sandbox thành công! Bản quyền truyện đã kích hoạt.`);
    } catch (e) {
      if (e.response?.data?.message?.includes('đã sở hữu')) {
        console.log(`ℹ️ Người dùng đã sở hữu truyện này từ trước, bản quyền đã kích hoạt.`);
      } else {
        throw e;
      }
    }

    // Kiểm tra quyền đọc chương VIP qua middleware checkReadAccess
    const accessVipRes = await axios.get(`${API_BASE}/chapters/${chapterVip.id}`, readerHeader);
    assert.strictEqual(accessVipRes.status, 200);
    console.log(`✅ Middleware checkReadAccess cho phép đọc chương VIP: reason = "${accessVipRes.data.read_access.reason}", via = "${accessVipRes.data.read_access.via}"`);

    // 5. Test Lịch Sử Giao Dịch (US-32)
    console.log('\n5️⃣ Kiểm tra Lịch Sử Giao Dịch & Thanh Toán...');
    const transRes = await axios.get(`${API_BASE}/payments/my-transactions`, readerHeader);
    assert.strictEqual(transRes.data.success, true);
    assert.ok(transRes.data.transactions.length > 0);
    const latestTx = transRes.data.transactions[0];
    console.log(`✅ Lịch sử giao dịch: ${transRes.data.transactions.length} đơn. Giao dịch gần nhất: Mã ${latestTx.transaction_code}, Trạng thái: ${latestTx.status}, Sản phẩm: "${latestTx.item_title}"`);

    // 6. Test Bình Luận, Thích & Báo Cáo Vi Phạm (US-37, US-38)
    console.log('\n6️⃣ Kiểm tra Bình Luận Theo Chương & Báo Cáo Vi Phạm...');
    const commentRes = await axios.post(`${API_BASE}/chapters/${chapter1.id}/comments`, {
      content: 'Chương truyện này nét vẽ Marvel quá mãn nhãn, mong chờ hồi tiếp theo!'
    }, readerHeader);
    assert.strictEqual(commentRes.data.success, true);
    const newCommentId = commentRes.data.comment.id;
    console.log(`   Đã đăng bình luận ID: ${newCommentId} bởi ${commentRes.data.comment.user.full_name}`);

    // Thích bình luận
    const likeRes = await axios.post(`${API_BASE}/comments/${newCommentId}/like`, {});
    assert.strictEqual(likeRes.data.success, true);
    assert.strictEqual(likeRes.data.likes_count, 1);
    console.log(`   Đã thích bình luận thành công (likes: ${likeRes.data.likes_count})`);

    // Báo cáo vi phạm
    const reportRes = await axios.post(`${API_BASE}/comments/${newCommentId}/report`, {
      reason: 'Spam liên kết ngoài độc hại'
    }, readerHeader);
    assert.strictEqual(reportRes.data.success, true);
    console.log(`✅ Đã gửi báo cáo vi phạm bình luận thành công!`);

    // 7. Đăng nhập Admin & Kiểm Duyệt Bình Luận (US-10)
    console.log('\n7️⃣ Đăng nhập Admin & Kiểm Duyệt Bình Luận Vi Phạm...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      loginId: 'admin@marvel.local',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Admin lấy danh sách báo cáo
    const adminCommentsRes = await axios.get(`${API_BASE}/admin/comments?filter=reported`, adminHeader);
    assert.strictEqual(adminCommentsRes.data.success, true);
    const reportedFound = adminCommentsRes.data.comments.find(c => c.id === newCommentId);
    assert.ok(reportedFound, 'Bình luận bị báo cáo phải xuất hiện trong trang quản trị');
    console.log(`   Admin phát hiện bình luận vi phạm: "${reportedFound.content}" - Lý do: "${reportedFound.report_reason}"`);

    // Admin ẩn bình luận
    const hideRes = await axios.patch(`${API_BASE}/admin/comments/${newCommentId}/status`, {
      status: 'hidden'
    }, adminHeader);
    assert.strictEqual(hideRes.data.success, true);
    console.log(`   Admin đã ẩn bình luận vi phạm thành công.`);

    // Xác nhận độc giả không thấy bình luận bị ẩn nữa
    const publicCommentsRes = await axios.get(`${API_BASE}/chapters/${chapter1.id}/comments`);
    const isStillVisible = publicCommentsRes.data.comments.some(c => c.id === newCommentId);
    assert.strictEqual(isStillVisible, false, 'Bình luận bị ẩn không được xuất hiện ở danh sách công khai');
    console.log(`✅ Bình luận vi phạm đã bị loại bỏ khỏi danh sách công khai của chương truyện!`);

    // 8. Admin xuất bản chương mới -> Follower nhận thông báo (Notification & Socket)
    console.log('\n8️⃣ Admin xuất bản chương mới -> Kiểm tra Thông Báo Tới Follower...');
    const newChapNum = Math.floor(Date.now() / 1000) % 1000;
    const addChapRes = await axios.post(`${API_BASE}/admin/chapters`, {
      story_id: story.id,
      chapter_number: newChapNum,
      title: `Chương Thử Nghiệm Thông Báo #${newChapNum}`,
      is_preview: false
    }, adminHeader);
    assert.strictEqual(addChapRes.data.success, true);
    const newlyAddedChapter = addChapRes.data.chapter;
    console.log(`   Admin đã xuất bản chương mới: ID ${newlyAddedChapter.id}, Chapter #${newChapNum}`);

    // Reader kiểm tra thông báo
    const notifsRes = await axios.get(`${API_BASE}/notifications`, readerHeader);
    assert.strictEqual(notifsRes.data.success, true);
    const foundNotif = notifsRes.data.notifications.find(n => n.message?.includes(newlyAddedChapter.title));
    assert.ok(foundNotif, 'Người theo dõi phải nhận được thông báo về chương mới');
    console.log(`✅ Người theo dõi nhận thông báo tức thời: "${foundNotif.title}" - "${foundNotif.message}"`);

    // Đánh dấu đã đọc
    const readNotifRes = await axios.patch(`${API_BASE}/notifications/${foundNotif.id}/read`, {}, readerHeader);
    assert.strictEqual(readNotifRes.data.success, true);
    console.log(`✅ Đã đánh dấu thông báo đã đọc thành công.`);

    // Cleanup: Xóa chương test và bình luận test
    await axios.delete(`${API_BASE}/admin/chapters/${newlyAddedChapter.id}`, adminHeader);
    await axios.delete(`${API_BASE}/admin/comments/${newCommentId}`, adminHeader);

    console.log('\n================================================================');
    console.log('🎉 100% CÁC TIÊU CHÍ DEFINITION OF DONE CỦA SPRINT 4 ĐÃ ĐẠT ĐỐI VỚI LIVE SERVER!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ LIVE:', err.response?.data || err.message);
    process.exit(1);
  }
}

runE2E();
