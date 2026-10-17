const { Chapter, Story } = require('../src/models');
const http = require('http');
const https = require('https');

(async () => {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title'] }],
    order: [['story_id', 'ASC'], ['chapter_number', 'ASC']]
  });

  console.log(`=== AUDIT TẤT CẢ CHARACTER CREDITS TRONG DATABASE (${chapters.length} CHAPTERS) ===\n`);

  // Map by character name (normalized)
  // characterName -> { name, icon_urls: Set, chapters: [{ id, num, title, storyTitle, icon_url }] }
  const charMap = new Map();
  // iconUrl -> Set of character names
  const iconToChars = new Map();

  let totalCreditEntries = 0;

  for (const ch of chapters) {
    let credits = ch.character_credits;
    if (typeof credits === 'string') {
      try { credits = JSON.parse(credits); } catch (e) { credits = []; }
    }
    if (!Array.isArray(credits)) credits = [];

    for (const char of credits) {
      totalCreditEntries++;
      const name = (char.name || char.character_name || 'Unknown').trim();
      const iconUrl = (char.icon_url || char.image_url || char.image || '').trim();

      if (!charMap.has(name)) {
        charMap.set(name, {
          name,
          iconUrls: new Set(),
          chapters: []
        });
      }
      const entry = charMap.get(name);
      if (iconUrl) entry.iconUrls.add(iconUrl);
      entry.chapters.push({
        chapterId: ch.id,
        chapterNum: ch.chapter_number,
        chapterTitle: ch.title,
        storyTitle: ch.story ? ch.story.title : `Story #${ch.story_id}`,
        iconUrl
      });

      if (iconUrl) {
        if (!iconToChars.has(iconUrl)) {
          iconToChars.set(iconUrl, new Set());
        }
        iconToChars.get(iconUrl).add(name);
      }
    }
  }

  console.log(`Tổng số lượt xuất hiện nhân vật (character entries): ${totalCreditEntries}`);
  console.log(`Tổng số nhân vật độc nhất (unique character names): ${charMap.size}\n`);

  console.log('--- DANH SÁCH TẤT CẢ NHÂN VẬT & ICON_URL HIỆN TẠI ---');
  const emptyIcons = [];
  const validIcons = [];

  for (const [name, data] of charMap.entries()) {
    const urls = Array.from(data.iconUrls);
    const chapterList = data.chapters.map(c => `${c.storyTitle} Ch#${c.chapterNum}`).join(', ');
    if (urls.length === 0 || urls.every(u => !u)) {
      emptyIcons.push({ name, chapters: chapterList, count: data.chapters.length });
    } else {
      validIcons.push({ name, urls, chapters: chapterList, count: data.chapters.length });
    }
  }

  console.log(`\n1. NHÂN VẬT CÓ ICON_URL RỖNG / NULL (${emptyIcons.length} nhân vật):`);
  emptyIcons.forEach((c, idx) => {
    console.log(`  [${idx + 1}] ${c.name} (${c.count} lần xuất hiện trong: ${c.chapters}) -> icon_url: RỖNG/NULL`);
  });

  console.log(`\n2. NHÂN VẬT CÓ ICON_URL (${validIcons.length} nhân vật):`);
  validIcons.forEach((c, idx) => {
    console.log(`  [${idx + 1}] ${c.name} (${c.count} lần):`);
    c.urls.forEach(u => console.log(`      -> ${u}`));
    console.log(`      Chapters: ${c.chapters}`);
  });

  console.log('\n--- KIỂM TRA TRÙNG LẶP ICON_URL GIỮA CÁC NHÂN VẬT KHÁC NHAU ---');
  let duplicateIconGroupCount = 0;
  for (const [iconUrl, namesSet] of iconToChars.entries()) {
    if (namesSet.size > 1) {
      duplicateIconGroupCount++;
      console.log(`\n[NHÓM TRÙNG #${duplicateIconGroupCount}] URL: ${iconUrl}`);
      console.log(`  Dùng chung bởi ${namesSet.size} nhân vật khác nhau: ${Array.from(namesSet).join(' | ')}`);
    }
  }

  if (duplicateIconGroupCount === 0) {
    console.log('\n✅ TUYỆT VỜI: Không phát hiện nhóm nhân vật nào bị trùng icon_url với nhau!');
  } else {
    console.log(`\n❌ Tổng cộng phát hiện ${duplicateIconGroupCount} nhóm icon_url bị dùng chung bởi nhiều nhân vật khác nhau!`);
  }

  console.log('\n--- KIỂM TRA TẢI QUA PROXY (/api/image-proxy) CHO TẤT CẢ ẢNH NHÂN VẬT ---');
  const uniqueUrls = Array.from(iconToChars.keys());
  console.log(`Kiểm tra ${uniqueUrls.length} URL ảnh qua backend proxy...`);

  let proxySuccess = 0;
  let proxyFail = 0;
  const failedUrls = [];

  for (let i = 0; i < uniqueUrls.length; i += 10) {
    const chunk = uniqueUrls.slice(i, i + 10);
    await Promise.all(chunk.map(url => new Promise((resolve) => {
      const proxyUrl = `http://localhost:5000/api/image-proxy?url=${encodeURIComponent(url)}`;
      http.get(proxyUrl, res => {
        let body = '';
        res.on('data', c => { if (body.length < 500) body += c; });
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          if (res.statusCode === 200 && contentType.startsWith('image/')) {
            proxySuccess++;
          } else {
            proxyFail++;
            failedUrls.push({ url, statusCode: res.statusCode, contentType });
          }
          resolve();
        });
      }).on('error', err => {
        proxyFail++;
        failedUrls.push({ url, error: err.message });
        resolve();
      });
    })));
  }

  console.log(`Kết quả proxy: ${proxySuccess}/${uniqueUrls.length} ảnh tải thành công (HTTP 200 image/*).`);
  if (proxyFail > 0) {
    console.log(`❌ Có ${proxyFail} URL thất bại hoặc trả về fallback:`, failedUrls);
  } else {
    console.log(`✅ 100% URL nhân vật hoạt động hoàn hảo qua proxy!`);
  }

  process.exit(0);
})();
