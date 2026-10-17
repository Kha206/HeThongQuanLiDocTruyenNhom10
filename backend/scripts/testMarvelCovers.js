const axios = require('axios');

// Test authentic Marvel covers on ComicVine
const testList = [
  // Civil War covers
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608583-02.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668134-03.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
  
  // Marvel covers that returned 200
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11161/111615891/9972433-cover.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118064/4096612-7617155689-11686.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118064/4096618-9691217218-11686.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/12/124259/8459983-rco031_1650495781.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/12/124259/9476911-large-3730198.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11161/111615891/10169914-cover.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11183/111836101/10070612-40-1083.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912127-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912132-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912116-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912115-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912057-ww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912071-wwww.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912113-wwww.jpg'
];

async function check() {
  for (const u of testList) {
    try {
      const res = await axios.head(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 3000 });
      console.log('200:', u.substring(u.lastIndexOf('/') + 1));
    } catch(e) {
      console.log('FAIL:', u.substring(u.lastIndexOf('/') + 1));
    }
  }
}
check();
