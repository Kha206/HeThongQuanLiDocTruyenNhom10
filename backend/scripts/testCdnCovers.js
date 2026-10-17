'use strict';
const axios = require('axios');

// Test batches of candidate ComicVine image paths
const testUrls = [
  // Civil War
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608583-02.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668134-03.jpg',
  
  // Spider-Man (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676366-amazingspiderman001.jpg',
  
  // Infinity Gauntlet (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215796-047.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215797-048.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215798-049.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215799-050.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215800-051.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215801-052.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215803-053.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215804-054.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215805-055.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215810-056.jpg',

  // Thor (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713359-128.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713360-129.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713361-130.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713362-131.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713363-132.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713365-133.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713368-134.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713369-135.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713370-136.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713372-137.jpg',

  // Avengers (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912127-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912132-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912116-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912115-wwww.jpg',

  // Secret Wars (known 200)
  'https://comicvine.gamespot.com/a/uploads/scale_small/11161/111615891/10169914-cover.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11183/111836101/10070612-40-1083.jpg'
];

async function check() {
  console.log(`Checking ${testUrls.length} candidate URLs...`);
  for (const u of testUrls) {
    try {
      const res = await axios.head(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 });
      console.log(`[OK ${res.status}] ${u.substring(u.lastIndexOf('/') + 1)}`);
    } catch (e) {
      console.log(`[FAIL ${e.response?.status || e.message}] ${u.substring(u.lastIndexOf('/') + 1)}`);
    }
  }
}

check();
