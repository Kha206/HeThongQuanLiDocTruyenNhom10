const WebSocket = require('ws');
const axios = require('axios');

const CHARACTERS = [
  { key: 'spiderMan', url: 'https://comicvine.gamespot.com/spider-man/4005-1443/' },
  { key: 'greenGoblin', url: 'https://comicvine.gamespot.com/green-goblin/4005-2030/' },
  { key: 'doctorOctopus', url: 'https://comicvine.gamespot.com/doctor-octopus/4005-1492/' },
  { key: 'vulture', url: 'https://comicvine.gamespot.com/vulture/4005-1502/' },
  { key: 'sandman', url: 'https://comicvine.gamespot.com/sandman/4005-1456/' },
  { key: 'doctorDoom', url: 'https://comicvine.gamespot.com/doctor-doom/4005-1468/' },
  { key: 'lizard', url: 'https://comicvine.gamespot.com/lizard/4005-1488/' },
  { key: 'electro', url: 'https://comicvine.gamespot.com/electro/4005-1498/' },
  { key: 'captainAmerica', url: 'https://comicvine.gamespot.com/captain-america/4005-1442/' },
  { key: 'ironMan', url: 'https://comicvine.gamespot.com/iron-man/4005-1455/' },
  { key: 'thor', url: 'https://comicvine.gamespot.com/thor/4005-2268/' },
  { key: 'hulk', url: 'https://comicvine.gamespot.com/hulk/4005-2267/' },
  { key: 'thanos', url: 'https://comicvine.gamespot.com/thanos/4005-7607/' },
  { key: 'wolverine', url: 'https://comicvine.gamespot.com/wolverine/4005-1440/' },
  { key: 'jjj', url: 'https://comicvine.gamespot.com/j-jonah-jameson/4005-1487/' }
];

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/442804D160EC6290AF4A0FDE6548C123');
  await new Promise(r => ws.on('open', r));

  const send = (method, params) => new Promise(resolve => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const results = {};

  for (const char of CHARACTERS) {
    console.log(`Navigating to ${char.key}...`);
    await send('Page.navigate', { url: char.url });
    await new Promise(r => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('.wiki-item-display img, .wiki-details img, .wiki-cover img, .profile-avatar img, a.image img');
        const all = Array.from(document.querySelectorAll('img'))
          .map(i => i.src)
          .filter(s => s && s.includes('uploads'));
        return {
          primary: img ? img.src : null,
          candidates: all.slice(0, 5)
        };
      })()`,
      returnByValue: true
    });

    const val = evalRes?.result?.value;
    const chosen = val?.primary || val?.candidates?.[0] || null;
    results[char.key] = chosen;
    console.log(` -> ${char.key}: ${chosen}`);
  }

  ws.close();
  console.log('\n--- FINAL CHAR RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
