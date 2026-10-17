'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Chapter, Story } = require('../src/models');
const ComicVineService = require('../src/services/comicVineService');

async function run() {
  const cvService = new ComicVineService();
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['title'] }],
    order: [['id', 'ASC']]
  });

  console.log(`Auditing and fixing character_credits for ${chapters.length} chapters...`);

  let updatedCount = 0;

  for (const ch of chapters) {
    let credits = ch.character_credits;
    if (typeof credits === 'string') {
      try { credits = JSON.parse(credits); } catch (e) { credits = []; }
    }
    if (!Array.isArray(credits) || credits.length === 0) continue;

    // Normalize and deduplicate using ComicVineService
    const cleaned = cvService.normalizeCharacterCredits(credits);

    const oldStr = JSON.stringify(credits);
    const newStr = JSON.stringify(cleaned);

    if (oldStr !== newStr) {
      updatedCount++;
      await ch.update({ character_credits: cleaned });
      console.log(`[Fixed Ch ID ${ch.id}] "${ch.title}" (${ch.story?.title}):`);
      console.log(`  Before:`, oldStr);
      console.log(`  After: `, newStr);
    }
  }

  console.log(`\n======================================================`);
  console.log(`[SUCCESS] Fixed character_credits in ${updatedCount} chapters in database.`);
  console.log(`======================================================\n`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
