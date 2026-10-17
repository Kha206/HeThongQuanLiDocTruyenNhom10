const fs = require('fs');
const path = require('path');

const keywords = [
  'dicebear',
  'robohash',
  'picsum',
  'lorem',
  'unsplash',
  'placeholder.com',
  'via.placeholder',
  'pokeapi',
  'pokemon',
  'pokémon',
  'fakestore',
  'dummyjson',
  'randomuser',
  'avatar.iran',
  'pravatar',
  'i.pravatar.cc',
  'cloudflare-ipfs',
  'faker'
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.gemini', 'cache'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.jsx', '.json', '.html', '.css', '.md', '.sql', '.svg'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const kw of keywords) {
            if (content.toLowerCase().includes(kw)) {
              console.log(`[MATCH] Found '${kw}' in: ${fullPath}`);
            }
          }
        } catch (e) {}
      }
    }
  }
}

console.log('=== SCANNING CODEBASE FOR RANDOM / PLACEHOLDER APIS ===\n');
scanDir(path.resolve(__dirname, '../../'));
console.log('\n=== SCAN COMPLETE ===');
