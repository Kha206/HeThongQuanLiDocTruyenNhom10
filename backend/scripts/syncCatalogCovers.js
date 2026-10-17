const fs = require('fs');
const path = require('path');
const { VERIFIED_COVERS_MAP } = require('./fixAllDuplicateChapterCovers');

const SEED_FILE = path.join(__dirname, 'seedFromComicVine.js');
let code = fs.readFileSync(SEED_FILE, 'utf8');

// Also update Story volumes comicvine_id / comicvine_volume_id in catalog:
// Story 2 Civil War: 18023
// Story 4 The Avengers: 2128
// Story 5 Iron Man: 18220
// Story 6 Uncanny X-Men: 2133
// Story 8 Secret Wars: 3352

code = code.replace(/comicvine_id:\s*18151/g, 'comicvine_id: 18023');
code = code.replace(/comicvine_volume_id:\s*18151/g, 'comicvine_volume_id: 18023');

code = code.replace(/comicvine_id:\s*2144/g, 'comicvine_id: 2128');
code = code.replace(/comicvine_volume_id:\s*2144/g, 'comicvine_volume_id: 2128');

code = code.replace(/comicvine_id:\s*18861/g, 'comicvine_id: 18220');
code = code.replace(/comicvine_volume_id:\s*18861/g, 'comicvine_volume_id: 18220');

code = code.replace(/comicvine_id:\s*2140/g, 'comicvine_id: 2133');
code = code.replace(/comicvine_volume_id:\s*2140/g, 'comicvine_volume_id: 2133');

code = code.replace(/comicvine_id:\s*4208/g, 'comicvine_id: 3352');
code = code.replace(/comicvine_volume_id:\s*4208/g, 'comicvine_volume_id: 3352');

fs.writeFileSync(SEED_FILE, code, 'utf8');
console.log('Updated Volume IDs in seedFromComicVine.js');

// Now let's update individual issue entries in catalog
// We can require the file and verify, or update directly
const { MARVEL_VOLUMES_CATALOG } = require('./seedFromComicVine');

for (const vol of MARVEL_VOLUMES_CATALOG) {
  let mapKey = null;
  if (vol.title === 'Civil War') mapKey = 2;
  else if (vol.title === 'The Avengers') mapKey = 4;
  else if (vol.title.includes('Extremis') || vol.title.includes('Iron Man')) mapKey = 5;
  else if (vol.title.includes('X-Men')) mapKey = 6;
  else if (vol.title === 'Secret Wars') mapKey = 8;

  if (mapKey && VERIFIED_COVERS_MAP[mapKey]) {
    const list = VERIFIED_COVERS_MAP[mapKey];
    for (const item of list) {
      const iss = (vol.issues || []).find(i => i.chapter_number === item.num);
      if (iss) {
        iss.comicvine_issue_id = item.issue_id;
        iss.cover_image = item.cover;
      }
    }
  }
}

// Write catalog update
console.log('Catalog objects in memory updated successfully.');
