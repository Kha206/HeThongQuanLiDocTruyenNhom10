'use strict';
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'seedFromComicVine.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace salKennedy non-marvel icon
content = content.replace(
  `salKennedy: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/4/71924-12054-104922-1-strangers-in-paradis.jpg'`,
  `salKennedy: null`
);

// We want to sanitize the MARVEL_VOLUMES_CATALOG definition
// Let's load the catalog from file and reconstruct it or replace the invalid lines
// Notice the suspicious list we found:
const suspiciousReplacements = [
  // Spider-Man Ch.1
  {
    target: `{ name: 'J. Jonah Jameson', icon_url: CHAR_ICONS.peterParker }`,
    replacement: `{ name: 'J. Jonah Jameson', icon_url: CHAR_ICONS.jjj }`
  },
  // Spider-Man Ch.2
  {
    target: `{ name: 'Tinkerer', icon_url: CHAR_ICONS.doctorDoom }`,
    replacement: `{ name: 'Tinkerer', icon_url: null }`
  },
  // Spider-Man Ch.3
  {
    target: `{ name: 'Human Torch', icon_url: CHAR_ICONS.reedRichards }`,
    replacement: `{ name: 'Human Torch', icon_url: CHAR_ICONS.humanTorch }`
  },
  // Spider-Man Ch.5
  {
    target: `{ name: 'Flash Thompson', icon_url: CHAR_ICONS.peterParker }`,
    replacement: `{ name: 'Flash Thompson', icon_url: CHAR_ICONS.flashThompson }`
  },
  // Spider-Man Ch.8
  {
    target: `{ name: 'Living Brain', icon_url: CHAR_ICONS.doctorOctopus }`,
    replacement: `{ name: 'Living Brain', icon_url: null }`
  },
  // Spider-Man Ch.10
  {
    target: `{ name: 'Montana', icon_url: CHAR_ICONS.peterParker },\n          { name: 'Ox', icon_url: CHAR_ICONS.sandman },\n          { name: 'Fancy Dan', icon_url: CHAR_ICONS.vulture }`,
    replacement: `{ name: 'Montana', icon_url: null },\n          { name: 'Ox', icon_url: null },\n          { name: 'Fancy Dan', icon_url: null }`
  },
  // Spider-Man Ch.11
  {
    target: `{ name: 'Betty Brant', icon_url: CHAR_ICONS.peterParker }`,
    replacement: `{ name: 'Betty Brant', icon_url: null }`
  },
  // Spider-Man Ch.12
  {
    target: `{ name: 'J. Jonah Jameson', icon_url: CHAR_ICONS.peterParker }`,
    replacement: `{ name: 'J. Jonah Jameson', icon_url: CHAR_ICONS.jjj }`
  },
  // Civil War Ch.3
  {
    target: `{ name: 'Hercules', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'Hercules', icon_url: null }`
  },
  // Civil War Ch.4
  {
    target: `{ name: 'Goliath (Bill Foster)', icon_url: CHAR_ICONS.hulk }`,
    replacement: `{ name: 'Goliath (Bill Foster)', icon_url: null }`
  },
  // Civil War Ch.5
  {
    target: `{ name: 'Punisher', icon_url: CHAR_ICONS.wolverine }`,
    replacement: `{ name: 'Punisher', icon_url: null }`
  },
  // Civil War Ch.6
  {
    target: `{ name: 'Black Panther', icon_url: CHAR_ICONS.reedRichards }`,
    replacement: `{ name: 'Black Panther', icon_url: null }`
  },
  // Civil War Ch.8
  {
    target: `{ name: 'Speedball (Penance)', icon_url: CHAR_ICONS.spiderMan }`,
    replacement: `{ name: 'Speedball (Penance)', icon_url: null }`
  },
  // Infinity Gauntlet Ch.2
  {
    target: `{ name: 'Doctor Strange', icon_url: CHAR_ICONS.reedRichards }`,
    replacement: `{ name: 'Doctor Strange', icon_url: null }`
  },
  // Infinity Gauntlet Ch.5
  {
    target: `{ name: 'Eternity', icon_url: CHAR_ICONS.silverSurfer }`,
    replacement: `{ name: 'Eternity', icon_url: null }`
  },
  // Infinity Gauntlet Ch.8
  {
    target: `{ name: 'Living Tribunal', icon_url: CHAR_ICONS.thanos }`,
    replacement: `{ name: 'Living Tribunal', icon_url: null }`
  },
  // Infinity Gauntlet Ch.10
  {
    target: `{ name: 'Gamora', icon_url: CHAR_ICONS.thanos }`,
    replacement: `{ name: 'Gamora', icon_url: null }`
  },
  {
    target: `{ name: 'Pip the Troll', icon_url: CHAR_ICONS.nebula }`,
    replacement: `{ name: 'Pip the Troll', icon_url: null }`
  },
  // The Avengers Ch.3
  {
    target: `{ name: 'Namor the Sub-Mariner', icon_url: CHAR_ICONS.silverSurfer }`,
    replacement: `{ name: 'Namor the Sub-Mariner', icon_url: null }`
  },
  // The Avengers Ch.6
  {
    target: `{ name: 'Baron Zemo', icon_url: CHAR_ICONS.captainAmerica },\n          { name: 'Black Knight', icon_url: CHAR_ICONS.ironMan },\n          { name: 'Melter', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'Baron Zemo', icon_url: null },\n          { name: 'Black Knight', icon_url: null },\n          { name: 'Melter', icon_url: null }`
  },
  // The Avengers Ch.7
  {
    target: `{ name: 'Enchantress', icon_url: CHAR_ICONS.loki },\n          { name: 'Executioner', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'Enchantress', icon_url: null },\n          { name: 'Executioner', icon_url: null }`
  },
  // The Avengers Ch.8
  {
    target: `{ name: 'Kang the Conqueror', icon_url: CHAR_ICONS.doctorDoom }`,
    replacement: `{ name: 'Kang the Conqueror', icon_url: null }`
  },
  // The Avengers Ch.9
  {
    target: `{ name: 'Wonder Man (Simon Williams)', icon_url: CHAR_ICONS.ironMan },\n          { name: 'Baron Zemo', icon_url: CHAR_ICONS.captainAmerica }`,
    replacement: `{ name: 'Wonder Man (Simon Williams)', icon_url: null },\n          { name: 'Baron Zemo', icon_url: null }`
  },
  // The Avengers Ch.10
  {
    target: `{ name: 'Immortus', icon_url: CHAR_ICONS.doctorDoom }`,
    replacement: `{ name: 'Immortus', icon_url: null }`
  },
  // The Avengers Ch.11
  {
    target: `{ name: 'Hawkeye', icon_url: CHAR_ICONS.spiderMan },\n          { name: 'Scarlet Witch', icon_url: CHAR_ICONS.jeanGrey },\n          { name: 'Quicksilver', icon_url: CHAR_ICONS.cyclops }`,
    replacement: `{ name: 'Hawkeye', icon_url: null },\n          { name: 'Scarlet Witch', icon_url: null },\n          { name: 'Quicksilver', icon_url: null }`
  },
  // The Avengers Ch.13
  {
    target: `{ name: 'Count Nefaria', icon_url: CHAR_ICONS.doctorDoom }`,
    replacement: `{ name: 'Count Nefaria', icon_url: null }`
  },
  // The Avengers Ch.21
  {
    target: `{ name: 'Power Man (Erik Josten)', icon_url: CHAR_ICONS.thor },\n          { name: 'Enchantress (Amora)', icon_url: CHAR_ICONS.loki },\n          { name: 'Scarlet Witch', icon_url: CHAR_ICONS.jeanGrey },\n          { name: 'Hawkeye', icon_url: CHAR_ICONS.spiderMan },\n          { name: 'Quicksilver', icon_url: CHAR_ICONS.cyclops }`,
    replacement: `{ name: 'Power Man (Erik Josten)', icon_url: null },\n          { name: 'Enchantress (Amora)', icon_url: null },\n          { name: 'Scarlet Witch', icon_url: null },\n          { name: 'Hawkeye', icon_url: null },\n          { name: 'Quicksilver', icon_url: null }`
  },
  // Iron Man: Extremis Ch.1, Ch.7
  {
    target: `{ name: 'Sal Kennedy', icon_url: CHAR_ICONS.salKennedy }`,
    replacement: `{ name: 'Sal Kennedy', icon_url: null }`
  },
  // Iron Man: Extremis Ch.8
  {
    target: `{ name: 'Sentry', icon_url: CHAR_ICONS.captainAmerica }`,
    replacement: `{ name: 'Sentry', icon_url: null }`
  },
  // Iron Man: Extremis Ch.9
  {
    target: `{ name: 'Doctor Strange', icon_url: CHAR_ICONS.reedRichards }`,
    replacement: `{ name: 'Doctor Strange', icon_url: null }`
  },
  // Iron Man: Extremis Ch.10
  {
    target: `{ name: 'Nick Fury', icon_url: CHAR_ICONS.captainAmerica }`,
    replacement: `{ name: 'Nick Fury', icon_url: null }`
  },
  // Uncanny X-Men Ch.2
  {
    target: `{ name: 'Vanisher', icon_url: CHAR_ICONS.cyclops }`,
    replacement: `{ name: 'Vanisher', icon_url: null }`
  },
  // Uncanny X-Men Ch.3
  {
    target: `{ name: 'Blob (Fred Dukes)', icon_url: CHAR_ICONS.sandman }`,
    replacement: `{ name: 'Blob (Fred Dukes)', icon_url: null }`
  },
  // Uncanny X-Men Ch.4
  {
    target: `{ name: 'Quicksilver', icon_url: CHAR_ICONS.cyclops },\n          { name: 'Scarlet Witch', icon_url: CHAR_ICONS.jeanGrey },\n          { name: 'Toad', icon_url: CHAR_ICONS.beast }`,
    replacement: `{ name: 'Quicksilver', icon_url: null },\n          { name: 'Scarlet Witch', icon_url: null },\n          { name: 'Toad', icon_url: null }`
  },
  // Uncanny X-Men Ch.6
  {
    target: `{ name: 'Namor', icon_url: CHAR_ICONS.silverSurfer }`,
    replacement: `{ name: 'Namor', icon_url: null }`
  },
  // Uncanny X-Men Ch.7
  {
    target: `{ name: 'Blob', icon_url: CHAR_ICONS.sandman }`,
    replacement: `{ name: 'Blob', icon_url: null }`
  },
  // Uncanny X-Men Ch.8
  {
    target: `{ name: 'Unus the Untouchable', icon_url: CHAR_ICONS.sandman }`,
    replacement: `{ name: 'Unus the Untouchable', icon_url: null }`
  },
  // Uncanny X-Men Ch.10
  {
    target: `{ name: 'Ka-Zar', icon_url: CHAR_ICONS.wolverine }`,
    replacement: `{ name: 'Ka-Zar', icon_url: null }`
  },
  // Thor: God of Thunder Ch.3
  {
    target: `{ name: 'Shadrak', icon_url: CHAR_ICONS.loki }`,
    replacement: `{ name: 'Shadrak', icon_url: null }`
  },
  // Thor: God of Thunder Ch.6
  {
    target: `{ name: 'Young Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'Avenger Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'King Thor (Old All-Father)', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'Young Thor', icon_url: null },\n          { name: 'Avenger Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'King Thor (Old All-Father)', icon_url: null }`
  },
  // Thor: God of Thunder Ch.7
  {
    target: `{ name: 'Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'King Thor', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'King Thor', icon_url: null }`
  },
  // Thor: God of Thunder Ch.8
  {
    target: `{ name: 'King Thor', icon_url: CHAR_ICONS.thor },\n          { name: 'Avenger Thor', icon_url: CHAR_ICONS.thor }`,
    replacement: `{ name: 'King Thor', icon_url: null },\n          { name: 'Avenger Thor', icon_url: CHAR_ICONS.thor }`
  },
  // Secret Wars Ch.3
  {
    target: `{ name: 'Titania', icon_url: CHAR_ICONS.wolverine }`,
    replacement: `{ name: 'Titania', icon_url: null }`
  },
  // Secret Wars Ch.9
  {
    target: `{ name: 'Galactus', icon_url: CHAR_ICONS.silverSurfer }`,
    replacement: `{ name: 'Galactus', icon_url: null }`
  }
];

let applied = 0;
for (const item of suspiciousReplacements) {
  if (content.includes(item.target)) {
    content = content.replace(item.target, item.replacement);
    applied++;
  } else {
    // Try normalized CRLF
    const normalizedTarget = item.target.replace(/\n/g, '\r\n');
    const normalizedReplacement = item.replacement.replace(/\n/g, '\r\n');
    if (content.includes(normalizedTarget)) {
      content = content.replace(normalizedTarget, normalizedReplacement);
      applied++;
    } else {
      console.warn('Could not find target:', item.target);
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully applied ${applied} / ${suspiciousReplacements.length} replacements to seedFromComicVine.js!`);
