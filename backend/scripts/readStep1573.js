const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Kha/.gemini/antigravity-ide/brain/388b07b7-146b-4ecf-a430-b3985e9f21d6/.system_generated/logs/transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (line.includes('"step_index":1573')) {
    const obj = JSON.parse(line);
    console.log(obj.content);
  }
});
