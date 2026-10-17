const { sequelize } = require('../src/models');

async function search() {
  const [tables] = await sequelize.query('SHOW TABLES');
  const domains = new Set();
  const allUrls = [];
  for (const tObj of tables) {
    const tableName = Object.values(tObj)[0];
    const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
    for (const row of rows) {
      const json = JSON.stringify(row);
      const matches = json.match(/https?:\/\/[^\s"'\\`]+/g) || [];
      for (const m of matches) {
        allUrls.push({ table: tableName, url: m });
        try {
          const u = new URL(m);
          domains.add(u.hostname);
        } catch(e){}
      }
    }
  }
  console.log('All domains in database:', Array.from(domains));
  const nonCv = allUrls.filter(item => !item.url.includes('comicvine') && !item.url.includes('localhost'));
  console.log(`Non-ComicVine URLs count: ${nonCv.length}`);
  for (const item of nonCv) {
    console.log('->', item.table, item.url);
  }
}

search().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
