'use strict';
const axios = require('axios');
const { Chapter, Story } = require('../src/models');

async function testAllCurrentCovers() {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['title'] }],
    order: [['id', 'ASC']]
  });

  console.log(`Auditing all ${chapters.length} chapters against live ComicVine CDN...\n`);

  let okCount = 0;
  let failCount = 0;
  let nullCount = 0;

  for (const c of chapters) {
    if (!c.cover_image) {
      nullCount++;
      console.log(`[NULL] ID ${c.id} - ${c.story?.title} Ch #${c.chapter_number}: "${c.title}"`);
      continue;
    }

    try {
      const res = await axios.head(c.cover_image, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 4000
      });
      if (res.status === 200) {
        okCount++;
        console.log(`[HTTP 200 OK] ID ${c.id} - ${c.story?.title} Ch #${c.chapter_number}: "${c.title}"`);
      } else {
        failCount++;
        console.log(`[HTTP ${res.status}] ID ${c.id} - ${c.story?.title} Ch #${c.chapter_number}: ${c.cover_image}`);
      }
    } catch (err) {
      failCount++;
      console.log(`[FAIL ${err.response?.status || err.code}] ID ${c.id} - ${c.story?.title} Ch #${c.chapter_number}: "${c.title}" -> ${c.cover_image}`);
    }
  }

  console.log(`\nSummary: OK=${okCount}, FAIL=${failCount}, NULL=${nullCount}, Total=${chapters.length}`);
}

testAllCurrentCovers().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
