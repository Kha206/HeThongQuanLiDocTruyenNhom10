const WebSocket = require('ws');
const axios = require('axios');

const QUERIES = [
  'Adrian Toomes',
  'Flint Marko'
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

  const verified = {};

  for (const q of QUERIES) {
    const url = `https://comicvine.gamespot.com/search/?i=character&q=${encodeURIComponent(q)}`;
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const results = [];
        const links = Array.from(document.querySelectorAll('a'))
          .filter(a => a.href && a.href.includes('/4005-'));
        for (const a of links) {
          const img = a.querySelector('img') || a.parentElement?.querySelector('img') || a.parentElement?.parentElement?.querySelector('img');
          const text = a.innerText.trim();
          if (img && img.src && img.src.includes('uploads')) {
            results.push({ name: text, href: a.href, img: img.src });
          }
        }
        return results;
      })()`,
      returnByValue: true
    });

    const items = evalRes?.result?.value || [];
    console.log(`\nQuery "${q}": found ${items.length} characters`);
    for (const it of items.slice(0, 3)) {
      console.log(`  - ${it.name} | ${it.href} | ${it.img}`);
    }
    if (items.length > 0) {
      verified[q] = items[0].img;
    }
  }

  ws.close();
  console.log('\n--- VERIFIED ICONS ---');
  console.log(JSON.stringify(verified, null, 2));
}

run().catch(console.error);
