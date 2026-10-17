'use strict';
const axios = require('axios');

const candidates = [
  // Civil War #1
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11118/111187425/4652255-civil_war_1.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71275-11920-104273-1-phoenix.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608583-02.jpg', // CW #2 (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668134-03.jpg', // CW #3 (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11118/111187425/4652258-civil_war_4.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11118/111187425/4652259-civil_war_5.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11118/111187425/4652260-civil_war_6.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11118/111187425/4652261-civil_war_7.jpg'
];

async function test() {
  for (const url of candidates) {
    try {
      const res = await axios.head(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 });
      console.log('OK 200:', url);
    } catch (e) {
      console.log('FAIL:', e.response?.status || e.message, url);
    }
  }
}

test();
