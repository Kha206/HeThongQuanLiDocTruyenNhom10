'use strict';

const axios = require('axios');
const assert = require('assert');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';

async function runVerification() {
  console.log('================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ XÁC MINH: VẤN ĐỀ 1 & VẤN ĐỀ 2');
  console.log('================================================================\n');

  // 1. Đăng nhập Admin
  console.log('1️⃣ Đăng nhập tài khoản Quản Trị Viên (Admin)...');
  const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    loginId: 'admin@marvel.local',
    password: 'admin123'
  });
  assert.strictEqual(adminLoginRes.data.success, true);
  const adminToken = adminLoginRes.data.token;
  const adminHeader = { headers: { Authorization: `Bearer ${adminToken}` } };
  console.log(`✅ Admin đăng nhập thành công: ${adminLoginRes.data.user.full_name} (${adminLoginRes.data.user.role})`);

  // 2. Đăng nhập Thành viên (Reader)
  console.log('\n2️⃣ Đăng nhập tài khoản Độc Giả (Reader)...');
  const readerLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    loginId: 'reader_vip@marvel.com',
    password: 'Marvel123!'
  });
  assert.strictEqual(readerLoginRes.data.success, true);
  const readerToken = readerLoginRes.data.token;
  const readerHeader = { headers: { Authorization: `Bearer ${readerToken}` } };
  console.log(`✅ Reader đăng nhập thành công: ${readerLoginRes.data.user.full_name}`);

  // ===========================================================================
  // KIỂM THỬ VẤN ĐỀ 1: ẨN / XÓA BÌNH LUẬN VI PHẠM
  // ===========================================================================
  console.log('\n----------------------------------------------------------------');
  console.log('🛡️ KIỂM THỬ VẤN ĐỀ 1: ADMIN ẨN & XÓA BÌNH LUẬN VI PHẠM');
  console.log('----------------------------------------------------------------');

  const testChapterId = 108; // Chapter 1 of The Amazing Spider-Man
  const uniqueContent = `Bình luận kiểm thử ẩn/xóa tự động [${Date.now()}]`;

  // Reader đăng bình luận mới
  console.log(`-> Độc giả đăng bình luận lên Chương ID ${testChapterId}...`);
  const postCommentRes = await axios.post(`${API_BASE}/chapters/${testChapterId}/comments`, {
    content: uniqueContent
  }, readerHeader);
  assert.strictEqual(postCommentRes.data.success, true);
  const testComment = postCommentRes.data.comment;
  console.log(`✅ Bình luận tạo thành công với ID: ${testComment.id}`);

  // Xác nhận bình luận xuất hiện công khai
  const publicBefore = await axios.get(`${API_BASE}/chapters/${testChapterId}/comments`);
  const isVisibleBefore = publicBefore.data.comments.some(c => c.id === testComment.id);
  assert.strictEqual(isVisibleBefore, true, 'Bình luận vừa đăng phải hiển thị công khai');
  console.log('✅ Bình luận đang hiển thị công khai bình thường.');

  // Admin ẩn bình luận qua endpoint PATCH /api/admin/comments/:id/hide
  console.log(`-> Admin gọi PATCH /api/admin/comments/${testComment.id}/hide...`);
  const hideRes = await axios.patch(`${API_BASE}/admin/comments/${testComment.id}/hide`, {}, adminHeader);
  assert.strictEqual(hideRes.data.success, true);
  console.log(`✅ API ẩn phản hồi thành công: "${hideRes.data.message}"`);

  // Xác nhận bình luận bị ẩn KHÔNG còn xuất hiện ở danh sách công khai
  const publicAfterHide = await axios.get(`${API_BASE}/chapters/${testChapterId}/comments`);
  const isVisibleAfterHide = publicAfterHide.data.comments.some(c => c.id === testComment.id);
  assert.strictEqual(isVisibleAfterHide, false, 'Bình luận bị ẩn tuyệt đối KHÔNG được hiển thị cho độc giả');
  console.log('✅ Xác nhận: Bình luận bị ẩn đã biến mất hoàn toàn khỏi danh sách công khai!');

  // Admin khôi phục lại bình luận qua PATCH /api/admin/comments/:id/restore
  console.log(`-> Admin gọi PATCH /api/admin/comments/${testComment.id}/restore...`);
  const restoreRes = await axios.patch(`${API_BASE}/admin/comments/${testComment.id}/restore`, {}, adminHeader);
  assert.strictEqual(restoreRes.data.success, true);
  console.log(`✅ API khôi phục phản hồi thành công: "${restoreRes.data.message}"`);

  // Xác nhận bình luận hiển thị công khai trở lại
  const publicAfterRestore = await axios.get(`${API_BASE}/chapters/${testChapterId}/comments`);
  const isVisibleAfterRestore = publicAfterRestore.data.comments.some(c => c.id === testComment.id);
  assert.strictEqual(isVisibleAfterRestore, true, 'Bình luận khôi phục phải hiển thị trở lại');
  console.log('✅ Xác nhận: Bình luận đã hiển thị công khai trở lại thành công.');

  // Admin xóa vĩnh viễn bình luận qua DELETE /api/admin/comments/:id
  console.log(`-> Admin gọi DELETE /api/admin/comments/${testComment.id}...`);
  const deleteRes = await axios.delete(`${API_BASE}/admin/comments/${testComment.id}`, adminHeader);
  assert.strictEqual(deleteRes.data.success, true);
  console.log(`✅ API xóa phản hồi thành công: "${deleteRes.data.message}"`);

  // Xác nhận bình luận bị xóa vĩnh viễn khỏi CSDL
  const publicAfterDelete = await axios.get(`${API_BASE}/chapters/${testChapterId}/comments`);
  const isVisibleAfterDelete = publicAfterDelete.data.comments.some(c => c.id === testComment.id);
  assert.strictEqual(isVisibleAfterDelete, false);
  console.log('✅ VẤN ĐỀ 1 HOÀN TOÀN ĐẠT TIÊU CHUẨN KIỂM THỬ!\n');

  // ===========================================================================
  // KIỂM THỬ VẤN ĐỀ 2: TẠO CHƯƠNG THỦ CÔNG (CÁCH A & CÁCH B)
  // ===========================================================================
  console.log('----------------------------------------------------------------');
  console.log('📖 KIỂM THỬ VẤN ĐỀ 2: TẠO CHƯƠNG MỚI (CÁCH A & CÁCH B)');
  console.log('----------------------------------------------------------------');

  const storyId = 1; // The Amazing Spider-Man (comicvine_id: 2139)

  // 1. Kiểm tra validation trùng số chương
  console.log('-> Kiểm tra validation chống trùng số chương trong cùng bộ truyện...');
  try {
    await axios.post(`${API_BASE}/admin/chapters`, {
      story_id: storyId,
      chapter_number: 1, // Đã tồn tại trong Story 1
      title: 'Chương Trùng Lặp Thử Nghiệm'
    }, adminHeader);
    assert.fail('Hệ thống phải chặn số chương trùng lặp');
  } catch (err) {
    assert.strictEqual(err.response?.status, 400);
    console.log(`✅ Chặn trùng lặp chuẩn xác (HTTP 400): "${err.response?.data?.message}"`);
  }

  // 2. CÁCH A: Liên kết từ ComicVine
  console.log('\n-> [CÁCH A] Tìm kiếm issue trên ComicVine cho Story 1...');
  const cvSearchRes = await axios.get(`${API_BASE}/admin/comicvine/issues?story_id=${storyId}&query=1`, adminHeader);
  assert.strictEqual(cvSearchRes.data.success, true);
  assert.ok(cvSearchRes.data.issues.length > 0, 'Phải tìm thấy danh sách issue từ ComicVine');
  console.log(`✅ ComicVine trả về ${cvSearchRes.data.issues.length} issue hợp lệ.`);

  // Chọn 1 issue và tạo chương theo Cách A
  const sampleCvIssue = cvSearchRes.data.issues[0];
  const newChapterNumberA = 901; // Số chương duy nhất để test
  console.log(`-> Tạo chương mới từ Issue ComicVine (Issue #${sampleCvIssue.issue_number}: "${sampleCvIssue.title}")...`);

  const createChapterARes = await axios.post(`${API_BASE}/admin/chapters`, {
    story_id: storyId,
    chapter_number: newChapterNumberA,
    title: `[Cách A - ComicVine] ${sampleCvIssue.title}`,
    release_date: sampleCvIssue.release_date || '1964-06-10',
    cover_image: sampleCvIssue.cover_image,
    content: sampleCvIssue.description || 'Chương được liên kết chính thức từ ComicVine.',
    character_credits: sampleCvIssue.character_credits || [],
    comicvine_issue_id: sampleCvIssue.id,
    is_preview: true
  }, adminHeader);

  assert.strictEqual(createChapterARes.data.success, true);
  const createdChapterA = createChapterARes.data.chapter;
  console.log(`✅ [Cách A] Đã tạo thành công Chương ID: ${createdChapterA.id} (#${newChapterNumberA})`);

  // Kiểm tra hiển thị trên trang đọc chương
  const readerChapterARes = await axios.get(`${API_BASE}/chapters/${createdChapterA.id}`);
  assert.strictEqual(readerChapterARes.data.success, true);
  assert.strictEqual(readerChapterARes.data.chapter.id, createdChapterA.id);
  console.log(`✅ [Cách A] Độc giả đọc chương bình thường! Tiêu đề: "${readerChapterARes.data.chapter.title}", Ảnh bìa: ${readerChapterARes.data.chapter.cover_image?.slice(0, 45)}...`);

  // 3. CÁCH B: Nhập thủ công hoàn toàn + Tải lên file ảnh từ máy tính
  console.log('\n-> [CÁCH B] Tải lên file ảnh bìa từ máy tính (qua multer upload)...');
  
  // Tạo 1 file ảnh PNG 1x1 hợp lệ trong bộ nhớ
  const png1x1Buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const tempImagePath = path.join(__dirname, 'temp_test_cover.png');
  fs.writeFileSync(tempImagePath, png1x1Buffer);

  const uploadForm = new FormData();
  uploadForm.append('cover', fs.createReadStream(tempImagePath));

  const uploadRes = await axios.post(`${API_BASE}/admin/upload-cover`, uploadForm, {
    headers: {
      ...adminHeader.headers,
      ...uploadForm.getHeaders()
    }
  });

  // Xóa file tạm
  fs.unlinkSync(tempImagePath);

  assert.strictEqual(uploadRes.data.success, true);
  const uploadedCoverUrl = uploadRes.data.url;
  console.log(`✅ Tải ảnh lên máy chủ thành công! Đường dẫn tĩnh: ${uploadedCoverUrl}`);

  // Kiểm tra file ảnh tải lên có truy cập được qua HTTP không
  const staticFileRes = await axios.get(`http://localhost:5000${uploadedCoverUrl}`, { responseType: 'arraybuffer' });
  assert.strictEqual(staticFileRes.status, 200);
  console.log(`✅ File ảnh tĩnh được phục vụ chính xác qua HTTP (status 200, bytes: ${staticFileRes.data.length})`);

  // Tạo chương mới theo Cách B
  const newChapterNumberB = 902;
  console.log(`-> Tạo chương mới hoàn toàn thủ công (Chương #${newChapterNumberB})...`);

  const createChapterBRes = await axios.post(`${API_BASE}/admin/chapters`, {
    story_id: storyId,
    chapter_number: newChapterNumberB,
    title: 'Hồi Kết Của Đa Vũ Trụ (Tác Phẩm Minh Họa Gốc)',
    release_date: '2026-10-04',
    cover_image: uploadedCoverUrl,
    content: 'Nội dung tóm tắt được tác giả nhập thủ công hoàn toàn theo đúng kịch bản gốc.',
    is_preview: false,
    character_credits: [
      { name: 'Spider-Man', icon_url: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg' }
    ]
  }, adminHeader);

  assert.strictEqual(createChapterBRes.data.success, true);
  const createdChapterB = createChapterBRes.data.chapter;
  console.log(`✅ [Cách B] Đã tạo thành công Chương ID: ${createdChapterB.id} (#${newChapterNumberB})`);

  // Kiểm tra hiển thị trên trang đọc chương
  // Vì is_preview: false nên dùng adminHeader để đọc (Admin có quyền bypass)
  const readerChapterBRes = await axios.get(`${API_BASE}/chapters/${createdChapterB.id}`, adminHeader);
  assert.strictEqual(readerChapterBRes.data.success, true);
  assert.strictEqual(readerChapterBRes.data.chapter.id, createdChapterB.id);
  assert.strictEqual(readerChapterBRes.data.chapter.cover_image, uploadedCoverUrl);
  console.log(`✅ [Cách B] Độc giả mở đọc chương thành công! Ảnh bìa lưu đúng file upload: ${readerChapterBRes.data.chapter.cover_image}`);

  // Dọn dẹp dữ liệu test
  console.log('\n🧹 Dọn dẹp 2 chương test trong CSDL...');
  await axios.delete(`${API_BASE}/admin/chapters/${createdChapterA.id}`, adminHeader);
  await axios.delete(`${API_BASE}/admin/chapters/${createdChapterB.id}`, adminHeader);
  console.log('✅ Đã dọn dẹp sạch sẽ!');

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ CÁC MỤC KIỂM THỬ CỦA VẤN ĐỀ 1 & VẤN ĐỀ 2 ĐÃ PASS 100%!');
  console.log('================================================================\n');
}

runVerification().catch(err => {
  console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err.response?.data || err.message);
  process.exit(1);
});
