'use strict';
const axios = require('axios');

const chars = [
  { name: 'Hawkeye', url: 'https://comicvine.gamespot.com/hawkeye/4005-1475/' },
  { name: 'She-Hulk', url: 'https://comicvine.gamespot.com/she-hulk/4005-1446/' },
  { name: 'Hercules', url: 'https://comicvine.gamespot.com/hercules/4005-2503/' },
  { name: 'Wonder Man', url: 'https://comicvine.gamespot.com/wonder-man/4005-2425/' },
  { name: 'Monica Rambeau', url: 'https://comicvine.gamespot.com/monica-rambeau/4005-2487/' },
  { name: 'Shang-Chi', url: 'https://comicvine.gamespot.com/shang-chi/4005-1476/' },
  { name: 'Baron Zemo', url: 'https://comicvine.gamespot.com/baron-zemo-heinrich/4005-6435/' },
  { name: 'Scarlet Witch', url: 'https://comicvine.gamespot.com/scarlet-witch/4005-1466/' },
  { name: 'Quicksilver', url: 'https://comicvine.gamespot.com/quicksilver/4005-1467/' },
  { name: 'Enchantress', url: 'https://comicvine.gamespot.com/enchantress/4005-2501/' },
  { name: 'Power Man', url: 'https://comicvine.gamespot.com/erik-josten/4005-3419/' }
];

async function run() {
  for (const c of chars) {
    try {
      const res = await axios.get(c.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 8000
      });
      const matches = res.data.match(/https:\/\/comicvine\.gamespot\.com\/a\/uploads\/(?:scale_small|scale_medium|square_avatar|square_small|original)\/[^\"]+\.(?:jpg|png|webp)/gi);
      if (matches && matches.length > 0) {
        console.log(`Found for ${c.name}:`, matches[0]);
      } else {
        console.log(`No direct match for ${c.name}`);
      }
    } catch (err) {
      console.log(`Fetch failed for ${c.name}: ${err.message}`);
    }
  }
}

run();
