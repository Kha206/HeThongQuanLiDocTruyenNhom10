const WebSocket = require('ws');

const ISSUES = [
  'https://comicvine.gamespot.com/the-amazing-spider-man-2-the-vulture-the-terrible-t/4000-6423/',
  'https://comicvine.gamespot.com/the-amazing-spider-man-3-spider-man-versus-doctor-o/4000-6424/',
  'https://comicvine.gamespot.com/the-amazing-spider-man-4-nothing-can-stop-the-sandm/4000-6425/',
  'https://comicvine.gamespot.com/the-amazing-spider-man-6-face-to-face-with-the-liza/4000-6427/',
  'https://comicvine.gamespot.com/the-amazing-spider-man-9-the-man-called-electro/4000-6430/',
  'https://comicvine.gamespot.com/the-amazing-spider-man-14-the-grotesque-adventure-/4000-6435/'
];

async function run() {
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

  const allChars = [];

  for (const url of ISSUES) {
    console.log('Navigating to ' + url);
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        return Array.from(document.querySelectorAll('a'))
          .filter(a => a.href && a.href.includes('/4005-'))
          .map(a => {
            const img = a.querySelector('img') || a.parentElement?.querySelector('img');
            return {
              name: a.innerText.trim(),
              href: a.href,
              img: img ? img.src : null
            };
          })
          .filter(x => x.name && x.img && x.img.includes('uploads'));
      })()`,
      returnByValue: true
    });

    const chars = evalRes?.result?.value || [];
    console.log('Found ' + chars.length + ' chars in ' + url);
    chars.forEach(c => console.log('  -', c.name, ':', c.img));
    allChars.push(...chars);
  }

  ws.close();
}

run().catch(console.error);
