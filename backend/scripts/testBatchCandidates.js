const axios = require('axios');

const candidates = [
  // Civil War #1 candidates
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71275-11920-104273-1-phoenix.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/6/67663/3052825-442.jpg',
  'https://comicvine.gamespot.com/a/uploads/original/6/67663/3052825-442.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608583-02.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668134-03.jpg',

  // Civil War 4-7
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608584-04.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608585-05.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608586-06.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608587-07.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668135-04.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668136-05.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668137-06.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668138-07.jpg',

  // Avengers #2-10
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464633-avengers001.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464634-avengers002.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464635-avengers003.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464636-avengers004.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464637-avengers005.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464638-avengers006.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464639-avengers007.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464640-avengers008.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464641-avengers009.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464642-avengers010.jpg',

  // X-Men
  'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2464650-xmen001.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/12/124259/9476911-large-3730198.jpg',

  // Secret Wars
  'https://comicvine.gamespot.com/a/uploads/scale_small/11161/111615891/10169914-cover.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11183/111836101/10070612-40-1083.jpg'
];

async function run() {
  for (const url of candidates) {
    try {
      const res = await axios.head(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 2500 });
      console.log(`[200 OK] ${url}`);
    } catch (e) {
      // ignore
    }
  }
}

run().then(() => console.log('Finished testing.'));
