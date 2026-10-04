const WebSocket = require('ws');
const axios = require('axios');

const SERIES = [
  { key: 'secretWars', url: 'https://comicvine.gamespot.com/secret-wars-1-the-war-begins/4000-24320/' },
  { key: 'infinityGauntlet', url: 'https://comicvine.gamespot.com/the-infinity-gauntlet-1-god/4000-34375/' },
  { key: 'xmen', url: 'https://comicvine.gamespot.com/the-x-men-1-x-men/4000-6831/' },
  { key: 'avengers', url: 'https://comicvine.gamespot.com/the-avengers-1-the-coming-of-the-avengers/4000-6712/' },
  { key: 'thor', url: 'https://comicvine.gamespot.com/thor-god-of-thunder-1-the-god-butcher-part-one-a-w/4000-369408/' },
  { key: 'ironman', url: 'https://comicvine.gamespot.com/iron-man-1-extremis-part-1-of-6/4000-104921/' }
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

  const output = {};

  for (const s of SERIES) {
    console.log(`Navigating to ${s.key}...`);
    await send('Page.navigate', { url: s.url });
    await new Promise(r => setTimeout(r, 2800));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        return Array.from(document.querySelectorAll('.imgboxart img, li .img img'))
          .map(i => i.src)
          .filter(src => src && src.includes('uploads') && (src.includes('scale_small') || src.includes('scale_medium')));
      })()`,
      returnByValue: true
    });

    const imgs = evalRes?.result?.value || [];
    output[s.key] = imgs;
    console.log(`Found ${imgs.length} covers for ${s.key}`);
  }

  ws.close();
  console.log('\n--- ALL SCRAPED COVERS ---');
  console.log(JSON.stringify(output, null, 2));
}

run().catch(console.error);
