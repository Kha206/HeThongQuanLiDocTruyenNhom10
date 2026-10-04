const WebSocket = require('ws');
const http = require('http');

async function inspect(url) {
  const targetUrl = url || process.argv[2] || 'https://comicvine.gamespot.com/avengers-11/4000-1142989/';
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) {
    console.error('No CDP page available');
    return null;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 1000000);
    const h = (d) => {
      const m = JSON.parse(d);
      if (m.id === id) {
        ws.off('message', h);
        if (m.error) rej(m.error);
        else res(m.result);
      }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.navigate', { url: targetUrl });
  await new Promise(r => setTimeout(r, 3500));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const getMeta = (prop) => document.querySelector('meta[property="' + prop + '"]')?.content || document.querySelector('meta[name="' + prop + '"]')?.content;
      const img = document.querySelector('.imgboxart img, .wiki-boxart img, .art-module img')?.src || getMeta('og:image');
      const title = document.querySelector('h1, .wiki-title')?.innerText || getMeta('og:title');
      const desc = getMeta('og:description') || document.querySelector('.wiki-deck')?.innerText;
      
      const volLink = document.querySelector('a[href*="/4050-"]');
      const volumeId = volLink ? volLink.href.match(/4050-(\\d+)/)?.[1] : null;
      const volumeTitle = volLink?.innerText;

      // Extract issue number
      const bodyText = document.body.innerText;
      const numMatch = (title && title.match(/#(\\d+)/)) || bodyText.match(/Issue Number\\s*(\\d+)/i);
      const issueNumber = numMatch ? numMatch[1] : null;

      // Extract date
      const dateMatch = bodyText.match(/Cover Date\\s*([A-Za-z]+\\s+\\d{4})/i) ||
                        bodyText.match(/In Store Date\\s*([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4})/i) ||
                        bodyText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{4}/i);
      const releaseDate = dateMatch ? dateMatch[1] : null;

      return {
        url: window.location.href,
        title: title ? title.trim() : null,
        issueNumber,
        img,
        desc: desc ? desc.trim() : null,
        volumeId,
        volumeTitle: volumeTitle ? volumeTitle.trim() : null,
        releaseDate
      };
    })()`,
    returnByValue: true
  });

  const res = evalRes?.result?.value;
  console.log('Result:', JSON.stringify(res, null, 2));
  ws.close();
  return res;
}

if (require.main === module) {
  inspect().catch(console.error);
}

module.exports = { inspect };
