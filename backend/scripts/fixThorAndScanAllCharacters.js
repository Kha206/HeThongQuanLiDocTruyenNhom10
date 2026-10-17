const { Chapter } = require('../src/models');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '../uploads/cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const THOR_ICON_URL = 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2593422-thor1.png';

async function downloadToCache(url) {
  const cacheKey = crypto.createHash('md5').update(url).digest('hex');
  const cachedPath = path.join(CACHE_DIR, `${cacheKey}.cache`);

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://comicvine.gamespot.com/'
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        // Verify valid image buffer
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isJpg = buf[0] === 0xFF && buf[1] === 0xD8;
        if ((isPng || isJpg) && buf.length > 500) {
          fs.writeFileSync(cachedPath, buf);
          console.log(`[Cache OK] Pre-cached ${url} -> ${cachedPath} (${buf.length} bytes)`);
          resolve(true);
        } else {
          console.warn(`[Cache Warning] Downloaded non-image for ${url}, length=${buf.length}`);
          resolve(false);
        }
      });
    }).on('error', err => {
      console.error(`[Cache Error] ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('--- Step 1: Pre-caching Thor official ComicVine icon ---');
  await downloadToCache(THOR_ICON_URL);
  await downloadToCache('https://comicvine.gamespot.com/a/uploads/scale_small/8/83882/1761902-thor_mighty_hammer.jpg');

  console.log('\n--- Step 2: Scanning all Chapters in database for Character Credits ---');
  const chapters = await Chapter.findAll();
  console.log(`Found ${chapters.length} total chapters in database.`);

  let totalCharactersScanned = 0;
  let thorCharactersUpdated = 0;
  let nonComicVineFound = 0;
  let chaptersUpdated = 0;

  for (const ch of chapters) {
    let credits = ch.character_credits;
    if (typeof credits === 'string') {
      try {
        credits = JSON.parse(credits);
      } catch (_) {
        credits = [];
      }
    }
    if (!Array.isArray(credits)) credits = [];

    let modified = false;

    for (const char of credits) {
      totalCharactersScanned++;
      const name = (char.name || '').trim().toLowerCase();

      // Check for Thor
      if (name === 'thor' || name === 'thor odinson' || name.startsWith('thor (')) {
        if (char.icon_url !== THOR_ICON_URL) {
          console.log(`[Chapter ${ch.id} (${ch.title})] Updating Thor icon_url from "${char.icon_url}" to official Thor icon.`);
          char.icon_url = THOR_ICON_URL;
          modified = true;
          thorCharactersUpdated++;
        }
      }

      // Check domain of icon_url
      if (char.icon_url) {
        if (!char.icon_url.includes('comicvine.gamespot.com') && !char.icon_url.startsWith('/')) {
          console.error(`[NON-COMICVINE DETECTED] Chapter ${ch.id}, Character "${char.name}": ${char.icon_url}`);
          nonComicVineFound++;
        }
      }
    }

    if (modified) {
      await ch.update({ character_credits: credits });
      chaptersUpdated++;
    }
  }

  console.log('\n=== AUDIT & UPDATE SUMMARY ===');
  console.log(`Total Chapters scanned: ${chapters.length}`);
  console.log(`Total Characters scanned: ${totalCharactersScanned}`);
  console.log(`Thor instances updated: ${thorCharactersUpdated}`);
  console.log(`Chapters updated in DB: ${chaptersUpdated}`);
  console.log(`Non-ComicVine URLs found in character_credits: ${nonComicVineFound}`);
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
