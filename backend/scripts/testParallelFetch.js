const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

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
    console.error('No comicvine page found');
    process.exit(1);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const send = (method, params = {}) => new Promise((res, rej) => {
    const msgId = id++;
    const timer = setTimeout(() => {
      ws.off('message', handler);
      rej(new Error('CDP send timeout for ' + method));
    }, 30000);
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === msgId) {
        clearTimeout(timer);
        ws.off('message', handler);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  const queryMap = {
    'Tinkerer': 'Phineas Mason',
    'Living Brain': 'Living Brain',
    'Montana': 'Montana',
    'Ox': 'Raymond Bloch',
    'Fancy Dan': 'Fancy Dan',
    'Betty Brant': 'Betty Brant',
    'Hercules': 'Hercules Marvel',
    'Goliath (Bill Foster)': 'Bill Foster',
    'Punisher': 'Frank Castle Punisher',
    'Black Panther': 'T\'Challa Black Panther',
    'Speedball (Penance)': 'Robbie Baldwin',
    'Eternity': 'Eternity Marvel',
    'Living Tribunal': 'Living Tribunal',
    'Gamora': 'Gamora Marvel',
    'Pip the Troll': 'Pip the Troll',
    'Namor the Sub-Mariner': 'Namor Marvel',
    'Namor': 'Namor the Sub-Mariner',
    'Baron Zemo': 'Helmut Zemo',
    'Black Knight': 'Dane Whitman',
    'Melter': 'Bruno Horgan',
    'Enchantress': 'Amora Enchantress',
    'Executioner': 'Skurge Executioner',
    'Kang the Conqueror': 'Kang the Conqueror',
    'Wonder Man (Simon Williams)': 'Simon Williams',
    'Wonder Man': 'Wonder Man Marvel',
    'Immortus': 'Immortus Marvel',
    'Sal Kennedy': 'Sal Kennedy',
    'Sentry': 'Robert Reynolds Sentry',
    'Nick Fury': 'Nick Fury Marvel',
    'Marvel Girl (Jean Grey)': 'Jean Grey Marvel Girl',
    'Angel': 'Warren Worthington Angel',
    'Iceman': 'Bobby Drake Iceman',
    'Vanisher': 'Telford Porter',
    'Blob (Fred Dukes)': 'Fred Dukes Blob',
    'Blob': 'The Blob Marvel',
    'Toad': 'Mortimer Toynbee',
    'Unus the Untouchable': 'Angelo Unuscione',
    'Ka-Zar': 'Kevin Plunder Ka-Zar',
    'Shadrak': 'Shadrak Marvel',
    'Titania': 'Mary MacPherran Titania',
    'Galactus': 'Galactus Marvel',
    'Monica Rambeau': 'Monica Rambeau Spectrum',
    'Shang-Chi': 'Shang-Chi Marvel',
    // Distinct icons for variants:
    'Spider-Man (Black Suit)': 'Alien Costume Symbiote',
    'Doctor Doom (God Doom)': 'God Emperor Doom',
    'Tony Stark': 'Tony Stark Iron Man',
    'Iron Man (Tony Stark)': 'Iron Man Model 1',
    'Thor (Clone Ragnarok)': 'Ragnarok Clone',
    'Thor (Present)': 'Thor Odinson Marvel',
    'Young Thor': 'Young Thor Viking',
    'Young Thor (Viking Era)': 'Thor Jarnbjorn',
    'King Thor': 'King Thor All-Father',
    'King Thor (Old All-Father)': 'Old King Thor',
    'Avenger Thor': 'Thor Avengers',
    'Gorr the God Butcher': 'Gorr the God Butcher',
    'Gorr': 'Gorr Marvel',
    'Vulture (Adrian Toomes)': 'Adrian Toomes Vulture',
    'Vulture': 'Vulture Marvel'
  };

  const entries = Object.entries(queryMap);
  console.log(`Processing ${entries.length} characters in batches of 5...`);

  const results = {};
  const batchSize = 5;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    console.log(`\nBatch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(entries.length / batchSize)}: ${batch.map(b => b[0]).join(', ')}`);

    const batchRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const batch = ${JSON.stringify(batch)};
        const out = {};
        for (const [charName, keyword] of batch) {
          try {
            const url = 'https://comicvine.gamespot.com/search/?q=' + encodeURIComponent(keyword) + '&indices%5B%5D=character';
            const r = await fetch(url);
            const html = await r.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const items = Array.from(doc.querySelectorAll('li.wiki-item, li.media-item, .search-results li'));
            let chosenImg = null;
            let chosenTitle = null;

            for (const it of items) {
              const fullText = it.textContent;
              const imgEl = it.querySelector('img[src*="uploads"]');
              if (imgEl && (fullText.includes('Marvel') || fullText.includes('Character') || fullText.includes('issues'))) {
                chosenImg = imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                chosenTitle = it.querySelector('.title, h3, a')?.textContent?.trim();
                break;
              }
            }

            if (!chosenImg) {
              const anyImg = doc.querySelector('img[src*="uploads"]');
              if (anyImg) {
                chosenImg = anyImg.src || anyImg.getAttribute('data-src') || anyImg.getAttribute('src');
              }
            }

            out[charName] = { img: chosenImg, title: chosenTitle };
          } catch (e) {
            out[charName] = { error: e.message };
          }
        }
        return out;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const batchData = batchRes.result.value || {};
    for (const [k, v] of Object.entries(batchData)) {
      results[k] = v.img || null;
      console.log(`  ${k}: ${v.img ? 'OK' : 'MISSING'} -> ${v.img || 'none'}`);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  fs.writeFileSync('backend/scripts/fetchedCharacterIcons.json', JSON.stringify(results, null, 2));
  console.log('\nAll done! Saved to backend/scripts/fetchedCharacterIcons.json');

  ws.close();
  process.exit(0);
})();
