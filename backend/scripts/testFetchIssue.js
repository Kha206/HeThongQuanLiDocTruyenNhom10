'use strict';
const axios = require('axios');

async function test(issueId) {
  try {
    const url = `https://comicvine.gamespot.com/issue/4000-${issueId}/`;
    console.log('Testing URL:', url);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    });
    console.log('Status:', res.status, 'HTML length:', res.data.length);
    const ogMatch = res.data.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log('OG Image:', ogMatch ? ogMatch[1] : null);

    // Characters in HTML: look for character credits or links
    const charRegex = /\/4005-(\d+)\/["'][^>]*>([^<]+)<\/a>/g;
    let match;
    const chars = [];
    while ((match = charRegex.exec(res.data)) !== null) {
      chars.push({ id: match[1], name: match[2].trim() });
    }
    console.log('Extracted characters count:', chars.length);
    if (chars.length > 0) {
      console.log('Sample characters:', chars.slice(0, 5));
    }
  } catch (err) {
    console.log('Error:', err.response?.status, err.message);
  }
}

test(6704);
