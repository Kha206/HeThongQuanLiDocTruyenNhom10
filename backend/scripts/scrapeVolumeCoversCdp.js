const WebSocket = require('ws');
const http = require('http');

function getCdpPageId() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const tabs = JSON.parse(d);
        // Find a background tab or new tab
        const bg = tabs.find(t => t.url.includes('newtab') || t.url.includes('comicvine') || t.title.includes('New Tab'));
        if (bg) resolve(bg.id);
        else resolve(tabs[0].id);
      });
    }).on('error', reject);
  });
}

async function scrapeVolume(volumeUrl) {
  const pageId = await getCdpPageId();
  console.log('Using CDP Tab ID:', pageId);

  const ws = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${pageId}`);
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

  console.log(`Navigating to ${volumeUrl}...`);
  await send('Page.navigate', { url: volumeUrl });
  await new Promise(r => setTimeout(r, 4500));

  const extractCode = `(() => {
    const results = [];
    const elements = document.querySelectorAll('.issue-grid li, .editorial li, .wiki-details-list li, ul.editorial li, .grid li, .editorial-river li, .imgboxart, .wiki-item-display, .image-detail');
    for (const el of elements) {
      const a = el.querySelector('a') || (el.tagName === 'A' ? el : null);
      const img = el.querySelector('img') || (el.tagName === 'IMG' ? el : null);
      const titleEl = el.querySelector('.title, h3, .name, .issue-number');
      const src = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;
      if (src && src.includes('uploads')) {
        results.push({
          href: a ? a.href : null,
          cover: src,
          title: titleEl ? titleEl.textContent.trim() : (img ? img.alt : '')
        });
      }
    }
    const singleImg = document.querySelector('.imgboxart img, .wiki-item-display img, .primary-image img, #view-full-size');
    if (singleImg && results.length === 0) {
      results.push({
        href: window.location.href,
        cover: singleImg.src || singleImg.getAttribute('data-src'),
        title: document.title
      });
    }
    return {
      title: document.title,
      currentUrl: window.location.href,
      count: results.length,
      items: results
    };
  })()`;

  const evalRes = await send('Runtime.evaluate', {
    expression: extractCode,
    returnByValue: true
  });

  ws.close();
  return evalRes?.result?.value;
}

async function main() {
  const url = process.argv[2] || 'https://comicvine.gamespot.com/the-avengers/4050-2128/?page=5';
  console.log('Scraping volume URL:', url);
  const data = await scrapeVolume(url);
  console.log('Scrape result summary:', {
    title: data?.title,
    currentUrl: data?.currentUrl,
    count: data?.count
  });
  if (data?.items) {
    console.log(`All ${data.items.length} items:`);
    console.table(data.items);
  }
}

main().catch(console.error);
