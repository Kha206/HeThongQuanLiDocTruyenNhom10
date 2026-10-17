'use strict';
const { Chapter } = require('../src/models');
const fs = require('fs');

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
        charMap.set(name, { count: 0, currentIcons: new Set() });
      }
      const entry = charMap.get(name);
      entry.count++;
      if (ch.icon_url) entry.currentIcons.add(ch.icon_url);
    }
  }

  const list = [];
  for (const [name, data] of charMap.entries()) {
    list.push({
      name,
      count: data.count,
      icons: Array.from(data.currentIcons)
    });
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  console.log(JSON.stringify(list, null, 2));
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
