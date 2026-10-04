const http = require('http');
const WebSocket = require('ws');

async function inspect() {
  const targetUrl = 'https://comicvine.gamespot.com/avengers-13/4000-1142987/';
  
  const page = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 9222,
      path: '/json/new?' + encodeURIComponent(targetUrl),
      method: 'PUT'
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  await new Promise(r => setTimeout(r, 4000));

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = Math.floor(Math.random() * 100000);
    ws.send(JSON.stringify({ id, method, params }));
    const h = (d) => {
      const msg = JSON.parse(d);
      if (msg.id === id) {
        ws.off('message', h);
        resolve(msg.result);
      }
    };
    ws.on('message', h);
  });

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const getMeta = (p) => document.querySelector('meta[property="' + p + '"]')?.content || document.querySelector('meta[name="' + p + '"]')?.content;
      const boxImg = document.querySelector('.imgboxart img, .wiki-boxart img, .art-module img, .pod-gallery img');
      return {
        title: document.title,
        h1: document.querySelector('h1')?.innerText,
        boxImgSrc: boxImg?.src,
        ogImage: getMeta('og:image'),
        ogTitle: getMeta('og:title'),
        ogDesc: getMeta('og:description'),
        allImages: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, className: i.className })).slice(0, 15)
      };
    })()`,
    returnByValue: true
  });

  console.log('=== REAL DATA FROM COMICVINE FOR 1142987 ===');
  console.log(JSON.stringify(evalRes, null, 2));

  ws.close();
  http.get(`http://127.0.0.1:9222/json/close/${page.id}`, () => {});
}

inspect().catch(console.error);
