'use strict';
const fs = require('fs');
const path = require('path');
const { Chapter, Story } = require('../src/models');

async function fixIssue1() {
  console.log('=== FIX VẤN ĐỀ 1: LOẠI BỎ ẢNH KHÔNG PHẢI MARVEL THẬT KHỎI CATALOG VÀ DATABASE ===\n');

  // 1. Update seedFromComicVine.js catalog
  const seedFilePath = path.join(__dirname, 'seedFromComicVine.js');
  let content = fs.readFileSync(seedFilePath, 'utf8');

  // Replace fake Civil War #1 cover with authentic cover
  content = content.replace(
    /https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_small\/11\/118689\/2903877-2767530_2700867_supsm2013001_camunvar_1_\.jpg/g,
    'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3052825-442.jpg'
  );

  // Replace phoenix covers in Civil War #4-10 with null
  content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/(?:0\/4|1\/15776)\/(?:7127[89]|997088[01245])[^']*phoenix[^']*',/g, 'cover_image: null,');

  // Replace g-i-combat covers in Avengers #2-10 with null
  content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/0\/4\/\d+-\d+-\d+-1-g-i-combat\.jpg',/g, 'cover_image: null,');

  // Replace strangers-in-paradis covers in Iron Man #3-10 with null
  content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/0\/4\/719\d+-\d+-\d+-1-strangers-in-paradis\.jpg',/g, 'cover_image: null,');

  // Replace talestoastonish covers in X-Men #2-10 with null
  content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/(?:11\/117763|0\/4|8\/84205)\/[^']*tale[^']*',/g, 'cover_image: null,');

  // Replace duplicate Secret Wars cropped covers with null (keep Ch 1 and Ch 10)
  content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/6\/67663\/275434\d-\d+_cropped\.jpg',/g, 'cover_image: null,');

  // Update line in seed logic: don't fallback to volume coverImage when issue.cover_image is missing/null
  content = content.replace(
    /const issueCover = issue\.cover_image \|\| coverImage;/g,
    'const issueCover = (issue.cover_image && typeof issue.cover_image === \'string\' && issue.cover_image.trim()) ? issue.cover_image.trim() : null;'
  );

  // Update generateChapterPages to use clean placeholder if cover is null
  content = content.replace(
    /image_url: coverUrl,/g,
    'image_url: coverUrl || \'/placeholder-cover.svg\','
  );

  fs.writeFileSync(seedFilePath, content, 'utf8');
  console.log('✅ Đã cập nhật seedFromComicVine.js: loại bỏ toàn bộ cover giả mạo/không chính xác.');

  // 2. Update Database Chapters
  console.log('\n--- Cập nhật các chapter trong database marvel_db ---');
  const chapters = await Chapter.findAll();
  let updatedCount = 0;

  for (const c of chapters) {
    const img = c.cover_image;
    if (!img) continue;

    let shouldClear = false;
    let replacement = null;

    if (img.includes('supsm2013001')) {
      // Civil War #1
      replacement = 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3052825-442.jpg';
    } else if (
      img.includes('g-i-combat') ||
      img.includes('strangers-in-paradis') ||
      img.includes('talestoastonish') ||
      img.includes('phoenix')
    ) {
      shouldClear = true;
    } else if (img.includes('275434') && img.includes('_cropped')) {
      // Secret Wars duplicate crops (not Ch 1, which is 10169914)
      shouldClear = true;
    }

    if (replacement) {
      console.log(`[REPLACE] Ch #${c.chapter_number} (ID ${c.id}) [${c.title}]: -> ${replacement}`);
      await c.update({ cover_image: replacement });
      updatedCount++;
    } else if (shouldClear) {
      console.log(`[CLEAR] Ch #${c.chapter_number} (ID ${c.id}) [${c.title}]: Xóa ảnh không hợp lệ (${img.slice(0, 70)}...)`);
      await c.update({ cover_image: null });
      updatedCount++;
    }
  }

  console.log(`\n✅ Tổng số chapter đã được làm sạch trong DB: ${updatedCount}`);
}

fixIssue1()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
