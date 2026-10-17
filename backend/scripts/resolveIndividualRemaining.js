const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

(async () => {
  const list = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = list.find(p => p.url.includes('comicvine.gamespot.com'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const msgId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === msgId) {
        ws.off('message', handler);
        res(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  const targets = [
    { name: 'Namor the Sub-Mariner', q: 'Namor 1968' },
    { name: 'Blob (Fred Dukes)', q: 'Fred Dukes' },
    { name: 'Gorr the God Butcher', q: 'God Butcher' },
    { name: 'Wonder Man (Simon Williams)', q: 'Wonder Man Simon Williams' }
  ];

  const fetched = {};

  for (const t of targets) {
    const res = await send('Runtime.evaluate', {
      expression: `(async () => {
        const r = await fetch('https://comicvine.gamespot.com/search/?q=' + encodeURIComponent('${t.q}') + '&indices%5B%5D=character');
        const html = await r.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const items = Array.from(doc.querySelectorAll('li.wiki-item, li.media-item, .search-results li'));
        const imgs = [];
        for (const it of items) {
          const img = it.querySelector('img[src*="uploads"]');
          if (img) imgs.push(img.src || img.getAttribute('data-src'));
        }
        return imgs;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log(t.name, res.result.value);
    fetched[t.name] = res.result.value;
  }

  ws.close();
  process.exit(0);
})();
