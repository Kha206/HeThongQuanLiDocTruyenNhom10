const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Kha/.gemini/antigravity-ide/brain/388b07b7-146b-4ecf-a430-b3985e9f21d6/.system_generated/logs/transcript.jsonl')
});

const urls = new Set();
rl.on('line', (line) => {
  const matches = line.match(/https:\/\/comicvine\.gamespot\.com\/a\/uploads\/[^\s"'\<\>]+/g);
  if (matches) {
    for (const m of matches) {
      // clean trailing characters
      const clean = m.replace(/[\\]+$/, '').replace(/[;,]+$/, '');
      urls.add(clean);
    }
  }
});

rl.on('close', () => {
  console.log('Total unique ComicVine upload URLs in transcript:', urls.size);
  for (const u of urls) {
    console.log(u);
  }
});
