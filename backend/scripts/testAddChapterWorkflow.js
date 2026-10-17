'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Story, Chapter } = require('../src/models');

const API_URL = 'http://localhost:5000/api';

async function run() {
  console.log('=== TESTING ADMIN ADD CHAPTER WORKFLOW (ISSUE 6) ===\n');

  const token = jwt.sign(
    { id: 1, username: 'admin', email: 'admin@marvel.com', role: 'admin' },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: '1h' }
  );

  // 1. Target Story
  const story = await Story.findOne({ where: { slug: 'the-avengers' } }) || await Story.findOne();
  console.log(`1. Target Story: "${story.title}" (ID: ${story.id})`);

  // 2. Lookup ComicVine Issue
  const comicVineUrl = 'https://comicvine.gamespot.com/avengers-13/4000-1142987/';
  console.log(`2. Searching ComicVine URL: ${comicVineUrl}`);

  const lookupRes = await axios.get(`${API_URL}/admin/comicvine/issue-by-url?story_id=${story.id}&url=${encodeURIComponent(comicVineUrl)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const issue = lookupRes.data.issue;
  console.log(`[✓] Issue resolved:`);
  console.log(`    Title        : ${issue.title}`);
  console.log(`    Cover Image  : ${issue.cover_image}`);
  console.log(`    Issue Number : ${issue.issue_number}`);
  console.log(`    Characters (${issue.character_credits.length}):`);
  issue.character_credits.forEach((c, idx) => {
    console.log(`      [${idx + 1}] ${c.name.padEnd(20)} => icon: ${c.icon_url || '(Marvel Gradient Initials)'}`);
  });

  // Check character icons for duplicates
  const icons = issue.character_credits.map(c => c.icon_url).filter(Boolean);
  const uniqueIcons = new Set(icons);
  if (icons.length !== uniqueIcons.size) {
    throw new Error('DUPLICATE CHARACTER ICONS DETECTED IN LOOKUP!');
  }
  console.log(`[✓] 0 duplicate icons detected in character credits.\n`);

  // 3. Find unique chapter number
  const maxCh = await Chapter.max('chapter_number', { where: { story_id: story.id } }) || 0;
  const newChapterNumber = Math.floor(maxCh) + 100; // unique high number for testing

  console.log(`3. Submitting new chapter #${newChapterNumber} via POST /api/admin/chapters...`);
  const createPayload = {
    story_id: story.id,
    chapter_number: newChapterNumber,
    title: issue.title || `Avengers Special Edition #${newChapterNumber}`,
    release_date: issue.release_date || '2025-03-01',
    is_preview: true,
    cover_image: issue.cover_image,
    content: issue.content || issue.description,
    character_credits: issue.character_credits,
    comicvine_issue_id: issue.comicvine_issue_id,
    accent_color: '#ED1D24',
    pages_data: [
      { page_number: 1, image_url: issue.cover_image, caption: 'Bìa chính thức' }
    ]
  };

  const createRes = await axios.post(`${API_URL}/admin/chapters`, createPayload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const createdChapter = createRes.data.chapter;
  console.log(`[✓] Successfully created chapter ID ${createdChapter.id}: "${createdChapter.title}"\n`);

  // 4. Query reader endpoint: GET /api/chapters/:id
  console.log(`4. Verifying reader endpoint: GET /api/chapters/${createdChapter.id}...`);
  const readerRes = await axios.get(`${API_URL}/chapters/${createdChapter.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const readData = readerRes.data.chapter;
  console.log(`[✓] Chapter loaded in Reader:`);
  console.log(`    Title        : ${readData.title}`);
  console.log(`    Cover Image  : ${readData.cover_image}`);
  console.log(`    Pages        : ${readData.pages_data?.length || 0} page(s)`);
  const readChars = Array.isArray(readData.character_credits)
    ? readData.character_credits
    : (typeof readData.character_credits === 'string' ? JSON.parse(readData.character_credits) : []);
  console.log(`    Characters   : ${readChars.length} character(s)`);

  const readIcons = readChars.map(c => c.icon_url).filter(Boolean);
  const readUniqueIcons = new Set(readIcons);
  if (readIcons.length !== readUniqueIcons.size) {
    throw new Error('DUPLICATE CHARACTER ICONS DETECTED IN SAVED CHAPTER!');
  }
  console.log(`[✓] Reader view verified: 0 duplicate icons, all characters have distinct icons or initials avatars.\n`);

  // 5. Clean up test chapter
  console.log(`5. Cleaning up test chapter ID ${createdChapter.id}...`);
  await axios.delete(`${API_URL}/admin/chapters/${createdChapter.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`[✓] Test chapter cleaned up successfully.`);

  console.log('\n======================================================');
  console.log('[SUCCESS] All steps of Problem 6 verified perfectly!');
  console.log('======================================================\n');
}

run().then(() => process.exit(0)).catch(err => {
  console.error('[ERROR in Problem 6 test]', err.response?.data || err.message);
  process.exit(1);
});
