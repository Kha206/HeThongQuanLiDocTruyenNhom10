const WebSocket = require('ws');
const axios = require('axios');

const VILLAINS = [
  { name: 'greenGoblin', url: 'https://comicvine.gamespot.com/green-goblin/4005-2030/images/' },
  { name: 'doctorOctopus', url: 'https://comicvine.gamespot.com/doctor-octopus/4005-1492/images/' },
  { name: 'vulture', url: 'https://comicvine.gamespot.com/vulture/4005-1502/images/' },
  { name: 'sandman', url: 'https://comicvine.gamespot.com/sandman/4005-1456/images/' },
  { name: 'lizard', url: 'https://comicvine.gamespot.com/lizard/4005-1488/images/' },
  { name: 'electro', url: 'https://comicvine.gamespot.com/electro/4005-1498/images/' }
];

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/442804D160EC6290AF4A0FDE6548C123');
  await new Promise(r => ws.on('open', r));

  const send = (method, params) => new Promise(res => {
    const id = Math.floor(Math.random() * 1000000);
    const h = (d) => {
      const m = JSON.parse(d);
      if (m.id === id) {
        ws.off('message', h);
        res(m.result);
      }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const results = {};

  for (const v of VILLAINS) {
    await send('Page.navigate', { url: v.url });
    await new Promise(r => setTimeout(r, 2200));

    const r = await send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = Array.from(document.querySelectorAll('img'))
          .map(i => i.src)
          .filter(s => s && s.includes('uploads') && (s.includes('scale_small') || s.includes('scale_medium') || s.includes('square_small')));
        return imgs.slice(0, 3);
      })()`,
      returnByValue: true
    });

    results[v.name] = r?.result?.value?.[0] || null;
    console.log(v.name, '=>', results[v.name]);
  }

  ws.close();
  console.log('\n--- VERIFYING ---');
  for (const [name, url] of Object.entries(results)) {
    if (url) {
      try {
        const check = await axios.head(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`[OK] ${name}: ${check.status} (${url})`);
      } catch (e) {
        console.log(`[FAIL] ${name}: ${e.message}`);
      }
    }
  }
}

run().catch(console.error);
