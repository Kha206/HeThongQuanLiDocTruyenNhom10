'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User, Story, Chapter } = require('../src/models');

const API_BASE = 'http://localhost:5000/api';

async function testAvengersIssue13() {
  console.log('================================================================');
  console.log('🧪 KIỂM THỬ: TÌM KIẾM AVENGERS ISSUE #13 & TỰ ĐỘNG ĐIỀN FORM');
  console.log('================================================================');

  // 1. Check Admin User & Auth Token
  const adminUser = await User.findOne({ where: { email: 'admin@marvel.local' } });
  if (!adminUser) throw new Error('Không tìm thấy tài khoản admin@marvel.local');

  const token = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: '1h' }
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Check "The Avengers" Story in Database & comicvine_volume_id
  const avengersStory = await Story.findOne({
    where: { slug: 'the-avengers-1963' }
  });
  if (!avengersStory) throw new Error('Không tìm thấy bộ truyện "The Avengers" trong database!');

  console.log(`\n1️⃣ Kiểm tra Story "The Avengers" trong Database:`);
  console.log(`   - ID: ${avengersStory.id}`);
  console.log(`   - Title: "${avengersStory.title}"`);
  console.log(`   - comicvine_id: ${avengersStory.comicvine_id}`);
  console.log(`   - comicvine_volume_id: ${avengersStory.comicvine_volume_id}`);

  if (!avengersStory.comicvine_volume_id) {
    throw new Error('FAIL: comicvine_volume_id chưa được lưu trong database!');
  }
  console.log('   ✅ Đã xác nhận: comicvine_volume_id tồn tại và có giá trị hợp lệ!');

  // 3. Test API Search with query "13"
  console.log('\n2️⃣ Gọi API tìm kiếm issue với query="13":');
  const res13 = await axios.get(`${API_BASE}/admin/comicvine/issues`, {
    params: { story_id: avengersStory.id, query: '13' },
    headers: authHeaders
  });

  if (!res13.data.success || !Array.isArray(res13.data.issues) || res13.data.issues.length === 0) {
    throw new Error('FAIL: Không tìm thấy issue nào khi tìm "13" cho The Avengers!');
  }

  const issue13 = res13.data.issues.find(i => String(i.issue_number) === '13');
  if (!issue13) {
    throw new Error('FAIL: Danh sách kết quả không có issue_number == "13"!');
  }

  console.log('   ✅ Tìm thấy đúng Avengers Issue #13!');
  console.log('   - ID / ComicVine Issue ID:', issue13.id || issue13.comicvine_issue_id);
  console.log('   - Issue Number:', issue13.issue_number);
  console.log('   - Title:', issue13.title);
  console.log('   - Release Date:', issue13.release_date);
  console.log('   - Cover Image:', issue13.cover_image);
  console.log('   - Content length:', issue13.content ? issue13.content.length : 0);

  // 4. Verify Autofill Fields are ALL Non-Empty
  console.log('\n3️⃣ Xác nhận các trường bắt buộc của Issue #13 đều có dữ liệu:');
  if (!issue13.cover_image) throw new Error('FAIL: cover_image bị trống!');
  if (!issue13.content) throw new Error('FAIL: content/tóm tắt bị trống!');
  if (!issue13.release_date) throw new Error('FAIL: release_date bị trống!');
  if (!issue13.title) throw new Error('FAIL: title bị trống!');
  console.log('   ✅ CẢ 4 trường (ảnh bìa, tóm tắt, ngày phát hành, tiêu đề) đều đầy đủ!');

  // 5. Test Query Variations ("Issue 13", "#13", "13 Nefaria")
  console.log('\n4️⃣ Kiểm tra độ bao phủ tìm kiếm với các biến thể query:');
  const variants = ['Issue 13', '#13', '13 Nefaria'];
  for (const v of variants) {
    const resV = await axios.get(`${API_BASE}/admin/comicvine/issues`, {
      params: { story_id: avengersStory.id, query: v },
      headers: authHeaders
    });
    const found = resV.data.issues?.some(i => String(i.issue_number) === '13');
    if (!found) {
      throw new Error(`FAIL: Không tìm thấy Issue #13 với query="${v}"`);
    }
    console.log(`   ✅ Query "${v}" -> Tìm thấy Avengers Issue #13!`);
  }

  // 6. Test Creating Chapter from Issue #13 Data
  console.log('\n5️⃣ Thử nghiệm Submit tạo chương từ dữ liệu tự động điền của Issue #13:');
  const testChapNum = 13.99; // Unique chapter number for test
  await Chapter.destroy({ where: { story_id: avengersStory.id, chapter_number: testChapNum } });

  const createPayload = {
    story_id: avengersStory.id,
    chapter_number: testChapNum,
    title: issue13.title,
    release_date: issue13.release_date,
    is_preview: false,
    cover_image: issue13.cover_image,
    content: issue13.content,
    character_credits: issue13.character_credits || [],
    comicvine_issue_id: issue13.comicvine_issue_id || issue13.id
  };

  const createRes = await axios.post(`${API_BASE}/admin/chapters`, createPayload, {
    headers: authHeaders
  });

  if (!createRes.data.success || !createRes.data.chapter) {
    throw new Error('FAIL: Không thể tạo chương mới từ dữ liệu Issue #13');
  }

  const createdChap = createRes.data.chapter;
  console.log(`   ✅ Tạo chương thành công! ID: ${createdChap.id}, Tiêu đề: "${createdChap.title}"`);
  console.log(`   - Ảnh bìa được lưu: ${createdChap.cover_image}`);
  console.log(`   - Tóm tắt được lưu (${createdChap.content.length} ký tự): ${createdChap.content.slice(0, 100)}...`);

  // Cleanup test chapter
  await Chapter.destroy({ where: { id: createdChap.id } });
  console.log('   ✅ Đã dọn dẹp bản ghi chương test.');

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ KIỂM THỬ TÌM KIẾM THEO VOLUME & ISSUE_NUMBER ĐÃ PASS 100%!');
  console.log('================================================================\n');
}

testAvengersIssue13().catch(err => {
  console.error('\n❌ ERROR:', err.response?.data || err.message);
  process.exit(1);
});
