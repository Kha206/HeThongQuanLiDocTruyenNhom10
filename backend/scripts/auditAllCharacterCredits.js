'use strict';
const { MARVEL_VOLUMES_CATALOG } = require('./seedFromComicVine');

let mismatches = [];

for (const vol of MARVEL_VOLUMES_CATALOG) {
  for (const iss of vol.issues || []) {
    for (const char of iss.character_credits || []) {
      if (char.icon_url) {
        mismatches.push({
          volume: vol.title,
          issue: iss.chapter_number,
          charName: char.name,
          iconUrl: char.icon_url
        });
      }
    }
  }
}

console.log(`Total character credits with icon_url: ${mismatches.length}`);

// Check icon to character mapping
const validAssignments = {
  'spider-man': ['spider-man', 'peter parker'],
  'peter parker': ['spider-man', 'peter parker'],
  'green goblin': ['green goblin', 'norman osborn'],
  'doctor octopus': ['doctor octopus', 'otto octavius', 'doc ock'],
  'vulture': ['vulture'],
  'sandman': ['sandman'],
  'lizard': ['lizard', 'curt connors'],
  'electro': ['electro'],
  'chameleon': ['chameleon'],
  'doctor doom': ['doctor doom', 'victor von doom'],
  'captain america': ['captain america', 'steve rogers'],
  'iron man': ['iron man', 'tony stark'],
  'thor': ['thor', 'avenger thor', 'thor (present)'],
  'hulk': ['hulk', 'bruce banner'],
  'thanos': ['thanos'],
  'wolverine': ['wolverine', 'logan'],
  'j. jonah jameson': ['j. jonah jameson', 'jjj'],
  'aunt may': ['aunt may', 'may parker'],
  'flash thompson': ['flash thompson'],
  'human torch': ['human torch', 'johnny storm'],
  'mr. fantastic': ['mr. fantastic', 'mister fantastic', 'reed richards'],
  'ant-man': ['ant-man', 'hank pym'],
  'wasp': ['wasp', 'janet van dyne'],
  'loki': ['loki'],
  'cyclops': ['cyclops', 'scott summers'],
  'jean grey': ['jean grey', 'marvel girl'],
  'magneto': ['magneto', 'erik lehnsherr'],
  'silver surfer': ['silver surfer', 'norrin radd'],
  'adam warlock': ['adam warlock'],
  'mephisto': ['mephisto'],
  'nebula': ['nebula'],
  'mistress death': ['mistress death', 'death'],
  'gorr': ['gorr', 'gorr the god butcher'],
  'beyonder': ['beyonder'],
  'mallen': ['mallen'],
  'maya hansen': ['maya hansen']
};

let suspicious = [];
for (const m of mismatches) {
  let matched = false;
  const lowerName = m.charName.toLowerCase();
  for (const [key, aliases] of Object.entries(validAssignments)) {
    if (aliases.some(a => lowerName.includes(a))) {
      matched = true;
      break;
    }
  }
  if (!matched) {
    suspicious.push(m);
  }
}

console.log(`Suspicious character icon assignments: ${suspicious.length}`);
suspicious.forEach(s => {
  console.log(`- [${s.volume} Ch.${s.issue}] "${s.charName}" has icon: ${s.iconUrl}`);
});
