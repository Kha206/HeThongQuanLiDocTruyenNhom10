const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Kha/.gemini/antigravity-ide/brain/388b07b7-146b-4ecf-a430-b3985e9f21d6/.system_generated/logs/transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (line.includes('1573')) {
    const urls = line.match(/https:\/\/[^\s"'<>]+/g) || [];
    const unique = Array.from(new Set(urls.filter(u => u.includes('uploads') && u.includes('.jpg'))));
    console.log('All image URLs mentioned in step 1573:');
    unique.forEach(u => console.log(u));
  }
});
