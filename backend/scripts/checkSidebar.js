const WebSocket = require('ws');
const axios = require('axios');

async function checkSidebar() {
  const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/442804D160EC6290AF4A0FDE6548C123');
  await new Promise(r => ws.on('open', r));

  const send = (method, params) => new Promise(res => {
    const id = Math.floor(Math.random() * 1000000);
    const h = (d) => {
      const m = JSON.parse(d);
      if (m.id === id) {
        ws.off('message', h);
        res(m.result);
      }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const urls = [
    { name: 'greenGoblin', url: 'https://comicvine.gamespot.com/green-goblin/4005-2030/' },
    { name: 'doctorOctopus', url: 'https://comicvine.gamespot.com/doctor-octopus/4005-1492/' },
    { name: 'vulture', url: 'https://comicvine.gamespot.com/vulture/4005-1502/' },
    { name: 'sandman', url: 'https://comicvine.gamespot.com/sandman/4005-1456/' },
    { name: 'lizard', url: 'https://comicvine.gamespot.com/lizard/4005-1488/' },
    { name: 'electro', url: 'https://comicvine.gamespot.com/electro/4005-1498/' }
  ];

  for (const item of urls) {
    await send('Page.navigate', { url: item.url });
    await new Promise(r => setTimeout(r, 2200));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Find image inside wiki sidebar or main profile
        const sidebar = document.querySelector('.wiki-details, aside, .wiki-boxart, .wiki-image');
        const img = sidebar ? sidebar.querySelector('img') : null;
        const all = Array.from(document.querySelectorAll('img'))
          .map(i => i.src)
          .filter(s => s && s.includes('uploads') && !s.includes('avatar') && !s.includes('loose'));
        return {
          sidebarImg: img ? img.src : null,
          firstUploadImg: all[0] || null
        };
      })()`,
      returnByValue: true
    });

    console.log(item.name, evalRes?.result?.value);
  }

  ws.close();
}

checkSidebar().catch(console.error);
