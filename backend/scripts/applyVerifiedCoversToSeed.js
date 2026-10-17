const fs = require('fs');
const path = require('path');
const { VERIFIED_COVERS_MAP } = require('./fixAllDuplicateChapterCovers');

const SEED_FILE = path.join(__dirname, 'seedFromComicVine.js');
let content = fs.readFileSync(SEED_FILE, 'utf8');

// Update Volume IDs in catalog
content = content.replace(/comicvine_id:\s*18151/g, 'comicvine_id: 18023');
content = content.replace(/comicvine_volume_id:\s*18151/g, 'comicvine_volume_id: 18023');

content = content.replace(/comicvine_id:\s*2144/g, 'comicvine_id: 2128');
content = content.replace(/comicvine_volume_id:\s*2144/g, 'comicvine_volume_id: 2128');

content = content.replace(/comicvine_id:\s*18861/g, 'comicvine_id: 18220');
content = content.replace(/comicvine_volume_id:\s*18861/g, 'comicvine_volume_id: 18220');

content = content.replace(/comicvine_id:\s*2140/g, 'comicvine_id: 2133');
content = content.replace(/comicvine_volume_id:\s*2140/g, 'comicvine_volume_id: 2133');

content = content.replace(/comicvine_id:\s*4208/g, 'comicvine_id: 3352');
content = content.replace(/comicvine_volume_id:\s*4208/g, 'comicvine_volume_id: 3352');

// Helper to replace issue in a given volume section
function updateVolumeIssues(volKeyword, issuesList) {
  const volIdx = content.indexOf(volKeyword);
  if (volIdx === -1) {
    console.warn('Volume not found:', volKeyword);
    return;
  }
  const nextVolIdx = content.indexOf('comicvine_id:', volIdx + 50);
  const endIdx = nextVolIdx !== -1 ? nextVolIdx : content.length;
  let volSection = content.slice(volIdx, endIdx);

  for (const item of issuesList) {
    // Find chapter_number: item.num
    const chPattern = new RegExp(`(chapter_number:\\s*${item.num},[\\s\\S]*?comicvine_issue_id:\\s*)\\d+([\\s\\S]*?cover_image:\\s*)(?:null|'[^']*'|"[^"]*")`);
    if (chPattern.test(volSection)) {
      volSection = volSection.replace(chPattern, `$1${item.issue_id}$2'${item.cover}'`);
    } else {
      console.warn(`Issue ${item.num} not matched in ${volKeyword}`);
    }
  }

  content = content.slice(0, volIdx) + volSection + content.slice(endIdx);
}

updateVolumeIssues("title: 'Civil War'", VERIFIED_COVERS_MAP[2]);
updateVolumeIssues("title: 'The Avengers'", VERIFIED_COVERS_MAP[4]);
updateVolumeIssues("title: 'Iron Man: Extremis'", VERIFIED_COVERS_MAP[5]);
updateVolumeIssues("title: 'Uncanny X-Men'", VERIFIED_COVERS_MAP[6]);
updateVolumeIssues("title: 'Secret Wars'", VERIFIED_COVERS_MAP[8]);

fs.writeFileSync(SEED_FILE, content, 'utf8');
console.log('Successfully updated seedFromComicVine.js with verified unique covers!');
