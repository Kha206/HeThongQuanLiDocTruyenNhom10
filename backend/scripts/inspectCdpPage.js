const WebSocket = require('ws');

async function inspect() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/442804D160EC6290AF4A0FDE6548C123');

  await new Promise(r => ws.on('open', r));

  const send = (method, params) => new Promise(resolve => {
    const id = Math.floor(Math.random() * 100000);
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

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
        .map(i => ({ src: i.src, alt: i.alt, className: i.className }))
        .filter(i => i.src && i.src.includes('uploads'));
      
      const boxartImgs = Array.from(document.querySelectorAll('.imgboxart img, .img.imgboxart img, li .img img'))
        .map(i => ({
          src: i.src,
          alt: i.alt,
          title: i.parentElement?.parentElement?.querySelector('.title')?.innerText.trim() || i.title || ''
        }));

      return {
        title: document.title,
        url: window.location.href,
        totalBoxart: boxartImgs.length,
        boxartImgs
      };

      const charLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href && a.href.includes('/4005-'))
        .slice(0, 10)
        .map(a => {
          const img = a.querySelector('img') || a.parentElement?.querySelector('img');
          return {
            name: a.innerText.trim(),
            href: a.href,
            img: img ? img.src : null
          };
        });

      return {
        title: document.title,
        url: window.location.href,
        mainImg: mainImg?.src || null,
        nextIssue: nextIssueLink ? { text: nextIssueLink.innerText.trim(), href: nextIssueLink.href } : null,
        allImgs: allImgs.slice(0, 8),
        charLinks
      };
    })()`,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(res.result.value, null, 2));
  ws.close();
}

inspect().catch(console.error);
