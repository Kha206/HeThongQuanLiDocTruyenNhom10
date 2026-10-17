const { Chapter, Story } = require('../src/models');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '../uploads/cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const POW_REAL_COVER = 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2170083-05.jpg';

async function run() {
  console.log('=== FIX ALL CHAPTER COVERS AND PAGES DATA ===\n');

  // Pre-cache POW real cover from local file if exists
  if (fs.existsSync(path.join(__dirname, '../uploads/pow_real_cover.jpg'))) {
    const powBuf = fs.readFileSync(path.join(__dirname, '../uploads/pow_real_cover.jpg'));
    const powHash = crypto.createHash('md5').update(POW_REAL_COVER).digest('hex');
    fs.writeFileSync(path.join(CACHE_DIR, `${powHash}.cache`), powBuf);
    console.log(`[Cache] Pre-cached Avengers/Invaders #5 cover -> ${powHash}.cache (${powBuf.length} bytes)`);
  }

  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story' }],
    order: [['id', 'ASC']]
  });

  console.log(`Total chapters in database: ${chapters.length}`);

  let updatedCount = 0;
  let powUpdated = false;

  const BAD_PATTERNS = [
    'g-i-combat',
    'strangers-in-paradis',
    'phoenix',
    '2754348-04_cropped',
    'placeholder-cover'
  ];

  for (const ch of chapters) {
    let modified = false;
    let cover = ch.cover_image;

    // Check Chapter 160: Prisoners of War!
    if (ch.title.toLowerCase().includes('prisoners of war')) {
      console.log(`\n>>> Updating Chapter ${ch.id} (Prisoners of War!) <<<`);
      console.log(`Old issue_id: ${ch.comicvine_issue_id}, Old cover: ${ch.cover_image}`);
      ch.comicvine_issue_id = 140126;
      cover = POW_REAL_COVER;
      ch.cover_image = POW_REAL_COVER;
      modified = true;
      powUpdated = true;
    } else if (!cover) {
      // Assign story cover
      cover = ch.story?.cover_image || null;
      ch.cover_image = cover;
      modified = true;
      console.log(`[Cover Fill] Ch ${ch.id} [${ch.story?.title} - ${ch.title}] assigned story cover -> ${cover}`);
    }

    // Sanitize pages_data
    let pages = ch.pages_data;
    if (typeof pages === 'string') {
      try { pages = JSON.parse(pages); } catch (_) { pages = []; }
    }
    if (!Array.isArray(pages) || pages.length === 0) {
      pages = [];
      for (let i = 1; i <= 6; i++) {
        pages.push({
          page_number: i,
          image_url: cover,
          caption: `${ch.title} (Page ${i}/6)`
        });
      }
      modified = true;
    } else {
      let pagesModified = false;
      pages.forEach((p, idx) => {
        const isBad = !p.image_url || BAD_PATTERNS.some(pat => p.image_url.includes(pat));
        if (isBad) {
          p.image_url = cover;
          pagesModified = true;
        }
      });
      if (pagesModified) modified = true;
    }

    if (modified) {
      ch.pages_data = pages;
      await ch.save();
      updatedCount++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total chapters inspected: ${chapters.length}`);
  console.log(`Total chapters updated: ${updatedCount}`);
  console.log(`Chapter "Prisoners of War!" updated with official ComicVine issue 140126 cover: ${powUpdated}`);

  // Verify Chapter 160 now
  const verify160 = await Chapter.findOne({ where: { title: 'Prisoners of War!' } });
  console.log('\nVerification of Prisoners of War Chapter:');
  console.log('- ID:', verify160.id);
  console.log('- Title:', verify160.title);
  console.log('- comicvine_issue_id:', verify160.comicvine_issue_id);
  console.log('- cover_image:', verify160.cover_image);
  console.log('- pages_data (first page):', verify160.pages_data[0]);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
