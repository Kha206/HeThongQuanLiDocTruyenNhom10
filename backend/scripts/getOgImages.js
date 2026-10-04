const axios = require('axios');

const urls = [
  { name: 'Avengers', url: 'https://comicvine.gamespot.com/avengers/4060-3165/' },
  { name: 'Iron Man', url: 'https://comicvine.gamespot.com/iron-man/4005-1455/' },
  { name: 'X-Men', url: 'https://comicvine.gamespot.com/x-men/4060-3173/' },
  { name: 'Thor', url: 'https://comicvine.gamespot.com/thor/4005-2268/' },
  { name: 'Captain America', url: 'https://comicvine.gamespot.com/captain-america/4005-1442/' },
  { name: 'Thanos', url: 'https://comicvine.gamespot.com/thanos/4005-7607/' }
];

async function run() {
  for (const item of urls) {
    try {
      const res = await axios.get(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 10000
      });
      const html = res.data;
      const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      console.log(item.name, ':', match ? match[1] : 'No meta match');
    } catch (err) {
      console.log(item.name, 'Error:', err.message, err.response ? err.response.status : '');
    }
  }
}

run();
