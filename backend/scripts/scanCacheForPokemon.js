const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '../uploads/cache');
const files = fs.readdirSync(cacheDir);

console.log('Checking all cache files for image headers or text strings...');
for (const f of files) {
  const filePath = path.join(cacheDir, f);
  const buf = fs.readFileSync(filePath);
  const str = buf.toString('latin1'); // raw string
  
  // Check if string contains any recognizable text
  const match = str.match(/https?:\/\/[a-zA-Z0-9\.\_\-\/]+/g) || [];
  const textMatches = str.match(/[a-zA-Z0-9_\-\.]{5,}/g) || [];
  
  if (/poke/i.test(str) || /pokemon/i.test(str) || /pikachu/i.test(str)) {
    console.log(`[POKEMON DETECTED IN CACHE FILE] ${f}`);
  }
}
console.log('Done scanning cache files.');
