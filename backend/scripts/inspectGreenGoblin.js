const WebSocket = require('ws');

async function testWiki() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/442804D160EC6290AF4A0FDE6548C123');
  await new Promise(r => ws.on('open', r));

  const send = (method, params) => new Promise(resolve => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.navigate', { url: 'https://comicvine.gamespot.com/green-goblin/4005-2030/' });
  await new Promise(r => setTimeout(r, 2500));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        title: document.title,
        href: window.location.href,
        imgs: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt })).filter(i => i.src && i.src.includes('uploads')).slice(0, 10)
      };
    })()`,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(res?.result?.value, null, 2));
  ws.close();
}

testWiki().catch(console.error);
