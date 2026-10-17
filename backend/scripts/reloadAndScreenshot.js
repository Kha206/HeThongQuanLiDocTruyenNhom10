const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

function getActiveTabId() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const tabs = JSON.parse(d);
        const t = tabs.find(x => x.url.includes('5173') || x.title.includes('Marvel'));
        resolve(t ? t.id : tabs[0].id);
      });
    }).on('error', reject);
  });
}

async function run() {
  const tabId = await getActiveTabId();
  console.log('Reloading Tab ID:', tabId);

  const ws = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${tabId}`);
  await new Promise(r => ws.on('open', r));

  const send = (m, p) => new Promise(res => {
    const id = Math.floor(Math.random() * 1000000);
    const h = d => {
      const msg = JSON.parse(d);
      if (msg.id === id) { ws.off('message', h); res(msg.result); }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method: m, params: p }));
  });

  // Hard reload
  console.log('Navigating to http://localhost:5173/stories/2 with cache clear...');
  await send('Page.navigate', { url: 'http://localhost:5173/stories/2' });
  await new Promise(r => setTimeout(r, 4000));

  // Scroll to chapter list
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('.grid');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // Capture screenshot
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(screenshotRes.data, 'base64');
  const outPath = path.join('C:\\Users\\Kha\\.gemini\\antigravity-ide\\brain\\388b07b7-146b-4ecf-a430-b3985e9f21d6', 'civil_war_verified_fresh.png');
  fs.writeFileSync(outPath, buf);
  console.log('Saved screenshot to:', outPath);

  ws.close();
}

run().catch(console.error);
