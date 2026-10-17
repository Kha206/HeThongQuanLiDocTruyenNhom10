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

  const res = await send('Runtime.evaluate', {
    expression: `(async () => {
      const r = await fetch('https://comicvine.gamespot.com/search/?q=Penance&indices%5B%5D=character');
      const html = await r.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items = Array.from(doc.querySelectorAll('li, div.media, div.media-body, article'));
      const found = [];
      doc.querySelectorAll('img[src*="uploads"]').forEach(img => {
        const link = img.closest('a');
        found.push({
          href: link ? link.href : '',
          src: img.src || img.getAttribute('data-src') || img.getAttribute('src')
        });
      });
      return found.slice(0, 10);
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Results:', res.result.value);

  ws.close();
  process.exit(0);
})();
