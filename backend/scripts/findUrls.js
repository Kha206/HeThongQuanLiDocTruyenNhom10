const fs = require('fs');
const path = require('path');
const scriptsDir = path.join(__dirname);
const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
const urls = new Set();
files.forEach(f => {
  const content = fs.readFileSync(path.join(scriptsDir, f), 'utf8');
  const matches = content.match(/https:\/\/comicvine\.gamespot\.com\/a\/uploads\/[^\s'",\)]+/g) || [];
  matches.forEach(m => urls.add(m));
});
console.log('Total unique ComicVine image URLs found in scripts:', urls.size);
Array.from(urls).slice(0, 40).forEach(u => console.log(u));
