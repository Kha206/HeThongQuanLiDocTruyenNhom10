/**
 * auditAllChaptersBeforeFix.js
 * 
 * Script kiểm tra TOÀN BỘ chapter hiện có trong database marvel_db:
 * - Kiểm tra cover_image: URL thật của ComicVine (HTTP 200) vs Bị hỏng 404 vs NULL/rỗng vs Sai lệch
 * - Kiểm tra character_credits: Có bị NULL icon_url, mượn avatar của nhân vật khác, hoặc rỗng
 * - Liệt kê chi tiết danh sách các chapter bị sai lệch trước khi sửa.
 */
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const { Chapter, Story } = require('../src/models');

async function auditAll() {
  console.log('========================================================================');
  console.log('   BÁO CÁO RÀ SOÁT DỮ LIỆU TOÀN BỘ CHAPTER (TRƯỚC KHI SỬA)   ');
  console.log('========================================================================\n');

  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title', 'comicvine_volume_id'] }],
    order: [['story_id', 'ASC'], ['chapter_number', 'ASC']]
  });

  console.log(`Tổng số chapter trong cơ sở dữ liệu: ${chapters.length}\n`);

  const coverIssues = [];
  const charIssues = [];
  let validCoversCount = 0;

  for (const c of chapters) {
    const storyTitle = c.story?.title || `Story #${c.story_id}`;
    const chLabel = `[Story: ${storyTitle}] Ch #${c.chapter_number} (ID: ${c.id}, CV_Issue: ${c.comicvine_issue_id || 'N/A'}) - "${c.title}"`;

    // 1. Kiểm tra cover_image
    if (!c.cover_image || c.cover_image.trim() === '') {
      coverIssues.push({
        chapterId: c.id,
        label: chLabel,
        reason: 'Thiếu ảnh bìa (cover_image bị rỗng/NULL)',
        currentUrl: null
      });
    } else {
      // Test URL status
      try {
        const res = await axios.head(c.cover_image, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          timeout: 3000
        });
        if (res.status === 200) {
          validCoversCount++;
        } else {
          coverIssues.push({
            chapterId: c.id,
            label: chLabel,
            reason: `URL ảnh trả về HTTP ${res.status}`,
            currentUrl: c.cover_image
          });
        }
      } catch (err) {
        coverIssues.push({
          chapterId: c.id,
          label: chLabel,
          reason: `Lỗi tải ảnh (${err.response?.status || err.message})`,
          currentUrl: c.cover_image
        });
      }
    }

    // 2. Kiểm tra character_credits
    let credits = [];
    if (typeof c.character_credits === 'string') {
      try {
        credits = JSON.parse(c.character_credits);
      } catch (e) {
        credits = [];
      }
    } else if (Array.isArray(c.character_credits)) {
      credits = c.character_credits;
    }

    const borrowedOrNullChars = [];
    const seenUrlsInChapter = new Set();

    for (const char of credits) {
      if (!char) continue;
      const name = typeof char === 'string' ? char : (char.name || '');
      const icon = typeof char === 'object' ? char.icon_url : null;

      if (!icon) {
        borrowedOrNullChars.push(`${name} (icon_url = NULL -> nguy cơ fallback initials)`);
      } else if (seenUrlsInChapter.has(icon)) {
        borrowedOrNullChars.push(`${name} (trùng lặp avatar với nhân vật khác trong cùng chapter)`);
      } else {
        seenUrlsInChapter.add(icon);
        // Kiểm tra xem có phải avatar mượn sai không (ví dụ Ka-Zar mượn Wolverine, Immortus mượn Doctor Doom)
        const lowerName = name.toLowerCase();
        if (lowerName.includes('immortus') && icon.includes('1724175-doctor_doom')) {
          borrowedOrNullChars.push(`${name} (mượn nhầm avatar của Doctor Doom)`);
        } else if (lowerName.includes('ka-zar') && icon.includes('1863600-200px_wolverine')) {
          borrowedOrNullChars.push(`${name} (mượn nhầm avatar của Wolverine)`);
        } else if (lowerName.includes('titania') && icon.includes('1863600-200px_wolverine')) {
          borrowedOrNullChars.push(`${name} (mượn nhầm avatar của Wolverine)`);
        } else if (lowerName.includes('punisher') && icon.includes('1863600-200px_wolverine')) {
          borrowedOrNullChars.push(`${name} (mượn nhầm avatar của Wolverine)`);
        } else if (lowerName.includes('namor') && icon.includes('2215796-047')) {
          borrowedOrNullChars.push(`${name} (mượn nhầm avatar của Silver Surfer)`);
        } else if (lowerName.includes('scarlet witch') && icon.includes('talestoastonish051')) {
          borrowedOrNullChars.push(`${name} (lưu nhầm avatar của Jean Grey)`);
        } else if (lowerName.includes('quicksilver') && icon.includes('talestoastonish050')) {
          borrowedOrNullChars.push(`${name} (lưu nhầm avatar của Cyclops)`);
        }
      }
    }

    if (borrowedOrNullChars.length > 0) {
      charIssues.push({
        chapterId: c.id,
        label: chLabel,
        totalChars: credits.length,
        problematicChars: borrowedOrNullChars
      });
    }
  }

  // IN BÁO CÁO CHI TIẾT
  console.log('------------------------------------------------------------------------');
  console.log(`LỖI 1: DANH SÁCH ${coverIssues.length} CHAPTER CÓ ẢNH BÌA BỊ LỖI / THIẾU`);
  console.log('------------------------------------------------------------------------');
  coverIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.label}`);
    console.log(`   - Tình trạng: ${issue.reason}`);
    if (issue.currentUrl) console.log(`   - URL hiện tại: ${issue.currentUrl}`);
  });

  console.log('\n------------------------------------------------------------------------');
  console.log(`LỖI 2: DANH SÁCH ${charIssues.length} CHAPTER CÓ DỮ LIỆU NHÂN VẬT BỊ LỖI`);
  console.log('------------------------------------------------------------------------');
  charIssues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.label} (${issue.totalChars} nhân vật)`);
    issue.problematicChars.forEach(p => console.log(`   - ${p}`));
  });

  console.log('\n========================================================================');
  console.log('TỔNG HỢP KIỂM TRA:');
  console.log(`- Tổng số chapter đã kiểm tra       : ${chapters.length}`);
  console.log(`- Số chapter có ảnh bìa hợp lệ (200) : ${validCoversCount}`);
  console.log(`- Số chapter bị lỗi/thiếu ảnh bìa   : ${coverIssues.length}`);
  console.log(`- Số chapter có lỗi nhân vật        : ${charIssues.length}`);
  console.log('========================================================================\n');
}

auditAll().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
