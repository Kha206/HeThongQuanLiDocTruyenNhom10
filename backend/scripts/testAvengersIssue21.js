const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Story, Chapter } = require('../src/models');
const ComicVineService = require('../src/services/comicVineService');

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao';

async function testAvengersIssue21() {
  console.log('========================================================================');
  console.log('🧪 KIỂM THỬ: TÌM KIẾM \u0026 CHỌN ISSUE #21: THE AVENGERS #21');
  console.log('========================================================================\n');

  // 1. Create Admin token
  const adminToken = jwt.sign(
    { id: 1, email: 'admin@marvel.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  // 2. Fetch "The Avengers" Story from DB
  const story = await Story.findOne({
    where: { slug: 'the-avengers-1963' }
  });

  if (!story) {
    throw new Error('❌ Không tìm thấy bộ truyện "The Avengers (1963)" trong database!');
  }

  console.log(`1️⃣ Kiểm tra Story "The Avengers" trong Database:`);
  console.log(`   - ID: ${story.id}`);
  console.log(`   - Title: "${story.title}"`);
  console.log(`   - comicvine_id: ${story.comicvine_id}`);
  console.log(`   - comicvine_volume_id: ${story.comicvine_volume_id}`);
  console.log(`   - Story Cover (Issue #1): ${story.cover_image}`);

  // Expected authentic ComicVine issue 21 data:
  const EXPECTED_ISSUE_ID = 11270;
  const EXPECTED_COVER_CONTAINS = '11270-2144-11270-1-avengers.jpg';
  const GENERIC_ISSUE_1_COVER = '8459983-rco031_1650495781.jpg';

  // 3. Test queries for Issue 21
  const queriesToTest = [
    '21',
    '#21',
    'Issue 21',
    'Avengers Issue 21',
    'The Avengers 21',
    'Issue #21: The Avengers #21',
    'The Bitter Taste of Defeat'
  ];

  console.log('\n2️⃣ Thử nghiệm các biến thể từ khóa tìm kiếm:');

  for (const q of queriesToTest) {
    const res = await axios.get(`${BASE_URL}/admin/comicvine/issues`, {
      params: { story_id: story.id, query: q },
      ...authHeaders
    });

    if (!res.data.success || !res.data.issues || res.data.issues.length === 0) {
      throw new Error(`❌ FAIL: Không tìm thấy issue khi tìm query "${q}"!`);
    }

    const selectedIssue = res.data.issues.find(iss => String(iss.issue_number) === '21') || res.data.issues[0];

    console.log(`\n   🔍 Query: "${q}"`);
    console.log(`      - Title: "${selectedIssue.title}"`);
    console.log(`      - Issue Number: ${selectedIssue.issue_number}`);
    console.log(`      - Issue ID (id): ${selectedIssue.id}`);
    console.log(`      - comicvine_issue_id: ${selectedIssue.comicvine_issue_id}`);
    console.log(`      - cover_image: ${selectedIssue.cover_image}`);
    console.log(`      - image.icon_url: ${selectedIssue.image?.icon_url}`);
    console.log(`      - image.medium_url: ${selectedIssue.image?.medium_url}`);
    console.log(`      - image.original_url: ${selectedIssue.image?.original_url}`);

    // VERIFY 1: Issue ID must match 11270
    if (Number(selectedIssue.id) !== EXPECTED_ISSUE_ID && Number(selectedIssue.comicvine_issue_id) !== EXPECTED_ISSUE_ID) {
      throw new Error(`❌ FAIL: Issue ID ${selectedIssue.id} không khớp với ComicVine ID 11270!`);
    }

    // VERIFY 2: Cover image must be the authentic Issue #21 cover, NOT Issue #1
    if (selectedIssue.cover_image.includes(GENERIC_ISSUE_1_COVER)) {
      throw new Error(`❌ FAIL: cover_image vẫn đang dùng nhầm ảnh bìa Issue #1 (${GENERIC_ISSUE_1_COVER})!`);
    }

    if (!selectedIssue.cover_image.includes(EXPECTED_COVER_CONTAINS)) {
      throw new Error(`❌ FAIL: cover_image không chứa file ảnh thật của Avengers #21 (${EXPECTED_COVER_CONTAINS})!`);
    }

    // VERIFY 3: image sub-URLs must all be present
    if (!selectedIssue.image || !selectedIssue.image.medium_url || !selectedIssue.image.original_url || !selectedIssue.image.icon_url) {
      throw new Error(`❌ FAIL: image sub-URLs (icon_url, medium_url, original_url) bị thiếu!`);
    }

    console.log(`      ✅ Khớp 100% với ComicVine Issue #21 thật!`);
  }

  // 4. Test Chapter Creation in Database
  console.log('\n3️⃣ Kiểm thử tạo chương trong Database với dữ liệu Issue #21:');
  const testChapNumber = 21;

  // Cleanup old test chapter 21 if exists
  await Chapter.destroy({ where: { story_id: story.id, chapter_number: testChapNumber } });

  const createRes = await axios.post(`${BASE_URL}/admin/chapters`, {
    story_id: story.id,
    chapter_number: testChapNumber,
    title: 'The Bitter Taste of Defeat!',
    release_date: '1965-10-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/11270-2144-11270-1-avengers.jpg',
    content: 'Power Man (Erik Josten) makes his explosive debut! Empowered by the Enchantress with the ionic ray machinery of Baron Zemo, Power Man frames the Avengers for reckless destruction.',
    is_preview: false,
    comicvine_issue_id: 11270,
    character_credits: [
      { name: 'Power Man (Erik Josten)' },
      { name: 'Enchantress (Amora)' },
      { name: 'Scarlet Witch' },
      { name: 'Captain America' }
    ]
  }, authHeaders);

  if (!createRes.data.success) {
    throw new Error(`❌ FAIL: Tạo chương thất bại: ${createRes.data.message}`);
  }

  console.log('   ✅ Đã tạo chương #21 thành công trong database!');

  // Fetch created chapter from DB
  const createdChap = await Chapter.findOne({
    where: { story_id: story.id, chapter_number: testChapNumber }
  });

  console.log(`   - Chapter ID: ${createdChap.id}`);
  console.log(`   - Chapter Number: ${createdChap.chapter_number}`);
  console.log(`   - Title: "${createdChap.title}"`);
  console.log(`   - Cover Image: ${createdChap.cover_image}`);
  console.log(`   - ComicVine Issue ID: ${createdChap.comicvine_issue_id}`);

  if (createdChap.cover_image.includes(GENERIC_ISSUE_1_COVER) || !createdChap.cover_image.includes(EXPECTED_COVER_CONTAINS)) {
    throw new Error('❌ FAIL: Ảnh bìa đã lưu trong database không đúng với Issue #21!');
  }

  console.log('   ✅ Ảnh bìa đã lưu chính xác 100% khớp với Issue #21 thật trên ComicVine!');

  // Cleanup test chapter so database is pristine
  await Chapter.destroy({ where: { id: createdChap.id } });
  console.log('   ✅ Đã dọn dẹp chapter test an toàn.');

  console.log('\n🎉 TẤT CẢ KIỂM THỬ CHO ISSUE #21 THE AVENGERS ĐÃ HOÀN TẤT XUẤT SẮC!');
}

testAvengersIssue21().catch(err => {
  console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err.response?.data || err.message);
  process.exit(1);
});
