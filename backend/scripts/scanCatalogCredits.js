'use strict';
const fs = require('fs');
const content = fs.readFileSync('scripts/seedFromComicVine.js', 'utf8');

const regex = /character_credits:\s*\[([\s\S]*?)\]/g;
let match;
let issueIdx = 0;

while ((match = regex.exec(content)) !== null) {
  issueIdx++;
  const block = match[1];
  // check if any CHAR_ICONS or URL is repeated or mismatched
  const lines = block.split('\n').filter(l => l.includes('name:'));
  const iconLines = block.split('\n').filter(l => l.includes('icon_url:'));
  
  if (block.includes('peterParker') && (block.includes('Jameson') || block.includes('Flash') || block.includes('Montana') || block.includes('Betty'))) {
    console.log(`[Issue #${issueIdx}] Has wrong peterParker assignment:`);
    console.log(block.trim());
  }
  if (block.includes('doctorDoom') && block.includes('Tinkerer')) {
    console.log(`[Issue #${issueIdx}] Has wrong doctorDoom assignment for Tinkerer:`);
    console.log(block.trim());
  }
  if (block.includes('reedRichards') && block.includes('Human Torch')) {
    console.log(`[Issue #${issueIdx}] Has wrong reedRichards assignment for Human Torch:`);
    console.log(block.trim());
  }
  if (block.includes('cyclops') && block.includes('Vanisher')) {
    console.log(`[Issue #${issueIdx}] Has wrong cyclops assignment for Vanisher:`);
    console.log(block.trim());
  }
  if (block.includes('strangers-in-paradis')) {
    console.log(`[Issue #${issueIdx}] Has strangers-in-paradis non-marvel icon:`);
    console.log(block.trim());
  }
}
