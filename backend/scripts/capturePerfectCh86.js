const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

(async () => {
  const list = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = list.find(p => p.url.includes('localhost:5173')) || list[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (m, p = {}) => new Promise(res => {
    const msgId = id++;
    const h = d => {
      const msg = JSON.parse(d);
      if (msg.id === msgId) { ws.off('message', h); res(msg.result); }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id: msgId, method: m, params: p }));
  });

  // Navigate to Thor 6
  await send('Page.navigate', { url: 'http://localhost:5173/stories/7/chapters/154' });
  await new Promise(r => setTimeout(r, 2500));

  const rect = await send('Runtime.evaluate', {
    expression: `(() => {
      const allSecs = Array.from(document.querySelectorAll('section'));
      const sec = allSecs.find(s => s.textContent.toLowerCase().includes('nhân vật xuất hiện'));
      if (sec) {
        sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        return true;
      }
      return false;
    })()`,
    returnByValue: true
  });
  console.log('Scrolled to section in Thor 6:', rect.result.value);

  await new Promise(r => setTimeout(r, 1000));
  const s = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Kha/.gemini/antigravity-ide/brain/388b07b7-146b-4ecf-a430-b3985e9f21d6/thor6_three_thors_distinct.png', Buffer.from(s.data, 'base64'));
  console.log('Saved Thor 6 screenshot!');

  ws.close();
  process.exit(0);
})();
