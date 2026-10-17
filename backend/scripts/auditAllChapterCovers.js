'use strict';
const { Chapter, Story } = require('../src/models');

async function run() {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title'] }],
    order: [['story_id', 'ASC'], ['chapter_number', 'ASC']]
  });

  console.log(`=== AUDIT ALL ${chapters.length} CHAPTER COVERS ===\n`);

  const results = {
    total: chapters.length,
    validComicVine: [],
    nullCover: [],
    suspiciousCover: []
  };

  for (const c of chapters) {
    const item = {
      id: c.id,
      story: c.story?.title,
      chapter_number: c.chapter_number,
      title: c.title,
      comicvine_issue_id: c.comicvine_issue_id,
      cover_image: c.cover_image
    };

    if (!c.cover_image) {
      results.nullCover.push(item);
    } else if (
      c.cover_image.includes('g-i-combat') ||
      c.cover_image.includes('tales-to-astonish') ||
      c.cover_image.includes('strangers-in-paradis') ||
      c.cover_image.includes('phoenix') ||
      !c.cover_image.includes('comicvine.gamespot.com')
    ) {
      results.suspiciousCover.push(item);
    } else {
      results.validComicVine.push(item);
    }
  }

  console.log(`1. Chapters with verified authentic ComicVine covers (${results.validComicVine.length}):`);
  results.validComicVine.forEach(c => {
    console.log(`   [Story ${c.story}] Ch #${c.chapter_number} (CV ID: ${c.comicvine_issue_id}): ${c.cover_image.substring(c.cover_image.lastIndexOf('/') + 1)}`);
  });

  console.log(`\n2. Chapters with NULL covers (${results.nullCover.length}):`);
  results.nullCover.forEach(c => {
    console.log(`   [Story ${c.story}] Ch #${c.chapter_number} "${c.title}" (CV ID: ${c.comicvine_issue_id}) => cover_image: NULL`);
  });

  console.log(`\n3. Chapters with suspicious / mismatched non-Marvel covers (${results.suspiciousCover.length}):`);
  results.suspiciousCover.forEach(c => {
    console.log(`   [Story ${c.story}] Ch #${c.chapter_number} "${c.title}" (CV ID: ${c.comicvine_issue_id}) => cover_image: ${c.cover_image}`);
  });
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
