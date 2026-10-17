const { Chapter, Story } = require('../src/models');
const { MARVEL_VOLUMES_CATALOG } = require('./seedFromComicVine');

(async () => {
  const chapters = await Chapter.findAll({
    include: [{ model: Story, as: 'story' }],
    order: [['id', 'ASC']]
  });

  const nullChapters = chapters.filter(c => !c.cover_image);
  console.log(`Total chapters with null cover_image: ${nullChapters.length}`);

  for (const ch of nullChapters) {
    console.log(`Ch ${ch.id} | Story ${ch.story?.title} | #${ch.chapter_number} - ${ch.title} | issue_id: ${ch.comicvine_issue_id}`);
  }

  process.exit(0);
})();
