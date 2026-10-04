const WebSocket = require('ws');
const axios = require('axios');

async function scrapeCivilWar() {
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

  await send('Page.navigate', { url: 'https://comicvine.gamespot.com/civil-war-1-whos-side-are-you-on/4000-104273/' });
  await new Promise(r => setTimeout(r, 3000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return Array.from(document.querySelectorAll('.imgboxart img, li .img img, .editorial img'))
        .map(i => ({ src: i.src, alt: i.alt }))
        .filter(x => x.src && x.src.includes('uploads'));
    })()`,
    returnByValue: true
  });

  const imgs = res?.result?.value || [];
  console.log('Civil War covers count:', imgs.length);
  for (let i = 0; i < imgs.length; i++) {
    console.log(`Issue #${i+1}: ${imgs[i].src}`);
  }
  ws.close();
}

scrapeCivilWar().catch(console.error);
