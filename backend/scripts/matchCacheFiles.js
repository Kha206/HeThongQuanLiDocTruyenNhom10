const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Chapter, Story, User } = require('../src/models');
const { MARVEL_VOLUMES_CATALOG } = require('./seedFromComicVine');

async function match() {
  const cacheDir = path.join(__dirname, '../uploads/cache');
  const cacheFiles = fs.readdirSync(cacheDir);
  const cacheSet = new Set(cacheFiles.map(f => f.replace('.cache', '')));

  // Collect all known URLs
  const urlMap = new Map();

  const addUrl = (url, source) => {
    if (!url || typeof url !== 'string') return;
    const clean = url.trim();
    const hash = crypto.createHash('md5').update(clean).digest('hex');
    urlMap.set(hash, { url: clean, source });
  };

  // From database
  const stories = await Story.findAll();
  for (const s of stories) {
    addUrl(s.cover_image, `Story #${s.id} cover`);
    addUrl(s.banner_image, `Story #${s.id} banner`);
  }

  const chapters = await Chapter.findAll();
  for (const c of chapters) {
    addUrl(c.cover_image, `Chapter #${c.id} cover`);
    let chars = [];
    try {
      chars = typeof c.character_credits === 'string' ? JSON.parse(c.character_credits) : c.character_credits;
    } catch(e){}
    if (Array.isArray(chars)) {
      for (const ch of chars) {
        if (ch && ch.icon_url) addUrl(ch.icon_url, `Chapter #${c.id} char: ${ch.name}`);
      }
    }
  }

  // From catalog
  for (const v of MARVEL_VOLUMES_CATALOG) {
    addUrl(v.cover_image, `Catalog Vol: ${v.title}`);
    if (v.issues) {
      for (const iss of v.issues) {
        addUrl(iss.cover_image, `Catalog Issue #${iss.chapter_number} in ${v.title}`);
        if (iss.character_credits) {
          for (const ch of iss.character_credits) {
            if (ch && ch.icon_url) addUrl(ch.icon_url, `Catalog char: ${ch.name}`);
          }
        }
      }
    }
  }

  console.log(`Collected ${urlMap.size} unique candidate URLs.`);
  console.log(`Total cache files on disk: ${cacheFiles.length}`);

  let matched = 0;
  let unmatched = 0;

  for (const f of cacheFiles) {
    const hash = f.replace('.cache', '');
    const buf = fs.readFileSync(path.join(cacheDir, f));
    const isHtml = buf.slice(0, 50).toString().includes('<html') || buf.slice(0, 50).toString().includes('<!DOCTYPE');

    if (urlMap.has(hash)) {
      matched++;
      const info = urlMap.get(hash);
      if (isHtml) {
        console.log(`[HTML ERROR CACHED] (${hash}): ${info.url} (${info.source})`);
      }
    } else {
      unmatched++;
      console.log(`[UNMATCHED CACHE FILE] (${hash}, size: ${buf.length}, isHtml: ${isHtml})`);
    }
  }

  console.log(`\nMatched: ${matched}, Unmatched: ${unmatched}`);
}

match().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
