'use strict';
const { Chapter } = require('../src/models');

async function run() {
  const chapters = await Chapter.findAll();
  const charMap = new Map();

  for (const c of chapters) {
    const credits = Array.isArray(c.character_credits)
      ? c.character_credits
      : (typeof c.character_credits === 'string' ? JSON.parse(c.character_credits || '[]') : []);

    for (const ch of credits) {
      if (!ch || !ch.name) continue;
      const name = ch.name.trim();
      if (!charMap.has(name)) {
        charMap.set(name, { count: 0, icons: new Set(), chapters: [] });
      }
      const entry = charMap.get(name);
      entry.count++;
      if (ch.icon_url) entry.icons.add(ch.icon_url);
      entry.chapters.push(c.id);
    }
  }

  console.log(`=== UNIQUE CHARACTERS IN DATABASE (${charMap.size}) ===\n`);
  const sortedNames = Array.from(charMap.keys()).sort();
  for (const name of sortedNames) {
    const entry = charMap.get(name);
    const iconList = Array.from(entry.icons);
    console.log(`- "${name}": appears in ${entry.count} chapter(s). Icons (${iconList.length}): ${iconList.join(', ') || 'NONE (NULL)'}`);
  }
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
