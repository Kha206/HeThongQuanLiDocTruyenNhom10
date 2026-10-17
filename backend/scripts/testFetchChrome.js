const WebSocket = require('ws');

async function run() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/8A826D50B476FA5E9D03E295EF10079D');
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

  const res = await send('Runtime.evaluate', {
    expression: `(async () => {
      const resp = await fetch("https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111129651/5756915-200605%20iron%20man%20%20-%20unknown%20%236%20-%20page%201.jpg");
      const blob = await resp.blob();
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  const b64 = res?.result?.value;
  if (b64) {
    const buf = Buffer.from(b64, 'base64');
    console.log('Fetched buffer bytes from Chrome:', buf.length);
    const crypto = require('crypto');
    const fs = require('fs');
    const path = require('path');
    const u = 'https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111129651/5756915-200605%20iron%20man%20%20-%20unknown%20%236%20-%20page%201.jpg';
    const hash = crypto.createHash('md5').update(u).digest('hex');
    fs.writeFileSync(path.join(__dirname, '../uploads/cache', `${hash}.cache`), buf);
    console.log(`Saved ${hash}.cache (${buf.length} bytes)`);
  }
  ws.close();
}
run().catch(console.error);
