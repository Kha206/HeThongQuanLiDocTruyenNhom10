const http = require('http');
const WebSocket = require('ws');

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
  const send = (method, params = {}) => new Promise((res) => {
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

  const testNames = [
    'Punisher',
    'Hercules',
    'Sentry',
    'Galactus',
    'Nick Fury',
    'Kang the Conqueror',
    'Spider-Man (Black Suit)',
    'Ragnarok',
    'King Thor'
  ];

  const results = {};

  for (const name of testNames) {
    const res = await send('Runtime.evaluate', {
      expression: `(async () => {
        const query = '${name.replace(/'/g, "\\'")}';
        const url = 'https://comicvine.gamespot.com/search/?q=' + encodeURIComponent(query) + '&indices%5B%5D=character';
        const r = await fetch(url);
        const text = await r.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const items = Array.from(doc.querySelectorAll('li.wiki-item, li.media-item, .search-results li'));
        for (const it of items) {
          const text = it.textContent;
          const imgEl = it.querySelector('img[src*="uploads"]');
          if (imgEl && (text.includes('Marvel') || text.includes('Character'))) {
            const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
            return {
              name: query,
              title: it.querySelector('.title, h3, a')?.textContent?.trim(),
              img: src
            };
          }
        }
        return { name: query, notFound: true };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    results[name] = res.result.value;
    console.log(`Fetched ${name}:`, res.result.value?.img ? 'OK' : 'Not found', res.result.value?.img);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\nResults Summary:', JSON.stringify(results, null, 2));

  ws.close();
  process.exit(0);
})();
