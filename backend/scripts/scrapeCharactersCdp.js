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
  if (!page) {
    console.error('No comicvine page found', list.map(l => l.url));
    process.exit(1);
  }
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

  const query = 'Black Panther';
  const testRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const url = 'https://comicvine.gamespot.com/search/?q=' + encodeURIComponent('${query}') + '&indices%5B%5D=character';
      const r = await fetch(url);
      const text = await r.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const items = Array.from(doc.querySelectorAll('li.wiki-item, li.media-item, .search-results li'));
      const parsed = [];
      for (const it of items) {
        const titleEl = it.querySelector('.title, h3, a');
        const imgEl = it.querySelector('img[src*="uploads"]');
        if (titleEl && imgEl) {
          parsed.push({
            title: titleEl.textContent.trim(),
            img: imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('src')
          });
        }
      }
      return {
        url,
        count: parsed.length,
        items: parsed.slice(0, 5)
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Test Result:', JSON.stringify(testRes.result.value, null, 2));

  ws.close();
  process.exit(0);
})();
