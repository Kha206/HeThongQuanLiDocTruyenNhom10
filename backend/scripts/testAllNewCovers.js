const http = require('http');

const ALL_NEW_COVERS = {
  civilWar: [
    { num: 1, issue_id: 105525, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/443/82656-18023-105525-1-civil-war.jpg' },
    { num: 2, issue_id: 105570, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/443/83333-18023-105570-1-civil-war.jpg' },
    { num: 3, issue_id: 105624, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111129651/5832344-200609%20civil%20war%20%20-%20unknown%20%233%20-%20page%201.jpg' },
    { num: 4, issue_id: 105682, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/443/84167-18023-105682-1-civil-war.jpg' },
    { num: 5, issue_id: 106999, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/2945051-www.jpg' },
    { num: 6, issue_id: 107000, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/1/11307/440508-civil_war_6_00.jpg' },
    { num: 7, issue_id: 106626, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/2779408-www.jpg' },
    { num: 8, issue_id: 106844, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/787/97460-18245-106844-1-civil-war-front-lin.jpg' },
    { num: 9, issue_id: 108957, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/574/114369-18542-108957-1-iron-man-captain-ame.jpg' },
    { num: 10, issue_id: 106909, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/40/98620-18258-106909-1-civil-war-the-confe.jpg' }
  ],
  avengers: [
    { num: 1, issue_id: 6686, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464633-avengers001.jpg' },
    { num: 2, issue_id: 6779, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464636-avengers002.jpg' },
    { num: 3, issue_id: 6938, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464637-avengers003.jpg' },
    { num: 4, issue_id: 7025, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464638-avengers004.jpg' },
    { num: 5, issue_id: 7106, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464639-avengers005.jpg' },
    { num: 6, issue_id: 7199, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464640-avengers006.jpg' },
    { num: 7, issue_id: 7254, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464641-avengers007.jpg' },
    { num: 8, issue_id: 7302, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464642-avengers008.jpg' },
    { num: 9, issue_id: 7371, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464643-avengers009.jpg' },
    { num: 10, issue_id: 7423, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2464644-avengers010.jpg' }
  ],
  ironMan: [
    { num: 1, issue_id: 108913, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/787/114157-18220-108913-1-iron-man.jpg' },
    { num: 2, issue_id: 108914, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/787/114159-18220-108914-1-iron-man.jpg' },
    { num: 3, issue_id: 111259, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2188170-03.jpg' },
    { num: 4, issue_id: 111395, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/574/148557-18220-111395-1-iron-man.jpg' },
    { num: 5, issue_id: 111396, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/574/148558-18220-111396-1-iron-man.jpg' },
    { num: 6, issue_id: 111397, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111129651/5756915-200605%20iron%20man%20%20-%20unknown%20%236%20-%20page%201.jpg' },
    { num: 7, issue_id: 108247, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2188171-07.jpg' },
    { num: 8, issue_id: 108311, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2188172-08.jpg' },
    { num: 9, issue_id: 108349, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2188173-09.jpg' },
    { num: 10, issue_id: 108350, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2188174-10.jpg' }
  ],
  xmen: [
    { num: 1, issue_id: 6694, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1355017-uxm_v1_001_01.jpg' },
    { num: 2, issue_id: 6787, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1355032-01.jpg' },
    { num: 3, issue_id: 6946, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1355038-01.jpg' },
    { num: 4, issue_id: 7032, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1356279-01.jpg' },
    { num: 5, issue_id: 7114, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1357837-01.jpg' },
    { num: 6, issue_id: 7207, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1376114-01.jpg' },
    { num: 7, issue_id: 7310, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1377294-01.jpg' },
    { num: 8, issue_id: 7431, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1377429-01.jpg' },
    { num: 9, issue_id: 7559, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/5344/1377485-01.jpg' },
    { num: 10, issue_id: 7674, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/7019-2133-7674-1-x-men.jpg' }
  ],
  secretWars: [
    { num: 1, issue_id: 57504, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407772-marvelsuperheroessecretwars01.jpg' },
    { num: 2, issue_id: 140126, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2170083-05.jpg' },
    { num: 3, issue_id: 57506, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407778-marvelsuperheroessecretwars03.jpg' },
    { num: 4, issue_id: 57507, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407779-marvelsuperheroessecretwars04.jpg' },
    { num: 5, issue_id: 57508, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407780-marvelsuperheroessecretwars05.jpg' },
    { num: 6, issue_id: 57509, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407781-marvelsuperheroessecretwars06.jpg' },
    { num: 7, issue_id: 57510, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407815-marvelsuperheroessecretwars07.jpg' },
    { num: 8, issue_id: 57511, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407783-marvelsuperheroessecretwars08.jpg' },
    { num: 9, issue_id: 57512, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407784-marvelsuperheroessecretwars09.jpg' },
    { num: 10, issue_id: 57513, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407785-marvelsuperheroessecretwars10.jpg' },
    { num: 11, issue_id: 57514, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407786-marvelsuperheroessecretwars11.jpg' },
    { num: 12, issue_id: 57515, url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2407787-marvelsuperheroessecretwars12.jpg' }
  ]
};

async function testAll() {
  for (const [series, issues] of Object.entries(ALL_NEW_COVERS)) {
    console.log(`\nTesting ${series} (${issues.length} covers)...`);
    for (const item of issues) {
      await new Promise(r => {
        http.get('http://localhost:5000/api/stories/proxy-image?url=' + encodeURIComponent(item.url), res => {
          let chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            const isImg = (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50);
            console.log(`  Issue #${item.num} (ID: ${item.issue_id}): Status ${res.statusCode} | Bytes: ${buf.length} | Valid Image: ${isImg}`);
            r();
          });
        }).on('error', e => {
          console.error(`  Issue #${item.num} error:`, e.message);
          r();
        });
      });
    }
  }
  process.exit(0);
}

testAll();
