const { Chapter, Story } = require('../src/models');

async function main() {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story', attributes: ['id', 'title', 'comicvine_volume_id'] }],
    order: [['story_id', 'ASC'], ['chapter_number', 'ASC']]
  });

  for (const c of chapters) {
    console.log(`Story ${c.story_id} (${c.story?.title}) | Ch ${c.chapter_number} | ID: ${c.id} | CV: ${c.comicvine_issue_id} | ${c.cover_image || 'NULL'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
