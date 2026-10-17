const axios = require('axios');

async function testUrl(url) {
  try {
    const res = await axios.head(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 2500
    });
    return res.status;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('Scanning for Avengers issue covers in 11/117763/...');
  const found = {};
  
  // Test range around 2464633
  for (let num = 2464630; num <= 2464700; num++) {
    for (let iss = 1; iss <= 12; iss++) {
      const pad = String(iss).padStart(3, '0');
      const filename = `${num}-avengers${pad}.jpg`;
      const url = `https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/${filename}`;
      const status = await testUrl(url);
      if (status === 200) {
        console.log(`FOUND Issue ${iss}: ${url}`);
        found[iss] = url;
        break;
      }
    }
  }
  console.log('Found so far:', Object.keys(found).length, found);
}

main().then(() => process.exit(0));
