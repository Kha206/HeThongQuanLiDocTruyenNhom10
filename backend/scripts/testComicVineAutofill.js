'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User, Story, Chapter } = require('../src/models');

const API_BASE = 'http://localhost:5000/api';

async function runAutofillTest() {
  console.log('--- STARTING COMICVINE AUTOFILL & MODE A VERIFICATION ---');

  // 1. Generate Admin JWT Token
  const adminUser = await User.findOne({ where: { email: 'admin@marvel.local' } });
  if (!adminUser) {
    throw new Error('Admin user admin@marvel.local not found in database!');
  }

  const token = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET || 'marvel_super_secret_jwt_key_2026_cnpmnangcao',
    { expiresIn: '1h' }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  // 2. Fetch ComicVine issues for Story #1
  console.log('\n1. Testing GET /api/admin/comicvine/issues?story_id=1&query=1...');
  const searchRes = await axios.get(`${API_BASE}/admin/comicvine/issues`, {
    params: { story_id: 1, query: '1' },
    headers: authHeaders
  });

  if (!searchRes.data.success || !Array.isArray(searchRes.data.issues)) {
    throw new Error('Failed to retrieve issues from endpoint');
  }

  console.log(`✓ Received ${searchRes.data.issues.length} issue(s)`);
  const issue = searchRes.data.issues[0];
  console.log('Sample issue response:', JSON.stringify(issue, null, 2));

  // 3. Verify fields required for autofill
  console.log('\n2. Verifying issue properties for cover_image and content:');
  console.log('  issue.cover_image:', issue.cover_image);
  console.log('  issue.image:', issue.image);
  console.log('  issue.content:', issue.content ? issue.content.slice(0, 80) + '...' : '(empty)');
  console.log('  issue.description:', issue.description ? issue.description.slice(0, 80) + '...' : '(empty)');

  if (!issue.cover_image && !issue.image) {
    throw new Error('FAIL: Both cover_image and image are empty in API response!');
  }
  if (!issue.content && !issue.description) {
    throw new Error('FAIL: Both content and description are empty in API response!');
  }
  console.log('✓ API response contains valid cover image and description/content!');

  // 4. Simulate handleSelectIssue logic in frontend
  console.log('\n3. Simulating frontend handleSelectIssue logic:');
  let resolvedCover = '';
  if (typeof issue.cover_image === 'string' && issue.cover_image.trim()) {
    resolvedCover = issue.cover_image.trim();
  } else if (typeof issue.image === 'string' && issue.image.trim()) {
    resolvedCover = issue.image.trim();
  } else if (issue.image && typeof issue.image === 'object') {
    resolvedCover = issue.image.medium_url || issue.image.original_url || '';
  }

  let resolvedContent = '';
  const rawContent = issue.content || issue.description || issue.deck || issue.summary || '';
  if (typeof rawContent === 'string' && rawContent.trim()) {
    resolvedContent = rawContent.replace(/<[^>]*>?/gm, '').trim();
  }

  console.log('  resolvedCover:', resolvedCover);
  console.log('  resolvedContent (length):', resolvedContent.length);

  if (!resolvedCover) {
    throw new Error('FAIL: resolvedCover is empty!');
  }
  if (!resolvedContent) {
    throw new Error('FAIL: resolvedContent is empty!');
  }
  console.log('✓ Frontend mapping extracts non-empty values for BOTH fields!');

  // 5. Test Chapter Submission (Mode A Flow)
  console.log('\n4. Testing Chapter Creation with Autofilled Data via POST /api/admin/chapters:');
  const testChapterNumber = 999.5; // Unique test chapter number

  // Cleanup if already exists
  await Chapter.destroy({ where: { story_id: 1, chapter_number: testChapterNumber } });

  const payload = {
    story_id: 1,
    chapter_number: testChapterNumber,
    title: issue.title || `Issue #${issue.issue_number}`,
    release_date: issue.release_date || '2026-10-04',
    is_preview: false,
    cover_image: resolvedCover,
    content: resolvedContent,
    character_credits: issue.character_credits || [],
    comicvine_issue_id: issue.id || issue.comicvine_issue_id
  };

  const createRes = await axios.post(`${API_BASE}/admin/chapters`, payload, {
    headers: authHeaders
  });

  if (!createRes.data.success || !createRes.data.chapter) {
    throw new Error('Failed to create chapter: ' + JSON.stringify(createRes.data));
  }

  const created = createRes.data.chapter;
  console.log('✓ Chapter created successfully with ID:', created.id);
  console.log('  Created cover_image:', created.cover_image);
  console.log('  Created content length:', created.content.length);

  // 6. Verify in Database
  const dbChapter = await Chapter.findByPk(created.id);
  if (!dbChapter || !dbChapter.cover_image || !dbChapter.content) {
    throw new Error('FAIL: Chapter in DB is missing cover_image or content!');
  }
  console.log('✓ Database verification passed: cover_image and content are persisted correctly!');

  // 7. Cleanup test chapter
  await dbChapter.destroy();
  console.log('✓ Cleaned up test chapter record.');

  console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY (100%) ---');
}

runAutofillTest().catch(err => {
  console.error('\n❌ ERROR:', err.response?.data || err.message);
  process.exit(1);
});
