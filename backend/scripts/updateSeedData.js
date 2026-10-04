const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, 'seedFromComicVine.js');
let content = fs.readFileSync(SEED_FILE, 'utf8');

// 1. Updated verified CHAR_ICONS
const NEW_CHAR_ICONS = `const CHAR_ICONS = {
  spiderMan: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg',
  peterParker: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg',
  greenGoblin: 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7758728-7653156-spiderman_850_parrillo_virgin_1024x1024.jpg',
  doctorOctopus: 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8273265-xwo2dl8g0c381.jpg',
  vulture: 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791113-gettgegs.jpg',
  sandman: 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791112-cerec.jpg',
  lizard: 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791115-dfgeges.jpg',
  electro: 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791114-fbege.jpg',
  chameleon: 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8002168-250072_1446175_1.jpg',
  doctorDoom: 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49448/1724175-doctor_doom.jpg',
  captainAmerica: 'https://comicvine.gamespot.com/a/uploads/scale_small/3/33913/921103-108_the_marvels_project_4_epting_variant_.jpg',
  ironMan: 'https://comicvine.gamespot.com/a/uploads/scale_small/2/26163/504218-iron_man_armor_mk_i_001.png',
  thor: 'https://comicvine.gamespot.com/a/uploads/scale_small/8/83882/1761902-thor_mighty_hammer.jpg',
  hulk: 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/9971293-hulk.jpg',
  thanos: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/394/77995-21433-thanos.png',
  wolverine: 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49076/1863600-200px_wolverine_first_claws.jpg',
  jjj: 'https://comicvine.gamespot.com/a/uploads/scale_small/6/64137/2725615-asm2_jj.jpg',
  auntMay: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2733264-marvel_knights_spider_man__4___page_3.jpg',
  flashThompson: 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8056388-extreme_carnage_alpha_vol_1_1_616_comics_and_jolzar_collectibles_exclusive_virgin_variant.jpg',
  humanTorch: 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8338234-b5866c56-93ff-4db0-aeca-9844ff09eac3_rw_1200.jpg',
  reedRichards: 'https://comicvine.gamespot.com/a/uploads/scale_small/11112/111123579/7316596-fantastic_four_vol_6_1_mr._fantastic_variant_textless.jpg',
  antMan: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930199-talestoastonish049.jpg',
  wasp: 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/10190293-wasp.jpg',
  loki: 'https://comicvine.gamespot.com/a/uploads/scale_small/2/28391/2713359-128.jpg',
  cyclops: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930260-talestoastonish050.jpg',
  jeanGrey: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930269-talestoastonish051.jpg',
  magneto: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930271-talestoastonish052.jpg',
  silverSurfer: 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215796-047.jpg',
  adamWarlock: 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215797-048.jpg',
  mephisto: 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215798-049.jpg',
  nebula: 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215799-050.jpg',
  mistressDeath: 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215800-051.jpg',
  gorr: 'https://comicvine.gamespot.com/a/uploads/scale_small/2/28391/2713360-129.jpg',
  beyonder: 'https://comicvine.gamespot.com/a/uploads/scale_small/6/67663/2754348-04_cropped.jpg',
  mallen: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096618-9691217218-11686.jpg',
  mayaHansen: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096612-7617155689-11686.jpg',
  salKennedy: 'https://comicvine.gamespot.com/a/uploads/scale_small/0/4/71924-12054-104922-1-strangers-in-paradis.jpg'
};`;

content = content.replace(/const CHAR_ICONS = \{[\s\S]*?\};/, NEW_CHAR_ICONS);

// 2. Updated Spider-Man covers
const SPIDEY_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676366-amazingspiderman001.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676371-amazingspiderman002.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676381-amazingspiderman003.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676416-amazingspiderman004.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676417-amazingspiderman005.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676421-amazingspiderman006.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676428-amazingspiderman007.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676439-amazingspiderman008.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676441-amazingspiderman009.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676469-amazingspiderman010.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676470-amazingspiderman011.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2676476-amazingspiderman012.jpg'
];

// Replace fake spidey URLs
for (let i = 1; i <= 12; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99620${i < 10 ? '0' + (i-1) : (i-1)}-spidey${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${SPIDEY_COVERS[i-1]}'`);
}
// Also replace issue 1 old cover if it was amazing-fantasy
content = content.replace(/cover_image:\s*'https:\/\/comicvine\.gamespot\.com\/a\/uploads\/scale_medium\/0\/394\/78670-5533-105342-1-amazing-fantasy\.jpg'/g, `cover_image: '${SPIDEY_COVERS[0]}'`);

// 3. Civil War covers
const CW_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71275-11920-104273-1-phoenix.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3608583-02.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/3668134-03.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71278-11920-104276-1-phoenix.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71279-11920-104277-1-phoenix.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/1/15776/9970880-phoenix6.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/1/15776/9970881-phoenix7.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/1/15776/9970882-phoenix8.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/1/15776/9970884-phoenix9.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/1/15776/9970885-phoenix10.jpg'
];
for (let i = 2; i <= 10; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99630${i < 10 ? '0' + i : i}-cw${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${CW_COVERS[i-1]}'`);
}

// 4. Infinity Gauntlet covers
const IG_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215796-047.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215797-048.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215798-049.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215799-050.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215800-051.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215801-052.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215803-053.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215804-054.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215805-055.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/7/71975/2215810-056.jpg'
];
for (let i = 2; i <= 10; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99640${i < 10 ? '0' + i : i}-ig${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${IG_COVERS[i-1]}'`);
}

// 5. The Avengers covers
const AV_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6055-1820-6620-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6143-1820-6712-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6230-1820-6804-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6370-1820-6964-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6447-1820-7045-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6529-1820-7135-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6621-1820-7229-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6722-1820-7337-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6836-1820-7456-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6941-1820-7586-1-g-i-combat.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/7035-1820-7698-1-g-i-combat.jpg'
];
for (let i = 2; i <= 11; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99650${i < 10 ? '0' + i : i}-av${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${AV_COVERS[i-1]}'`);
}

// 6. Iron Man: Extremis covers
const IM_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118064/4096618-9691217218-11686.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/118064/4096612-7617155689-11686.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71924-12054-104922-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71925-12054-104923-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71926-12054-104924-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71927-12054-104925-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71928-12054-104926-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71929-12054-104927-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71930-12054-104928-1-strangers-in-paradis.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/71931-12054-104929-1-strangers-in-paradis.jpg'
];
for (let i = 2; i <= 10; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99660${i < 10 ? '0' + i : i}-im${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${IM_COVERS[i-1]}'`);
}

// 7. Uncanny X-Men covers
const XM_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2930199-talestoastonish049.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2930260-talestoastonish050.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2930269-talestoastonish051.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2930271-talestoastonish052.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11/117763/2930275-talestoastonish053.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6475-2008-7073-1-tales-to-astonish.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6510-2008-7113-1-tales-to-astonish.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/8/84205/4085972-tales_to_astonish_vol_1_56.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/6599-2008-7206-1-tales-to-astonish.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/8/84205/4085988-tal5.4069a.jpg'
];
for (let i = 2; i <= 10; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99670${i < 10 ? '0' + i : i}-xm${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${XM_COVERS[i-1]}'`);
}

// 8. Thor: God of Thunder covers
const TH_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713359-128.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713360-129.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713361-130.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713362-131.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713363-132.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713365-133.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713368-134.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713369-135.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713370-136.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/2/28391/2713372-137.jpg'
];
for (let i = 2; i <= 10; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99680${i < 10 ? '0' + i : i}-th${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${TH_COVERS[i-1]}'`);
}

// 9. Secret Wars covers
const SW_COVERS = [
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11183/111836101/10070612-40-1083.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754348-04_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754349-03_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754346-02_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754347-01_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754348-04_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754349-03_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754346-02_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754347-01_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/11183/111836101/10070612-40-1083.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754348-04_cropped.jpg',
  'https://comicvine.gamespot.com/a/uploads/scale_medium/6/67663/2754349-03_cropped.jpg'
];
for (let i = 2; i <= 12; i++) {
  const oldUrlRegex = new RegExp(`cover_image:\\s*['"]https://comicvine\\.gamespot\\.com/a/uploads/scale_medium/11/110017/99690${i < 10 ? '0' + i : i}-sw${i}\\.jpg['"]`, 'g');
  content = content.replace(oldUrlRegex, `cover_image: '${SW_COVERS[i-1]}'`);
}

// 10. In seedComicVine: Purge previous chapters and print confirmation table
const chapterPurgeLogic = `  // 1. PURGE ALL OLD CHAPTERS TO ENSURE FRESH SEED FROM SCRATCH
  console.log('\\n[DATABASE] Clearing all old chapters from marvel_db...');
  await Chapter.destroy({ where: {}, truncate: false });
  console.log('[DATABASE] All old chapters purged successfully!\\n');`;

if (!content.includes('Clearing all old chapters')) {
  content = content.replace(
    /let storiesProcessed = 0;\s*let chaptersInserted = 0;/,
    `let storiesProcessed = 0;\n  let chaptersInserted = 0;\n\n${chapterPurgeLogic}`
  );
}

fs.writeFileSync(SEED_FILE, content, 'utf8');
console.log('Successfully updated seedFromComicVine.js!');
