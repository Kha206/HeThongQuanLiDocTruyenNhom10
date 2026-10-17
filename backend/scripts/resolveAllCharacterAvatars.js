const http = require('http');
const WebSocket = require('ws');
const { Chapter } = require('../src/models');

(async () => {
  const list = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = list.find(p => p.url.includes('comicvine.gamespot.com'));
  if (!page) {
    console.error('No comicvine page found in Chrome');
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (method, params = {}) => new Promise((res) => {
    const msgId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === msgId) {
        ws.off('message', handler);
        res(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  // Target character queries to fetch from ComicVine
  const queryMap = {
    'Tinkerer': 'Phineas Mason',
    'Living Brain': 'Living Brain',
    'Montana': 'Montana',
    'Ox': 'Raymond Bloch',
    'Fancy Dan': 'Fancy Dan',
    'Betty Brant': 'Betty Brant',
    'Hercules': 'Hercules',
    'Goliath (Bill Foster)': 'Bill Foster',
    'Punisher': 'Punisher',
    'Black Panther': 'Black Panther',
    'Speedball (Penance)': 'Robbie Baldwin',
    'Eternity': 'Eternity',
    'Living Tribunal': 'Living Tribunal',
    'Gamora': 'Gamora',
    'Pip the Troll': 'Pip the Troll',
    'Namor the Sub-Mariner': 'Namor',
    'Namor': 'Namor the Sub-Mariner',
    'Baron Zemo': 'Helmut Zemo',
    'Black Knight': 'Dane Whitman',
    'Melter': 'Bruno Horgan',
    'Enchantress': 'Amora the Enchantress',
    'Executioner': 'Skurge the Executioner',
    'Kang the Conqueror': 'Kang the Conqueror',
    'Wonder Man (Simon Williams)': 'Wonder Man',
    'Wonder Man': 'Simon Williams',
    'Immortus': 'Immortus',
    'Sal Kennedy': 'Sal Kennedy',
    'Sentry': 'Robert Reynolds',
    'Nick Fury': 'Nick Fury',
    'Marvel Girl (Jean Grey)': 'Marvel Girl',
    'Angel': 'Warren Worthington III',
    'Iceman': 'Bobby Drake',
    'Vanisher': 'Telford Porter',
    'Blob (Fred Dukes)': 'Fred J. Dukes',
    'Blob': 'The Blob',
    'Toad': 'Mortimer Toynbee',
    'Unus the Untouchable': 'Angelo Unuscione',
    'Ka-Zar': 'Kevin Plunder',
    'Shadrak': 'Shadrak',
    'Titania': 'Mary MacPherran',
    'Galactus': 'Galactus',
    'Monica Rambeau': 'Monica Rambeau',
    'Shang-Chi': 'Shang-Chi',
    // Duplicate disambiguations:
    'Spider-Man (Black Suit)': 'Alien Costume',
    'Doctor Doom (God Doom)': 'God Emperor Doom',
    'Tony Stark': 'Tony Stark',
    'Iron Man (Tony Stark)': 'Iron Man Model 1',
    'Thor (Clone Ragnarok)': 'Ragnarok',
    'Thor (Present)': 'Thor Odinson',
    'Young Thor': 'Young Thor',
    'Young Thor (Viking Era)': 'Thor Jarnbjorn',
    'King Thor': 'King Thor',
    'King Thor (Old All-Father)': 'Old King Thor',
    'Avenger Thor': 'Thor Odinson',
    'Gorr the God Butcher': 'Gorr the God Butcher',
    'Gorr': 'Gorr',
    'Vulture (Adrian Toomes)': 'Adrian Toomes',
    'Vulture': 'Vulture'
  };

  const fetchedIcons = {};

  for (const [charName, searchKeyword] of Object.entries(queryMap)) {
    try {
      const fetchRes = await send('Runtime.evaluate', {
        expression: `(async () => {
          const query = '${searchKeyword.replace(/'/g, "\\'")}';
          const url = 'https://comicvine.gamespot.com/search/?q=' + encodeURIComponent(query) + '&indices%5B%5D=character';
          const r = await fetch(url);
          const text = await r.text();
          const doc = new DOMParser().parseFromString(text, 'text/html');
          const items = Array.from(doc.querySelectorAll('li.wiki-item, li.media-item, .search-results li'));
          for (const it of items) {
            const fullText = it.textContent;
            const imgEl = it.querySelector('img[src*="uploads"]');
            if (imgEl && (fullText.includes('Marvel') || fullText.includes('Character') || fullText.includes('issues'))) {
              const src = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
              return {
                charName: '${charName}',
                title: it.querySelector('.title, h3, a')?.textContent?.trim(),
                img: src
              };
            }
          }
          // Fallback to any image found
          const anyImg = doc.querySelector('img[src*="uploads"]');
          if (anyImg) {
            return {
              charName: '${charName}',
              img: anyImg.src || anyImg.getAttribute('data-src')
            };
          }
          return { charName: '${charName}', notFound: true };
        })()`,
        awaitPromise: true,
        returnByValue: true
      });

      const data = fetchRes.result.value;
      if (data && data.img) {
        fetchedIcons[charName] = data.img;
        console.log(`[OK] ${charName} -> ${data.img}`);
      } else {
        console.warn(`[FAIL] ${charName} (searchKeyword: ${searchKeyword})`);
      }
    } catch (e) {
      console.error(`[ERROR] ${charName}:`, e.message);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // Save the fetched map to a json file
  const fs = require('fs');
  fs.writeFileSync('backend/scripts/fetchedCharacterIcons.json', JSON.stringify(fetchedIcons, null, 2));
  console.log('\nSaved all fetched icons to backend/scripts/fetchedCharacterIcons.json');
  console.log(`Total resolved: ${Object.keys(fetchedIcons).length} / ${Object.keys(queryMap).length}`);

  ws.close();
  process.exit(0);
})();
