const { Chapter, Story } = require('../src/models');

async function scan() {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title'] }],
    order: [['story_id', 'ASC'], ['chapter_number', 'ASC']]
  });

  console.log('Total chapters in DB:', chapters.length);
  
  // Group by cover_image
  const coverMap = {};
  for (const ch of chapters) {
    const cv = ch.cover_image;
    if (!coverMap[cv]) coverMap[cv] = [];
    coverMap[cv].push({
      id: ch.id,
      story_id: ch.story_id,
      story_title: ch.story?.title,
      chapter_number: ch.chapter_number,
      title: ch.title,
      comicvine_issue_id: ch.comicvine_issue_id
    });
  }

  console.log('\n=== DUPLICATE COVER GROUPS ===');
  let dupCount = 0;
  for (const [cover, list] of Object.entries(coverMap)) {
    if (list.length > 1) {
      dupCount++;
      console.log(`\n[Group ${dupCount}] Cover: ${cover} (${list.length} chapters):`);
      list.forEach(c => {
        console.log(`  - Story [${c.story_id}] ${c.story_title} | Ch #${c.chapter_number} (ID: ${c.id}): "${c.title}" | Issue ID: ${c.comicvine_issue_id}`);
      });
    }
  }

  console.log('\nTotal unique covers:', Object.keys(coverMap).length);
  console.log('Total duplicate groups:', dupCount);
  process.exit(0);
}
scan();
