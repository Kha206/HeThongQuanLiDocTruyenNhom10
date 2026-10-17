const { Chapter, Story } = require('../src/models');
const fs = require('fs');
const path = require('path');
const http = require('http');

(async () => {
  console.log('=== BẮT ĐẦU SỬA TRIỆT ĐỂ TOÀN BỘ CHARACTER CREDITS ===\n');

  // 1. Load fetched icons from json
  const fetchedIcons = JSON.parse(fs.readFileSync(path.join(__dirname, 'fetchedCharacterIcons.json'), 'utf8'));

  // Disambiguate remaining 4 items
  fetchedIcons['Namor the Sub-Mariner'] = 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7642506-0083aa18cc79f26640e29a8594e2e51e.jpg';
  fetchedIcons['Blob (Fred Dukes)'] = 'https://comicvine.gamespot.com/a/uploads/square_small/0/3125/2213755-fred1.jpg';
  fetchedIcons['Gorr the God Butcher'] = 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/3073997-01.jpg';
  fetchedIcons['Wonder Man (Simon Williams)'] = 'https://comicvine.gamespot.com/a/uploads/square_small/11159/111592040/9311802-img_4496.jpeg';

  // Base characters that already had good unique images in seed
  const existingBaseIcons = {
    'Spider-Man': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg',
    'Green Goblin': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7758728-7653156-spiderman_850_parrillo_virgin_1024x1024.jpg',
    'Doctor Octopus': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8273265-xwo2dl8g0c381.jpg',
    'Sandman': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791112-cerec.jpg',
    'Sandman (Flint Marko)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791112-cerec.jpg',
    'Lizard': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791115-dfgeges.jpg',
    'Lizard (Dr. Curt Connors)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791115-dfgeges.jpg',
    'Electro': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791114-fbege.jpg',
    'Electro (Max Dillon)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791114-fbege.jpg',
    'Chameleon': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8002168-250072_1446175_1.jpg',
    'Doctor Doom': 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49448/1724175-doctor_doom.jpg',
    'Captain America': 'https://comicvine.gamespot.com/a/uploads/scale_small/3/33913/921103-108_the_marvels_project_4_epting_variant_.jpg',
    'Iron Man': 'https://comicvine.gamespot.com/a/uploads/scale_small/2/26163/504218-iron_man_armor_mk_i_001.png',
    'Thor': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2593422-thor1.png',
    'Hulk': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/9971293-hulk.jpg',
    'Thanos': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/394/77995-21433-thanos.png',
    'Wolverine': 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49076/1863600-200px_wolverine_first_claws.jpg',
    'J. Jonah Jameson': 'https://comicvine.gamespot.com/a/uploads/scale_small/6/64137/2725615-asm2_jj.jpg',
    'Aunt May': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2733264-marvel_knights_spider_man__4___page_3.jpg',
    'Flash Thompson': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8056388-extreme_carnage_alpha_vol_1_1_616_comics_and_jolzar_collectibles_exclusive_virgin_variant.jpg',
    'Human Torch': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8338234-b5866c56-93ff-4db0-aeca-9844ff09eac3_rw_1200.jpg',
    'Reed Richards': 'https://comicvine.gamespot.com/a/uploads/scale_small/11112/111123579/7316596-fantastic_four_vol_6_1_mr._fantastic_variant_textless.jpg',
    'Ant-Man': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930199-talestoastonish049.jpg',
    'Wasp': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/10190293-wasp.jpg',
    'Loki': 'https://comicvine.gamespot.com/a/uploads/scale_small/2/28391/2713359-128.jpg',
    'Cyclops': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930260-talestoastonish050.jpg',
    'Jean Grey': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930269-talestoastonish051.jpg',
    'Magneto': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930271-talestoastonish052.jpg',
    'Silver Surfer': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215796-047.jpg',
    'Adam Warlock': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215797-048.jpg',
    'Mephisto': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215798-049.jpg',
    'Nebula': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215799-050.jpg',
    'Mistress Death': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215800-051.jpg',
    'Beyonder': 'https://comicvine.gamespot.com/a/uploads/scale_small/6/67663/2754348-04_cropped.jpg',
    'Mallen': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096618-9691217218-11686.jpg',
    'Maya Hansen': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096612-7617155689-11686.jpg',
    'Beast': 'https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111123579/7166569-x-force_vol_6_6_textless.jpg',
    'Professor X': 'https://comicvine.gamespot.com/a/uploads/scale_small/8/83882/2039151-260136_185357_professor_x.jpg',
    'Quicksilver': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2594178-quicks.png',
    'Scarlet Witch': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/9986552-scarlet_witch.jpg',
    'Doctor Strange': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8753901-ezgif-3-69b95d2d1b.jpg',
    'She-Hulk': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/11307/448626-she_hulk_01_00.jpg',
    'Hawkeye': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3133/108921-190878-hawkeye.jpg'
  };

  // Merge all verified avatars into a master map
  const MASTER_AVATARS = { ...existingBaseIcons, ...fetchedIcons };

  console.log(`Master Avatars count: ${Object.keys(MASTER_AVATARS).length}`);

  // Check that every character has a distinct URL where intended
  const urlOwners = {};
  for (const [name, url] of Object.entries(MASTER_AVATARS)) {
    if (!url) {
      console.error(`FATAL: ${name} has null URL!`);
      process.exit(1);
    }
    urlOwners[url] = urlOwners[url] || [];
    urlOwners[url].push(name);
  }

  let dupes = 0;
  for (const [url, names] of Object.entries(urlOwners)) {
    // Sandman & Sandman (Flint Marko) or Lizard & Lizard (Dr. Curt Connors) is same person alias, but let's check across different people
    if (names.length > 1) {
      console.warn(`[Note] URL shared by aliases: ${names.join(', ')}`);
      // If they are actually different characters, flag error
      const isAlias = names.every(n => n.includes('Sandman') || n.includes('Lizard') || n.includes('Electro'));
      if (!isAlias) dupes++;
    }
  }

  if (dupes > 0) {
    console.error(`Found ${dupes} non-alias duplicates in MASTER_AVATARS!`);
  } else {
    console.log('Verification: All distinct characters have 100% individual, unique ComicVine URLs!\n');
  }

  // 2. Update Database Chapters
  const chapters = await Chapter.findAll();
  let updatedChaptersCount = 0;
  let totalCharactersUpdated = 0;

  for (const ch of chapters) {
    let credits = ch.character_credits;
    if (typeof credits === 'string') {
      try { credits = JSON.parse(credits); } catch (e) { credits = []; }
    }
    if (!Array.isArray(credits)) credits = [];

    let changed = false;
    const newCredits = credits.map(char => {
      const name = (char.name || char.character_name || '').trim();
      const currentUrl = (char.icon_url || char.image_url || '').trim();

      // Look up master avatar
      const targetUrl = MASTER_AVATARS[name] || MASTER_AVATARS[name.replace(/ \(.*\)/, '')];
      if (targetUrl && targetUrl !== currentUrl) {
        changed = true;
        totalCharactersUpdated++;
        return {
          ...char,
          name,
          icon_url: targetUrl
        };
      }
      return char;
    });

    if (changed) {
      ch.character_credits = newCredits;
      await ch.save();
      updatedChaptersCount++;
    }
  }

  console.log(`=> Đã cập nhật ${totalCharactersUpdated} lượt nhân vật trên ${updatedChaptersCount} chapters trong database!\n`);

  // 3. Update seedFromComicVine.js with MASTER_AVATARS
  const seedPath = path.join(__dirname, 'seedFromComicVine.js');
  let seedContent = fs.readFileSync(seedPath, 'utf8');

  // Also replace character objects inside seed catalog where icon_url was null or missing
  // Scan all chapters in seed and add icon_url
  for (const [charName, url] of Object.entries(MASTER_AVATARS)) {
    // match: { name: 'charName' } or { name: 'charName', icon_url: ... }
    const regex1 = new RegExp(`{\\s*name:\\s*['"]${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*}`, 'g');
    seedContent = seedContent.replace(regex1, `{ name: '${charName}', icon_url: '${url}' }`);

    // match: { name: 'charName', icon_url: null }
    const regex2 = new RegExp(`{\\s*name:\\s*['"]${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"],\\s*icon_url:\\s*null\\s*}`, 'g');
    seedContent = seedContent.replace(regex2, `{ name: '${charName}', icon_url: '${url}' }`);

    // match: { name: 'charName', icon_url: '...' } where old URL needs update
    if (fetchedIcons[charName]) {
      const regex3 = new RegExp(`({\\s*name:\\s*['"]${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"],\\s*icon_url:\\s*)['"][^'"]+['"](\\s*})`, 'g');
      seedContent = seedContent.replace(regex3, `$1'${url}'$2`);
    }
  }

  fs.writeFileSync(seedPath, seedContent, 'utf8');
  console.log('=> Đã đồng bộ toàn bộ icon_url vào file seedFromComicVine.js!');

  // 4. Update comicVineService.js CHARACTER_AVATARS
  const servicePath = path.join(__dirname, '../src/services/comicVineService.js');
  let serviceContent = fs.readFileSync(servicePath, 'utf8');

  const avatarEntries = Object.entries(MASTER_AVATARS)
    .map(([k, v]) => `  '${k.toLowerCase()}': '${v}'`)
    .join(',\n');

  serviceContent = serviceContent.replace(/const CHARACTER_AVATARS = \{[\s\S]*?\};/, `const CHARACTER_AVATARS = {\n${avatarEntries}\n};`);
  fs.writeFileSync(servicePath, serviceContent, 'utf8');
  console.log('=> Đã đồng bộ vào comicVineService.js CHARACTER_AVATARS!');

  console.log('\n=== HOÀN TẤT CẬP NHẬT DỮ LIỆU VÀ MÃ NGUỒN ===');
  process.exit(0);
})();
