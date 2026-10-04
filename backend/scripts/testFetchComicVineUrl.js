const axios = require('axios');

async function testFetch() {
  const url = 'https://comicvine.gamespot.com/avengers-21/4000-1142913/';
  console.log('Testing fetch:', url);
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000
    });
    console.log('Success! Status:', res.status, 'HTML length:', res.data.length);
    // Extract og:image, og:title, etc.
    const titleMatch = res.data.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const imgMatch = res.data.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const descMatch = res.data.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    console.log('og:title:', titleMatch ? titleMatch[1] : null);
    console.log('og:image:', imgMatch ? imgMatch[1] : null);
    console.log('og:description:', descMatch ? descMatch[1] : null);
  } catch (err) {
    console.error('Fetch error:', err.response?.status || err.message);
  }
}

testFetch();
