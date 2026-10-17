const { Story, Chapter } = require('../src/models');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function testUrl(url) {
  if (!url || !url.startsWith('https://')) return false;
  return new Promise(resolve => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://comicvine.gamespot.com/'
      }
    }, res => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

(async () => {
  const stories = await Story.findAll({ include: [{ model: Chapter, as: 'chapters' }] });
  for (const s of stories) {
    console.log(`\n=== Story ${s.id}: ${s.title} ===`);
    console.log(`Story cover: ${s.cover_image}`);
    const validCovers = [];
    for (const c of s.chapters) {
      if (c.cover_image) {
        const ok = await testUrl(c.cover_image);
        if (ok) {
          validCovers.push({ id: c.id, num: c.chapter_number, title: c.title, url: c.cover_image });
        }
      }
    }
    console.log(`Found ${validCovers.length} valid chapter covers:`);
    validCovers.forEach(v => console.log(`  Issue #${v.num}: ${v.url}`));
  }
  process.exit(0);
})();
