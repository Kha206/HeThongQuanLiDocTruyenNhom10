'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Story } = require('../src/models');

async function migrate() {
  console.log('--- RUNNING MIGRATION: ADD comicvine_volume_id TO stories ---');
  
  const queryInterface = sequelize.getQueryInterface();
  const tableInfo = await queryInterface.describeTable('stories');

  if (!tableInfo.comicvine_volume_id) {
    console.log('Column comicvine_volume_id does not exist. Adding column...');
    await sequelize.query('ALTER TABLE stories ADD COLUMN comicvine_volume_id INT NULL AFTER comicvine_id;');
    console.log('✓ Column comicvine_volume_id added successfully.');
  } else {
    console.log('✓ Column comicvine_volume_id already exists.');
  }

  // Populate comicvine_volume_id from comicvine_id or known volume map
  const volumeMap = {
    'the-amazing-spider-man': 2139,
    'civil-war-2006': 18151,
    'the-infinity-gauntlet-1991': 4884,
    'the-avengers-1963': 2144,
    'iron-man-extremis': 18861,
    'uncanny-x-men-1963': 2140,
    'thor-god-of-thunder': 3245,
    'secret-wars-1984': 4208
  };

  const stories = await Story.findAll();
  console.log(`Found ${stories.length} stories in database.`);

  for (const story of stories) {
    const volId = story.comicvine_volume_id || story.comicvine_id || volumeMap[story.slug] || 2144;
    await story.update({
      comicvine_volume_id: volId,
      comicvine_id: story.comicvine_id || volId
    });
    console.log(`✓ Story #${story.id} "${story.title}" updated: comicvine_volume_id = ${volId}`);
  }

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
